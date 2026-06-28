import React, { useState, useEffect } from 'react';
import { Save, Printer, Download, FileText, Check, Loader2, Maximize2, Minimize2, X, ChevronDown } from 'lucide-react';
import { Vehicle } from '../types';
import InspectionTemplate from '../HyundaiCountyInspectionTemplate.json';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { getCurrentUserSession } from '../services/dbService';
import { logger } from '../utils/logger';
import { canEditModule } from '../services/permissionService';
import { canEditDocument } from '../services/ownershipService';

interface DetailedSelectionProtocolFormProps {
  vehicle: Vehicle | null;
  savedVehicles?: Vehicle[];
  initialFormId?: string | null;
  onClose: () => void;
  onSaveSuccess?: () => void;
  currentUserRole?: string;
}

interface ProtocolMetadata {
  unitTransfer: string;
  vehicleGroup: string;
  unitReceive: string;
  actualChassisNumber: string;
  actualEngineNumber: string;
  vehicleCondition: 'chay' | 'keo' | '';
  note: string;
  reportNo: string;
  docDate: string;
  giverName?: string;
  inspectorName?: string;
  commanderName?: string;
}

interface FormRowData {
  missing: string;
  replace: string;
  restore: string;
  repair: string;
  reuse: string;
}

export function DetailedSelectionProtocolForm({ vehicle, savedVehicles = [], initialFormId = null, onClose, onSaveSuccess, currentUserRole }: DetailedSelectionProtocolFormProps) {
  const canEdit = currentUserRole ? canEditModule(currentUserRole as any, 'INSPECTION') : false;

  const [formData, setFormData] = useState<Record<string, FormRowData>>({});
  const [metadata, setMetadata] = useState<ProtocolMetadata>({
    unitTransfer: '',
    vehicleGroup: '',
    unitReceive: '',
    actualChassisNumber: '',
    actualEngineNumber: '',
    vehicleCondition: '',
    note: '',
    reportNo: '',
    docDate: ''
  });
  const [docId, setDocId] = useState<string | null>(null);
  const [existingDoc, setExistingDoc] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Auto-select logic
  useEffect(() => {
    const vId = vehicle?.vehicleId || (vehicle as any)?.id;
    if (vId && savedVehicles.some(v => v.vehicleId === vId || (v as any).id === vId)) {
      setSelectedVehicleId(vId);
    }
  }, [vehicle]); // React only to parent 'vehicle' prop changes

  useEffect(() => {
    if (!selectedVehicleId && savedVehicles.length > 0) {
      const vId = vehicle?.vehicleId || (vehicle as any)?.id;
      if (!vId || !savedVehicles.some(v => v.vehicleId === vId || (v as any).id === vId)) {
        setSelectedVehicleId(savedVehicles[0].vehicleId || (savedVehicles[0] as any).id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedVehicles]);

  // Calculate the active vehicle based on the selection
  const activeVehicle = savedVehicles.find(v => v.vehicleId === selectedVehicleId || (v as any).id === selectedVehicleId);

  useEffect(() => {
    const vId = activeVehicle?.vehicleId || (activeVehicle as any)?.id;
    if (vId) {
      const fetchForm = async () => {
        setIsLoading(true);
        try {
          const isInitialVehicle = vId === (vehicle?.vehicleId || (vehicle as any)?.id);
          const formIdToMatch = isInitialVehicle ? initialFormId : null;

          if (!formIdToMatch) {
            setDocId(null);
            setExistingDoc(null);
            setFormData({});
            return;
          }

          let firestoreDocFound = false;

          // 1. Ưu tiên đọc từ Firestore trước
          try {
            const q = query(
              collection(db, 'vehicleInspectionForms'),
              where('vehicleId', '==', vId)
            );
            const snapshot = await getDocs(q);
            const correctDoc = snapshot.docs.find(docSnap => {
              const d = docSnap.data();
              return (docSnap.id === formIdToMatch || d.protocolId === formIdToMatch) && d.isDeleted === false;
            });

            if (correctDoc) {
              const data = correctDoc.data();
              setDocId(correctDoc.id);
              setExistingDoc(data);
              setFormData(data.formData || {});
              if (data.metadata) {
                setMetadata(prev => ({ ...prev, ...data.metadata }));
              }
              
              // Cache it
              cacheFormLocally({ docId: correctDoc.id, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
              firestoreDocFound = true;
            }
          } catch (firestoreError) {
            console.error("Lỗi đọc Firestore, thử tải từ LocalStorage:", firestoreError);
          }

          // 2. Chỉ fallback về LocalStorage khi:
          //    - Lỗi khi lấy từ Firestore (không có mạng, v.v.)
          //    - Hoặc không tìm thấy bất kỳ bản ghi nào thỏa mãn trên Firestore
          if (!firestoreDocFound) {
            const localCache = localStorage.getItem('local_vehicle_inspection_forms');
            let cacheFound = false;

            if (localCache) {
              try {
                const forms = JSON.parse(localCache);
                const cachedForm = forms.find((f: any) => {
                  return (f.docId === formIdToMatch || f.protocolId === formIdToMatch || f.id === formIdToMatch || f.vehicleId === formIdToMatch) && !f.isDeleted;
                });
                
                if (cachedForm) {
                  setDocId(cachedForm.docId || null);
                  setExistingDoc(cachedForm);
                  setFormData(cachedForm.formData || {});
                  if (cachedForm.metadata) {
                    setMetadata(prev => ({ ...prev, ...cachedForm.metadata }));
                  }
                  cacheFound = true;
                }
              } catch (e) {
                console.warn("Failed to parse local_vehicle_inspection_forms", e);
              }
            }

            if (!cacheFound) {
              setDocId(null);
              setExistingDoc(null);
              setFormData({});
            }
          }
        } catch (error) {
          console.error("Error fetching form", error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchForm();
    }
  }, [selectedVehicleId, vehicle, initialFormId]);

  const cacheFormLocally = (formDoc: any) => {
    try {
      const dpKey = 'local_vehicle_inspection_forms';
      const dpStored = localStorage.getItem(dpKey);
      let dpList: any[] = [];
      if (dpStored) {
        dpList = JSON.parse(dpStored);
      }
      dpList = dpList.filter((p: any) => p.docId !== formDoc.docId && p.id !== formDoc.docId);
      dpList.push(formDoc);
      localStorage.setItem(dpKey, JSON.stringify(dpList));
    } catch (e) {
      console.warn("Failed to cache form", e);
    }
  };

  const handleInputChange = (rowIndex: number, field: keyof FormRowData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [rowIndex.toString()]: {
        ...(prev[rowIndex.toString()] || { missing: '', replace: '', restore: '', repair: '', reuse: '' }),
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    const currentUser = getCurrentUserSession();
    const canModifyCurrentDocument = !existingDoc ? canEdit : (canEdit && canEditDocument(currentUser, existingDoc));

    if (!canModifyCurrentDocument) {
      alert('Bạn chỉ có quyền xem dữ liệu.');
      return;
    }
    const vId = activeVehicle?.vehicleId || (activeVehicle as any)?.id;
    if (!vId) {
      logger.warn("Chưa chọn phương tiện.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        vehicleId: vId,
        plateNumber: activeVehicle?.plateNumber || '',
        templateName: 'Hyundai County Inspection',
        vehicleName: activeVehicle?.brand || 'Hyundai County',
        formData: formData,
        metadata: metadata,
        isDeleted: false,
        updatedAt: serverTimestamp(),
      };

      let newDocId = docId;

      if (docId) {
        await updateDoc(doc(db, 'vehicleInspectionForms', docId), payload);
      } else {
        const fullPayload = {
          ...payload,
          createdBy: currentUser?.uid || '',
          createdByName: currentUser?.displayName || currentUser?.username || '',
          createdByRole: currentUser?.role || '',
          createdByUnit: currentUser?.unit || '',
          createdAt: serverTimestamp(),
        };
        const ref = await addDoc(collection(db, 'vehicleInspectionForms'), fullPayload);
        newDocId = ref.id;
        setDocId(ref.id);
      }
      
      // Avoid passing serverTimestamp() to localStorage which causes JSON.stringify errors
      const cachePayload = {
        ...payload,
        docId: newDocId,
        updatedAt: new Date().toISOString()
      };
      
      cacheFormLocally(cachePayload);

      logger.success("Đã lưu biên bản kiểm chọn.");
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error) {
      console.error(error);
      logger.error("Không thể lưu dữ liệu.", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!activeVehicle?.vehicleId) {
    return (
      <div className="flex-1 w-full bg-stone-100 flex flex-col items-center justify-center p-8">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md w-full">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 flex items-center justify-center rounded-full mx-auto mb-4">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-stone-800 mb-2">Vui lòng chọn xe trước</h3>
          <p className="text-stone-500 mb-6 font-medium">Bạn cần chọn một xe để thực hiện kiểm chọn chi tiết.</p>
          
          <div className="text-left mb-6">
            <label className="block text-sm font-semibold text-stone-700 mb-2">Chọn xe từ danh sách:</label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full text-sm border-2 border-stone-200 rounded-lg px-3 py-2.5 bg-stone-50 focus:outline-none focus:border-emerald-500 hover:bg-white transition-colors"
            >
              <option value="">-- Click để chọn xe --</option>
              {savedVehicles.map((v, i) => (
                <option key={`${v.vehicleId || 'no-id'}-${i}`} value={v.vehicleId || (v as any).id}>
                  {v.plateNumber} ({v.brand})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-700 text-sm font-medium underline"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // A4 dimensions approx: max-width: 210mm x 297mm (min-height)
  return (
    <div className={`flex flex-col h-full bg-stone-100 border border-stone-200 shadow-xl overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : 'relative rounded-2xl'}`} style={{ maxHeight: isFullscreen ? '100vh' : '820px' }}>
      
      {/* Upper Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-white border-b border-stone-200">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-amber-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-stone-300">Biên bản kiểm chọn (A4)</span>
          <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 rounded-md border border-emerald-800">{activeVehicle?.plateNumber || "BẢN NHÁP"}</span>
          <span className="text-xs font-medium text-stone-500 ml-2">
            {isLoading ? "Đang tải dữ liệu..." : (docId ? "Bản lưu trên hệ thống" : "Chưa lưu")}
          </span>
        </div>

        {/* Dynamic Zoom levels based on user request */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 hidden sm:flex bg-stone-50 border border-stone-200 px-1.5 py-0.5 rounded-lg text-xs font-mono">
            <span className="mr-1.5 text-stone-400 font-sans text-3xs uppercase tracking-wider">Tỷ lệ:</span>
            {[50, 75, 100, 125, 150, 200].map((z) => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`px-1.5 py-0.5 rounded transition-all text-3xs font-bold cursor-pointer ${zoom === z ? 'bg-amber-600 text-white shadow-sm' : 'hover:bg-white text-stone-600 hover:text-stone-800'}`}
              >
                {z}%
              </button>
            ))}
          </div>

          {/* Fullscreen Button */}
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)} 
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 transition-colors rounded-lg text-xs font-medium"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Thu nhỏ' : 'Mở rộng'}</span>
          </button>

          <div className="h-4 w-px bg-stone-800 mx-1"></div>

          <button
            onClick={() => logger.info("Chức năng đang được cập nhật.")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-stone-800 border border-stone-200 rounded-lg text-xs font-medium transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Xuất PDF</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-stone-800 border border-stone-200 rounded-lg text-xs font-medium transition-all"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">In</span>
          </button>
          
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading || !activeVehicle?.vehicleId}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-emerald-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span>{isSaving ? "Đang lưu..." : "Lưu"}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-8 h-8 text-stone-400 hover:text-white bg-stone-50 hover:bg-red-500/80 border border-stone-200 hover:border-red-500 rounded-lg transition-all ml-1"
            title="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 w-full overflow-auto p-4 md:p-8 flex justify-center bg-white sm:bg-stone-50/80 print:p-0 print:bg-white custom-scrollbar">
        <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.15s ease-out', marginBottom: `${Math.max(0, (zoom - 100) * 10)}px` }} className="print:transform-none">
          <div 
            className="bg-white text-stone-900 sm:shadow-2xl origin-top-left sm:origin-top w-full sm:w-auto border-none sm:border-2 border-transparent sm:border-stone-200 print:border-none print:w-full print:p-0 print:shadow-none print:!zoom-100 min-h-[max-content] flex flex-col mx-auto font-serif"
            style={{ fontFamily: '"Times New Roman", Times, serif', width: typeof window !== 'undefined' && window.innerWidth < 800 ? '100%' : '260mm', minHeight: typeof window !== 'undefined' && window.innerWidth < 800 ? '100%' : '350mm', padding: typeof window !== 'undefined' && window.innerWidth < 800 ? '10mm 4mm' : '20mm', marginRight: 'auto', marginLeft: 'auto' }} // Approximate A4 aspect ratio
          >
            {/* A4 Content Area */}
            <div className="flex flex-col gap-6 text-black print:p-0">
              <fieldset disabled={!canEdit} className="border-0 p-0 m-0 min-w-0">
              
              {/* Administrative Header block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start text-center mb-6 pb-4 border-b border-stone-200">
            <div className="space-y-1">
              <div className="font-bold text-stone-900 uppercase whitespace-nowrap" style={{ fontSize: '13pt' }}>CỤC HẬU CẦN - KỸ THUẬT QUÂN ĐOÀN 34</div>
              <div className="font-bold text-stone-900 uppercase underline decoration-1 underline-offset-4 whitespace-nowrap" style={{ fontSize: '13pt' }}>TIỂU ĐOÀN SCTH30</div>
              <div className="flex justify-center items-center gap-1.5 mt-3" style={{ fontSize: '13pt' }}>
                <span className="text-stone-700 whitespace-nowrap">Số biên bản:</span>
                <input 
                  type="text" 
                  value={metadata.reportNo || ''}
                  onChange={(e) => setMetadata({ ...metadata, reportNo: e.target.value })}
                  placeholder="Nhập số biên bản..."
                  className="w-48 bg-transparent border-b border-stone-400 focus:border-stone-850 outline-none px-2 py-0.5 text-center font-bold font-mono"
                  style={{ fontSize: '13pt' }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-stone-900 uppercase whitespace-nowrap" style={{ fontSize: '13pt' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div className="font-bold text-stone-900 uppercase underline decoration-1 underline-offset-4 whitespace-nowrap" style={{ fontSize: '13pt' }}>Độc lập - Tự do - Hạnh phúc</div>
              <div className="flex justify-center items-center gap-1.5 mt-3" style={{ fontSize: '13pt' }}>
                <input 
                  type="text" 
                  value={metadata.docDate || ''}
                  onChange={(e) => setMetadata({ ...metadata, docDate: e.target.value })}
                  placeholder="Gia Lai, ngày... tháng... năm 2026"
                  className="w-80 bg-transparent border-b border-stone-400 focus:border-stone-850 outline-none px-2 py-0.5 text-center italic font-bold"
                  style={{ fontSize: '13pt' }}
                />
              </div>
            </div>
          </div>

          {/* Document Header */}
          <div className="text-center pt-4">
            <h1 className="text-[20px] font-bold uppercase mb-1">BIÊN BẢN</h1>
            <h2 className="text-[18px] font-bold">Kiểm chọn chi tiết Xe – Máy vào sửa chữa</h2>
          </div>

          {/* Top Form Fields */}
          <div className="mt-8 space-y-4 text-[15px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {/* Row 1 */}
              <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-2 sm:items-center">
                <span className="font-bold min-w-[100px]">Đơn vị giao:</span>
                <input 
                  type="text" 
                  className="flex-1 w-full border-b border-dashed border-stone-400 focus:outline-none focus:border-stone-800 bg-transparent"
                  value={metadata.unitTransfer}
                  onChange={(e) => setMetadata({ ...metadata, unitTransfer: e.target.value })}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-2 sm:items-center">
                <span className="font-bold min-w-[90px]">Loại xe máy:</span>
                <span className="flex-1 w-full font-bold">Hyundai County</span>
              </div>

              {/* Row 2 */}
              <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-2 sm:items-center relative group">
                <span className="font-bold min-w-[100px]">Số ĐK:</span>
                <select 
                  className="flex-1 w-full pb-0.5 border-b border-dashed border-stone-400 focus:outline-none focus:border-stone-800 bg-transparent font-bold appearance-none cursor-pointer pr-6 relative z-10"
                  value={activeVehicle?.vehicleId || ''}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                >
                  <option value={activeVehicle?.vehicleId || ''}>{activeVehicle?.plateNumber || ''}</option>
                  {savedVehicles.filter(v => v.vehicleId !== activeVehicle?.vehicleId).map((v) => (
                    <option key={v.vehicleId || (v as any).id} value={v.vehicleId || (v as any).id}>
                      {v.plateNumber} ({v.brand})
                    </option>
                  ))}
                </select>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-stone-500 opacity-30 group-hover:opacity-100 transition-opacity z-0">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-2 sm:items-center">
                <span className="font-bold min-w-[90px]">Nhóm xe:</span>
                <input 
                  type="text" 
                  className="flex-1 w-full border-b border-dashed border-stone-400 focus:outline-none focus:border-stone-800 bg-transparent"
                  value={metadata.vehicleGroup}
                  onChange={(e) => setMetadata({ ...metadata, vehicleGroup: e.target.value })}
                />
              </div>

              {/* Row 3 */}
              <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-2 sm:items-center">
                <span className="font-bold min-w-[100px]">Đơn vị nhận:</span>
                <input 
                  type="text" 
                  className="flex-1 w-full border-b border-dashed border-stone-400 focus:outline-none focus:border-stone-800 bg-transparent"
                  value={metadata.unitReceive}
                  onChange={(e) => setMetadata({ ...metadata, unitReceive: e.target.value })}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-2 sm:items-center">
                <span className="font-bold min-w-[90px]">SK:</span>
                <input 
                  type="text" 
                  className="w-24 border-b border-dashed border-stone-400 focus:outline-none focus:border-stone-800 bg-transparent"
                  value={activeVehicle?.chassisNumber || ''}
                  readOnly
                />
                <span className="font-bold ml-4 mr-2">Thực tế:</span>
                <input 
                  type="text" 
                  className="flex-1 w-full border-b border-dashed border-stone-400 focus:outline-none focus:border-stone-800 bg-transparent"
                  value={metadata.actualChassisNumber}
                  onChange={(e) => setMetadata({ ...metadata, actualChassisNumber: e.target.value })}
                />
              </div>

              {/* Row 4 */}
              <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-4 sm:items-center">
                <span className="font-bold min-w-[100px]">TTT xe vào:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="radio" 
                    name="ttt_" 
                    className="w-4 h-4 accent-black" 
                    checked={metadata.vehicleCondition === 'chay'}
                    onChange={() => setMetadata({ ...metadata, vehicleCondition: 'chay' })}
                  />
                  <span>Chạy</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="radio" 
                    name="ttt_" 
                    className="w-4 h-4 accent-black" 
                    checked={metadata.vehicleCondition === 'keo'}
                    onChange={() => setMetadata({ ...metadata, vehicleCondition: 'keo' })}
                  />
                  <span>Kéo</span>
                </label>
              </div>
              <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-2 sm:items-center">
                <span className="font-bold min-w-[90px]">SM:</span>
                <input 
                  type="text" 
                  className="w-24 border-b border-dashed border-stone-400 focus:outline-none focus:border-stone-800 bg-transparent"
                  value={activeVehicle?.engineNumber || ''}
                  readOnly
                />
                <span className="font-bold ml-4 mr-2">Thực tế:</span>
                <input 
                  type="text" 
                  className="flex-1 w-full border-b border-dashed border-stone-400 focus:outline-none focus:border-stone-800 bg-transparent"
                  value={metadata.actualEngineNumber}
                  onChange={(e) => setMetadata({ ...metadata, actualEngineNumber: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Middle Part - Table */}
          <div className="mt-8">
            <h3 className="text-center font-bold uppercase mb-4 text-[16px]">KẾT QUẢ KIỂM CHỌN</h3>
            
            <table className="w-full border-collapse border border-black text-[14px]">
              <thead className="hidden sm:table-header-group">
                <tr>
                  <th className="border border-black p-2 font-bold text-center w-12">TT</th>
                  <th className="border border-black p-2 font-bold text-center w-1/3">Tên cụm – chi tiết</th>
                  <th className="border border-black p-2 font-bold text-center w-20">Biên chế</th>
                  <th className="border border-black p-2 font-bold text-center">Thiếu</th>
                  <th className="border border-black p-2 font-bold text-center">Hỏng thay</th>
                  <th className="border border-black p-2 font-bold text-center">Phục hồi</th>
                  <th className="border border-black p-2 font-bold text-center">S/C</th>
                  <th className="border border-black p-2 font-bold text-center">Dùng lại</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let globalIndex = 0;
                  return InspectionTemplate.groups.map((group) => (
                  <React.Fragment key={group.name}>
                     <tr className="bg-stone-50 font-bold block sm:table-row">
                        <td colSpan={8} className="border-y border-x sm:border border-stone-300 sm:border-black py-2.5 px-3 sm:p-2 text-left block sm:table-cell mt-4 sm:mt-0 text-[12pt] sm:text-[14px]">{group.name}</td>
                     </tr>
                     {group.subgroups.map((subgroup) => (
                       <React.Fragment key={subgroup.name}>
                          <tr className="bg-stone-50 font-bold italic block sm:table-row">
                            <td colSpan={8} className="border-y border-x sm:border border-stone-300 sm:border-black py-2 px-3 sm:p-2 text-left sm:pl-6 block sm:table-cell mt-2 sm:mt-0 bg-stone-100 sm:bg-transparent text-[11pt] sm:text-[14px]">{subgroup.name}</td>
                          </tr>
                          {subgroup.items.map((item) => {
                            globalIndex++;
                            const currentIndex = globalIndex;
                            return (
                            <tr key={item.name} className="flex flex-col sm:table-row hover:bg-stone-50/50 transition-colors border-b-2 sm:border-b border-stone-300 sm:border-black mb-2 sm:mb-0 h-auto sm:h-10">
                              <td className="hidden sm:table-cell border border-black p-1 text-center font-medium bg-stone-50/20">{currentIndex}</td>
                              <td className="py-2.5 px-2 sm:px-3 sm:border-r sm:border-black font-medium text-stone-800 text-[11pt] sm:text-[14px] leading-tight sm:leading-normal bg-stone-100 sm:bg-stone-50/20 border-t border-x border-stone-300 sm:border-y-0 sm:border-l-0"><span className="sm:hidden font-bold mr-1">{currentIndex}.</span>{item.name}<span className="sm:hidden text-stone-500 font-normal text-[9pt] ml-1">(Biên chế: {item.quantity})</span></td>
                              <td className="hidden sm:table-cell border border-black p-1 text-center font-bold text-stone-600 bg-stone-50/20">{item.quantity}</td>
                              <td className="py-1.5 px-2 sm:p-1 text-center bg-white sm:bg-transparent border-x border-b sm:border border-stone-300 sm:border-black flex sm:table-cell items-center justify-between">
    <span className="sm:hidden text-xs text-stone-500 font-medium ml-1">Thiếu</span>
    <input 
      type="number" min="0" placeholder="0"
      className="w-20 sm:w-full h-8 px-1 text-center bg-white sm:bg-transparent border border-stone-300 sm:border-transparent hover:border-stone-800 focus:border-stone-800 focus:bg-white sm:focus:bg-emerald-50 focus:outline-none cursor-pointer rounded px-2 sm:px-1 py-1.5 sm:py-0" 
      value={formData[currentIndex.toString()]?.missing || ''}
      onChange={(e) => handleInputChange(currentIndex, 'missing', e.target.value)}
    />
  </td>
                              <td className="py-1.5 px-2 sm:p-1 text-center bg-white sm:bg-transparent border-x border-b sm:border border-stone-300 sm:border-black flex sm:table-cell items-center justify-between">
    <span className="sm:hidden text-xs text-stone-500 font-medium ml-1">Hỏng thay</span>
    <input 
      type="number" min="0" placeholder="0"
      className="w-20 sm:w-full h-8 px-1 text-center bg-white sm:bg-transparent border border-stone-300 sm:border-transparent hover:border-stone-800 focus:border-stone-800 focus:bg-white sm:focus:bg-emerald-50 focus:outline-none cursor-pointer rounded px-2 sm:px-1 py-1.5 sm:py-0" 
      value={formData[currentIndex.toString()]?.replace || ''}
      onChange={(e) => handleInputChange(currentIndex, 'replace', e.target.value)}
    />
  </td>
                              <td className="py-1.5 px-2 sm:p-1 text-center bg-white sm:bg-transparent border-x border-b sm:border border-stone-300 sm:border-black flex sm:table-cell items-center justify-between">
    <span className="sm:hidden text-xs text-stone-500 font-medium ml-1">Phục hồi</span>
    <input 
      type="number" min="0" placeholder="0"
      className="w-20 sm:w-full h-8 px-1 text-center bg-white sm:bg-transparent border border-stone-300 sm:border-transparent hover:border-stone-800 focus:border-stone-800 focus:bg-white sm:focus:bg-emerald-50 focus:outline-none cursor-pointer rounded px-2 sm:px-1 py-1.5 sm:py-0" 
      value={formData[currentIndex.toString()]?.restore || ''}
      onChange={(e) => handleInputChange(currentIndex, 'restore', e.target.value)}
    />
  </td>
                              <td className="py-1.5 px-2 sm:p-1 text-center bg-white sm:bg-transparent border-x border-b sm:border border-stone-300 sm:border-black flex sm:table-cell items-center justify-between">
    <span className="sm:hidden text-xs text-stone-500 font-medium ml-1">Sửa chữa</span>
    <input 
      type="number" min="0" placeholder="0"
      className="w-20 sm:w-full h-8 px-1 text-center bg-white sm:bg-transparent border border-stone-300 sm:border-transparent hover:border-stone-800 focus:border-stone-800 focus:bg-white sm:focus:bg-emerald-50 focus:outline-none cursor-pointer rounded px-2 sm:px-1 py-1.5 sm:py-0" 
      value={formData[currentIndex.toString()]?.repair || ''}
      onChange={(e) => handleInputChange(currentIndex, 'repair', e.target.value)}
    />
  </td>
                              <td className="py-1.5 px-2 sm:p-1 text-center bg-white sm:bg-transparent border-x border-b sm:border border-stone-300 sm:border-black flex sm:table-cell items-center justify-between">
    <span className="sm:hidden text-xs text-stone-500 font-medium ml-1">Dùng lại</span>
    <input 
      type="number" min="0" placeholder="0"
      className="w-20 sm:w-full h-8 px-1 text-center bg-white sm:bg-transparent border border-stone-300 sm:border-transparent hover:border-stone-800 focus:border-stone-800 focus:bg-white sm:focus:bg-emerald-50 focus:outline-none cursor-pointer rounded px-2 sm:px-1 py-1.5 sm:py-0" 
      value={formData[currentIndex.toString()]?.reuse || ''}
      onChange={(e) => handleInputChange(currentIndex, 'reuse', e.target.value)}
    />
  </td>
                            </tr>
                            );
                          })}
                       </React.Fragment>
                     ))}
                  </React.Fragment>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          {/* Bottom Part - Notes */}
          <div className="mt-6">
            <span className="font-bold underline mb-2 block text-[15px]">Ghi chú:</span>
            <textarea 
              className="w-full h-32 border border-black p-2 focus:outline-none focus:ring-1 focus:ring-black text-[15px] resize-none"
              placeholder="Nhập ghi chú tại đây..."
              value={metadata.note}
              onChange={(e) => setMetadata({ ...metadata, note: e.target.value })}
            ></textarea>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-4 mt-8 pb-12 text-center" style={{ pageBreakInside: 'avoid' }}>
            <div>
               <p className="font-bold uppercase" style={{ fontSize: '13pt' }}>ĐẠI ĐỘI SỬA CHỮA XE</p>
               <p className="italic mb-24" style={{ fontSize: '13pt' }}>(Ký, ghi rõ họ tên)</p>
               <input 
                 type="text" 
                 value={metadata.giverName || ''}
                 onChange={(e) => setMetadata({ ...metadata, giverName: e.target.value })}
                 placeholder="..."
                 className="w-48 bg-transparent border-b border-stone-400 focus:border-stone-850 outline-none px-2 py-0.5 text-center font-bold"
                 style={{ fontSize: '13pt' }}
               />
            </div>
            <div>
               <p className="font-bold uppercase" style={{ fontSize: '13pt' }}>NHÂN VIÊN KCS</p>
               <p className="italic mb-24" style={{ fontSize: '13pt' }}>(Ký, ghi rõ họ tên)</p>
               <input 
                 type="text" 
                 value={metadata.inspectorName || ''}
                 onChange={(e) => setMetadata({ ...metadata, inspectorName: e.target.value })}
                 placeholder="..."
                 className="w-48 bg-transparent border-b border-stone-400 focus:border-stone-850 outline-none px-2 py-0.5 text-center font-bold"
                 style={{ fontSize: '13pt' }}
               />
            </div>
            <div>
               <p className="font-bold uppercase" style={{ fontSize: '13pt' }}>CHỈ HUY ĐƠN VỊ</p>
               <p className="italic mb-24" style={{ fontSize: '13pt' }}>(Ký, ghi rõ họ tên)</p>
               <input 
                 type="text" 
                 value={metadata.commanderName || ''}
                 onChange={(e) => setMetadata({ ...metadata, commanderName: e.target.value })}
                 placeholder="..."
                 className="w-48 bg-transparent border-b border-stone-400 focus:border-stone-850 outline-none px-2 py-0.5 text-center font-bold"
                 style={{ fontSize: '13pt' }}
               />
            </div>
          </div>
          </fieldset>

        </div>
        </div>
        </div>
      </div>
    </div>
  );
}
