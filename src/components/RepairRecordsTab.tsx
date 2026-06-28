import React, { useState } from "react";
import {
  ClipboardList,
  Wrench,
  Settings,
  Shield,
  FileText,
  CheckCircle,
  PenTool,
  Plus,
  Trash2,
  Search,
} from "lucide-react";
import { Vehicle } from "../types";
import { EngineInspectionBeforeRepairForm } from "./EngineInspectionBeforeRepairForm";
import { InteriorInspectionBeforeRepairForm } from "./InteriorInspectionBeforeRepairForm";
import { BodyInspectionBeforeRepairForm } from "./BodyInspectionBeforeRepairForm";
import { PaintInspectionBeforeRepairForm } from "./PaintInspectionBeforeRepairForm";
import { getModuleForTemplateType } from "../utils/formModules";
import { GeneralDisassemblyRepairForm } from "./GeneralDisassemblyRepairForm";
import { EngineComponentDisassemblyForm } from "./EngineComponentDisassemblyForm";
import { EngineComponentRepairForm } from "./EngineComponentRepairForm";
import { PartsCleaningRepairForm } from "./PartsCleaningRepairForm";
import { DataService } from "../firebase";
import { getCurrentUserSession } from "../services/dbService";
import { logger } from "../utils/logger";
import { formatVNTime } from "../utils/time";
import { canEditModule } from "../services/permissionService";
import { canEditDocument } from "../services/ownershipService";

export function formatVietnamDate(value: any): string {
  return formatVNTime(value) || "Không rõ";
}

interface RepairRecordsTabProps {
  viewMode: string;
  setViewMode: (mode: any) => void;
  selectedVehicle: Vehicle | null;
  savedVehicles: Vehicle[];
}

type SubTab =
  | "TONG_THAO"
  | "SUA_MAY"
  | "SUA_GAM"
  | "SUA_DIEN"
  | "SUA_VOTHE"
  | "TONG_LAP"
  | "KIEM_TRA_THU_NGHIEM";

