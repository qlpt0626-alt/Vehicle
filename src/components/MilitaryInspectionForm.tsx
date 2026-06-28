import React, { Component, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Save, 
  Printer, 
  Download, 
  Maximize2, 
  Minimize2, 
  FileText,
  Check,
  Plus,
  Trash2
} from 'lucide-react';
import { Vehicle } from '../types';
import { dbService, getCreatorAuditParams, getCurrentUserSession, normalizePlate } from '../services/dbService';
import { DataService } from '../firebase';
import HyundaiCountyTemplate from '../HyundaiCountyTemplate.json';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import { canEditModule } from '../services/permissionService';
import { canEditDocument } from '../services/ownershipService';

interface MilitaryInspectionFormProps {
  vehicle?: Vehicle | null;
  onClose: () => void;
  onSave?: (savedForm: any, isSilent: boolean) => void;
  initialForm?: any;
  onReset?: () => void;
  currentUserRole?: string;
}

// Error Boundary subclass to capture component level failures
class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  state: { hasError: boolean };
  props: { children: React.ReactNode; fallback?: React.ReactNode };

  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an inside error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center bg-stone-900 border border-stone-800 rounded-2xl max-w-lg mx-auto my-12 space-y-4">
          <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-500/25">
            <span className="text-xl font-bold">!</span>
          </div>
          <h3 className="font-extrabold text-stone-200 text-sm md:text-base uppercase tracking-wider">Không thể tải biểu mẫu</h3>
          <p className="text-xs text-stone-400">Đã xảy ra sự cố đột xuất khi khởi tạo thông tin chi tiết.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function MilitaryInspectionForm(props: MilitaryInspectionFormProps) {
  return (
    <ErrorBoundary 
      fallback={
        <div className="p-8 text-center bg-stone-900 border border-stone-800 rounded-2xl max-w-lg mx-auto my-12 space-y-4">
          <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-500/25">
            <span className="text-xl font-bold text-rose-500 font-sans">!</span>
          </div>
          <h3 className="font-extrabold text-stone-200 text-sm md:text-base uppercase tracking-wider">Không thể tải biểu mẫu</h3>
          <p className="text-xs text-stone-400 leading-relaxed">Đã xảy ra sự cố đột xuất khi khởi tạo thông tin chi tiết biên bản kiểm tra.</p>
        </div>
      }
    >
      <MilitaryInspectionFormInner {...props} />
    </ErrorBoundary>
  );
}

