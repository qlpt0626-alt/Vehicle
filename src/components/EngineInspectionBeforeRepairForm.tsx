import { canEditDocument } from '../services/ownershipService';
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, FileDown, Printer, Plus } from 'lucide-react';
import { Vehicle } from '../types';
import { getCurrentUserSession } from '../services/dbService';
import { DataService } from '../firebase';
import { AutoResizeTextarea } from './AutoResizeTextarea';

interface Props {
  vehicle?: Vehicle | null;
  existingFormId?: string;
  templateName?: string;
  stageName?: string;
  templateType?: string;
  onSaved?: (payload?: any) => void;
  onClose: () => void;
  initialData?: any;
}

const DEFAULT_INSPECTION_ITEMS = [
  { id: 1, content: 'Tình trạng chung bên ngoài động cơ', unit: '-', requirement: 'Không nứt vỡ, rò rỉ' },
  { id: 2, content: 'Khả năng khởi động', unit: '-', requirement: 'Dễ nổ' },
  { id: 3, content: 'Áp suất dầu bôi trơn (Không tải)', unit: 'kg/cm2', requirement: 'Theo tài liệu kỹ thuật' },
  { id: 4, content: 'Áp suất dầu bôi trơn (Định mức)', unit: 'kg/cm2', requirement: 'Theo tài liệu kỹ thuật' },
  { id: 5, content: 'Nhiệt độ nước làm mát định mức', unit: '°C', requirement: '80 - 90' },
  { id: 6, content: 'Tiếng gõ, tiếng ồn bất thường', unit: '-', requirement: 'Không có' },
  { id: 7, content: 'Tình trạng rò rỉ (dầu, nước, nhiên liệu)', unit: '-', requirement: 'Kín khít, không rò rỉ' },
  { id: 8, content: 'Tình trạng khí xả (Màu sắc khói)', unit: '-', requirement: 'Bình thường, không khói đen/xanh' },
  { id: 9, content: 'Tốc độ vòng quay không tải biên', unit: 'v/p', requirement: 'Ổn định, theo TLKT' },
  { id: 10, content: 'Hệ thống cung cấp nhiên liệu', unit: '-', requirement: 'Hoạt động tốt, kín' },
  { id: 11, content: 'Hệ thống điện động cơ (Máy nạp, máy đề)', unit: '-', requirement: 'Hoạt động tốt' },
  { id: 12, content: 'Tình trạng các bộ phận phụ trợ (Bơm, đai)', unit: '-', requirement: 'Chắc chắn, căng đúng mức' },
];

