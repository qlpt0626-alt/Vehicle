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

const ITEMS: any[] = [
  { stt: 1, noiDung: "Bơm xăng", yeuCau: "Không nứt, vỡ, rò rỉ xăng" },
  { stt: "1.1", noiDung: "Màng bơm xăng", yeuCau: "Không rách, đàn hồi tốt" },
  { stt: 2, noiDung: "Bơm dầu", yeuCau: "" },
  { stt: "2.1", noiDung: "Tiếng kêu gõ, rò rỉ dầu", yeuCau: "Không cho phép" },
  { stt: "2.2", noiDung: "Áp suất dầu bôi trơn (700÷750 vòng/phút)", yeuCau: "≥ 0,6 kgf/cm²" },
  { stt: "2.3", noiDung: "Áp suất dầu bôi trơn (4000 vòng/phút)", yeuCau: "4,5 ÷ 5,0 kgf/cm²" },
  { stt: 3, noiDung: "Bơm nước", yeuCau: "" },
  { stt: "3.1", noiDung: "Trục bơm nước", yeuCau: "Không mòn, khuyết, rỗ" },
  { stt: "3.2", noiDung: "Phớt bơm nước", yeuCau: "Không chảy nước" },
  { stt: "3.3", noiDung: "Cánh quạt bơm nước", yeuCau: "Không mẻ, vênh" },
  { stt: "3.4", noiDung: "Tiếng kêu gõ, rò rỉ nước", yeuCau: "Không rò rỉ nước, không có tiếng kêu lớn" },
  { stt: 4, noiDung: "Két nước làm mát", yeuCau: "Thông rửa sạch sẽ, không mọt gỉ, thủng" },
  { stt: 5, noiDung: "Két làm mát dầu động cơ", yeuCau: "Không mọt gỉ, thủng, rò rỉ" },
  { stt: 6, noiDung: "Cút nước", yeuCau: "Không han gỉ, rò rỉ" },
  { stt: 7, noiDung: "Dây đai", yeuCau: "Không mòn, nứt" },
  { stt: 8, noiDung: "Cụm lọc nhiên liệu", yeuCau: "Không tắc, bẩn" },
  { stt: 9, noiDung: "Trục cam", yeuCau: "Không cong vênh, mòn, rỗ" },
  { stt: 10, noiDung: "Dàn cò", yeuCau: "Hoạt động êm dịu" },
  { stt: 11, noiDung: "Tuy ô dầu", yeuCau: "Không móp méo, rò rỉ" },
  { stt: 12, noiDung: "Tuy ô xăng", yeuCau: "Không móp méo, rò rỉ" },
  { stt: 13, noiDung: "Chế hòa khí", yeuCau: "Không nứt, mòn, rò rỉ xăng, làm việc ổn định" },
  { stt: 14, noiDung: "Cao su chân két mát", yeuCau: "Không mòn, nứt, lão hóa" },
  { stt: 15, noiDung: "Cao su chân máy", yeuCau: "Không mòn, nứt, lão hóa" },
  { stt: 16, noiDung: "Nấm hút + xả", yeuCau: "Không mòn, han gỉ" },
  { stt: 17, noiDung: "Bộ gioăng phớt đại tu máy", yeuCau: "Không nứt, rách" },
  { stt: 18, noiDung: "Bộ hơi, quả nén, xec măng", yeuCau: "Hoạt động êm dịu" }
];

const getInspectionItems = (type?: string) => {
  return ITEMS;
};