// Highly optimized TableRow component using React.memo to prevent lag
const TableRow = React.memo(({ 
  tt, 
  name, 
  quantity, 
  value, 
  onChange 
}: { 
  tt: number; 
  name: string; 
  quantity: string; 
  value: string; 
  onChange: (tt: number, val: string) => void; 
}) => {
  return (
    <tr className="table-row hover:bg-stone-50/50 transition-colors border-b border-stone-300 mb-0">
      <td className="table-cell py-2.5 px-3 text-center border-r border-stone-250 font-mono text-stone-500 w-12" style={{ fontSize: '12pt' }}>
        {tt}
      </td>
      <td className="py-2.5 px-3 border-r border-stone-250 font-medium text-stone-800 text-[12pt] leading-normal bg-transparent border-transparent">
        {name}
      </td>
      <td className="table-cell py-2.5 px-3 text-center border-r border-stone-250 font-semibold font-mono text-stone-600 w-24 whitespace-nowrap" style={{ fontSize: '11pt' }}>
        {quantity}
      </td>
      <td className="py-2.5 px-2 text-center bg-transparent w-64 border-transparent">
        <AutoResizeTextarea 
          value={value}
          onChange={(e) => onChange(tt, e.target.value)}
          placeholder="Tình trạng"
          className="w-full bg-white border border-stone-350 focus:border-stone-800 rounded px-2.5 py-1 text-stone-850 outline-none text-left"
          style={{ fontSize: '11pt' }}
        />
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the field value changes
  return prevProps.value === nextProps.value;
});

export function MilitaryInspectionFormInner({ vehicle, onClose, onSave, initialForm, onReset, currentUserRole }: MilitaryInspectionFormProps) {
  const canEdit = currentUserRole ? canEditModule(currentUserRole as any, 'INSPECTION') : false;
  const currentUser = getCurrentUserSession();
  const isNewDocument = !initialForm?.id && !initialForm?.createdBy;
  const canModifyCurrentDocument = isNewDocument ? canEdit : (canEdit && canEditDocument(currentUser, initialForm));

  const emptyVehicle = {
    plateNumber: "",
    vehicleName: "Hyundai County",
    chassisNumber: "",
    engineNumber: "",
    unit: ""
  };

  const activeVehicle = vehicle || emptyVehicle;

  // Document customization states
  const [zoom, setZoom] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 800) {
      return Math.max(30, Math.floor((window.innerWidth) / 7.94));
    }
    return 100;
  });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 800;
  });

  // Form Header Values
  const [reportNo, setReportNo] = useState<string>('');
  const [docDate, setDocDate] = useState<string>('');
  const [repairLevel, setRepairLevel] = useState<string>('');
  const [repairGroup, setRepairGroup] = useState<string>('');
  
  // Custom sign names
  const [giverName, setGiverName] = useState<string>('');
  const [receiverName, setReceiverName] = useState<string>('');
  const [commanderName, setCommanderName] = useState<string>('');
  const [plateNumber, setPlateNumber] = useState<string>(activeVehicle.plateNumber || '');
  const [chassisNumber, setChassisNumber] = useState<string>(activeVehicle.chassisNumber || '');
  const [actualChassisNumber, setActualChassisNumber] = useState<string>(activeVehicle.chassisNumber || '');
  const [engineNumber, setEngineNumber] = useState<string>(activeVehicle.engineNumber || '');
  const [actualEngineNumber, setActualEngineNumber] = useState<string>(activeVehicle.engineNumber || '');
  const [giverUnit, setGiverUnit] = useState<string>((activeVehicle as any).unit || (activeVehicle as any).createdByUnit || '');
  const [currentVehicleId, setCurrentVehicleId] = useState<string>((activeVehicle as any).vehicleId || '');
  const [vehicleName, setVehicleName] = useState<string>((activeVehicle as any).vehicleName || (activeVehicle as any).brand || 'Hyundai County');

  // Additional sections state
  const [staticTechnicalStatus, setStaticTechnicalStatus] = useState<string>('');
  const [dynamicTechnicalStatus, setDynamicTechnicalStatus] = useState<string>('');
  const [recommendation, setRecommendation] = useState<string>('');
  const [customConclusion, setCustomConclusion] = useState<string>('');
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const list = await dbService.getAllVehicles();
        setAvailableVehicles(list || []);
      } catch (err) {
        console.error("Failed to fetch vehicles list for linkage:", err);
      }
    };
    fetchVehicles();
  }, []);

  useEffect(() => {
    const target = vehicle || emptyVehicle;
    setCurrentVehicleId((target as any).vehicleId || '');
    setVehicleName((target as any).vehicleName || (target as any).brand || 'Hyundai County');
    setPlateNumber(target.plateNumber || '');
    setChassisNumber(target.chassisNumber || '');
    setActualChassisNumber(target.chassisNumber || '');
    setEngineNumber(target.engineNumber || '');
    setActualEngineNumber(target.engineNumber || '');
    setGiverUnit((target as any).unit || (target as any).createdByUnit || localStorage.getItem('temp_giverUnit') || '');
  }, [vehicle]);

  // Primary Form State for item quantities/statuses
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [existingForm, setExistingForm] = useState<any>(null);
  const [currentProtocolId, setCurrentProtocolId] = useState<string>('');

  // Loading & Save states
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSuccessAlert, setIsSuccessAlert] = useState<boolean>(false);

  // Auto-save and Recovery States
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [showRecoveryModal, setShowRecoveryModal] = useState<boolean>(false);
  const [recoveredData, setRecoveredData] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const hasUserInteracted = useRef<boolean>(false);

  // Search features
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchResultsRef = useRef<HTMLElement[]>([]);
  const [resultCount, setResultCount] = useState<number>(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1);
  const formRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const scrollToElement = useCallback((el: HTMLElement) => {
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        (el as HTMLElement).focus({ preventScroll: true });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const clearHighlights = useCallback((elements: HTMLElement[]) => {
    elements.forEach(el => {
      el.classList.remove('ring-2', 'ring-yellow-400', 'bg-yellow-50', 'ring-orange-500', 'bg-orange-50');
    });
  }, []);

  const applyHighlights = useCallback((elements: HTMLElement[], activeIdx: number) => {
    elements.forEach((el, idx) => {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (idx === activeIdx) {
          el.classList.add('ring-2', 'ring-orange-500', 'bg-orange-50');
        } else {
          el.classList.add('ring-2', 'ring-yellow-400', 'bg-yellow-50');
        }
      }
    });
  }, []);

  // Ensure highlights persist across React renders (e.g., when typing in inputs)
  useEffect(() => {
    if (showSearch && searchResultsRef.current.length > 0 && currentMatchIndex >= 0) {
      applyHighlights(searchResultsRef.current, currentMatchIndex);
    }
  });

  // --- Search Logic ---
  const performSearch = useCallback((query: string) => {
    try {
      clearHighlights(searchResultsRef.current);
      setSearchQuery(query);
      
      if (!query.trim() || !formRef.current) {
        searchResultsRef.current = [];
        setResultCount(0);
        setCurrentMatchIndex(-1);
        return;
      }
      
      const queryLower = query.toLowerCase();
      const results: HTMLElement[] = [];
      
      const walk = (node: Node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          
          if (['SCRIPT', 'STYLE', 'BUTTON'].includes(element.tagName)) return;
          if (element.id === 'search-bar-container') return;
          
          if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            const val = (element as HTMLInputElement | HTMLTextAreaElement).value || '';
            if (String(val).toLowerCase().includes(queryLower)) {
              results.push(element);
            }
          } else {
            let hasDirectTextMatch = false;
            for (let i = 0; i < element.childNodes.length; i++) {
              const child = element.childNodes[i];
              if (child.nodeType === Node.TEXT_NODE) {
                const text = child.textContent || '';
                if (String(text).toLowerCase().includes(queryLower)) {
                  hasDirectTextMatch = true;
                  break;
                }
              }
            }
            if (hasDirectTextMatch) {
              results.push(element);
            }
          }
          
          const children = element.childNodes;
          for (let i = 0; i < children.length; i++) {
            walk(children[i]);
          }
        }
      };
      
      walk(formRef.current);
      searchResultsRef.current = results;
      setResultCount(results.length);
      if (results.length > 0) {
        setCurrentMatchIndex(0);
        applyHighlights(results, 0);
        scrollToElement(results[0]);
      } else {
        setCurrentMatchIndex(-1);
      }
    } catch (e) {
      console.error('Search error:', e);
    }
  }, [scrollToElement, clearHighlights, applyHighlights]);

  const navigateSearch = useCallback((direction: 'next' | 'prev') => {
    const results = searchResultsRef.current;
    if (results.length === 0) return;
    
    clearHighlights(results);

    let newIndex = currentMatchIndex;
    if (direction === 'next') {
      newIndex = (currentMatchIndex + 1) % results.length;
    } else {
      newIndex = (currentMatchIndex - 1 + results.length) % results.length;
    }
    setCurrentMatchIndex(newIndex);
    applyHighlights(results, newIndex);
    scrollToElement(results[newIndex]);
  }, [currentMatchIndex, scrollToElement, clearHighlights, applyHighlights]);

  const closeSearch = useCallback(() => {
    clearHighlights(searchResultsRef.current);
    setShowSearch(false);
    setSearchQuery('');
    searchResultsRef.current = [];
    setResultCount(0);
    setCurrentMatchIndex(-1);
  }, [clearHighlights]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  // --------------------

  // Pristine reset action
  const initNewForm = () => {
    if (!canEdit) {
      alert('Bạn chỉ có quyền xem dữ liệu.');
      return;
    }
    setExistingForm(null);
    const randomizedId = 'DP-' + Math.random().toString(36).substring(2, 11).toUpperCase();
    setCurrentProtocolId(randomizedId);
    
    setReportNo('');
    setDocDate('Gia Lai, ngày      tháng      năm 2026');
    
    setRepairLevel('');
    setRepairGroup('');
    setGiverName('');
    setReceiverName('');
    setCommanderName('');
    setVehicleName((activeVehicle as any).vehicleName || (activeVehicle as any).brand || vehicleName || 'Hyundai County');
    setPlateNumber(activeVehicle.plateNumber || plateNumber || '');
    setChassisNumber(activeVehicle.chassisNumber || chassisNumber || '');
    setActualChassisNumber(activeVehicle.chassisNumber || actualChassisNumber || '');
    setEngineNumber(activeVehicle.engineNumber || engineNumber || '');
    setActualEngineNumber(activeVehicle.engineNumber || actualEngineNumber || '');
    setGiverUnit((activeVehicle as any).unit || (activeVehicle as any).createdByUnit || localStorage.getItem('temp_giverUnit') || giverUnit || '');
    setFormData({});
    setIsInitialized(true);
    hasUserInteracted.current = false;
    setSaveStatus('');
  };

  // Recovered loader action
  const loadRecoveredForm = (savedData: any) => {
    setExistingForm(savedData);
    if (savedData.protocolId) {
      setCurrentProtocolId(savedData.protocolId);
    } else if (savedData.vehicleId) {
      setCurrentProtocolId(savedData.vehicleId); // fallback for legacy elements
    }
    if (savedData.headerData) {
      const hd = savedData.headerData;
      if (hd.reportNo !== undefined) setReportNo(hd.reportNo);
      if (hd.docDate !== undefined) setDocDate(hd.docDate);
      if (hd.repairLevel !== undefined) setRepairLevel(hd.repairLevel);
      if (hd.repairGroup !== undefined) setRepairGroup(hd.repairGroup);
      if (hd.giverName !== undefined) setGiverName(hd.giverName);
      if (hd.receiverName !== undefined) setReceiverName(hd.receiverName);
      if (hd.commanderName !== undefined) setCommanderName(hd.commanderName);
      if (hd.plateNumber !== undefined) setPlateNumber(hd.plateNumber);
      if (hd.chassisNumber !== undefined) setChassisNumber(hd.chassisNumber);
      if (hd.actualChassisNumber !== undefined) setActualChassisNumber(hd.actualChassisNumber);
      if (hd.engineNumber !== undefined) setEngineNumber(hd.engineNumber);
      if (hd.actualEngineNumber !== undefined) setActualEngineNumber(hd.actualEngineNumber);
      if (hd.giverUnit !== undefined) setGiverUnit(hd.giverUnit);
      if (hd.vehicleName !== undefined) setVehicleName(hd.vehicleName);
      if (hd.staticTechnicalStatus !== undefined) setStaticTechnicalStatus(hd.staticTechnicalStatus);
      if (hd.dynamicTechnicalStatus !== undefined) setDynamicTechnicalStatus(hd.dynamicTechnicalStatus);
      if (hd.recommendation !== undefined) setRecommendation(hd.recommendation);
      if (hd.customConclusion !== undefined) setCustomConclusion(hd.customConclusion);
    }
    if (savedData.formData) {
      setFormData(savedData.formData);
    } else {
      setFormData({});
    }
    setIsInitialized(true);
    hasUserInteracted.current = false;
    setSaveStatus('');
  };

  useEffect(() => {
    if (initialForm) {
      loadRecoveredForm(initialForm);
    }
  }, [initialForm]);

  // Unified Save & Update to Firestore & LocalStorage based on existing checks
  const executeSave = async (silent: boolean = false) => {
    if (!canModifyCurrentDocument) {
      if (!silent) alert('Bạn chỉ có quyền xem dữ liệu.');
      return;
    }
    if (!silent) {
       setIsSaving(true);
       setIsSuccessAlert(false);
       setSaveStatus('Đang lưu...');
    }

    let targetVehicleId = currentVehicleId;
    if (!targetVehicleId) {
       const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
       const uniqueSuffix = Date.now().toString().slice(-4);
       targetVehicleId = `TEMP-${todayStr}-${uniqueSuffix}`;
       setCurrentVehicleId(targetVehicleId);
    }

    let targetProtocolId = currentProtocolId;
    if (!targetProtocolId) {
       targetProtocolId = 'DP-' + Math.random().toString(36).substring(2, 11).toUpperCase();
       setCurrentProtocolId(targetProtocolId);
    }

    // Validation for duplicate plate in damageProtocols
    try {
      const dpsRaw = await DataService.load('damageProtocols') || [];
      const dpStored = localStorage.getItem('local_damage_protocols');
      let dpLocal: any[] = [];
      if (dpStored) {
        try { dpLocal = JSON.parse(dpStored); } catch {}
      }
      
      const allDps = Array.isArray(dpsRaw) && dpsRaw.length > 0 ? dpsRaw : dpLocal;
      const normalizedCurrentPlate = plateNumber ? plateNumber.trim().toUpperCase() : "";
      const normalizedCurrentBrand = vehicleName ? vehicleName.trim().toUpperCase() : "";

      const duplicateNode = allDps.find((p: any) => {
        const idMatches = p.protocolId === targetProtocolId || p.id === targetProtocolId;
        if (idMatches || p.isDeleted) return false;
        
        const pPlate = p.plateNumber || p.vehiclePlateNumber || "";
        const normalizedPPlate = pPlate ? pPlate.trim().toUpperCase() : "";
        
        const pBrand = p.brand || p.vehicleName || (p.headerData?.vehicleName) || "";
        const normalizedPBrand = pBrand ? pBrand.trim().toUpperCase() : "";
        
        return normalizedPPlate === normalizedCurrentPlate && normalizedPBrand === normalizedCurrentBrand;
      });

      if (duplicateNode) {
        if (!silent) {
          alert('Đã tồn tại biên bản giao nhận cho xe này');
          setIsSaving(false);
          setSaveStatus('');
        }
        return;
      }
    } catch (err) {
      console.warn("Lỗi kiểm tra trùng biển số:", err);
    }

    const auditParams = getCreatorAuditParams();
    const currentUser = getCurrentUserSession();
    const creator = existingForm && existingForm.createdBy ? {
       createdBy: existingForm.createdBy,
       createdAt: existingForm.createdAt,
       createdByName: existingForm.createdByName || currentUser?.fullName || currentUser?.username || '',
       createdByRole: existingForm.createdByRole || currentUser?.role || '',
       createdByUnit: existingForm.createdByUnit || currentUser?.unit || ''
    } : {
       createdBy: auditParams.createdBy,
       createdAt: auditParams.createdAt,
       createdByName: currentUser?.fullName || currentUser?.username || '',
       createdByRole: currentUser?.role || '',
       createdByUnit: currentUser?.unit || ''
    };

    const lastEditedBy = currentUser?.fullName || currentUser?.username || currentUser?.email || currentUser?.uid || 'unknown';

    const dpItems: any[] = [];
    if (HyundaiCountyTemplate && Array.isArray(HyundaiCountyTemplate.sections)) {
       HyundaiCountyTemplate.sections.forEach((sec: any) => {
          if (Array.isArray(sec.items)) {
             sec.items.forEach((item: any) => {
                const val = formData[item.tt];
                if (val) {
                   dpItems.push({
                      id: `item-${item.tt}`,
                      itemName: `${sec.name} - ${item.name}`,
                      damageDetail: val,
                      solution: "Sửa chữa theo quy chuẩn"
                   });
                }
             });
          }
       });
    }

    if (dpItems.length === 0) {
       dpItems.push({
          id: "overview",
          itemName: "Tình trạng chung phương tiện",
          damageDetail: "Đã kiểm tra đầu vào toàn bộ các hạng mục kỹ thuật",
          solution: "Theo dõi sửa chữa"
       });
    }

    const damageProtocolPayload = {
       protocolId: targetProtocolId,
       vehicleId: targetVehicleId,
       reportNumber: reportNo || `BBKT-${plateNumber}`,
       createdDate: new Date().toISOString().split('T')[0],
       place: "Tiểu đoàn SCTH30",
       representativeGeneral: giverUnit ? `Đơn vị bàn giao: ${giverUnit}` : "Trạm sửa chữa H30",
       representativeTechnical: "Đại diện kỹ thuật",
       technician: lastEditedBy || "Kỹ thuật viên kiểm tra",
       driver: "Lái xe bàn giao",
       plateNumber: plateNumber,
       brand: vehicleName || "Hyundai County",
       vehicleType: "Xe quân cụ chuyên dụng",
       chassisNumber: actualChassisNumber || chassisNumber || "",
       engineNumber: actualEngineNumber || engineNumber || "",
       orderNumber: "", 
       odometer: "Tiêu chuẩn",
       items: dpItems,
       conclusion: `Nhất trí bàn giao xe ${vehicleName || 'Hyundai County'} biển kiểm soát ${plateNumber} vào sửa chữa cấp ${repairLevel}.`,
       formData,
       headerData: {
         reportNo,
         docDate,
         vehicleName: vehicleName || "Hyundai County",
         repairLevel,
         repairGroup,
         giverName,
         receiverName,
         commanderName,
         plateNumber,
         chassisNumber,
         actualChassisNumber,
         engineNumber,
         actualEngineNumber,
         giverUnit,
         receiverUnit: "Tiểu đoàn SCTH30",
         staticTechnicalStatus,
         dynamicTechnicalStatus,
         recommendation,
         customConclusion
       },
       createdBy: creator.createdBy,
       createdAt: creator.createdAt,
       createdByName: creator.createdByName,
       createdByRole: creator.createdByRole,
       createdByUnit: creator.createdByUnit,
       updatedAt: new Date().toISOString(),
       updatedBy: currentUser?.uid || '',
       updatedByName: currentUser?.fullName || currentUser?.username || '',
       lastEditedBy
    };

    try {
       // 1. Check if document exists in damageProtocols and write directly to it
       let docExists = false;
       try {
         const checkDoc = await DataService.get('damageProtocols', targetProtocolId);
         if (checkDoc) {
           docExists = true;
         }
       } catch (err) {
         console.warn("Error verifying existing document in damageProtocols:", err);
       }

       if (docExists) {
         await DataService.update('damageProtocols', targetProtocolId, damageProtocolPayload);
       } else {
         await DataService.save('damageProtocols', damageProtocolPayload);
       }

       // 2. Sync LocalStorage fallback for offline support
       const dpKey = 'local_damage_protocols';
       const dpStored = localStorage.getItem(dpKey);
       let dpList: any[] = [];
       if (dpStored) {
          try {
             dpList = JSON.parse(dpStored);
          } catch {
             dpList = [];
          }
       }
       dpList = dpList.filter((p: any) => p.protocolId !== targetProtocolId && p.reportNumber !== damageProtocolPayload.reportNumber);
       dpList.push(damageProtocolPayload);
       localStorage.setItem(dpKey, JSON.stringify(dpList));

       setExistingForm(damageProtocolPayload);
       
       if (!silent) {
          setSaveStatus('Đã lưu');
          setIsSuccessAlert(true);
          setTimeout(() => setIsSuccessAlert(false), 4000);
       }
       
       if (onSave) {
          onSave(damageProtocolPayload, silent);
       }
    } catch (err) {
       console.error("Save failed:", err);
       if (!silent) setSaveStatus('Lỗi lưu');
    } finally {
       if (!silent) {
          setIsSaving(false);
       }
    }
  };

  const handleSave = () => {
    if (!canModifyCurrentDocument) {
      alert('Bạn chỉ có quyền xem dữ liệu.');
      return;
    }
    executeSave(false);
  };

  // Load saved dynamic form from Firestore/LocalStorage on load
  useEffect(() => {
    if (initialForm?.protocolId || initialForm?.id) {
      return;
    }

    // CREATE MODE
    initNewForm();
  }, [vehicle, initialForm]);

  // Debounced auto save effect triggers 1000ms after changes
  useEffect(() => {
    if (!canEdit || !isInitialized || !hasUserInteracted.current) return;

    const delayDebounceFn = setTimeout(() => {
      executeSave(true);
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [
    reportNo,
    docDate,
    repairLevel,
    repairGroup,
    giverName,
    receiverName,
    commanderName,
    plateNumber,
    chassisNumber,
    actualChassisNumber,
    engineNumber,
    actualEngineNumber,
    giverUnit,
    formData,
    isInitialized
  ]);

  // Stable row change handler to optimize performance and prevent re-renders
  const handleRowChange = useCallback((tt: number, value: string) => {
    hasUserInteracted.current = true;
    setFormData(prev => ({
      ...prev,
      [tt]: value
    }));
  }, []);

  // Construct Microsoft Word document download from Hyundai County template rows
  const exportToWord = () => {
    const css = `
      <style>
        body { font-family: 'Times New Roman', Times, serif; margin: 40px; padding: 20px; text-align: left; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .text-lg { font-size: 18px; }
        .text-xl { font-size: 20px; font-weight: bold; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid black; padding: 8px 12px; font-size: 12px; }
        th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
        .underline { text-decoration: underline; }
      </style>
    `;

    let tableRows = '';
    HyundaiCountyTemplate.sections.forEach(section => {
      tableRows += `
        <tr>
          <td colspan="4" class="font-bold" style="background-color: #f5f5f5; font-size: 12px;">${section.name}</td>
        </tr>
      `;
      section.items.forEach(item => {
        const val = formData[item.tt] !== undefined ? formData[item.tt] : '';
        tableRows += `
          <tr>
            <td style="text-align: center; font-size: 12px;">${item.tt}</td>
            <td style="font-size: 12px;">${item.name}</td>
            <td style="text-align: center; font-size: 12px;">${item.quantity}</td>
            <td style="font-size: 12px;">${val}</td>
          </tr>
        `;
      });
    });

    const bodyHtml = `
      <div style="width: 100%;">
        <table style="width: 100%; border: none; margin-bottom: 20px;">
          <tr style="border: none;">
            <td style="width: 50%; text-align: center; vertical-align: top; border: none; padding: 0;">
              <div class="font-bold" style="font-size: 13px;">CỤC HẬU CẦN - KỸ THUẬT QUÂN ĐOÀN 34</div>
              <div class="font-bold underline" style="font-size: 13px;">TIỂU ĐOÀN SCTH30</div>
              <div style="margin-top: 5px; font-size: 13px;">Số: ${reportNo || '..../BB-SCTH30'}</div>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top; border: none; padding: 0;">
              <div class="font-bold" style="font-size: 13px;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div class="font-bold underline" style="margin-bottom: 5px; font-size: 13px;">Độc lập - Tự do - Hạnh phúc</div>
              <div style="font-style: italic; font-size: 13px;">${docDate || '&nbsp;'}</div>
            </td>
          </tr>
        </table>

        <div class="text-center font-bold text-xl" style="font-size: 18pt; margin: 30px 0 10px 0;">BIÊN BẢN GIAO NHẬN XE-MÁY VÀO SỬA CHỮA</div>

        <p class="font-bold" style="font-size: 13px;">I. THÔNG TIN CHUNG PHƯƠNG TIỆN & ĐƠN VỊ BÀN GIAO</p>
        <table style="width: 100%;">
          <tr>
            <td style="width: 50%; font-size: 13px;">Tên xe: <strong>Hyundai County</strong></td>
            <td style="width: 50%; font-size: 13px;">Đơn vị nhận: <strong>Tiểu đoàn SCTH30</strong></td>
          </tr>
          <tr>
            <td style="font-size: 13px;">Mức sửa chữa: <strong>${repairLevel}</strong></td>
            <td style="font-size: 13px;">Nhóm sửa chữa: <strong>${repairGroup}</strong></td>
          </tr>
          <tr>
            <td style="font-size: 13px;">Số đăng ký (SĐK): <strong>${plateNumber}</strong></td>
            <td style="font-size: 13px;">Đơn vị giao: <strong>${giverUnit}</strong></td>
          </tr>
          <tr>
            <td style="font-size: 13px;">Số khung (SK) lý lịch: <strong>${chassisNumber}</strong></td>
            <td style="font-size: 13px;">Số khung (SK) thực tế: <strong>${actualChassisNumber}</strong></td>
          </tr>
          <tr>
            <td style="font-size: 13px;">Số máy (SM) lý lịch: <strong>${engineNumber}</strong></td>
            <td style="font-size: 13px;">Số máy (SM) thực tế: <strong>${actualEngineNumber}</strong></td>
          </tr>
        </table>

        <p class="font-bold block-title" style="font-size: 13px; margin-top: 20px;">II. CHI TIẾT TÌNH TRẠNG ĐỒNG BỘ GIAO NHẬN</p>
        <table style="width: 100%;">
          <thead>
            <tr>
              <th style="width: 10%; font-size: 12px; font-weight: bold;">TT</th>
              <th style="width: 55%; font-size: 12px; font-weight: bold;">Tên cụm - chi tiết</th>
              <th style="width: 15%; font-size: 12px; font-weight: bold;">Biên chế</th>
              <th style="width: 20%; font-size: 12px; font-weight: bold;">Thực tế</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <!-- Added Parts III to VI -->
        <p class="font-bold block-title" style="font-size: 13px; margin-top: 20px;">III. TÌNH TRẠNG KỸ THUẬT TĨNH</p>
        <div style="font-size: 13px; margin-bottom: 20px;">
          ${staticTechnicalStatus ? staticTechnicalStatus.replace(/\\n/g, '<br/>') : '.......................................................................................................................................'}
        </div>

        <p class="font-bold block-title" style="font-size: 13px; margin-top: 20px;">IV. TÌNH TRẠNG KỸ THUẬT HOẠT ĐỘNG</p>
        <div style="font-size: 13px; margin-bottom: 20px;">
          ${dynamicTechnicalStatus ? dynamicTechnicalStatus.replace(/\\n/g, '<br/>') : '.......................................................................................................................................'}
        </div>

        <p class="font-bold block-title" style="font-size: 13px; margin-top: 20px;">V. ĐỀ NGHỊ</p>
        <div style="font-size: 13px; margin-bottom: 20px;">
          ${recommendation ? recommendation.replace(/\\n/g, '<br/>') : '.......................................................................................................................................'}
        </div>

        <p class="font-bold block-title" style="font-size: 13px; margin-top: 20px;">VI. KẾT LUẬN</p>
        <div style="font-size: 13px; margin-bottom: 20px;">
          ${customConclusion ? customConclusion.replace(/\\n/g, '<br/>') : '.......................................................................................................................................'}
        </div>

        <!-- Signatures -->
        <table style="width: 100%; border: none; margin-top: 40px; text-align: center;">
          <tr style="border: none;">
            <td style="width: 33%; border: none; vertical-align: top;">
              <div class="font-bold block-title" style="font-size: 13px;">ĐẠI DIỆN ĐƠN VỊ GIAO</div>
              <div style="font-style: italic; font-size: 13px;">(Ký, ghi rõ họ tên)</div>
              <div style="height: 100px;"></div>
              <div class="font-bold" style="font-size: 13px;">${giverName}</div>
            </td>
            <td style="width: 33%; border: none; vertical-align: top;">
              <div class="font-bold block-title" style="font-size: 13px;">ĐẠI DIỆN ĐƠN VỊ NHẬN</div>
              <div style="font-style: italic; font-size: 13px;">(Ký, ghi rõ họ tên)</div>
              <div style="height: 100px;"></div>
              <div class="font-bold" style="font-size: 13px;">${receiverName}</div>
            </td>
            <td style="width: 33%; border: none; vertical-align: top;">
              <div class="font-bold block-title" style="font-size: 13px;">CHỈ HUY TIỂU ĐOÀN</div>
              <div style="font-style: italic; font-size: 13px;">(Ký, ghi rõ họ tên)</div>
              <div style="height: 100px;"></div>
              <div class="font-bold" style="font-size: 13px;">${commanderName}</div>
            </td>
          </tr>
        </table>
      </div>
    `;

    const docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Bien ban giao nhan Hyundai County ${plateNumber}</title>
        ${css}
      </head>
      <body>
        ${bodyHtml}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BienBanGiaoNhan_${plateNumber.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // High performance cached sections mapping
  const memoizedSectionsRender = useMemo(() => {
    return HyundaiCountyTemplate.sections.map((section, idx) => (
      <div key={idx} className="mb-6 border border-stone-250 rounded-lg overflow-hidden break-inside-avoid shadow-sm">
        <div className="bg-stone-100 px-4 py-2 border-b border-stone-250 font-bold uppercase text-stone-800 flex justify-between items-center" style={{ fontSize: '13pt' }}>
          <span>{section.name}</span>
          <span className="text-stone-500 font-mono font-normal" style={{ fontSize: '11pt' }}>({section.items.length} chi tiết)</span>
        </div>
        
        {section.items.length > 0 ? (
          <div>
            <table className="w-full text-left border-collapse" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
              <thead>
                <tr className="bg-stone-50 text-stone-700 font-bold border-b border-stone-250 text-[11px] sm:text-[12pt]">
                  <th className="py-2.5 px-1.5 sm:px-3 text-center border-r border-stone-250 w-8 sm:w-12">TT</th>
                  <th className="py-2.5 px-2 sm:px-3 border-r border-stone-250">Tên cụm - chi tiết</th>
                  <th className="py-2.5 px-1.5 sm:px-3 text-center border-r border-stone-250 w-16 sm:w-24 leading-tight">Biên chế</th>
                  <th className="py-2.5 px-1.5 sm:px-3 text-center w-32 sm:w-64 leading-tight">Thực tế</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {section.items.map((item) => (
                  <TableRow 
                    key={item.tt}
                    tt={item.tt}
                    name={item.name}
                    quantity={item.quantity}
                    value={formData[item.tt] || ''}
                    onChange={handleRowChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 text-center text-stone-400 bg-stone-50/50 italic" style={{ fontSize: '12pt' }}>
            Không có chi tiết danh mục
          </div>
        )}
      </div>
    ));
  }, [formData, handleRowChange]);

  return (
    <div className={`flex flex-col h-full bg-stone-100 border border-stone-200 shadow-xl overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : 'relative rounded-2xl'}`} style={{ maxHeight: isFullscreen ? '100vh' : '820px' }}>
      
      {/* Upper Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-white border-b border-stone-200">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700">Biên bản bàn giao TBKT</span>
          <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">{plateNumber || "NHẬP TAY / BẢN NHÁP"}</span>
        </div>

        {/* Dynamic Zoom levels based on user request */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1 bg-stone-50 border border-stone-200 px-1.5 py-0.5 rounded-lg text-xs font-mono">
            <span className="mr-1.5 text-stone-500 font-sans text-3xs uppercase tracking-wider">Tỷ lệ:</span>
            {[50, 75, 100, 125, 150, 200].map((z) => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`px-1.5 py-0.5 rounded transition-all text-3xs font-bold cursor-pointer ${zoom === z ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-white text-stone-600 hover:text-stone-800'}`}
              >
                {z}%
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 hover:bg-stone-100 text-stone-500 hover:text-stone-800 rounded-lg cursor-pointer transition-colors"
            title={isFullscreen ? "Thu nhỏ lại màn hình" : "Mở rộng toàn màn hình"}
          >
            {isFullscreen ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
          </button>

          {/* Actions Button Bar */}
          <div className="h-5 w-[1px] bg-stone-200 hidden md:block"></div>

          {/* Autosave Realtime Status Indicator */}
          {saveStatus && (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
              saveStatus === 'Đang lưu...' 
                ? 'text-amber-600 animate-pulse bg-amber-50 border border-amber-200' 
                : saveStatus === 'Đã lưu' 
                ? 'text-emerald-600 bg-emerald-50 border border-emerald-200' 
                : 'text-rose-600 bg-rose-50 border border-rose-200'
            }`}>
              <span className={`h-1 w-1 rounded-full ${
                saveStatus === 'Đang lưu...' 
                  ? 'bg-amber-500' 
                  : saveStatus === 'Đã lưu' 
                  ? 'bg-emerald-500' 
                  : 'bg-rose-500'
              }`} />
              <span>{saveStatus}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-900 text-white font-bold rounded-lg flex items-center gap-1.5 text-xs transition-all cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu'}</span>
                </button>

                <button 
                  onClick={() => {
                    if (window.confirm('Bạn có chắc chắn muốn làm sạch biểu mẫu để lập một Biên bản bàn giao/nhận xe mới tinh hay không? (Mọi thay đổi chưa lưu sẽ bị mất)')) {
                      initNewForm();
                    }
                  }}
                  className="px-4 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold rounded-lg flex items-center gap-1.5 text-xs transition-all cursor-pointer"
                  title="Khởi tạo biểu mẫu trống để viết một biên bản giao nhận mới tinh"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Biên bản mới</span>
                </button>

                <button 
                  onClick={() => {
                    if (window.confirm('Xác nhận xóa sạch dữ liệu nhập trên biểu mẫu này? (Không thể hoàn tác)')) {
                      setReportNo('');
                      setDocDate('');
                      setRepairLevel('');
                      setRepairGroup('');
                      setGiverName('');
                      setReceiverName('');
                      setCommanderName('');
                      setPlateNumber('');
                      setChassisNumber('');
                      setActualChassisNumber('');
                      setEngineNumber('');
                      setActualEngineNumber('');
                      setGiverUnit('');
                      setVehicleName('');
                      setFormData({});
                      if (onReset) {
                        onReset();
                      }
                    }
                  }}
                  className="px-4 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-lg flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
                  title="Xóa sạch dữ liệu đã nhập trên biểu mẫu"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Xóa</span>
                </button>
              </>
            )}

            <button 
              onClick={exportToWord}
              className="px-3.5 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-stone-800 border border-stone-200 rounded-lg flex items-center gap-1.5 text-xs transition-all cursor-pointer"
              title="Xuất mẫu Microsoft Word .doc dã ngoại"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Xuất Word</span>
            </button>

            <button 
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-stone-800 border border-stone-200 rounded-lg flex items-center gap-1.5 text-xs transition-all cursor-pointer"
              title="In dã ngoại"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">In</span>
            </button>
            
            <button 
              onClick={() => {
                setShowSearch(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              className="px-3.5 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-stone-800 border border-stone-200 rounded-lg flex items-center gap-1.5 text-xs transition-all cursor-pointer"
              title="Tìm kiếm trong biên bản (Ctrl+F)"
            >
              <span>🔍 Tìm trong biên bản</span>
            </button>

            <button 
              onClick={onClose}
              className="px-3.5 py-1.5 bg-stone-100 border border-stone-200 hover:bg-stone-200 text-stone-600 hover:text-stone-900 rounded-lg text-xs transition-all cursor-pointer font-bold"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div id="search-bar-container" className="flex items-center px-5 py-2 bg-stone-50 border-b border-stone-200 gap-3 shrink-0 print:hidden">
          <div className="relative flex-1 max-w-sm flex items-center">
            <span className="absolute left-2.5 text-stone-400">🔍</span>
            <input 
              ref={searchInputRef}
              type="text" 
              className="w-full pl-8 pr-3 py-1 text-sm border border-stone-300 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="Tìm trong biên bản..."
              value={searchQuery}
              onChange={(e) => performSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (e.shiftKey) {
                    navigateSearch('prev');
                  } else {
                    navigateSearch('next');
                  }
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  closeSearch();
                }
              }}
            />
          </div>
          {resultCount > 0 ? (
            <span className="text-xs font-mono text-stone-500">
              {currentMatchIndex + 1} / {resultCount}
            </span>
          ) : searchQuery ? (
            <span className="text-xs font-mono text-stone-500 text-rose-500">
              0 / 0
            </span>
          ) : null}
          <div className="flex bg-stone-200 rounded border border-stone-300 overflow-hidden">
            <button 
              onClick={() => navigateSearch('prev')}
              disabled={resultCount === 0}
              className="px-2 py-1 text-stone-600 hover:bg-stone-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              ▲
            </button>
            <div className="w-[1px] bg-stone-300"></div>
            <button 
              onClick={() => navigateSearch('next')}
              disabled={resultCount === 0}
              className="px-2 py-1 text-stone-600 hover:bg-stone-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              ▼
            </button>
          </div>
          <button 
            onClick={closeSearch}
            className="p-1 hover:bg-stone-200 text-stone-500 rounded cursor-pointer ml-auto"
            title="Đóng tìm kiếm (Esc)"
          >
            ✕
          </button>
        </div>
      )}

      {/* Saving Alert Banner */}
      {isSuccessAlert && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 bg-emerald-900 text-emerald-100 border-b border-emerald-800 text-xs">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 bg-emerald-950 p-0.5 rounded-full text-emerald-300" />
            <span><strong>DỮ LIỆU ĐÃ LƯU:</strong> Trạng thái bàn giao xe Hyundai County <strong>{plateNumber}</strong> được lưu thành công vào Firestore và LocalStorage.</span>
          </div>
          <button onClick={() => setIsSuccessAlert(false)} className="text-emerald-400 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* Scrollable Container and Custom A4 Frame styling */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full flex sm:justify-center p-0 sm:p-8 print:p-0 print:block bg-white sm:bg-stone-50/80">
        <div 
          ref={formRef}
          className="bg-white text-stone-900 sm:shadow-2xl origin-top-left sm:origin-top w-full sm:w-auto border-none sm:border-2 border-transparent sm:border-stone-200 print:border-none print:w-full print:p-0 print:shadow-none print:!zoom-100 min-h-full sm:min-h-[350mm]"
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            zoom: `${zoom}%`,
            width: typeof window !== 'undefined' && window.innerWidth < 800 ? '100%' : '260mm',
            minHeight: typeof window !== 'undefined' && window.innerWidth < 800 ? '100%' : '350mm',
            padding: typeof window !== 'undefined' && window.innerWidth < 800 ? '10mm 4mm' : '20mm',
            marginRight: 'auto',
            marginLeft: 'auto'
          }}
          id="military-a4-document"
        >
          {/* Printable Override Style */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body, html {
                background: white !important;
                color: black !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              #military-a4-document {
                transform: none !important;
                width: 100% !important;
                height: auto !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
              }
              header, footer, nav, button, .no-print {
                display: none !important;
              }
            }
          `}} />

          <fieldset disabled={!canEdit} className="border-0 p-0 m-0 min-w-0">
          {/* Form Header block - Responsive two columns on desktop, stacked on mobile */}
          <div className="w-full flex flex-col sm:flex-row sm:justify-between items-center sm:items-start mb-6 sm:mb-8 pb-4 border-b border-stone-200 gap-y-6 sm:gap-y-0">
            {/* National Mottos - Right side on desktop, Top on mobile */}
            <div className="w-full sm:w-1/2 text-center space-y-1 order-1 sm:order-2">
              <div className="font-bold text-stone-900 uppercase" style={{ fontSize: '13pt' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div className="font-bold text-stone-900 uppercase underline decoration-1 underline-offset-4" style={{ fontSize: '13pt' }}>Độc lập - Tự do - Hạnh phúc</div>
              <div className="flex justify-center items-center gap-1.5 mt-3" style={{ fontSize: '13pt' }}>
                <input 
                  type="text" 
                  value={docDate} 
                  onChange={(e) => {
                    hasUserInteracted.current = true;
                    setDocDate(e.target.value);
                  }}
                  placeholder="Gia Lai, ngày... tháng... năm 2026"
                  className="w-full max-w-[320px] bg-transparent border-b border-stone-400 focus:border-stone-850 outline-none px-2 py-0.5 text-center font-bold"
                  style={{ fontSize: '13pt' }}
                />
              </div>
            </div>

            {/* Organization - Left side on desktop, Bottom on mobile */}
            <div className="w-full sm:w-1/2 text-center space-y-1 order-2 sm:order-1">
              <div className="font-bold text-stone-900 uppercase" style={{ fontSize: '13pt' }}>CỤC HẬU CẦN - KỸ THUẬT QUÂN ĐOÀN 34</div>
              <div className="font-bold text-stone-900 uppercase underline decoration-1 underline-offset-4" style={{ fontSize: '13pt' }}>TIỂU ĐOÀN SCTH30</div>
              <div className="flex justify-center items-center gap-1.5 mt-3" style={{ fontSize: '13pt' }}>
                <span className="text-stone-700 whitespace-nowrap">Số biên bản:</span>
                <input 
                  type="text" 
                  value={reportNo} 
                  onChange={(e) => {
                    hasUserInteracted.current = true;
                    setReportNo(e.target.value);
                  }}
                  placeholder="Nhập số..."
                  className="w-32 bg-transparent border-b border-stone-400 focus:border-stone-850 outline-none px-2 py-0.5 text-center font-bold font-mono"
                  style={{ fontSize: '13pt' }}
                />
              </div>
            </div>
          </div>

          {/* Document Main Title - 18pt bold center as requested */}
          <div className="text-center space-y-2 mb-8 select-none">
            <h1 className="font-bold uppercase tracking-normal text-stone-950 font-serif" style={{ fontSize: '18pt' }}>
              BIÊN BẢN GIAO NHẬN XE-MÁY VÀO SỬA CHỮA
            </h1>
            <div className="w-24 h-[1px] bg-stone-800 mx-auto mt-2"></div>
          </div>

          {/* Part 1: General Info Block - 13pt styled inputs */}
          <div className="space-y-4 mb-6">
            <h2 className="font-bold uppercase border-b border-stone-300 text-stone-900 py-1" style={{ fontSize: '13pt' }}>
              I. THÔNG TIN CHUNG PHƯƠNG TIỆN & ĐƠN VỊ BÀN GIAO
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4" style={{ fontSize: '13pt' }}>
              <div className="flex flex-col sm:flex-row sm:items-center items-start gap-1 sm:gap-1.5 w-full">
                <span className="font-bold text-stone-700 whitespace-nowrap">Tên xe:</span>
                <input 
                  type="text" 
                  value={vehicleName} 
                  onChange={(e) => {
                    hasUserInteracted.current = true;
                    setVehicleName(e.target.value);
                  }}
                  placeholder="Hyundai County"
                  className="flex-1 w-full sm:w-auto bg-stone-50 border-b border-stone-400 focus:border-stone-850 px-2 py-0.5 outline-none font-bold font-serif text-stone-900"
                  style={{ fontSize: '13pt' }}
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center items-start gap-1 sm:gap-1.5 w-full">
                <span className="font-bold text-stone-700 whitespace-nowrap">Đơn vị nhận:</span>
                <span className="px-2 py-0.5 font-bold text-stone-900 bg-stone-100 border border-stone-300 rounded font-serif" style={{ fontSize: '13pt' }}>Tiểu đoàn SCTH30</span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center items-start gap-1 sm:gap-1.5 w-full">
                <span className="font-bold text-stone-700 whitespace-nowrap">Mức sửa chữa:</span>
                <input 
                  type="text" 
                  value={repairLevel} 
                  onChange={(e) => {
                    hasUserInteracted.current = true;
                    setRepairLevel(e.target.value);
                  }}
                  placeholder="Nhập mức sửa chữa..."
                  className="flex-1 w-full sm:w-auto bg-stone-50 border-b border-stone-400 focus:border-stone-850 px-2 py-0.5 outline-none font-semibold font-serif"
                  style={{ fontSize: '13pt' }}
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center items-start gap-1 sm:gap-1.5 w-full">
                <span className="font-bold text-stone-700 whitespace-nowrap">Nhóm sửa chữa:</span>
                <input 
                  type="text" 
                  value={repairGroup} 
                  onChange={(e) => {
                    hasUserInteracted.current = true;
                    setRepairGroup(e.target.value);
                  }}
                  placeholder="Nhập nhóm sửa chữa..."
                  className="flex-1 w-full sm:w-auto bg-stone-50 border-b border-stone-400 focus:border-stone-850 px-2 py-0.5 outline-none font-semibold font-serif"
                  style={{ fontSize: '13pt' }}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center items-start gap-1 sm:gap-1.5 w-full">
                <span className="font-bold text-stone-700 whitespace-nowrap">Số đăng ký (SĐK):</span>
                <input 
                  type="text" 
                  value={plateNumber} 
                  onChange={(e) => {
                    hasUserInteracted.current = true;
                    setPlateNumber(e.target.value);
                  }}
                  placeholder="Nhập SĐK..."
                  className="flex-1 w-full sm:w-auto bg-stone-50 border-b border-stone-400 focus:border-stone-850 px-2 py-0.5 outline-none font-bold text-emerald-950 font-serif md:text-emerald-900"
                  style={{ fontSize: '13pt' }}
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center items-start gap-1 sm:gap-1.5 w-full">
                <span className="font-bold text-stone-700 whitespace-nowrap">Đơn vị giao:</span>
                <input 
                  type="text" 
                  value={giverUnit} 
                  onChange={(e) => {
                    hasUserInteracted.current = true;
                    setGiverUnit(e.target.value);
                  }}
                  placeholder="Nhập đơn vị giao..."
                  className="flex-1 w-full sm:w-auto bg-amber-50/20 border-b border-amber-300 focus:border-stone-850 px-2 py-0.5 outline-none font-semibold font-serif"
                  style={{ fontSize: '13pt' }}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center items-start gap-1 sm:gap-1.5 w-full">
                <span className="font-bold text-stone-700 whitespace-nowrap">Số khung (SK) lý lịch:</span>
                <input 
                  type="text" 
                  value={chassisNumber} 
                  onChange={(e) => {
                    hasUserInteracted.current = true;
                    setChassisNumber(e.target.value);
                  }}
                  placeholder="Nhập số khung..."
                  className="flex-1 w-full sm:w-auto bg-stone-50 border-b border-stone-400 focus:border-stone-850 px-2 py-0.5 outline-none font-mono font-semibold"
                  style={{ fontSize: '13pt' }}
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center items-start gap-1 sm:gap-1.5 w-full">
                <span className="font-bold text-stone-700 whitespace-nowrap">Số khung (SK) thực tế:</span>
                <input 
                  type="text" 
                  value={actualChassisNumber} 
                  onChange={(e) => {
                    hasUserInteracted.current = true;
                    setActualChassisNumber(e.target.value);
                  }}
                  placeholder="Nhập số khung thực tế..."
                  className="flex-1 w-full sm:w-auto bg-stone-50 border-b border-stone-400 focus:border-stone-850 px-2 py-0.5 outline-none font-mono font-bold text-stone-900"
                  style={{ fontSize: '13pt' }}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center items-start gap-1 sm:gap-1.5 w-full">
                <span className="font-bold text-stone-700 whitespace-nowrap">Số máy (SM) lý lịch:</span>
                <input 
                  type="text" 
                  value={engineNumber} 
                  onChange={(e) => {
                    hasUserInteracted.current = true;
                    setEngineNumber(e.target.value);
                  }}
                  placeholder="Nhập số máy..."
                  className="flex-1 w-full sm:w-auto bg-stone-50 border-b border-stone-400 focus:border-stone-850 px-2 py-0.5 outline-none font-mono font-semibold"
                  style={{ fontSize: '13pt' }}
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center items-start gap-1 sm:gap-1.5 w-full">
                <span className="font-bold text-stone-700 whitespace-nowrap">Số máy (SM) thực tế:</span>
                <input 
                  type="text" 
                  value={actualEngineNumber} 
                  onChange={(e) => {
                    hasUserInteracted.current = true;
                    setActualEngineNumber(e.target.value);
                  }}
                  placeholder="Nhập số máy thực tế..."
                  className="flex-1 w-full sm:w-auto bg-stone-50 border-b border-stone-400 focus:border-stone-850 px-2 py-0.5 outline-none font-mono font-bold text-stone-900"
                  style={{ fontSize: '13pt' }}
                />
              </div>
            </div>
          </div>

          {/* Part 2: Dynamic Accordion Panels Table - 12pt styled table headers & rows */}
          <div className="space-y-4 mb-6">
            <h2 className="font-bold uppercase border-b border-stone-300 text-stone-900 py-1" style={{ fontSize: '13pt' }}>
              II. CHI TIẾT TÌNH TRẠNG ĐỒNG BỘ GIAO NHẬN
            </h2>

            <div className="space-y-1">
              {memoizedSectionsRender}
            </div>
          </div>

          {/* Section III, IV, V, VI */}
          <div className="space-y-4 mb-6">
            <h2 className="font-bold uppercase border-b border-stone-300 text-stone-900 py-1 mt-6" style={{ fontSize: '13pt' }}>
              III. TÌNH TRẠNG KỸ THUẬT TĨNH
            </h2>
            <div className="min-h-[100px] border-b border-dotted border-stone-300">
               <AutoResizeTextarea 
                 value={staticTechnicalStatus}
                 onChange={(e) => {
                   hasUserInteracted.current = true;
                   setStaticTechnicalStatus(e.target.value);
                 }}
                 placeholder="......................................................................................................................................." 
                 className="w-full bg-transparent border-none focus:ring-0 resize-none p-0 whitespace-pre-wrap font-serif" 
                 style={{ fontSize: '13pt', lineHeight: '1.5' }} 
               />
            </div>

            <h2 className="font-bold uppercase border-b border-stone-300 text-stone-900 py-1 mt-6" style={{ fontSize: '13pt' }}>
              IV. TÌNH TRẠNG KỸ THUẬT HOẠT ĐỘNG
            </h2>
            <div className="min-h-[100px] border-b border-dotted border-stone-300">
               <AutoResizeTextarea 
                 value={dynamicTechnicalStatus}
                 onChange={(e) => {
                   hasUserInteracted.current = true;
                   setDynamicTechnicalStatus(e.target.value);
                 }}
                 placeholder="......................................................................................................................................." 
                 className="w-full bg-transparent border-none focus:ring-0 resize-none p-0 whitespace-pre-wrap font-serif" 
                 style={{ fontSize: '13pt', lineHeight: '1.5' }} 
               />
            </div>

            <h2 className="font-bold uppercase border-b border-stone-300 text-stone-900 py-1 mt-6" style={{ fontSize: '13pt' }}>
              V. ĐỀ NGHỊ
            </h2>
            <div className="min-h-[80px] border-b border-dotted border-stone-300">
               <AutoResizeTextarea 
                 value={recommendation}
                 onChange={(e) => {
                   hasUserInteracted.current = true;
                   setRecommendation(e.target.value);
                 }}
                 placeholder="......................................................................................................................................." 
                 className="w-full bg-transparent border-none focus:ring-0 resize-none p-0 whitespace-pre-wrap font-serif" 
                 style={{ fontSize: '13pt', lineHeight: '1.5' }} 
               />
            </div>

            <h2 className="font-bold uppercase border-b border-stone-300 text-stone-900 py-1 mt-6" style={{ fontSize: '13pt' }}>
              VI. KẾT LUẬN
            </h2>
            <div className="min-h-[80px] border-b border-dotted border-stone-300">
               <AutoResizeTextarea 
                 value={customConclusion}
                 onChange={(e) => {
                   hasUserInteracted.current = true;
                   setCustomConclusion(e.target.value);
                 }}
                 placeholder="......................................................................................................................................." 
                 className="w-full bg-transparent border-none focus:ring-0 resize-none p-0 whitespace-pre-wrap font-serif" 
                 style={{ fontSize: '13pt', lineHeight: '1.5' }} 
               />
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-4 mt-12 text-center" style={{ pageBreakInside: 'avoid' }}>
            <div>
               <p className="font-bold uppercase" style={{ fontSize: '13pt' }}>ĐẠI DIỆN ĐƠN VỊ GIAO</p>
               <p className="italic mb-24" style={{ fontSize: '13pt' }}>(Ký, ghi rõ họ tên)</p>
               <input 
                 type="text" 
                 value={giverName}
                 onChange={(e) => {
                   hasUserInteracted.current = true;
                   setGiverName(e.target.value);
                 }}
                 className="w-4/5 text-center bg-transparent border-b border-dotted border-stone-400 font-bold focus:outline-none focus:border-stone-800" 
                 style={{ fontSize: '13pt' }} 
                 placeholder="......................"
               />
            </div>
            <div>
               <p className="font-bold uppercase" style={{ fontSize: '13pt' }}>ĐẠI DIỆN ĐƠN VỊ NHẬN</p>
               <p className="italic mb-24" style={{ fontSize: '13pt' }}>(Ký, ghi rõ họ tên)</p>
               <input 
                 type="text" 
                 value={receiverName}
                 onChange={(e) => {
                   hasUserInteracted.current = true;
                   setReceiverName(e.target.value);
                 }}
                 className="w-4/5 text-center bg-transparent border-b border-dotted border-stone-400 font-bold focus:outline-none focus:border-stone-800" 
                 style={{ fontSize: '13pt' }} 
                 placeholder="......................"
               />
            </div>
            <div>
               <p className="font-bold uppercase" style={{ fontSize: '13pt' }}>CHỈ HUY TIỂU ĐOÀN</p>
               <p className="italic mb-24" style={{ fontSize: '13pt' }}>(Ký, ghi rõ họ tên)</p>
               <input 
                 type="text" 
                 value={commanderName}
                 onChange={(e) => {
                   hasUserInteracted.current = true;
                   setCommanderName(e.target.value);
                 }}
                 className="w-4/5 text-center bg-transparent border-b border-dotted border-stone-400 font-bold focus:outline-none focus:border-stone-800" 
                 style={{ fontSize: '13pt' }} 
                 placeholder="......................"
               />
            </div>
          </div>
          </fieldset>
        </div>
      </div>

      {/* Recovery Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/85 backdrop-blur-xs p-4 select-none">
          <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-amber-500">
              <FileText className="h-6 w-6 animate-pulse" />
              <h3 className="text-base font-extrabold uppercase tracking-wider text-stone-100">Đã tìm thấy biên bản đã lưu</h3>
            </div>
            
            <p className="text-stone-300 text-sm leading-relaxed mb-6 font-sans">
              Hệ thống đã tự động định vị được dữ liệu biên bản giao nhận xe <span className="font-extrabold text-amber-400 font-mono">{plateNumber || (recoveredData?.headerData && recoveredData.headerData.plateNumber) || "nhập tay dã chiến"}</span> dã ngoại tự lưu mới nhất. Hãy chọn hành động phù hợp:
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  if (recoveredData) {
                    loadRecoveredForm(recoveredData);
                  }
                  setShowRecoveryModal(false);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold rounded-lg text-xs tracking-wider uppercase shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                Tiếp tục
              </button>
              
              <button
                onClick={() => {
                  initNewForm();
                  setShowRecoveryModal(false);
                }}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white font-semibold rounded-lg text-xs tracking-wider uppercase border border-stone-700 transition-all cursor-pointer"
              >
                Nhập mới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