const CHASSIS_INSPECTION_ITEMS = [
  // I. HỆ THỐNG LÁI
  { id: 101, category: 'I. HỆ THỐNG LÁI', content: 'Tình trạng vô lăng và khớp trục lái', unit: '-', requirement: 'Không rơ lỏng quá giới hạn' },
  { id: 102, category: 'I. HỆ THỐNG LÁI', content: 'Cơ cấu lái (Hộp số lái)', unit: '-', requirement: 'Không rỉ dầu, bắt chặt' },
  { id: 103, category: 'I. HỆ THỐNG LÁI', content: 'Các thanh đòn dầm lái, rôtuyn', unit: '-', requirement: 'Không biến dạng, không rơ' },
  // II. HỆ THỐNG PHANH
  { id: 201, category: 'II. HỆ THỐNG PHANH', content: 'Tổng phanh, bầu trợ lực phanh', unit: '-', requirement: 'Hoạt động êm, không rò rỉ' },
  { id: 202, category: 'II. HỆ THỐNG PHANH', content: 'Các đường ống dẫn dầu/khí nén phanh', unit: '-', requirement: 'Kín khít, không rạn nứt' },
  { id: 203, category: 'II. HỆ THỐNG PHANH', content: 'Cơ cấu phanh (Má phanh, trống/đĩa phanh)', unit: '-', requirement: 'Độ mòn trong giới hạn' },
  { id: 204, category: 'II. HỆ THỐNG PHANH', content: 'Hiệu quả phanh chân và phanh tay', unit: '-', requirement: 'Hoạt động tốt, ăn đều' },
  // III. HỆ THỐNG TREO
  { id: 301, category: 'III. HỆ THỐNG TREO', content: 'Bộ nhíp lá (hoặc lò xo cuộn)', unit: '-', requirement: 'Không nứt gãy, không xô lệch' },
  { id: 302, category: 'III. HỆ THỐNG TREO', content: 'Giảm chấn thủy lực (Thụt)', unit: '-', requirement: 'Không rỉ dầu, hoạt động êm' },
  { id: 303, category: 'III. HỆ THỐNG TREO', content: 'Thanh cân bằng, cao su đệm', unit: '-', requirement: 'Đầy đủ, bắt chắc chắn' },
  // IV. HỘP SỐ
  { id: 401, category: 'IV. HỘP SỐ', content: 'Tình trạng vỏ hộp số chính, hộp số phụ', unit: '-', requirement: 'Không nứt vỡ, không rò rỉ' },
  { id: 402, category: 'IV. HỘP SỐ', content: 'Khả năng vào số, sang số', unit: '-', requirement: 'Mượt mà, không kẹt số/nhảy số' },
  { id: 403, category: 'IV. HỘP SỐ', content: 'Tiếng ồn bất thường của hộp số khi chạy', unit: '-', requirement: 'Không hú, không kêu lạ' },
  // V. LY HỢP
  { id: 501, category: 'V. LY HỢP', content: 'Hành trình tự do của bàn đạp ly hợp', unit: '-', requirement: 'Theo đúng tiêu chuẩn kỹ thuật' },
  { id: 502, category: 'V. LY HỢP', content: 'Tình trạng cắt trích công suất (côn)', unit: '-', requirement: 'Cắt dứt khoát, không trượt côn' },
  { id: 503, category: 'V. LY HỢP', content: 'Xi lanh lực, bầu trợ lực ly hợp', unit: '-', requirement: 'Kín, không rò rỉ dầu' },
  // VI. CÁC ĐĂNG
  { id: 601, category: 'VI. CÁC ĐĂNG', content: 'Trục các đăng, then hoa, ổ bi trung gian', unit: '-', requirement: 'Không rơ lắc, không cong vênh' },
  { id: 602, category: 'VI. CÁC ĐĂNG', content: 'Khớp chữ thập trục các đăng', unit: '-', requirement: 'Đầy đủ mỡ bôi trơn, không rơ' }
];

const ELECTRICAL_INSPECTION_ITEMS = [
  // I. NGUỒN ĐIỆN VÀ KHỞI ĐỘNG
  { id: 701, category: 'I. NGUỒN ĐIỆN VÀ KHỞI ĐỘNG', content: 'Bình điện (Acquy), khóa điện', unit: '-', requirement: 'Đủ điện áp, bắt chặt' },
  { id: 702, category: 'I. NGUỒN ĐIỆN VÀ KHỞI ĐỘNG', content: 'Máy phát điện', unit: '-', requirement: 'Hoạt động tốt, phát đủ dòng' },
  { id: 703, category: 'I. NGUỒN ĐIỆN VÀ KHỞI ĐỘNG', content: 'Điện áp khi khởi động', unit: 'V', requirement: '≥ 10.5V' },
  { id: 704, category: 'I. NGUỒN ĐIỆN VÀ KHỞI ĐỘNG', content: 'Điện áp tại vòng quay lớn nhất', unit: 'V', requirement: '13.6 ÷ 14.7V' },
  { id: 705, category: 'I. NGUỒN ĐIỆN VÀ KHỞI ĐỘNG', content: 'Máy khởi động (Củ đề)', unit: '-', requirement: 'Khởi động nhạy, êm' },
  
  // II. CHIẾU SÁNG VÀ TÍN HIỆU
  { id: 801, category: 'II. CHIẾU SÁNG VÀ TÍN HIỆU', content: 'Hệ thống đèn chiếu sáng (Pha, cốt, sương mù)', unit: '-', requirement: 'Sáng đều, đúng luồng sáng' },
  { id: 802, category: 'II. CHIẾU SÁNG VÀ TÍN HIỆU', content: 'Hệ thống đèn tín hiệu (Xi-nhan, hazard, phanh, lùi)', unit: '-', requirement: 'Hoạt động tốt, đúng tần số' },
  { id: 803, category: 'II. CHIẾU SÁNG VÀ TÍN HIỆU', content: 'Còi điện', unit: '-', requirement: 'Âm thanh chuẩn, đúng âm lượng' },

  // III. HỆ THỐNG PHỤ TRỢ VÀ ĐÁNH LỬA
  { id: 901, category: 'III. HỆ THỐNG PHỤ TRỢ VÀ ĐÁNH LỬA', content: 'Hệ thống gạt mưa, bơm nước rửa kính', unit: '-', requirement: 'Gạt sạch, phun đều' },
  { id: 902, category: 'III. HỆ THỐNG PHỤ TRỢ VÀ ĐÁNH LỬA', content: 'Bó dây điện toàn xe', unit: '-', requirement: 'Bọc cách điện tốt, không rách gãy' },
  { id: 903, category: 'III. HỆ THỐNG PHỤ TRỢ VÀ ĐÁNH LỬA', content: 'Hệ thống đánh lửa (đối với xe xăng)', unit: '-', requirement: 'Đánh lửa đều, mạnh' },
  { id: 904, category: 'III. HỆ THỐNG PHỤ TRỢ VÀ ĐÁNH LỬA', content: 'Hệ thống cảm biến, đồng hồ táp lô', unit: '-', requirement: 'Hiển thị chính xác các thông số' }
];