export const EngineComponentDisassemblyForm: React.FC<Props> = ({ vehicle, existingFormId, templateName, stageName, templateType, initialData, onSaved, onClose }) => {
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

  const [formData, setFormData] = useState<any>(() => {
    const defaultItems = getInspectionItems(templateType);
    const nowStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    return {
      vehicleName: vehicle?.brand || '',
      vehicleNumber: vehicle?.plateNumber || '',
      xxNumber1: '',
      stageNumber: '',
      xxNumber2: '',
      sheetNumber: '',
      tenTBKT: vehicle?.brand || '',
      soHieu: vehicle?.plateNumber || '',
      soXX: '',
      cumCongDoan: 'Tổng tháo cụm động cơ',
      toSo: '1',
      soTo: '1',
      soPhieu: '',
      items: defaultItems.map((item: any) => ({ ...item, actual: '', evaluation: '', notes: '' })),
      conclusion: '',
      ketLuan: "Tổng tháo cụm động cơ được thực hiện đúng Quy trình công nghệ.",
      ngayLap: `${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`,
      toTruong: "",
      daiDoiTruong: "Trần Văn Giáp",
      nhanVienKCS: "Nguyễn Văn Đăng",
      chiHuyTieuDoan: "Thiếu tá Thừa Trung Hải",
      status: 'DRAFT',
      createdAt: nowStr,
      updatedAt: nowStr,
      completedAt: null,
      approvedAt: null,
      updatedBy: ''
    };
  });

  const resolvedTemplateName = templateName || 'PHIẾU SỬA CHỮA';
  const resolvedStageName = stageName || 'Tổng tháo cụm động cơ';

  const [docId, setDocId] = useState(() => {
    if (existingFormId) return existingFormId;
    const baseId = vehicle ? `GDR_${vehicle.vehicleId}_${Date.now()}` : `GDR_${Date.now()}`;
    return baseId.replace(/[^a-zA-Z0-9_\-]/g, '_');
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
      const targetType = templateType || 'ENGINE_COMPONENT_DISASSEMBLY';
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

      if (foundDoc) {
        if (foundDoc.formData) {
          setFormData({
            ...foundDoc.formData,
            originalStatus: foundDoc.formData.status || 'DRAFT'
          });
        }
        if (foundDoc.id && foundDoc.id !== docId) {
          setDocId(foundDoc.id);
        }
      } else {
        if (!existingFormId) {
          try {
            const defaultItems = typeof getInspectionItems === 'function' ? getInspectionItems(templateType) : [];
            setFormData({
              vehicleName: vehicle?.brand || '',
              vehicleNumber: vehicle?.plateNumber || '',
              items: defaultItems.map((item: any) => ({ ...item, actual: '' }))
            });
          } catch(e) {}
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
      } catch (err) {}

      if (existingDoc && currentUser && !canEditDocument(currentUser, existingDoc)) {
        alert('Bạn chỉ có quyền xem dữ liệu.');
        return;
      }

      const payload = {
        id: docId,
        vehicleId: formVehicleId,
        templateType: templateType || 'GENERAL_DISASSEMBLY_REPAIR',
        templateName: docExists && existingDoc?.templateName ? existingDoc.templateName : resolvedTemplateName,
        stageName: docExists && existingDoc?.stageName ? existingDoc.stageName : resolvedStageName,
        formData: {
          ...formData,
          tongGioCong: (formData.items || []).reduce((sum: number, item: any) => sum + (parseFloat(item.gioCong) || 0), 0),
          updatedBy: currentUser?.fullName || currentUser?.username || 'unknown',
          updatedAt: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
          originalStatus: formData.status || 'DRAFT'
        },
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
      
      // Update local storage cache
      const targetType = templateType || 'GENERAL_DISASSEMBLY_REPAIR';
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
      
      setFormData(payload.formData);

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

      console.log('Đã lưu phiếu sửa chữa tổng tháo.');
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
      confirmed = window.confirm('Bạn có chắc chắn muốn xóa phiếu này?');
    } catch (err) {
      console.warn('window.confirm is blocked or unsupported in this sandbox:', err);
      confirmed = true;
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
        console.warn('Could not update firebase for delete:', err);
      }
      
      // Update local storage
      const targetType = templateType || 'GENERAL_DISASSEMBLY_REPAIR';
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
      
      console.log('Đã xóa phiếu (vào thùng rác).');
      if (onSaved) onSaved(); // call without payload to trigger refresh
      onClose();
    } catch (err) {
      console.error('Không thể xóa dữ liệu.', err);
    }
  };

  const currentUserRole = getCurrentUserSession()?.role || "user";
  const isAdmin = currentUserRole === "admin" || currentUserRole === "dai_doi_truong" || currentUserRole === "tro_ly_ky_thuat";
  const isLocked = formData.originalStatus === 'APPROVED';

  const tongGioCong = formData.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.gioCong) || 0), 0) || 0;
  const vatTuList = formData.items?.map((i: any) => i.vatTu?.trim()).filter((v: string) => v && v.length > 0) || [];

  const handlePrint = () => {
    window.print();
  };

  
  const handleExportPDF = () => {
    const originalTitle = document.title;
    document.title = `PhieuTongThao_${formData?.soPhieu || '0'}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
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
            disabled={isLocked && !isAdmin}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${
              isLocked && !isAdmin ? 'text-stone-400 border-stone-200 cursor-not-allowed hidden' : 'text-red-600 hover:bg-red-50 border-red-200'
            }`}
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
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-600 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Xuất PDF
          </button>
          
          <select 
            value={formData.status || 'DRAFT'}
            onChange={(e) => setFormData({ 
              ...formData, 
              status: e.target.value,
              completedAt: e.target.value === 'COMPLETED' ? new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : (formData.completedAt || null),
              approvedAt: e.target.value === 'APPROVED' ? new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : (formData.approvedAt || null),
             })}
            disabled={isLocked && !isAdmin}
            className={`px-3 py-2 text-sm font-medium rounded-lg border outline-none ${
              formData.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              formData.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              formData.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-stone-50 text-stone-700 border-stone-200'
            }`}
          >
            <option value="DRAFT">Nháp</option>
            <option value="IN_PROGRESS">Đang thực hiện</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="APPROVED">Đã nghiệm thu</option>
          </select>

          <button 
            onClick={handleSave}
            disabled={isLocked && !isAdmin}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm ${
              isLocked && !isAdmin ? 'bg-stone-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
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
            </div>
          </div>

          <div className="text-center mb-6 flex justify-center items-center gap-2">
            <h1 className="text-xl font-bold uppercase m-0 leading-tight">PHIẾU SỬA CHỮA: Số</h1>
            <input 
              type="text" 
              value={formData.soPhieu !== undefined ? formData.soPhieu : ''}
              onChange={(e) => setFormData({...formData, soPhieu: e.target.value})}
              disabled={isLocked && !isAdmin}
              className="text-xl font-bold border-b border-dotted border-black bg-transparent outline-none w-16 text-center disabled:opacity-75 disabled:cursor-not-allowed" 
            />
          </div>

          <div className="mb-6 grid grid-cols-2 gap-8 text-[15px] leading-relaxed">
            <div className="space-y-2">
              <div className="flex gap-2 relative items-end">
                <span className="whitespace-nowrap">Tên TBKT:</span>
                <input 
                  type="text" 
                  value={formData.tenTBKT !== undefined ? formData.tenTBKT : formData.vehicleName}
                  onChange={(e) => setFormData({...formData, tenTBKT: e.target.value})}
                  disabled={isLocked && !isAdmin}
                  className="border-b border-dotted border-black flex-1 bg-transparent outline-none pb-0 px-2 font-bold disabled:opacity-75 disabled:cursor-not-allowed" 
                />
                <button
                  disabled={isLocked && !isAdmin}
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
                              vehicleNumber: v.plateNumber || '',
                              tenTBKT: v.brand || v.vehicleGroup || 'Không xác định',
                              soHieu: v.plateNumber || ''
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
              <div className="flex gap-2">
                <span className="whitespace-nowrap">Số hiệu:</span>
                <input 
                  type="text" 
                  value={formData.soHieu !== undefined ? formData.soHieu : formData.vehicleNumber}
                  onChange={(e) => setFormData({...formData, soHieu: e.target.value})}
                  disabled={isLocked && !isAdmin}
                  className="border-b border-dotted border-black flex-1 bg-transparent outline-none pb-0 px-2 font-bold disabled:opacity-75 disabled:cursor-not-allowed" 
                />
              </div>
              <div className="flex gap-2">
                <span className="whitespace-nowrap">Số XX:</span>
                <input 
                  type="text" 
                  value={formData.soXX !== undefined ? formData.soXX : formData.xxNumber1}
                  onChange={(e) => setFormData({...formData, soXX: e.target.value})}
                  disabled={isLocked && !isAdmin}
                  className="border-b border-dotted border-black flex-1 bg-transparent outline-none pb-0 px-2 font-bold disabled:opacity-75 disabled:cursor-not-allowed" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <span className="whitespace-nowrap">Cụm - Công đoạn:</span>
                <input 
                  type="text" 
                  value={formData.cumCongDoan !== undefined ? formData.cumCongDoan : 'Tổng tháo cụm động cơ'}
                  onChange={(e) => setFormData({...formData, cumCongDoan: e.target.value})}
                  disabled={isLocked && !isAdmin}
                  className="border-b border-dotted border-black flex-1 bg-transparent outline-none pb-0 px-2 font-bold disabled:opacity-75 disabled:cursor-not-allowed" 
                />
              </div>
              <div className="flex gap-2">
                <span className="whitespace-nowrap">Tờ số:</span>
                <input 
                  type="text" 
                  value={formData.toSo !== undefined ? formData.toSo : (formData.sheetNumber || '1')}
                  onChange={(e) => setFormData({...formData, toSo: e.target.value})}
                  disabled={isLocked && !isAdmin}
                  className="border-b border-dotted border-black flex-1 bg-transparent outline-none pb-0 px-2 font-bold disabled:opacity-75 disabled:cursor-not-allowed" 
                />
              </div>
              <div className="flex gap-2">
                <span className="whitespace-nowrap">Số tờ:</span>
                <input 
                  type="text" 
                  value={formData.soTo !== undefined ? formData.soTo : '1'}
                  onChange={(e) => setFormData({...formData, soTo: e.target.value})}
                  disabled={isLocked && !isAdmin}
                  className="border-b border-dotted border-black flex-1 bg-transparent outline-none pb-0 px-2 font-bold disabled:opacity-75 disabled:cursor-not-allowed" 
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <table className="w-full border-collapse border-y border-x sm:border border-stone-300 sm:border-black text-[15px]">
              <thead className="hidden sm:table-header-group">
                <tr>
                  <th className="border border-black px-2 py-2 text-center w-12 font-bold">TT</th>
                  <th className="border border-black px-2 py-2 text-center font-bold">Nội dung</th>
                  <th className="border border-black px-2 py-2 text-center font-bold">Yêu cầu</th>
                  <th className="border border-black px-2 py-2 text-center font-bold">Thực tế</th>
                  <th className="border border-black px-2 py-2 text-center font-bold">Vật tư</th>
                  <th className="border border-black px-2 py-2 text-center font-bold" style={{width: '80px'}}>Giờ công</th>
                  <th className="border border-black px-2 py-2 text-center w-32 font-bold">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="border border-black px-2 py-4 text-center text-stone-500 italic">
                      Chưa có nội dung
                    </td>
                  </tr>
                )}
                {(() => {
                  let lastCategory = '';
                  return formData.items.map((item: any, index: number) => {
                    const showCategoryHeader = item.category && item.category !== lastCategory;
                    if (showCategoryHeader) {
                      lastCategory = item.category;
                    }
                    return (
                      <React.Fragment key={index}>
                        {showCategoryHeader && (
                          <tr className="bg-stone-50 print:bg-stone-100 font-bold block sm:table-row">
                            <td colSpan={7} className="border border-black px-4 py-2 text-left text-[14px]">
                              {item.category}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td className="border border-black px-2 py-2 text-center">{item.stt || index + 1}</td>
                          <td className="border border-black p-0 relative">
                            <div className="flex flex-col h-full">
                              <AutoResizeTextarea 
                                value={item.noiDung || ''}
                                onChange={(e) => {
                                  const newItems = [...formData.items];
                                  newItems[index].noiDung = e.target.value;
                                  setFormData({ ...formData, items: newItems });
                                }}
                                disabled={isLocked && !isAdmin}
                                className="w-full h-full min-h-[36px] bg-transparent outline-none px-2 py-2 font-bold text-emerald-700 print:text-black disabled:opacity-75"
                              />
                            </div>
                          </td>
                          <td className="border border-black p-0">
                            <AutoResizeTextarea 
                              value={item.yeuCau || ''}
                              onChange={(e) => {
                                const newItems = [...formData.items];
                                newItems[index].yeuCau = e.target.value;
                                setFormData({ ...formData, items: newItems });
                              }}
                              disabled={isLocked && !isAdmin}
                              className="w-full h-full min-h-[36px] bg-transparent outline-none px-2 py-2 font-bold text-emerald-700 print:text-black disabled:opacity-75"
                            />
                          </td>
                          <td className="border border-black p-0">
                            <AutoResizeTextarea 
                              value={item.thucTe || ''}
                              onChange={(e) => {
                                const newItems = [...formData.items];
                                newItems[index].thucTe = e.target.value;
                                setFormData({ ...formData, items: newItems });
                              }}
                              disabled={isLocked && !isAdmin}
                              className="w-full h-full min-h-[36px] bg-transparent outline-none px-2 py-2 text-center font-bold text-emerald-700 print:text-black disabled:opacity-75"
                            />
                          </td>
                          <td className="border border-black p-0">
                            <AutoResizeTextarea 
                              value={item.vatTu || ''}
                              onChange={(e) => {
                                const newItems = [...formData.items];
                                newItems[index].vatTu = e.target.value;
                                setFormData({ ...formData, items: newItems });
                              }}
                              disabled={isLocked && !isAdmin}
                              className="w-full h-full min-h-[36px] bg-transparent outline-none px-2 py-2 text-center font-bold text-emerald-700 print:text-black disabled:opacity-75"
                            />
                          </td>
                          <td className="border border-black p-0">
                            <AutoResizeTextarea 
                              value={item.gioCong || ''}
                              onChange={(e) => {
                                const newItems = [...formData.items];
                                newItems[index].gioCong = e.target.value;
                                setFormData({ ...formData, items: newItems });
                              }}
                              disabled={isLocked && !isAdmin}
                              className="w-full h-full min-h-[36px] bg-transparent outline-none px-2 py-2 text-center font-bold text-emerald-700 print:text-black disabled:opacity-75"
                            />
                          </td>
                          <td className="border border-black p-0">
                            <AutoResizeTextarea 
                              value={item.ghiChu || ''}
                              onChange={(e) => {
                                const newItems = [...formData.items];
                                newItems[index].ghiChu = e.target.value;
                                setFormData({ ...formData, items: newItems });
                              }}
                              disabled={isLocked && !isAdmin}
                              className="w-full h-full min-h-[36px] bg-transparent outline-none px-2 py-2 text-center font-bold text-emerald-700 print:text-black disabled:opacity-75"
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

          <div className="mb-6 bg-stone-50 border border-stone-200 p-4 rounded-lg print:border-black print:bg-white print:rounded-none">
            <h3 className="font-bold text-[15px] mb-2 uppercase text-emerald-800 print:text-black">Tổng hợp giờ công</h3>
            <div className="text-[14px] mb-4">
              <span className="font-bold text-2xl text-emerald-700 print:text-black">{tongGioCong.toFixed(1)}</span> <span className="text-stone-600 font-medium print:text-black">giờ</span>
            </div>

            <h3 className="font-bold text-[15px] mb-2 uppercase text-emerald-800 print:text-black">Tổng hợp vật tư sử dụng</h3>
            <div className="text-[14px] text-stone-700 print:text-black min-h-[40px]">
              {vatTuList.length > 0 ? vatTuList.join(', ') : <span className="italic text-stone-400">Không có vật tư ghi nhận</span>}
            </div>
          </div>

          <div className="mb-4">
            <span className="font-bold text-[15px] mr-2">KẾT LUẬN:</span>
            <AutoResizeTextarea
              value={formData.ketLuan !== undefined ? formData.ketLuan : (formData.conclusion || '')}
              onChange={(e) => setFormData({...formData, ketLuan: e.target.value})}
              disabled={isLocked && !isAdmin}
              className="flex-1 w-full border-none p-0 outline-none text-[15px] leading-relaxed font-bold text-emerald-700 print:text-black bg-transparent min-h-[40px] disabled:opacity-75 disabled:cursor-not-allowed"
              placeholder="Nhập kết luận..."
            />
          </div>

          <div className="flex justify-end mb-4">
            <input 
              type="text" 
              value={formData.ngayLap || ''}
              onChange={(e) => setFormData({...formData, ngayLap: e.target.value})}
              disabled={isLocked && !isAdmin}
              className="text-right italic font-bold text-emerald-700 print:text-black bg-transparent outline-none min-w-[250px] disabled:opacity-75 disabled:cursor-not-allowed" 
            />
          </div>

          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center flex flex-col items-center">
              <p className="font-bold text-[15px] mb-12">TỔ TRƯỞNG</p>
              <input 
                type="text" 
                className="w-full text-center outline-none bg-transparent font-bold text-[15px] print:text-black" 
                value={formData['sign_TỔ TRƯỞNG'] || ''} 
                onChange={(e) => setFormData({...formData, 'sign_TỔ TRƯỞNG': e.target.value})}
                placeholder="..."
              />
              <input 
                type="text" 
                value={formData.toTruong || ''}
                onChange={(e) => setFormData({...formData, toTruong: e.target.value})}
                disabled={isLocked && !isAdmin}
                className="text-center font-bold text-emerald-700 print:text-black bg-transparent outline-none w-full disabled:opacity-75 disabled:cursor-not-allowed" 
              />
            </div>
            <div className="text-center flex flex-col items-center">
              <p className="font-bold text-[15px] mb-12">ĐẠI ĐỘI TRƯỞNG</p>
              <input 
                type="text" 
                className="w-full text-center outline-none bg-transparent font-bold text-[15px] print:text-black" 
                value={formData['sign_ĐẠI ĐỘI TRƯỞNG'] || ''} 
                onChange={(e) => setFormData({...formData, 'sign_ĐẠI ĐỘI TRƯỞNG': e.target.value})}
                placeholder="..."
              />
              <input 
                type="text" 
                value={formData.daiDoiTruong || ''}
                onChange={(e) => setFormData({...formData, daiDoiTruong: e.target.value})}
                disabled={isLocked && !isAdmin}
                className="text-center font-bold text-emerald-700 print:text-black bg-transparent outline-none w-full disabled:opacity-75 disabled:cursor-not-allowed" 
              />
            </div>
            <div className="text-center flex flex-col items-center">
              <p className="font-bold text-[15px] mb-12">NHÂN VIÊN KCS</p>
              <input 
                type="text" 
                className="w-full text-center outline-none bg-transparent font-bold text-[15px] print:text-black" 
                value={formData['sign_NHÂN VIÊN KCS'] || ''} 
                onChange={(e) => setFormData({...formData, 'sign_NHÂN VIÊN KCS': e.target.value})}
                placeholder="..."
              />
              <input 
                type="text" 
                value={formData.nhanVienKCS || ''}
                onChange={(e) => setFormData({...formData, nhanVienKCS: e.target.value})}
                disabled={isLocked && !isAdmin}
                className="text-center font-bold text-emerald-700 print:text-black bg-transparent outline-none w-full disabled:opacity-75 disabled:cursor-not-allowed" 
              />
            </div>
            <div className="text-center flex flex-col items-center">
              <p className="font-bold text-[15px] mb-12">CHỈ HUY TIỂU ĐOÀN</p>
              <input 
                type="text" 
                className="w-full text-center outline-none bg-transparent font-bold text-[15px] print:text-black" 
                value={formData['sign_CHỈ HUY TIỂU ĐOÀN'] || ''} 
                onChange={(e) => setFormData({...formData, 'sign_CHỈ HUY TIỂU ĐOÀN': e.target.value})}
                placeholder="..."
              />
              <input 
                type="text" 
                value={formData.chiHuyTieuDoan || ''}
                onChange={(e) => setFormData({...formData, chiHuyTieuDoan: e.target.value})}
                disabled={isLocked && !isAdmin}
                className="text-center font-bold text-emerald-700 print:text-black bg-transparent outline-none w-full disabled:opacity-75 disabled:cursor-not-allowed" 
              />
            </div>
          </div>

          {formData.updatedAt && (
            <div className="mt-12 text-center text-[12px] text-stone-400 italic print:hidden">
              Cập nhật lần cuối: {formData.updatedAt} {formData.updatedBy && `bởi ${formData.updatedBy}`}
            </div>
          )}
</div>
      </div>
    </div>
  );
};