export const RepairRecordsTab = ({
  viewMode,
  setViewMode,
  selectedVehicle,
  savedVehicles,
}: RepairRecordsTabProps) => {
  const [activeTab, setActiveTab] = useState<SubTab>("TONG_THAO");
  const [tongThaoSubTab, setTongThaoSubTab] =
    useState<string>("ENGINE_PRE_REPAIR");
  const [suaMaySubTab, setSuaMaySubTab] = useState<string>("ENGINE_COMPONENT_DISASSEMBLY");
  const [suaGamSubTab, setSuaGamSubTab] = useState<string>("TONG_THAO_CUM_GAM");
  const [suaDienSubTab, setSuaDienSubTab] =
    useState<string>("TONG_THAO_CUM_DIEN");
  const [suaVoTheSubTab, setSuaVoTheSubTab] = useState<string>("XU_LY_BE_MAT");
  const [tongLapSubTab, setTongLapSubTab] = useState<string>("PHIEU_TONG_LAP");
  const [kiemTraThuNghiemSubTab, setKiemTraThuNghiemSubTab] = useState<string>(
    "THU_NGHIEM_TONG_THE",
  );
  const [showEngineInspectionForm, setShowEngineInspectionForm] =
    useState(false);
  const [activeEngineFormId, setActiveEngineFormId] = useState<
    string | undefined
  >(undefined);
  const [engineForms, setEngineForms] = useState<any[]>([]);
  const [damageProtocols, setDamageProtocols] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const tabs: { id: SubTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "TONG_THAO",
      label: "1 - Tổng tháo trang thiết bị",
      icon: <ClipboardList className="w-5 h-5" />,
    },
    {
      id: "SUA_MAY",
      label: "2 - Công đoạn sửa chữa máy",
      icon: <Wrench className="w-5 h-5" />,
    },
    {
      id: "SUA_GAM",
      label: "3 - Công đoạn sửa chữa gầm",
      icon: <Settings className="w-5 h-5" />,
    },
    {
      id: "SUA_DIEN",
      label: "4 - Công đoạn sửa chữa điện",
      icon: <Shield className="w-5 h-5" />,
    },
    {
      id: "SUA_VOTHE",
      label: "5 - Công đoạn sửa chữa thân vỏ, nội thất, sơn",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: "TONG_LAP",
      label: "6 - Tổng lắp Trang thiết bị",
      icon: <PenTool className="w-5 h-5" />,
    },
    {
      id: "KIEM_TRA_THU_NGHIEM",
      label: "7 - Kiểm tra, thử nghiệm trang thiết bị",
      icon: <CheckCircle className="w-5 h-5" />,
    },
  ];

  const tongThaoSubTabs = [
    { id: "ENGINE_PRE_REPAIR", label: "Phiếu kiểm tra động cơ trước sửa chữa" },
    { id: "CHASSIS_PRE_REPAIR", label: "Phiếu kiểm tra gầm trước sửa chữa" },
    {
      id: "ELECTRICAL_PRE_REPAIR",
      label: "Phiếu kiểm tra điện trước sửa chữa",
    },
    { id: "BODY_PRE_REPAIR", label: "Phiếu kiểm tra thân vỏ trước sửa chữa" },
    {
      id: "INTERIOR_PRE_REPAIR",
      label: "Phiếu kiểm tra nội thất trước sửa chữa",
    },
    { id: "PAINT_PRE_REPAIR", label: "Phiếu kiểm tra sơn trước sửa chữa" },
    { id: "GENERAL_DISASSEMBLY_REPAIR", label: "Phiếu sửa chữa tổng tháo" },
  ];

  const suaMaySubTabs = [
    { id: "ENGINE_COMPONENT_DISASSEMBLY", label: "Phiếu tổng tháo cụm chi tiết" },
    { id: "PARTS_CLEANING_REPAIR", label: "Tẩy rửa, làm sạch chi tiết" },
    { id: "ENGINE_COMPONENT_REPAIR", label: "Sửa chữa chi tiết, linh kiện của cụm" },
    { id: "LAP_RAP", label: "Lắp ráp, hiệu chỉnh, chạy rà cụm động cơ" },
    { id: "KIEM_TRA_SAU_LAP", label: "Kiểm tra sau tổng lắp động cơ" },
  ];

  const suaGamSubTabs = [
    { id: "TONG_THAO_CUM_GAM", label: "Phiếu tổng tháo cụm gầm" },
    { id: "TAY_RUA_GAM", label: "Tẩy rửa, làm sạch chi tiết" },
    { id: "SUA_CHUA_GAM", label: "Sửa chữa chi tiết, linh kiện của cụm" },
    { id: "LAP_RAP_GAM", label: "Lắp ráp, hiệu chỉnh, chạy rà cụm" },
    { id: "KIEM_TRA_GAM", label: "Kiểm tra sau tổng lắp" },
  ];

  const suaDienSubTabs = [
    { id: "TONG_THAO_CUM_DIEN", label: "Phiếu tổng tháo cụm gầm" },
    { id: "TAY_RUA_DIEN", label: "Tẩy rửa, làm sạch chi tiết" },
    { id: "SUA_CHUA_DIEN", label: "Sửa chữa chi tiết, linh kiện của cụm" },
    { id: "KIEM_TRA_DIEN", label: "Kiểm tra sau tổng lắp" },
  ];

  const suaVoTheSubTabs = [
    { id: "XU_LY_BE_MAT", label: "Phiếu xử lý bề mặt linh kiện, chi tiết" },
    { id: "KIEM_TRA_THAN_VO", label: "Phiếu kiểm tra thân vỏ sau sửa chữa" },
    { id: "TAY_RUA_SON", label: "Phiếu tẩy rửa, làm sạch bề mặt sơn" },
    { id: "CHONG_GI", label: "Phiếu chống gỉ và tạo bề mặt sơn" },
    { id: "SON_LEN_MAU", label: "Phiếu Sơn lên màu" },
    {
      id: "KIEM_TRA_NOI_THAT_SON",
      label: "Kiểm tra nội thất, sơn sau sửa chữa",
    },
  ];

  const tongLapSubTabs = [
    { id: "PHIEU_TONG_LAP", label: "Phiếu tổng lắp trang bị kỹ thuật" },
  ];

  const kiemTraThuNghiemSubTabs = [
    { id: "THU_NGHIEM_TONG_THE", label: "Thử nghiệm tổng thể TBKT" },
  ];

  const getActiveSubTabList = () => {
    switch (activeTab) {
      case "TONG_THAO":
        return tongThaoSubTabs;
      case "SUA_MAY":
        return suaMaySubTabs;
      case "SUA_GAM":
        return suaGamSubTabs;
      case "SUA_DIEN":
        return suaDienSubTabs;
      case "SUA_VOTHE":
        return suaVoTheSubTabs;
      case "TONG_LAP":
        return tongLapSubTabs;
      case "KIEM_TRA_THU_NGHIEM":
        return kiemTraThuNghiemSubTabs;
      default:
        return [];
    }
  };

  const getActiveSubTabValue = () => {
    switch (activeTab) {
      case "TONG_THAO":
        return tongThaoSubTab;
      case "SUA_MAY":
        return suaMaySubTab;
      case "SUA_GAM":
        return suaGamSubTab;
      case "SUA_DIEN":
        return suaDienSubTab;
      case "SUA_VOTHE":
        return suaVoTheSubTab;
      case "TONG_LAP":
        return tongLapSubTab;
      case "KIEM_TRA_THU_NGHIEM":
        return kiemTraThuNghiemSubTab;
      default:
        return "";
    }
  };

  const activeSubTabDef = getActiveSubTabList().find(
    (t) => t.id === getActiveSubTabValue(),
  );

  // Synchronously track current active sub-tab to protect against async closure race conditions
  const activeSubTabIdRef = React.useRef<string>("");
  activeSubTabIdRef.current = getActiveSubTabValue();

  const currentSubTab = getActiveSubTabValue();

  React.useEffect(() => {
    setShowEngineInspectionForm(false);

    console.log('selectedVehicle', selectedVehicle);
    console.log('activeTab', activeTab);
    console.log('currentSubTab', currentSubTab);
    console.log('activeSubTabDef', activeSubTabDef);

    console.log(
      JSON.stringify({
        hasVehicle: !!selectedVehicle,
        hasSubTab: !!activeSubTabDef,
        activeTab,
        currentSubTab
      })
    );

    if (activeSubTabDef) {
      loadEngineForms(activeSubTabDef.id);
    }
  }, [
    activeTab,
    currentSubTab
  ]);

  React.useEffect(() => {
    const fetchDps = async () => {
      try {
        const dps = await DataService.load('damageProtocols') || [];
        const localDps = JSON.parse(localStorage.getItem('local_damageProtocols') || '[]');
        const allDps = Array.isArray(dps) && dps.length > 0 ? dps : localDps;
        const activeDps = allDps.filter((p: any) => p.isDeleted !== true && p.isDeleted !== 'true');
        setDamageProtocols(activeDps);
      } catch (err) {}
    };
    fetchDps();
  }, []);

  const loadEngineForms = async (expectedTemplateId?: string) => {
    console.log(
      "LOAD ENGINE FORMS RUNNING | INDEPENDENT MODE"
    );
    const targetTemplateId = expectedTemplateId || activeSubTabDef?.id;
    if (!targetTemplateId) return [];

    console.log("LOAD TEMPLATE", targetTemplateId);
    if (targetTemplateId !== activeSubTabIdRef.current) return [];

    const storeKey = `local_${targetTemplateId}`;
    let localData = localStorage.getItem(storeKey);
    if (!localData) {
      const legacyKey = "local_repairForms";
      const legacyData = localStorage.getItem(legacyKey);
      if (legacyData) {
        try {
          const parsedLegacy = JSON.parse(legacyData);
          if (Array.isArray(parsedLegacy)) {
            const legacyItems = parsedLegacy.filter((f: any) => f.templateType === targetTemplateId);
            if (legacyItems.length > 0) {
              localStorage.setItem(storeKey, JSON.stringify(legacyItems));
              localData = JSON.stringify(legacyItems);
            }
          }
        } catch (e) {
          console.warn("Error parsing legacy repair forms", e);
        }
      }
    }
    const localDataArray = localData ? JSON.parse(localData) : [];

    const normalizeStr = (s: any) => s ? String(s).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

    const combinedMap = new Map();
    localDataArray.forEach((f: any) => combinedMap.set(f.id, f));

    let dbForms: any[] = [];
    let firestoreCount = 0;
    let localCount = localDataArray.length;
    let didLoadSuccessfully = false;

    console.log("LOCAL COUNT =", localCount);

    try {
      const dbData = await DataService.load("repairForms");
      if (Array.isArray(dbData)) {
        dbForms = dbData;
        firestoreCount = dbData.length;
        didLoadSuccessfully = true;

        console.log("FIRESTORE COUNT =", firestoreCount);

        dbData.slice(0, 5).forEach((f: any) => {
          console.log(`FORM: id=${f.id} vehicleId=${f.vehicleId || "EMPTY"} plateNumber=${f.plateNumber || "EMPTY"} templateType=${f.templateType} isDeleted=${f.isDeleted}`);
        });

        dbForms.forEach((dbF: any) => {
          const localItem = localDataArray.find((lf: any) => lf.id && dbF.id && String(lf.id).trim().toLowerCase() === String(dbF.id).trim().toLowerCase());
          const isDeletedLocally = localItem && (localItem.isDeleted === true || localItem.isDeleted === 'true');
          
          if (!isDeletedLocally) {
            if (combinedMap.has(dbF.id)) {
                combinedMap.set(dbF.id, { ...combinedMap.get(dbF.id), ...dbF });
            } else {
                combinedMap.set(dbF.id, dbF);
            }
          }
        });
      }
    } catch (err) {
      console.error("Error loading forms from DB:", err);
      console.log("FIRESTORE COUNT = ERROR");
    }

    const mergedForms = Array.from(combinedMap.values());
    console.log("MERGED COUNT =", mergedForms.length);

    console.log("TARGET TEMPLATE =", targetTemplateId);

    const filteredForms = mergedForms.filter((f: any) => {
        return f.templateType === targetTemplateId &&
               f.isDeleted !== true &&
               f.isDeleted !== 'true';
    });

    console.log("FILTERED COUNT =", filteredForms.length);

    filteredForms.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());

    const finalForms = filteredForms;
    console.log("FINAL COUNT =", finalForms.length);

    if (!didLoadSuccessfully) {
      console.log("KẾT LUẬN: A. Không đọc được Firestore");
    } else if (localCount === 0 && !localStorage.getItem(storeKey)) {
      console.log("KẾT LUẬN: B. Không đọc được LocalStorage");
    } else if (mergedForms.length === 0) {
      console.log("KẾT LUẬN: C. Đọc được nhưng MERGED COUNT = 0");
    } else if (mergedForms.length > 0 && filteredForms.length === 0) {
      console.log("KẾT LUẬN: D. MERGED COUNT > 0 nhưng FILTERED COUNT = 0");
    } else if (filteredForms.length > 0 && finalForms.length === 0) {
      console.log("KẾT LUẬN: E. FILTERED COUNT > 0 nhưng FINAL COUNT = 0");
    } else if (finalForms.length > 0) {
      console.log("KẾT LUẬN: F. FINAL COUNT > 0 nhưng setState không hiển thị");
    }

    if (targetTemplateId === activeSubTabIdRef.current) {
        setEngineForms(finalForms);
        
        try {
          const currentLocal = JSON.parse(localStorage.getItem(storeKey) || "[]");
          let updated = false;
          finalForms.forEach((cf: any) => {
            const idx = currentLocal.findIndex(
              (cl: any) => cl.id && cf.id && String(cl.id).trim().toLowerCase() === String(cf.id).trim().toLowerCase()
            );
            if (idx === -1) {
              currentLocal.push(cf);
              updated = true;
            } else if (
              new Date(cf.updatedAt || 0) >
              new Date(currentLocal[idx].updatedAt || 0)
            ) {
              currentLocal[idx] = cf;
              updated = true;
            }
          });
          if (updated) {
            localStorage.setItem(storeKey, JSON.stringify(currentLocal));
          }
        } catch (err) {}
    }

    return finalForms;
  };

  const handleDeleteForm = async (e: React.MouseEvent, formId: string) => {
    console.log("DELETE BUTTON CLICKED");
    console.log("DELETE BUTTON CLICKED", formId);
    e.stopPropagation();

    console.log("DELETE START", formId);
    console.log("DELETE CONFIRMED");
    console.log("DELETE CONFIRMED");

    try {
      const currentUser = getCurrentUserSession();
      const targetForm = engineForms.find(
        (f) => f.id && formId && String(f.id).trim().toLowerCase() === String(formId).trim().toLowerCase()
      );
      
      const canEdit = currentUser ? canEditModule(currentUser.role as any, 'REPAIR') : false;
      const canDeleteForm = canEdit && (targetForm ? canEditDocument(currentUser, targetForm) : false);

      if (!canDeleteForm) {
        alert('Bạn chỉ có quyền xem dữ liệu.');
        return;
      }
      
      const targetTemplateId = activeSubTabDef?.id;
      const storeKey = targetTemplateId ? `local_${targetTemplateId}` : `local_repairForms`;

      // Update template-specific local storage (marking isDeleted: true so that merge recognizes it)
      let list = [];
      const localData = localStorage.getItem(storeKey);
      if (localData) {
        try {
          list = JSON.parse(localData);
          if (!Array.isArray(list)) {
            list = [];
          }
        } catch (e) {
          list = [];
        }
      }
      
      const existingIdx = list.findIndex(
        (item: any) => item.id && formId && String(item.id).trim().toLowerCase() === String(formId).trim().toLowerCase()
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
        const existingInState = engineForms.find(
          (f) => f.id && formId && String(f.id).trim().toLowerCase() === String(formId).trim().toLowerCase()
        );
        list.push({
          ...(existingInState || {}),
          id: formId,
          module: getModuleForTemplateType(targetTemplateId || "ENGINE_PRE_REPAIR"),
          templateType: targetTemplateId || "ENGINE_PRE_REPAIR",
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser?.uid || currentUser?.username || "unknown",
          deletedByName: currentUser?.fullName || currentUser?.username || "Người dùng",
          deletedByRole: currentUser?.role || "Không xác định",
        });
      }
      localStorage.setItem(storeKey, JSON.stringify(list));

      // Also clean up legacy local_repairForms if it exists
      const legacyKey = "local_repairForms";
      let legacyList = [];
      const legacyData = localStorage.getItem(legacyKey);
      if (legacyData) {
        try {
          legacyList = JSON.parse(legacyData);
          if (!Array.isArray(legacyList)) {
            legacyList = [];
          }
        } catch (e) {
          legacyList = [];
        }
      }
      
      const legacyIdx = legacyList.findIndex(
        (item: any) => item.id && formId && String(item.id).trim().toLowerCase() === String(formId).trim().toLowerCase()
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
        const existingInState = engineForms.find(
          (f) => f.id && formId && String(f.id).trim().toLowerCase() === String(formId).trim().toLowerCase()
        );
        legacyList.push({
          ...(existingInState || {}),
          id: formId,
          module: getModuleForTemplateType(targetTemplateId || "ENGINE_PRE_REPAIR"),
          templateType: targetTemplateId || "ENGINE_PRE_REPAIR",
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser?.uid || currentUser?.username || "unknown",
          deletedByName: currentUser?.fullName || currentUser?.username || "Người dùng",
          deletedByRole: currentUser?.role || "Không xác định",
        });
      }
      localStorage.setItem(legacyKey, JSON.stringify(legacyList));

      console.log("LOCAL DELETE SUCCESS");
      console.log("LOCAL DELETE SUCCESS");

      // Update state immediately
      console.log("BEFORE DELETE", engineForms.length);
      const next = engineForms.filter((f) => f.id !== formId);
      console.log("AFTER DELETE", next.length);
      setEngineForms(next);
      console.log("DELETE UI SUCCESS");
      console.log("CURRENT STATE", next.map(f => f.id));

      // Update Firebase softly via DataService
      try {
        await DataService.update("repairForms", formId, {
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser?.uid || currentUser?.username || "unknown",
          deletedByName: currentUser?.fullName || currentUser?.username || "Người dùng",
          deletedByRole: currentUser?.role || "Không xác định",
        });
        console.log("FIRESTORE DELETE SUCCESS");
        console.log("DELETE FIRESTORE SUCCESS");
      } catch (firestoreErr) {
        console.warn("Firestore update failed, continuing with local deletion:", firestoreErr);
      }

      // Reload forms
      const finalForms = await loadEngineForms();
      console.log("RELOADED COUNT", finalForms ? finalForms.length : 0);
    } catch (err) {
      console.log("DELETE FAILED: " + err);
      console.error("DELETE FAILED", err);
      logger.error(
        "Không thể xóa dữ liệu trực tuyến. Dữ liệu đã xóa trên thiết bị này.",
        err,
      );
    }
  };

  return (
    <div className="flex-1 flex flex-col sm:flex-row h-full min-h-[500px] overflow-hidden bg-stone-50/50">
      {/* LEFT SIDEBAR (Tabs) */}
      <div className="w-full sm:w-72 md:w-80 bg-white border-r border-stone-200 flex flex-col shrink-0 overflow-y-auto z-10 shadow-sm relative shadow-stone-100">
        <div className="p-4 bg-stone-50 border-b border-stone-200 sticky top-0 z-20">
          <h2 className="font-black text-stone-800 uppercase tracking-tight flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-700" />
            Hồ sơ sửa chữa
          </h2>
          <p className="text-xs text-stone-500 font-medium">
            Quản lý và thực hiện các quy trình sửa chữa theo từng công đoạn
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 sm:py-4 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 text-left p-3 rounded-lg font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                activeTab === tab.id
                  ? "bg-emerald-50 text-emerald-800 border disabled border-emerald-200/60 shadow-sm shadow-emerald-900/5"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-transparent"
              }`}
            >
              <div
                className={`p-1.5 rounded-md ${activeTab === tab.id ? "bg-emerald-100 text-emerald-700" : "bg-stone-150 text-stone-500"}`}
              >
                {tab.icon}
              </div>
              <span className="leading-tight">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT CONTENT AREA */}
      <div className="flex-1 overflow-y-auto relative bg-stone-50 flex flex-col">
        <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in flex-1 flex flex-col">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div>
              <h3 className="font-extrabold text-stone-900 text-xl tracking-tight">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h3>
            </div>
            <div className="w-full sm:w-64 md:w-80 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm bg-white"
                placeholder="Tìm kiếm theo biển số xe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {activeTab === "TONG_THAO" && (
            <div className="flex w-full flex-wrap gap-2 mb-6 pb-2 shrink-0 border-b border-stone-200">
              {tongThaoSubTabs.map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setTongThaoSubTab(subTab.id)}
                  className={`flex-shrink-0 px-1 sm:px-4 py-2 font-bold text-sm transition-all rounded-t-xl shrink-0 ${
                    tongThaoSubTab === subTab.id
                      ? "bg-emerald-50 text-emerald-800 border-[1.5px] border-b-0 border-emerald-300 shadow-sm"
                      : "text-stone-500 bg-white hover:text-stone-800 hover:bg-stone-50 border border-transparent"
                  }`}
                  style={
                    tongThaoSubTab === subTab.id
                      ? {
                          marginBottom: "-9px",
                          borderBottomLeftRadius: 0,
                          borderBottomRightRadius: 0,
                        }
                      : {}
                  }
                >
                  {subTab.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === "SUA_MAY" && (
            <div className="flex w-full flex-wrap gap-2 mb-6 pb-2 shrink-0 border-b border-stone-200">
              {suaMaySubTabs.map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setSuaMaySubTab(subTab.id)}
                  className={`flex-shrink-0 px-1 sm:px-4 py-2 font-bold text-sm transition-all rounded-t-xl shrink-0 ${
                    suaMaySubTab === subTab.id
                      ? "bg-emerald-50 text-emerald-800 border-[1.5px] border-b-0 border-emerald-300 shadow-sm"
                      : "text-stone-500 bg-white hover:text-stone-800 hover:bg-stone-50 border border-transparent"
                  }`}
                  style={
                    suaMaySubTab === subTab.id
                      ? {
                          marginBottom: "-9px",
                          borderBottomLeftRadius: 0,
                          borderBottomRightRadius: 0,
                        }
                      : {}
                  }
                >
                  {subTab.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === "SUA_GAM" && (
            <div className="flex w-full flex-wrap gap-2 mb-6 pb-2 shrink-0 border-b border-stone-200">
              {suaGamSubTabs.map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setSuaGamSubTab(subTab.id)}
                  className={`flex-shrink-0 px-1 sm:px-4 py-2 font-bold text-sm transition-all rounded-t-xl shrink-0 ${
                    suaGamSubTab === subTab.id
                      ? "bg-emerald-50 text-emerald-800 border-[1.5px] border-b-0 border-emerald-300 shadow-sm"
                      : "text-stone-500 bg-white hover:text-stone-800 hover:bg-stone-50 border border-transparent"
                  }`}
                  style={
                    suaGamSubTab === subTab.id
                      ? {
                          marginBottom: "-9px",
                          borderBottomLeftRadius: 0,
                          borderBottomRightRadius: 0,
                        }
                      : {}
                  }
                >
                  {subTab.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === "SUA_DIEN" && (
            <div className="flex w-full flex-wrap gap-2 mb-6 pb-2 shrink-0 border-b border-stone-200">
              {suaDienSubTabs.map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setSuaDienSubTab(subTab.id)}
                  className={`flex-shrink-0 px-1 sm:px-4 py-2 font-bold text-sm transition-all rounded-t-xl shrink-0 ${
                    suaDienSubTab === subTab.id
                      ? "bg-emerald-50 text-emerald-800 border-[1.5px] border-b-0 border-emerald-300 shadow-sm"
                      : "text-stone-500 bg-white hover:text-stone-800 hover:bg-stone-50 border border-transparent"
                  }`}
                  style={
                    suaDienSubTab === subTab.id
                      ? {
                          marginBottom: "-9px",
                          borderBottomLeftRadius: 0,
                          borderBottomRightRadius: 0,
                        }
                      : {}
                  }
                >
                  {subTab.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === "SUA_VOTHE" && (
            <div className="flex w-full flex-wrap gap-2 mb-6 pb-2 shrink-0 border-b border-stone-200">
              {suaVoTheSubTabs.map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setSuaVoTheSubTab(subTab.id)}
                  className={`flex-shrink-0 px-1 sm:px-4 py-2 font-bold text-sm transition-all rounded-t-xl shrink-0 ${
                    suaVoTheSubTab === subTab.id
                      ? "bg-emerald-50 text-emerald-800 border-[1.5px] border-b-0 border-emerald-300 shadow-sm"
                      : "text-stone-500 bg-white hover:text-stone-800 hover:bg-stone-50 border border-transparent"
                  }`}
                  style={
                    suaVoTheSubTab === subTab.id
                      ? {
                          marginBottom: "-9px",
                          borderBottomLeftRadius: 0,
                          borderBottomRightRadius: 0,
                        }
                      : {}
                  }
                >
                  {subTab.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === "TONG_LAP" && (
            <div className="flex w-full flex-wrap gap-2 mb-6 pb-2 shrink-0 border-b border-stone-200">
              {tongLapSubTabs.map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setTongLapSubTab(subTab.id)}
                  className={`flex-shrink-0 px-1 sm:px-4 py-2 font-bold text-sm transition-all rounded-t-xl shrink-0 ${
                    tongLapSubTab === subTab.id
                      ? "bg-emerald-50 text-emerald-800 border-[1.5px] border-b-0 border-emerald-300 shadow-sm"
                      : "text-stone-500 bg-white hover:text-stone-800 hover:bg-stone-50 border border-transparent"
                  }`}
                  style={
                    tongLapSubTab === subTab.id
                      ? {
                          marginBottom: "-9px",
                          borderBottomLeftRadius: 0,
                          borderBottomRightRadius: 0,
                        }
                      : {}
                  }
                >
                  {subTab.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === "KIEM_TRA_THU_NGHIEM" && (
            <div className="flex w-full flex-wrap gap-2 mb-6 pb-2 shrink-0 border-b border-stone-200">
              {kiemTraThuNghiemSubTabs.map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setKiemTraThuNghiemSubTab(subTab.id)}
                  className={`flex-shrink-0 px-1 sm:px-4 py-2 font-bold text-sm transition-all rounded-t-xl shrink-0 ${
                    kiemTraThuNghiemSubTab === subTab.id
                      ? "bg-emerald-50 text-emerald-800 border-[1.5px] border-b-0 border-emerald-300 shadow-sm"
                      : "text-stone-500 bg-white hover:text-stone-800 hover:bg-stone-50 border border-transparent"
                  }`}
                  style={
                    kiemTraThuNghiemSubTab === subTab.id
                      ? {
                          marginBottom: "-9px",
                          borderBottomLeftRadius: 0,
                          borderBottomRightRadius: 0,
                        }
                      : {}
                  }
                >
                  {subTab.label}
                </button>
              ))}
            </div>
          )}

          {activeSubTabDef ? (
            <div className="flex-1 flex flex-col p-6 space-y-6">
              {(() => {
                const tabForms = engineForms.filter((form) => {
                  const expectedModule = getModuleForTemplateType(activeSubTabDef.id);
                  const actualModule = form.module || getModuleForTemplateType(form.templateType);
                  return actualModule === expectedModule && form.templateType === activeSubTabDef.id;
                });

                const displayedForms = tabForms.filter((form) => {
                  if (searchTerm.trim()) {
                    const dp = damageProtocols.find((p: any) => p.vehicleId === form.vehicleId);
                    const dpPlateNumber = dp?.plateNumber || 'Biển số không xác định';
                    return dpPlateNumber.toLowerCase().includes(searchTerm.trim().toLowerCase());
                  }
                  return true;
                });

                if (tabForms.length === 0 && !searchTerm.trim()) {
                  return (
                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 flex flex-col items-center justify-center text-center flex-1 min-h-[400px]">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-emerald-50 text-emerald-600">
                        <FileText className="w-8 h-8" />
                      </div>
                      <h4 className="text-xl font-bold text-stone-800 mb-2">
                        {activeSubTabDef.label}
                      </h4>
                      <p className="text-stone-500 mb-8 max-w-md">
                        Tạo và quản lý phiếu kiểm tra cho công đoạn {activeSubTabDef.label.toLowerCase()}.
                      </p>
                      {activeSubTabDef && (
                        <button
                          onClick={() => {
                            setActiveEngineFormId(undefined);
                            setShowEngineInspectionForm(true);
                          }}
                          className="flex items-center gap-2 px-6 py-2 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-sm hover:shadow"
                        >
                          <Plus className="w-5 h-5" />
                          Tạo phiếu kiểm tra
                        </button>
                      )}
                    </div>
                  );
                }

                return (
                  <>
                    {displayedForms.length > 0 ? (
                      <>
                        {activeSubTabDef && (
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-stone-800">Phiếu kiểm tra đã lưu</h3>
                            <button
                              onClick={() => {
                                setActiveEngineFormId(undefined);
                                setShowEngineInspectionForm(true);
                              }}
                              className="flex items-center gap-2 px-6 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-sm hover:shadow text-sm"
                            >
                              <Plus className="w-5 h-5" />
                              Tạo phiếu kiểm tra
                            </button>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {displayedForms.map((form) => {
                            const dp = damageProtocols.find((p: any) => p.vehicleId === form.vehicleId);
                            const displayPlateNumber = dp?.plateNumber || 'Biển số không xác định';

                            return (
                            <div
                              key={form.id}
                              onClick={() => {
                                setActiveEngineFormId(form.id);
                                setShowEngineInspectionForm(true);
                              }}
                              className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group relative"
                            >
                              <button
                                id="delete-button-selector"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteForm(e, form.id);
                                }}
                                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors z-10"
                                title="Xóa phiếu"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium text-stone-400 bg-stone-100 px-2 py-1 rounded-full mr-7">
                                  {formatVietnamDate(form.createdAt)}
                                </span>
                              </div>
                              <h5 className="font-bold text-stone-800 mb-1 line-clamp-1 pr-6">
                                {displayPlateNumber}
                              </h5>
                              <h6 className="font-semibold text-stone-700 mb-1 line-clamp-1 pr-6">
                                {form.templateName}
                              </h6>
                              <p className="text-sm text-stone-500 mb-1 line-clamp-1">
                                Tạo bởi: {form.createdByName}
                              </p>
                            </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 flex flex-col items-center justify-center text-center flex-1 min-h-[300px]">
                        <Search className="w-12 h-12 text-stone-300 mb-4" />
                        <h4 className="text-lg font-bold text-stone-800 mb-2">
                          Không tìm thấy kết quả
                        </h4>
                        <p className="text-stone-500 max-w-md mb-8">
                          Không có phiếu kiểm tra nào khớp với biển số "{searchTerm}".
                        </p>
                        {activeSubTabDef && (
                          <button
                            onClick={() => {
                              setActiveEngineFormId(undefined);
                              setShowEngineInspectionForm(true);
                            }}
                            className="flex items-center gap-2 px-6 py-2 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-sm hover:shadow"
                          >
                            <Plus className="w-5 h-5" />
                            Tạo phiếu kiểm tra mới
                          </button>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 flex flex-col items-center justify-center text-center flex-1 min-h-[400px]">
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4 text-stone-400">
                {tabs.find((t) => t.id === activeTab)?.icon}
              </div>
              <h4 className="text-lg font-bold text-stone-800 mb-2">
                Chưa có dữ liệu
              </h4>
              <p className="text-sm text-stone-500 max-w-sm">
                Khu vực này đang được xây dựng cho{" "}
                {tabs.find((t) => t.id === activeTab)?.label.toLowerCase()}.
              </p>
            </div>
          )}
        </div>
      </div>

      {showEngineInspectionForm && (
        activeSubTabDef?.id === "BODY_PRE_REPAIR" ? (
          <BodyInspectionBeforeRepairForm
            vehicle={selectedVehicle}
            existingFormId={activeEngineFormId}
            initialData={engineForms.find((f) => f.id === activeEngineFormId)}
            templateName={activeSubTabDef?.label}
            stageName={activeSubTabDef?.label}
            templateType={activeSubTabDef?.id}
            onSaved={(savedForm) => {
              if (savedForm) {
                console.log(
                  "SAVE TEMPLATE",
                  activeSubTabDef?.id,
                  savedForm.templateType
                );
                setEngineForms((prev) => {
                  const newList = [...prev];
                  const existingIdx = newList.findIndex(
                    (f) => f.id === savedForm.id,
                  );
                  if (existingIdx >= 0) {
                    newList[existingIdx] = savedForm;
                  } else {
                    newList.push(savedForm);
                  }
                  newList.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
                  return newList;
                });
              }
              loadEngineForms();
            }}
            onClose={() => {
              setShowEngineInspectionForm(false);
            }}
          />
        ) : activeSubTabDef?.id === "INTERIOR_PRE_REPAIR" ? (
          <InteriorInspectionBeforeRepairForm
            vehicle={selectedVehicle}
            existingFormId={activeEngineFormId}
            initialData={engineForms.find((f) => f.id === activeEngineFormId)}
            templateName={activeSubTabDef?.label}
            stageName={activeSubTabDef?.label}
            templateType={activeSubTabDef?.id}
            onSaved={(savedForm) => {
              if (savedForm) {
                console.log(
                  "SAVE TEMPLATE",
                  activeSubTabDef?.id,
                  savedForm.templateType
                );
                setEngineForms((prev) => {
                  const newList = [...prev];
                  const existingIdx = newList.findIndex(
                    (f) => f.id === savedForm.id,
                  );
                  if (existingIdx >= 0) {
                    newList[existingIdx] = savedForm;
                  } else {
                    newList.push(savedForm);
                  }
                  newList.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
                  return newList;
                });
              }
              loadEngineForms();
            }}
            onClose={() => {
              setShowEngineInspectionForm(false);
            }}
          />
        ) : activeSubTabDef?.id === "GENERAL_DISASSEMBLY_REPAIR" ? (
          <GeneralDisassemblyRepairForm
            vehicle={selectedVehicle}
            existingFormId={activeEngineFormId}
            initialData={engineForms.find((f) => f.id === activeEngineFormId)}
            templateName={activeSubTabDef?.label}
            stageName={activeSubTabDef?.label}
            templateType={activeSubTabDef?.id}
            onSaved={(savedForm) => {
              if (savedForm) {
                console.log(
                  "SAVE TEMPLATE",
                  activeSubTabDef?.id,
                  savedForm.templateType
                );
                setEngineForms((prev) => {
                  const newList = [...prev];
                  const existingIdx = newList.findIndex(
                    (f) => f.id === savedForm.id,
                  );
                  if (existingIdx >= 0) {
                    newList[existingIdx] = savedForm;
                  } else {
                    newList.push(savedForm);
                  }
                  newList.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
                  return newList;
                });
              }
              loadEngineForms();
            }}
            onClose={() => {
              setShowEngineInspectionForm(false);
            }}
          />
        ) : activeSubTabDef?.id === "ENGINE_COMPONENT_DISASSEMBLY" ? (
          <EngineComponentDisassemblyForm
            vehicle={selectedVehicle}
            existingFormId={activeEngineFormId}
            initialData={engineForms.find((f) => f.id === activeEngineFormId)}
            templateName={activeSubTabDef?.label}
            stageName={activeSubTabDef?.label}
            templateType={activeSubTabDef?.id}
            onSaved={(savedForm) => {
              if (savedForm) {
                console.log(
                  "SAVE TEMPLATE",
                  activeSubTabDef?.id,
                  savedForm.templateType
                );
                setEngineForms((prev) => {
                  const newList = [...prev];
                  const existingIdx = newList.findIndex(
                    (f) => f.id === savedForm.id,
                  );
                  if (existingIdx >= 0) {
                    newList[existingIdx] = savedForm;
                  } else {
                    newList.push(savedForm);
                  }
                  newList.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
                  return newList;
                });
              }
              loadEngineForms();
            }}
            onClose={() => {
              setShowEngineInspectionForm(false);
            }}
          />
        ) : activeSubTabDef?.id === "PARTS_CLEANING_REPAIR" ? (
          <PartsCleaningRepairForm
            vehicle={selectedVehicle}
            existingFormId={activeEngineFormId}
            initialData={engineForms.find((f) => f.id === activeEngineFormId)}
            templateName={activeSubTabDef?.label}
            stageName={activeSubTabDef?.label}
            templateType={activeSubTabDef?.id}
            onSaved={(savedForm) => {
              if (savedForm) {
                console.log(
                  "SAVE TEMPLATE",
                  activeSubTabDef?.id,
                  savedForm.templateType
                );
                setEngineForms((prev) => {
                  const newList = [...prev];
                  const existingIdx = newList.findIndex(
                    (f) => f.id === savedForm.id,
                  );
                  if (existingIdx >= 0) {
                    newList[existingIdx] = savedForm;
                  } else {
                    newList.push(savedForm);
                  }
                  newList.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
                  return newList;
                });
              }
              loadEngineForms();
            }}
            onClose={() => {
              setShowEngineInspectionForm(false);
            }}
          />
        ) : activeSubTabDef?.id === "ENGINE_COMPONENT_REPAIR" ? (
          <EngineComponentRepairForm
            vehicle={selectedVehicle}
            existingFormId={activeEngineFormId}
            initialData={engineForms.find((f) => f.id === activeEngineFormId)}
            templateName={activeSubTabDef?.label}
            stageName={activeSubTabDef?.label}
            templateType={activeSubTabDef?.id}
            onSaved={(savedForm) => {
              if (savedForm) {
                console.log(
                  "SAVE TEMPLATE",
                  activeSubTabDef?.id,
                  savedForm.templateType
                );
                setEngineForms((prev) => {
                  const newList = [...prev];
                  const existingIdx = newList.findIndex(
                    (f) => f.id === savedForm.id,
                  );
                  if (existingIdx >= 0) {
                    newList[existingIdx] = savedForm;
                  } else {
                    newList.push(savedForm);
                  }
                  newList.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
                  return newList;
                });
              }
              loadEngineForms();
            }}
            onClose={() => {
              setShowEngineInspectionForm(false);
            }}
          />
        ) : activeSubTabDef?.id === "PAINT_PRE_REPAIR" ? (
          <PaintInspectionBeforeRepairForm
            vehicle={selectedVehicle}
            existingFormId={activeEngineFormId}
            initialData={engineForms.find((f) => f.id === activeEngineFormId)}
            templateName={activeSubTabDef?.label}
            stageName={activeSubTabDef?.label}
            templateType={activeSubTabDef?.id}
            onSaved={(savedForm) => {
              if (savedForm) {
                console.log(
                  "SAVE TEMPLATE",
                  activeSubTabDef?.id,
                  savedForm.templateType
                );
                setEngineForms((prev) => {
                  const newList = [...prev];
                  const existingIdx = newList.findIndex(
                    (f) => f.id === savedForm.id,
                  );
                  if (existingIdx >= 0) {
                    newList[existingIdx] = savedForm;
                  } else {
                    newList.push(savedForm);
                  }
                  newList.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
                  return newList;
                });
              }
              loadEngineForms();
            }}
            onClose={() => {
              setShowEngineInspectionForm(false);
            }}
          />
        ) : (
          <EngineInspectionBeforeRepairForm
            vehicle={selectedVehicle}
            existingFormId={activeEngineFormId}
            initialData={engineForms.find((f) => f.id === activeEngineFormId)}
            templateName={activeSubTabDef?.label}
            stageName={activeSubTabDef?.label}
            templateType={activeSubTabDef?.id}
            onSaved={(savedForm) => {
              if (savedForm) {
                console.log(
                  "SAVE TEMPLATE",
                  activeSubTabDef?.id,
                  savedForm.templateType
                );
                setEngineForms((prev) => {
                  const newList = [...prev];
                  const existingIdx = newList.findIndex(
                    (f) => f.id === savedForm.id,
                  );
                  if (existingIdx >= 0) {
                    newList[existingIdx] = savedForm;
                  } else {
                    newList.push(savedForm);
                  }
                  newList.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
                  return newList;
                });
              }
              loadEngineForms();
            }}
            onClose={() => {
              setShowEngineInspectionForm(false);
            }}
          />
        )
      )}
    </div>
  );
};