const getInspectionItems = (type?: string) => {
  if (type === 'CHASSIS_PRE_REPAIR') {
    return CHASSIS_INSPECTION_ITEMS;
  }
  if (type === 'ELECTRICAL_PRE_REPAIR') {
    return ELECTRICAL_INSPECTION_ITEMS;
  }
  return DEFAULT_INSPECTION_ITEMS;
};

export const EngineInspectionBeforeRepairForm: React.FC<Props> = ({ vehicle, existingFormId, templateName, stageName, templateType, initialData, onSaved, onClose }) => {
  const [zoom, setZoom] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 800) {
      return Math.max(30, Math.floor((window.innerWidth) / 7.94));
    }
    return 100;
  });
  const printRef = useRef<HTMLDivElement>(null);
  
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [showVehicleSelect, setShowVehicleSelect] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicle?.vehicleId || '');

  const [formData, setFormData] = useState(() => {
    const defaultItems = getInspectionItems(templateType);
    return {
      vehicleName: vehicle?.brand || '',
      vehicleNumber: vehicle?.plateNumber || '',
      xxNumber1: '',
      stageNumber: '',
      xxNumber2: '',
      sheetNumber: '',
      items: defaultItems.map(item => ({ ...item, actual: '' })),
      conclusion: ''
    };
  });

  const resolvedTemplateName = templateName || 'Engine Inspection Before Repair';
  const resolvedStageName = stageName || 'Kiểm tra động cơ trước khi sửa chữa';

  const [docId, setDocId] = useState(() => {
    if (existingFormId) return existingFormId;
    const baseId = vehicle ? `EIR_${vehicle.vehicleId}_${Date.now()}` : `EIR_${Date.now()}`;
    return baseId.replace(/[^a-zA-Z0-9_\\-]/g, '_');
  });

  useEffect(() => {
    loadData();
    const loadVehicles = async () => {
      try {
        const dps = await DataService.load('damageProtocols') || [];
        const localDps = JSON.parse(localStorage.getItem('local_damageProtocols') || '[]');
        const allDps = (Array.isArray(dps) && dps.length > 0) ? dps : localDps;

        const activeDps = allDps.filter((p: any) => p.isDeleted !== true && p.isDeleted !== 'true');

        const mappedVehicles = activeDps.map((dp: any) => ({
          vehicleId: dp.vehicleId,
          plateNumber: dp.plateNumber,
          brand: dp.brand,
          vehicleType: dp.vehicleType,
          chassisNumber: dp.chassisNumber,
          engineNumber: dp.engineNumber
        }));

        const uniqueVehicles = Array.from(new Map(mappedVehicles.map((item: any) => [item.vehicleId, item])).values()) as Vehicle[];

        setVehiclesList(uniqueVehicles);
      } catch (err) {}
    };
    loadVehicles();
  }, [vehicle, docId, initialData]);

  const loadData = async () => {
    try {
      let foundDoc = initialData || null;

      // Check local storage first
      const targetType = templateType || 'ENGINE_PRE_REPAIR';
      const storeKey = `local_${targetType}`;
      let localData = localStorage.getItem(storeKey);
      if (!localData) {
        const legacyKey = 'local_repairForms';
        const legacyData = localStorage.getItem(legacyKey);
        if (legacyData) {
          try {
            const parsedLegacy = JSON.parse(legacyData);
            if (Array.isArray(parsedLegacy)) {
              const legacyItems = parsedLegacy.filter((f: any) => f.templateType === targetType);
              if (legacyItems.length > 0) {
                localStorage.setItem(storeKey, JSON.stringify(legacyItems));
                localData = JSON.stringify(legacyItems);
              }
            }
          } catch (e) {}
        }
      }
      const list = localData ? JSON.parse(localData) : [];
      
      console.log(`[DEBUG] Current docId: ${docId}`);
      console.log(`[DEBUG] ExistingFormId: ${existingFormId || 'undefined'}`);
      console.log(`[DEBUG] Loaded forms count: ${list.length}`);

      let matchedCount = 0;

      const normalizeStr = (s: any) => s ? String(s).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

      if (!foundDoc) {
        if (existingFormId) {
          foundDoc = list.find((item: any) => item.id === existingFormId && !item.isDeleted);
          if (foundDoc) matchedCount++;
        }
      }

      // If not in local storage or didn't find, try Firebase/DataService
      if (!foundDoc) {
        if (existingFormId) {
          const dbDoc = await DataService.get('repairForms', existingFormId);
          if (dbDoc && !dbDoc.isDeleted) {
            foundDoc = dbDoc;
            matchedCount++;
          }
        }
      }

      console.log(`[DEBUG] Matched forms count: ${matchedCount}`);

      if (foundDoc) {
        if (foundDoc.formData) {
          setFormData(foundDoc.formData);
        }
        if (foundDoc.id && foundDoc.id !== docId) {
          setDocId(foundDoc.id);
        }
      } else {
        if (!existingFormId) {
          const defaultItems = getInspectionItems(templateType);
          setFormData({
            vehicleName: vehicle?.brand || '',
            vehicleNumber: vehicle?.plateNumber || '',
            xxNumber1: '',
            stageNumber: '',
            xxNumber2: '',
            sheetNumber: '',
            items: defaultItems.map(item => ({ ...item, actual: '' })),
            conclusion: ''
          });
        }
      }
    } catch (err) {
      console.warn('Error loading form data:', err);
    }
  };

  const handleSave = async () => {
    try {
      const formVehicleId = selectedVehicleId || vehicle?.vehicleId || 'NO_VEHICLE';

      const currentUser = getCurrentUserSession();
      
      let docExists = false;
      let existingDoc = null;
      try {
        existingDoc = await DataService.get('repairForms', docId);
        if (existingDoc && !existingDoc.isDeleted) {
          docExists = true;
        }
      } catch (err) {}

      if (existingDoc && currentUser && !canEditDocument(currentUser, existingDoc)) {
        alert('Bạn chỉ có quyền xem dữ liệu.');
        return;
      }

      const payload = {
        id: docId,
        vehicleId: formVehicleId,
        templateType: templateType,
        templateName: docExists && existingDoc?.templateName ? existingDoc.templateName : resolvedTemplateName,
        stageName: docExists && existingDoc?.stageName ? existingDoc.stageName : resolvedStageName,
        formData: formData,
        isDeleted: false,
        createdBy: docExists && existingDoc?.createdBy ? existingDoc.createdBy : (currentUser?.uid || currentUser?.username || 'unknown'),
        createdByName: docExists && existingDoc?.createdByName ? existingDoc.createdByName : (currentUser?.fullName || 'unknown'),
        createdAt: docExists && existingDoc?.createdAt ? existingDoc.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (docExists) {
        await DataService.update('repairForms', docId, payload);
      } else {
        await DataService.save('repairForms', payload);
      }
      
      console.log(
        "SAVE TEMPLATE",
        templateType,
        payload.templateType
      );
      console.log("FORM SAVED", payload);
      
      // Update local storage cache
      const targetType = templateType || 'ENGINE_PRE_REPAIR';
      const storeKey = `local_${targetType}`;
      const localData = localStorage.getItem(storeKey);
      const list = localData ? JSON.parse(localData) : [];
      const existingIdx = list.findIndex(
        (item: any) => item.id && docId && String(item.id).trim().toLowerCase() === String(docId).trim().toLowerCase()
      );
      if (existingIdx >= 0) {
        list[existingIdx] = payload;
      } else {
        list.push(payload);
      }
      localStorage.setItem(storeKey, JSON.stringify(list));

      // Also update or clean up legacy local_repairForms if it exists, to keep it in sync
      const legacyKey = 'local_repairForms';
      const legacyData = localStorage.getItem(legacyKey);
      if (legacyData) {
        try {
          const legacyList = JSON.parse(legacyData);
          if (Array.isArray(legacyList)) {
            const idx = legacyList.findIndex(
              (item: any) => item.id && docId && String(item.id).trim().toLowerCase() === String(docId).trim().toLowerCase()
            );
            if (idx >= 0) {
              legacyList[idx] = payload;
            } else {
              legacyList.push(payload);
            }
            localStorage.setItem(legacyKey, JSON.stringify(legacyList));
          }
        } catch (e) {}
      }

      console.log('Đã lưu phiếu kiểm tra động cơ.');
      if (onSaved) onSaved(payload);
      onClose();
    } catch (err) {
      console.error('Không thể lưu dữ liệu.', err);
    }
  };

  const handleDelete = async () => {
    try {
      const currentUser = getCurrentUserSession();
      let existingDoc = null;
      try {
        existingDoc = await DataService.get('repairForms', docId);
      } catch (err) {}
      if (existingDoc && currentUser && !canEditDocument(currentUser, existingDoc)) {
        alert('Bạn chỉ có quyền xem dữ liệu.');
        return;
      }
    } catch(err) {}

    let confirmed = false;
    try {
      confirmed = window.confirm('Bạn có chắc chắn muốn xóa phiếu kiểm tra này?');
    } catch (err) {
      console.warn('window.confirm is blocked or unsupported in this sandbox:', err);
      confirmed = true; // Fallback to delete when sandbox restricts alert-like popups
    }

    if (!confirmed) return;

    try {
      const currentUser = getCurrentUserSession();
      // Soft delete via DataService directly
      try {
        const updatePayload = {
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser?.uid || currentUser?.username || "unknown",
          deletedByName: currentUser?.fullName || currentUser?.username || "Người dùng",
          deletedByRole: currentUser?.role || "Không xác định",
        };
        await DataService.update('repairForms', docId, updatePayload);
      } catch (err) {
        console.warn('Could not update firebase for delete, continuing locally:', err);
      }
      
      // Update local storage
      const targetType = templateType || 'ENGINE_PRE_REPAIR';
      const storeKey = `local_${targetType}`;
      let list = [];
      const localData = localStorage.getItem(storeKey);
      if (localData) {
        try {
          list = JSON.parse(localData);
          if (!Array.isArray(list)) list = [];
        } catch (e) {
          list = [];
        }
      }
      
      const existingIdx = list.findIndex(
        (item: any) => item.id && docId && String(item.id).trim().toLowerCase() === String(docId).trim().toLowerCase()
      );
      if (existingIdx >= 0) {
        list[existingIdx] = {
          ...list[existingIdx],
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser?.uid || currentUser?.username || "unknown",
          deletedByName: currentUser?.fullName || currentUser?.username || "Người dùng",
          deletedByRole: currentUser?.role || "Không xác định",
        };
      } else {
        list.push({
          id: docId,
          vehicleId: vehicle?.vehicleId,
          templateType: targetType,
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser?.uid || currentUser?.username || "unknown",
          deletedByName: currentUser?.fullName || currentUser?.username || "Người dùng",
          deletedByRole: currentUser?.role || "Không xác định",
        });
      }
      localStorage.setItem(storeKey, JSON.stringify(list));
      
      // Also update legacy local_repairForms if it exists
      const legacyKey = 'local_repairForms';
      let legacyList = [];
      const legacyData = localStorage.getItem(legacyKey);
      if (legacyData) {
        try {
          legacyList = JSON.parse(legacyData);
          if (!Array.isArray(legacyList)) legacyList = [];
        } catch (e) {
          legacyList = [];
        }
      }
      
      const legacyIdx = legacyList.findIndex(
        (item: any) => item.id && docId && String(item.id).trim().toLowerCase() === String(docId).trim().toLowerCase()
      );
      if (legacyIdx >= 0) {
        legacyList[legacyIdx] = {
          ...legacyList[legacyIdx],
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser?.uid || currentUser?.username || "unknown",
          deletedByName: currentUser?.fullName || currentUser?.username || "Người dùng",
          deletedByRole: currentUser?.role || "Không xác định",
        };
      } else {
        legacyList.push({
          id: docId,
          vehicleId: vehicle?.vehicleId,
          templateType: targetType,
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser?.uid || currentUser?.username || "unknown",
          deletedByName: currentUser?.fullName || currentUser?.username || "Người dùng",
          deletedByRole: currentUser?.role || "Không xác định",
        });
      }
      localStorage.setItem(legacyKey, JSON.stringify(legacyList));
      
      console.log('Đã xóa phiếu kiểm tra (vào thùng rác).');
      if (onSaved) onSaved(); // call without payload to trigger refresh
      onClose();
    } catch (err) {
      console.error('Không thể xóa dữ liệu.', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...formData.items];
    newItems[index].actual = value;
    setFormData({ ...formData, items: newItems });
  };

  
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-100/90 backdrop-blur-sm overflow-hidden print:bg-white print:static print:h-auto print:overflow-visible">
      
      {/* Header controls */}
      <div className="bg-white border-b border-stone-200 px-2 sm:px-4 py-3 flex flex-col sm:flex-row items-center justify-between shrink-0 print:hidden gap-3 sm:gap-0">
        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-500 hover:text-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-stone-200 hidden sm:block"></div>
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
            <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="px-2 py-1 hover:bg-white rounded text-sm text-stone-600 font-medium">-</button>
            <span className="text-sm font-mono text-stone-600 w-12 text-center">{zoom}%</span>
            <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="px-2 py-1 hover:bg-white rounded text-sm text-stone-600 font-medium">+</button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
          <button 
            id="delete-button-selector"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDelete();
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
          >
            Xóa
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-600 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            In biểu mẫu
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-600 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Xuất PDF
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            Lưu phiếu
          </button>
        </div>
      </div>

      {/* Form Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full flex sm:justify-center p-2 sm:p-8 print:p-0 print:block">
        <div 
          ref={printRef}
          style={{ 
            zoom: `${zoom}%`,
            fontFamily: '"Times New Roman", Times, serif'
          }}
          className="bg-white text-stone-900 sm:shadow-2xl origin-top-left sm:origin-top w-full sm:w-[210mm] border-none sm:border-2 border-transparent sm:border-stone-200 print:border-none print:w-full print:p-0 print:shadow-none print:!zoom-100 min-h-[max-content] mx-auto p-4 sm:p-[20mm] font-serif"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="text-center font-bold">
              <p className="text-base m-0 leading-tight">CỤC HC - KT</p>
              <p className="text-base m-0 leading-tight">Tiểu đoàn 30</p>
              <p className="text-base m-0 leading-tight">Đại đội S/C xe máy</p>
              <p className="text-base m-0 leading-tight">Tổ S/C Máy, gầm</p>
            </div>
            <div className="text-right">
              {/* Other corner content, usually blank or specific notes */}
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-xl font-bold uppercase m-0 leading-tight mb-2">PHIẾU KIỂM TRA: Số 1</h1>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 text-[15px] leading-relaxed">
            <div>
              <div className="flex gap-2 relative items-end">
                <span className="whitespace-nowrap">Tên TBKT:</span>
                <input 
                  type="text" 
                  value={formData.vehicleName}
                  onChange={(e) => setFormData({...formData, vehicleName: e.target.value})}
                  className="border-b border-dotted border-black flex-1 bg-transparent outline-none pb-0 px-2 font-bold" 
                />
                <button
                  onClick={() => setShowVehicleSelect(!showVehicleSelect)}
                  className="ml-2 px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-semibold rounded-md shadow-sm transition-colors print:hidden whitespace-nowrap font-sans cursor-pointer focus:outline-none"
                  title="Chọn xe từ danh sách"
                >
                  {showVehicleSelect ? 'Đóng' : 'Chọn xe...'}
                </button>
                {showVehicleSelect && (
                  <div className="absolute top-full right-0 mt-1 w-64 max-h-60 overflow-y-auto bg-white border border-stone-200 shadow-xl rounded-lg z-50 print:hidden text-black font-sans">
                    <div className="sticky top-0 bg-stone-100 px-3 py-2 border-b border-stone-200 flex justify-between items-center z-10">
                      <span className="text-xs font-bold text-stone-600 uppercase">Danh sách xe</span>
                      <button 
                        onClick={() => setShowVehicleSelect(false)}
                        className="text-stone-400 hover:text-stone-700 font-bold px-2"
                        title="Đóng danh sách"
                      >
                        ✕
                      </button>
                    </div>
                    {vehiclesList.length > 0 ? (
                      vehiclesList.map(v => (
                        <div 
                          key={v.vehicleId} 
                          className="px-3 py-2 hover:bg-emerald-50 cursor-pointer border-b border-stone-100 last:border-0 transition-colors"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              vehicleName: v.brand || v.vehicleGroup || 'Không xác định',
                              vehicleNumber: v.plateNumber || ''
                            });
                            setSelectedVehicleId(v.vehicleId);
                            setShowVehicleSelect(false);
                          }}
                        >
                          <div className="font-bold text-sm">{v.plateNumber}</div>
                          <div className="text-xs text-stone-500">{v.brand} - {v.vehicleType}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-stone-500 text-center">Không có dữ liệu xe</div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <span className="whitespace-nowrap">Số hiệu:</span>
                <input 
                  type="text" 
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                  className="border-b border-dotted border-black flex-1 bg-transparent outline-none pb-0 px-2 font-bold" 
                />
              </div>
              <div className="flex gap-2 mt-2">
                <span className="whitespace-nowrap">Số XX:</span>
                <input 
                  type="text" 
                  value={formData.xxNumber1}
                  onChange={(e) => setFormData({...formData, xxNumber1: e.target.value})}
                  className="border-b border-dotted border-black flex-1 bg-transparent outline-none pb-0 px-2 font-bold" 
                />
              </div>
            </div>
            
            <div>
              <div className="flex gap-2">
                <span className="whitespace-nowrap">Cụm - Công đoạn:</span>
                <span className="font-bold border-b border-dotted border-black flex-1 whitespace-nowrap">{resolvedStageName}</span>
              </div>
              <div className="flex gap-2 mt-2">
                <span className="whitespace-nowrap">Số hiệu:</span>
                <input 
                  type="text" 
                  value={formData.stageNumber}
                  onChange={(e) => setFormData({...formData, stageNumber: e.target.value})}
                  className="border-b border-dotted border-black flex-1 bg-transparent outline-none pb-0 px-2 font-bold" 
                />
              </div>
              <div className="flex gap-2 mt-2">
                <span className="whitespace-nowrap">Số XX:</span>
                <input 
                  type="text" 
                  value={formData.xxNumber2}
                  onChange={(e) => setFormData({...formData, xxNumber2: e.target.value})}
                  className="border-b border-dotted border-black flex-1 bg-transparent outline-none pb-0 px-2 font-bold" 
                />
              </div>
              <div className="flex gap-2 mt-2">
                <span className="whitespace-nowrap">Tờ số:</span>
                <input 
                  type="text" 
                  value={formData.sheetNumber}
                  onChange={(e) => setFormData({...formData, sheetNumber: e.target.value})}
                  className="border-b border-dotted border-black flex-1 bg-transparent outline-none pb-0 px-2 font-bold" 
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <table className="w-full border-collapse border-y border-x sm:border border-stone-300 sm:border-black text-[15px]">
              <thead className="hidden sm:table-header-group">
                <tr>
                  <th className="border border-black px-2 py-2 text-center w-12 font-bold">TT</th>
                  <th className="border border-black px-2 py-2 text-center font-bold">NỘI DUNG KIỂM TRA</th>
                  <th className="border border-black px-2 py-2 text-center w-24 font-bold">Đơn vị đo</th>
                  <th className="border border-black px-2 py-2 text-center w-40 font-bold">Yêu cầu</th>
                  <th className="border border-black px-2 py-2 text-center w-48 font-bold">Thực tế</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let lastCategory = '';
                  return formData.items.map((item: any, index: number) => {
                    const showCategoryHeader = item.category && item.category !== lastCategory;
                    if (showCategoryHeader) {
                      lastCategory = item.category;
                    }
                    return (
                      <React.Fragment key={item.id || index}>
                        {showCategoryHeader && (
                          <tr className="bg-stone-50 print:bg-stone-100 font-bold block sm:table-row">
                            <td colSpan={5} className="border-y border-x sm:border border-stone-300 sm:border-black px-4 py-2 text-left text-[14px] mt-4 sm:mt-0 block sm:table-cell">
                              {item.category}
                            </td>
                          </tr>
                        )}
                        <tr className="flex flex-col sm:table-row hover:bg-stone-50/50 transition-colors border-b-2 sm:border-b border-stone-300 sm:border-black mb-2 sm:mb-0 h-auto sm:h-auto">
                          <td className="hidden sm:table-cell border border-black px-2 py-2 text-center">{index + 1}</td>
                          <td className="border-t border-x sm:border-y-0 sm:border-l-0 sm:border-r border-stone-300 sm:border-black p-2.5 sm:px-2 font-medium bg-stone-100 sm:bg-transparent">
                            <span className="sm:hidden font-bold mr-1">{index + 1}.</span>
                            {item.content}
                          </td>
                          <td className="border-x border-b sm:border border-stone-300 sm:border-black p-2 sm:p-2 flex sm:table-cell items-center justify-between bg-white sm:bg-transparent">
                            <span className="sm:hidden text-xs text-stone-500 font-medium ml-1">Đơn vị đo</span>
                            <span className="text-right sm:text-center text-stone-800">{item.unit}</span>
                          </td>
                          <td className="border-x border-b sm:border border-stone-300 sm:border-black p-2 flex sm:table-cell items-center justify-between bg-white sm:bg-transparent">
                            <span className="sm:hidden text-xs text-stone-500 font-medium ml-1">Yêu cầu</span>
                            <span className="text-right sm:text-center text-stone-800 font-medium sm:font-normal">{item.requirement}</span>
                          </td>
                          <td className="border-x border-b sm:border border-stone-300 sm:border-black p-1 flex sm:table-cell flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white sm:bg-transparent">
                            <span className="sm:hidden text-xs text-stone-500 font-medium ml-2 mt-1 mb-1">Thực tế</span>

                            <AutoResizeTextarea 
                              value={item.actual || ''}
                              onChange={(e) => handleItemChange(index, e.target.value)}
                              className="w-full h-full min-h-[36px] sm:min-h-[auto] bg-stone-50 sm:bg-transparent border border-stone-200 sm:border-transparent outline-none px-3 sm:px-2 py-2 text-left sm:text-center rounded sm:rounded-none font-bold text-stone-800 sm:text-emerald-700 print:text-black"
                            />
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>

            
          </div>

          <div className="mb-8">
            <h3 className="font-bold text-[15px] mb-2">Kết luận:</h3>
            <textarea 
              value={formData.conclusion}
              onChange={(e) => setFormData({...formData, conclusion: e.target.value})}
              className="w-full h-32 border border-black p-3 outline-none text-[15px] leading-relaxed resize-none font-bold text-emerald-700 print:text-black print:border-none print:p-0 print:h-auto"
              placeholder="Nhập kết luận kiểm tra..."
            />
          </div>

          <div className="grid grid-cols-4 gap-4 mt-12">
            <div className="text-center">
              <p className="font-bold text-[15px] mb-12">THỢ KIỂM TRA</p>
              <input 
                type="text" 
                className="w-full text-center outline-none bg-transparent font-bold text-[15px] print:text-black" 
                value={formData['sign_THỢ KIỂM TRA'] || ''} 
                onChange={(e) => setFormData({...formData, 'sign_THỢ KIỂM TRA': e.target.value})}
                placeholder="..."
              />
            </div>
            <div className="text-center">
              <p className="font-bold text-[15px] mb-12">TỔ TRƯỞNG</p>
              <input 
                type="text" 
                className="w-full text-center outline-none bg-transparent font-bold text-[15px] print:text-black" 
                value={formData['sign_TỔ TRƯỞNG'] || ''} 
                onChange={(e) => setFormData({...formData, 'sign_TỔ TRƯỞNG': e.target.value})}
                placeholder="..."
              />
            </div>
            <div className="text-center">
              <p className="font-bold text-[15px] mb-12">KCS</p>
              <input 
                type="text" 
                className="w-full text-center outline-none bg-transparent font-bold text-[15px] print:text-black" 
                value={formData['sign_KCS'] || ''} 
                onChange={(e) => setFormData({...formData, 'sign_KCS': e.target.value})}
                placeholder="..."
              />
            </div>
            <div className="text-center">
              <p className="font-bold text-[15px] mb-12">ĐẠI ĐỘI TRƯỞNG</p>
              <input 
                type="text" 
                className="w-full text-center outline-none bg-transparent font-bold text-[15px] print:text-black" 
                value={formData['sign_ĐẠI ĐỘI TRƯỞNG'] || ''} 
                onChange={(e) => setFormData({...formData, 'sign_ĐẠI ĐỘI TRƯỞNG': e.target.value})}
                placeholder="..."
              />
            </div>
          </div>
</div>
      </div>
    </div>
  );
};
