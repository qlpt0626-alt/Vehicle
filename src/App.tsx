/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { NotificationPanel } from './components/NotificationPanel';
import { logger } from './utils/logger';
import { 
  Database, 
  Wrench, 
  BookOpen, 
  RotateCcw,
  PlusCircle,
  Truck,
  FileText,
  ClipboardList,
  Users,
  LogOut,
  Lock,
  X,
  Trash2,
  FolderOpen
} from 'lucide-react';
import { isFirebaseConfigured, db } from './firebase';
import { dbService } from './services/dbService';
import { Vehicle, RepairHistory, DamageProtocol, User } from './types';
import { VehicleProfileCard } from './components/VehicleProfileCard';
import { HistoryTimeline } from './components/HistoryTimeline';
import { ReceiveForm } from './components/ReceiveForm';
import { DamageProtocolForm } from './components/DamageProtocolForm';
import { DamageProtocolList } from './components/DamageProtocolList';
import { TemplateDamageProtocol } from './components/TemplateDamageProtocol';
import { MilitaryInspectionForm } from './components/MilitaryInspectionForm';
import { LoginScreen } from './components/LoginScreen';
import { UserManagement } from './components/UserManagement';
import { TrashTab } from './components/TrashTab';
import { userService } from './services/userService';
import { IntroTab } from './components/IntroTab';
import { ReceptionTab } from './components/ReceptionTab';
import { canViewModule } from './services/permissionService';
import { InspectionTab } from './components/InspectionTab';
import { RepairRecordsTab } from './components/RepairRecordsTab';
import { OperationsTab } from './components/OperationsTab';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => userService.getCurrentUser());
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(() => {
    try {
      const stored = localStorage.getItem('saved_selected_vehicle');
      console.log(
        "STORAGE CHECK = " +
        (stored ? "FOUND" : "NULL")
      );
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [repairHistory, setRepairHistory] = useState<RepairHistory[]>([]);
  const [damageProtocols, setDamageProtocols] = useState<DamageProtocol[]>([]);
  const [activeDamageProtocol, setActiveDamageProtocol] = useState<DamageProtocol | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSavedList, setShowSavedList] = useState(false);
  const [savedVehicles, setSavedVehicles] = useState<Vehicle[]>([]);
  const [workspaceTab, setWorkspaceTab] = useState<'INTRO' | 'RECEPTION' | 'INSPECTION' | 'REPAIR_RECORDS' | 'OPERATIONS'>(() => {
    return (localStorage.getItem('saved_workspaceTab') as any) || 'INTRO';
  });
  const [allDamageProtocols, setAllDamageProtocols] = useState<DamageProtocol[]>([]);
  const [allVehicleInspectionForms, setAllVehicleInspectionForms] = useState<any[]>([]);

  const loadAllSavedVehicles = async () => {
    try {
      const list = await dbService.getAllVehicles();
      setSavedVehicles(list);
    } catch (e) {
      console.error("Failed to load saved vehicles:", e);
    }
  };

  const loadAllDamageProtocols = async () => {
    try {
      const list = await dbService.getAllDamageProtocols();
      setAllDamageProtocols(list);
      
      const formList = await dbService.getAllVehicleInspectionForms();
      setAllVehicleInspectionForms(formList);
    } catch (e) {
      console.error("Failed to load damage protocols or inspection forms:", e);
    }
  };
  
  // Controls the current operational view
  const [viewMode, setViewMode] = useState<'BROWSE' | 'CREATE_PROTOCOL' | 'CREATE_DAMAGE_PROTOCOL' | 'VIEW_PRINT_DAMAGE_PROTOCOL' | 'USER_MANAGEMENT' | 'TRASH'>(() => {
    return (localStorage.getItem('saved_viewMode') as any) || 'BROWSE';
  });
  
  // Controls the new Military Inspection Form view
  const [showDetailedInspectionForm, setShowDetailedInspectionForm] = useState(() => {
    return localStorage.getItem('saved_showDetailedInspectionForm') === 'true';
  });

  // Controls the dynamic template damage protocol panel
  const [isTemplatePanelOpen, setIsTemplatePanelOpen] = useState(false);
  
  // Tab controller for repair history vs detailed damage protocol
  const [activeTab, setActiveTab] = useState<'REPAIR_HISTORY' | 'DAMAGE_PROTOCOL'>('REPAIR_HISTORY');
  
  // Track search states
  const [notFoundPlate, setNotFoundPlate] = useState<string | null>(null);
  const [lastSearchedPlate, setLastSearchedPlate] = useState<string>('');

  const [firestoreTestStatus, setFirestoreTestStatus] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  // Refresh current user info from DB on mount
  useEffect(() => {
    const purgeDeprecatedUsers = async () => {
      if (!localStorage.getItem('purged_default_users_3')) {
        try {
          await userService.deleteUser('tuan.tq').catch(() => {});
          await userService.deleteUser('nam.lh').catch(() => {});
          await userService.deleteUser('hung.nv').catch(() => {});
          localStorage.setItem('purged_default_users_3', 'true');
        } catch (e) {}
      }
    };
    purgeDeprecatedUsers();

    if (currentUser?.username) {
      userService.loadUsers().then(users => {
        const fresh = users.find(u => u.username === currentUser?.username);
        if (fresh && JSON.stringify(fresh) !== JSON.stringify(currentUser)) {
          setCurrentUser(fresh);
          localStorage.setItem('current_user', JSON.stringify(fresh));
        }
      });
    }
  }, [currentUser?.username]);

  const handleTestFirestore = async () => {
    setFirestoreTestStatus({ status: 'loading', message: '' });
    try {
      if (!isFirebaseConfigured || !db) {
        throw new Error("Chưa cấu hình Firebase/Firestore. Vui lòng kiểm tra file firebase-applet-config.json");
      }
      const { doc, setDoc } = await import('firebase/firestore');
      const docId = 'TEST_' + Math.random().toString(36).substring(2, 11).toUpperCase();
      const testData = {
        name: "test",
        time: Date()
      };
      
      const docRef = doc(db, 'test', docId);
      await setDoc(docRef, testData);

      setFirestoreTestStatus({
        status: 'success',
        message: 'Kết nối Firestore thành công'
      });
    } catch (err: any) {
      console.error("Firestore test write error:", err);
      const errMsg = err?.message || String(err);
      setFirestoreTestStatus({
        status: 'error',
        message: errMsg
      });
    }
  };

  // Persist states to LocalStorage
  useEffect(() => {
    localStorage.setItem('saved_viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('saved_workspaceTab', workspaceTab);
  }, [workspaceTab]);

  useEffect(() => {
    localStorage.setItem('saved_showDetailedInspectionForm', String(showDetailedInspectionForm));
  }, [showDetailedInspectionForm]);

  useEffect(() => {
    if (selectedVehicle) {
      console.log(
        "SAVE VEHICLE = " +
        JSON.stringify({
          vehicleId: selectedVehicle.vehicleId,
          plateNumber: selectedVehicle.plateNumber
        })
      );
      localStorage.setItem('saved_selected_vehicle', JSON.stringify(selectedVehicle));
      localStorage.setItem('saved_last_searched_plate', selectedVehicle.plateNumber);
      localStorage.setItem('temp_plateNumber', selectedVehicle.plateNumber);
      localStorage.setItem('temp_vktbktName', selectedVehicle.brand || '');
      localStorage.setItem('temp_chassisNumber', selectedVehicle.chassisNumber || '');
      localStorage.setItem('temp_actualChassisNumber', selectedVehicle.chassisNumber || '');
      localStorage.setItem('temp_engineNumber', selectedVehicle.engineNumber || '');
      localStorage.setItem('temp_actualEngineNumber', selectedVehicle.engineNumber || '');
      if ((selectedVehicle as any).unit) {
        localStorage.setItem('temp_giverUnit', (selectedVehicle as any).unit);
      }
    }
  }, [selectedVehicle]);

  // Start with a clean dashboard on mount so that the welcoming dynamic features menu of choice is displayed first
  useEffect(() => {
    const initApp = async () => {
      await loadAllSavedVehicles();
      await loadAllDamageProtocols();
      
      const stored = localStorage.getItem('saved_selected_vehicle');
      console.log(
        "STORAGE CHECK = " +
        (stored ? "FOUND" : "NULL")
      );
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.vehicleId) {
            const result = await dbService.searchVehicle(parsed.plateNumber || parsed.vehicleId);
            if (result.vehicle) {
              setSelectedVehicle(result.vehicle);
              setRepairHistory(result.history || []);
              const dps = await dbService.getDamageProtocols(result.vehicle.vehicleId);
              setDamageProtocols(dps || []);
            }
          }
        } catch (e) {
          console.error("Failed to restore selected vehicle on mount:", e);
        }
      }
    };
    initApp();
  }, []);

  const handleSearch = async (plate: string) => {
    setIsSearching(true);
    setNotFoundPlate(null);
    setSelectedVehicle(null);
    setRepairHistory([]);
    setDamageProtocols([]);
    setViewMode('BROWSE');
    setWorkspaceTab('RECEPTION');

    try {
      const result = await dbService.searchVehicle(plate);
      console.log(
        "SEARCH RESULT = " +
        JSON.stringify({
          hasVehicle: !!result.vehicle,
          vehicleId: result.vehicle?.vehicleId,
          plateNumber: result.vehicle?.plateNumber
        })
      );
      if (result.vehicle) {
        setSelectedVehicle(result.vehicle);
        setRepairHistory(result.history);
        setLastSearchedPlate(result.vehicle.plateNumber);
        const dps = await dbService.getDamageProtocols(result.vehicle.vehicleId);
        setDamageProtocols(dps);
      } else {
        setNotFoundPlate(plate);
        setLastSearchedPlate(plate);
      }
    } catch (e) {
      console.error("Critical search error:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleOpenCreateNew = () => {
    setViewMode('CREATE_PROTOCOL');
    setNotFoundPlate(null);
  };

  const handleSaveSuccess = async (savedPlate: string) => {
    setViewMode('BROWSE');
    setActiveDamageProtocol(null);
    await loadAllSavedVehicles();
    await loadAllDamageProtocols();
    // Re-trigger search for the saved plate to display its updated specs/timeline
    await handleSearch(savedPlate);
  };

  const handleReset = () => {
    setSelectedVehicle(null);
    setRepairHistory([]);
    setDamageProtocols([]);
    setActiveDamageProtocol(null);
    setNotFoundPlate(null);
    setLastSearchedPlate('');
    setViewMode('BROWSE');
    setActiveTab('REPAIR_HISTORY');
    localStorage.removeItem('saved_selected_vehicle');
  };

  const handleDeleteHistory = async (historyId: string) => {
    await dbService.deleteRepairLog(historyId);
    setRepairHistory(prev => prev.filter(h => h.historyId !== historyId));
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    await dbService.deleteVehicle(vehicleId);
    await loadAllSavedVehicles();
    if (selectedVehicle && (selectedVehicle.vehicleId === vehicleId || selectedVehicle.plateNumber === vehicleId)) {
      setSelectedVehicle(null);
      localStorage.removeItem('saved_selected_vehicle');
    }
  };

  // Damage Protocol Handlers
  const handleSaveDamageProtocol = async (payload: Omit<DamageProtocol, 'protocolId' | 'createdAt'>) => {
    await dbService.saveDamageProtocol(payload);
    await loadAllDamageProtocols();
    if (selectedVehicle) {
      const dps = await dbService.getDamageProtocols(selectedVehicle.vehicleId);
      setDamageProtocols(dps);
    }
    setViewMode('BROWSE');
    setActiveTab('DAMAGE_PROTOCOL');
  };

  const handleDeleteDamageProtocol = async (id: string) => {
    try {
      await dbService.deleteDamageProtocol(id);
      await loadAllDamageProtocols();
      setDamageProtocols(prev => prev.filter(p => p.protocolId !== id));
      logger.success("Đã xóa biên bản.");
    } catch (e) {
      logger.error("Không thể xóa biên bản.", e);
    }
  };

  const handleDeleteVehicleInspectionForm = async (id: string) => {
    try {
      await dbService.deleteVehicleInspectionForm(id);
      setAllVehicleInspectionForms(prev => prev.filter(f => f.docId !== id && f.protocolId !== id && f.vehicleId !== id && f.id !== id));
      await loadAllDamageProtocols();
      logger.success("Đã xóa biên bản kiểm chọn.");
    } catch (e) {
      logger.error("Không thể xóa biên bản kiểm chọn.", e);
    }
  };

  const handlePrintDamageProtocol = (protocol: DamageProtocol) => {
    setActiveDamageProtocol(protocol);
    setViewMode('VIEW_PRINT_DAMAGE_PROTOCOL');
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-850 font-sans selection:bg-emerald-800 selection:text-white pb-12 overflow-x-hidden">
      
      {/* 1. Header Banner & Branding */}
      <header className="bg-emerald-950 border-b border-emerald-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-5">
          
          {/* Logo & Military Depot Title */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-900 border border-emerald-800 rounded-xl flex items-center justify-center text-emerald-100 shadow-inner">
              <Wrench className="h-6 w-6 text-yellow-500 animate-pulse" />
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs font-bold text-yellow-500 uppercase tracking-widest">
                <span>TIỂU ĐOÀN SCTH30 - CỤC HẬU CẦN-KỸ THUẬT QUÂN ĐOÀN 34</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-white mt-0.5">
                Hệ thống tiếp nhận và sửa chữa xe sửa chữa
              </h1>
            </div>
          </div>

          {/* Right Section: Test Widget + User profile */}
          <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto justify-end">
            
            {/* Diagnostic Firestore Test Widget */}
            <div className="flex flex-col items-center md:items-end gap-1.5">
              <button
                onClick={handleTestFirestore}
                disabled={firestoreTestStatus.status === 'loading'}
                id="test-firestore-btn"
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm border transition-all flex items-center gap-2 cursor-pointer ${
                  firestoreTestStatus.status === 'loading'
                    ? 'bg-stone-800/50 text-stone-400 border-stone-700 cursor-not-allowed'
                    : 'bg-emerald-900 border-emerald-800 hover:bg-emerald-850 text-emerald-100'
                }`}
              >
                <Database className="h-3.5 w-3.5 text-yellow-500" />
                <span>Test Firestore</span>
              </button>
              {firestoreTestStatus.status === 'success' && (
                <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/80 border border-emerald-900 px-2 py-0.5 rounded animate-fade-in">
                  Kết nối Firestore thành công
                </span>
              )}
              {firestoreTestStatus.status === 'error' && (
                <span className="text-[11px] font-medium text-red-400 bg-red-950/85 border border-red-900 px-2 py-0.5 rounded break-all max-w-xs text-center md:text-right animate-fade-in">
                  {firestoreTestStatus.message}
                </span>
              )}
            </div>

            {/* User Session Profile & Controls */}
            <div className="flex items-center gap-3.5 bg-emerald-900 border border-emerald-800 rounded-xl p-3 text-white self-stretch md:self-auto shadow-inner">
              <div className="text-left">
                <div className="text-[10px] text-emerald-300 uppercase tracking-wider font-extrabold leading-none pb-0.5">
                  {currentUser.rank || 'Chưa rõ cấp bậc'} • {currentUser.unit || 'Chưa rõ đơn vị'}
                </div>
                <div className="text-xs font-black text-white flex items-center gap-1.5 py-0.5 leading-none">
                  <span>{currentUser.fullName || 'Chưa cập nhật tên'}</span>
                  <span className="text-[10px] text-emerald-200/70 font-mono font-medium">@{currentUser.username}</span>
                </div>
                <div className="text-[10px] text-stone-300 font-semibold leading-none">
                  {currentUser.role === 'dai_doi_truong' ? 'Đại đội trưởng' :
                   currentUser.role === 'pho_dai_doi_truong' ? 'Phó Đại đội trưởng' :
                   currentUser.role === 'trung_doi_truong' ? 'Trung đội trưởng' :
                   currentUser.role === 'to_truong' ? 'Tổ trưởng' :
                   currentUser.role === 'kcs' ? 'Nhân viên KCS' :
                   currentUser.role === 'tro_ly_ky_thuat' ? 'Trợ lý Kỹ thuật' :
                   currentUser.role === 'admin' ? 'Quản trị hệ thống' : 'Chưa rõ chức vụ'}
                </div>
              </div>
              
              <div className="h-6 w-px bg-emerald-800"></div>

              <div className="flex gap-1.5">
                {['admin'].includes(currentUser.role) && (
                  <button
                    onClick={() => setViewMode(viewMode === 'TRASH' ? 'BROWSE' : 'TRASH')}
                    className={`p-2 rounded-lg transition-all border cursor-pointer ${
                      viewMode === 'TRASH'
                        ? 'bg-yellow-500 text-emerald-950 border-yellow-400'
                        : 'bg-emerald-905 border-emerald-800 hover:bg-emerald-800 text-emerald-100'
                    }`}
                    title="Quản lý thùng rác"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                {canViewModule(currentUser.role, 'USER_MANAGEMENT') && (
                  <button
                    onClick={() => setViewMode(viewMode === 'USER_MANAGEMENT' ? 'BROWSE' : 'USER_MANAGEMENT')}
                    className={`p-2 rounded-lg transition-all border cursor-pointer ${
                      viewMode === 'USER_MANAGEMENT'
                        ? 'bg-yellow-500 text-emerald-950 border-yellow-400'
                        : 'bg-emerald-905 border-emerald-800 hover:bg-emerald-800 text-emerald-100'
                    }`}
                    title="Quản lý tài khoản cán bộ quân sự"
                  >
                    <Users className="h-4 w-4" />
                  </button>
                )}

                <button
                  onClick={() => {
                    userService.logout();
                    setCurrentUser(null);
                    setSelectedVehicle(null);
                    setViewMode('BROWSE');
                    localStorage.removeItem('saved_selected_vehicle');
                  }}
                  className="p-2 rounded-lg bg-red-900/60 border border-red-800 hover:bg-red-800 text-red-100 transition-all cursor-pointer"
                  title="Đăng xuất khỏi hệ thống"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </header>

      {/* 2. Main Content Canvas */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 font-sans">
        
        {/* Main Content Areas */}

        {/* Beautiful Workspace Tabs Navigation */}
        <div className="flex border-b border-stone-200 mt-6 mb-6 bg-white rounded-xl shadow-sm p-1 flex-row gap-0.5 md:gap-1 font-sans w-full max-w-full overflow-hidden">
          <button
            onClick={() => setWorkspaceTab('INTRO')}
            className={`flex-1 min-w-0 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2.5 py-1.5 md:py-3 px-0.5 md:px-4 text-[9px] w-[50px] sm:w-auto sm:text-[11px] md:text-sm leading-[1.2] whitespace-normal text-center font-bold rounded-lg transition-all cursor-pointer break-words ${
              workspaceTab === 'INTRO'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-stone-600 hover:text-emerald-900 hover:bg-stone-50/50'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Giới thiệu</span>
          </button>
          {canViewModule(currentUser.role, 'RECEPTION') && (
            <button
              onClick={async () => {
                setWorkspaceTab('RECEPTION');
                await loadAllSavedVehicles();
              }}
              className={`flex-1 min-w-0 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2.5 py-1.5 md:py-3 px-0.5 md:px-4 text-[9px] w-[50px] sm:w-auto sm:text-[11px] md:text-sm leading-[1.2] whitespace-normal text-center font-bold rounded-lg transition-all cursor-pointer break-words ${
                workspaceTab === 'RECEPTION'
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'text-stone-600 hover:text-emerald-950 hover:bg-stone-50/50'
              }`}
            >
              <Truck className="h-4 w-4" />
              <span>Tiếp nhận</span>
            </button>
          )}
          {canViewModule(currentUser.role, 'INSPECTION') && (
            <button
              onClick={async () => {
                setWorkspaceTab('INSPECTION');
                await loadAllDamageProtocols();
              }}
              className={`flex-1 min-w-0 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2.5 py-1.5 md:py-3 px-0.5 md:px-4 text-[9px] w-[50px] sm:w-auto sm:text-[11px] md:text-sm leading-[1.2] whitespace-normal text-center font-bold rounded-lg transition-all cursor-pointer break-words ${
                workspaceTab === 'INSPECTION'
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'text-stone-600 hover:text-emerald-950 hover:bg-stone-50/50'
              }`}
            >
              <Wrench className="h-4 w-4" />
              <span>Hồ sơ kiểm tra đầu vào</span>
            </button>
          )}
          <button
            onClick={async () => {
              setWorkspaceTab('REPAIR_RECORDS');
            }}
            className={`flex-1 min-w-0 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2.5 py-1.5 md:py-3 px-0.5 md:px-4 text-[9px] w-[50px] sm:w-auto sm:text-[11px] md:text-sm leading-[1.2] whitespace-normal text-center font-bold rounded-lg transition-all cursor-pointer break-words ${
              workspaceTab === 'REPAIR_RECORDS'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-stone-600 hover:text-emerald-950 hover:bg-stone-50/50'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>Hồ sơ sửa chữa</span>
          </button>
          {canViewModule(currentUser.role, 'OPERATIONS') && (
            <button
              onClick={async () => {
                setWorkspaceTab('OPERATIONS');
              }}
              className={`flex-1 min-w-0 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2.5 py-1.5 md:py-3 px-0.5 md:px-4 text-[9px] w-[50px] sm:w-auto sm:text-[11px] md:text-sm leading-[1.2] whitespace-normal text-center font-bold rounded-lg transition-all cursor-pointer break-words ${
                workspaceTab === 'OPERATIONS'
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'text-stone-600 hover:text-emerald-950 hover:bg-stone-50/50'
              }`}
            >
              <FolderOpen className="h-4 w-4" />
              <span>Điều hành công việc</span>
            </button>
          )}
        </div>

        {/* Global USER_MANAGEMENT view has override priority */}
        {viewMode === 'USER_MANAGEMENT' ? (
          <UserManagement 
            currentUser={currentUser}
            onBack={() => setViewMode('BROWSE')}
            onCurrentUserUpdate={(u) => setCurrentUser(u)}
          />
        ) : viewMode === 'TRASH' && ['admin'].includes(currentUser.role) ? (
          <TrashTab
            onBack={() => {
              loadAllDamageProtocols();
              setViewMode('BROWSE');
            }}
          />
        ) : (
          <>
            {/* Search Loading State */}
            {isSearching ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 flex flex-col items-center justify-center text-center">
                <Loader2 className="h-10 w-10 text-emerald-800 animate-spin mb-3" />
                <h3 className="font-bold text-stone-800 text-lg">Đang đối chiếu dữ liệu quân kỳ</h3>
                <p className="text-stone-500 text-sm mt-1">Vui lòng đợi giây lát để kiểm tra hồ sơ cơ bản...</p>
              </div>
            ) : (
              <>
                {/* Tab 1: "Giới thiệu" */}
                {workspaceTab === 'INTRO' && (
                  <IntroTab 
                    currentUser={currentUser!}
                    onNavigateToTab={(tab) => {
                      setWorkspaceTab(tab);
                      if (tab === 'RECEPTION') {
                        loadAllSavedVehicles();
                      } else {
                        loadAllDamageProtocols();
                      }
                    }}
                    onOpenCreateNew={() => {
                      setWorkspaceTab('RECEPTION');
                      setViewMode('CREATE_PROTOCOL');
                      setNotFoundPlate(null);
                    }}
                    onOpenInspection={() => {
                      setWorkspaceTab('INSPECTION');
                      setShowDetailedInspectionForm(true);
                    }}
                  />
                )}

                {/* Tab 2: "Tiếp nhận" */}
                {workspaceTab === 'RECEPTION' && canViewModule(currentUser.role, 'RECEPTION') && (
                  <ReceptionTab 
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    selectedVehicle={selectedVehicle}
                    setSelectedVehicle={setSelectedVehicle}
                    savedVehicles={savedVehicles}
                    repairHistory={repairHistory}
                    notFoundPlate={notFoundPlate}
                    lastSearchedPlate={lastSearchedPlate}
                    setNotFoundPlate={setNotFoundPlate}
                    handleSaveSuccess={handleSaveSuccess}
                    handleSearch={handleSearch}
                    handleDeleteHistory={handleDeleteHistory}
                    handleDeleteVehicle={handleDeleteVehicle}
                    currentUserRole={currentUser?.role}
                  />
                )}

                {/* Tab 3: "Hồ sơ kiểm tra đầu vào" */}
                {workspaceTab === 'INSPECTION' && canViewModule(currentUser.role, 'INSPECTION') && (
                  <InspectionTab 
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    selectedVehicle={selectedVehicle}
                    savedVehicles={savedVehicles}
                    showDetailedInspectionForm={showDetailedInspectionForm}
                    setShowDetailedInspectionForm={setShowDetailedInspectionForm}
                    activeDamageProtocol={activeDamageProtocol}
                    setActiveDamageProtocol={setActiveDamageProtocol}
                    allDamageProtocols={allDamageProtocols}
                    allVehicleInspectionForms={allVehicleInspectionForms}
                    loadAllDamageProtocols={loadAllDamageProtocols}
                    handleSaveDamageProtocol={handleSaveDamageProtocol}
                    handleDeleteDamageProtocol={handleDeleteDamageProtocol}
                    handleDeleteVehicleInspectionForm={handleDeleteVehicleInspectionForm}
                    handlePrintDamageProtocol={handlePrintDamageProtocol}
                    currentUserRole={currentUser?.role}
                  />
                )}

                {/* Tab 4: "Hồ sơ sửa chữa" */}
                {workspaceTab === 'REPAIR_RECORDS' && (
                  <RepairRecordsTab 
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    selectedVehicle={selectedVehicle}
                    savedVehicles={savedVehicles}
                  />
                )}

                {/* Tab 5: "Điều hành công việc" */}
                {workspaceTab === 'OPERATIONS' && canViewModule(currentUser.role, 'OPERATIONS') && (
                  <OperationsTab />
                )}
              </>
            )}
          </>
        )}
      </main>
      
      {/* Footer credits */}
      <footer className="mt-12 text-center text-xs text-stone-400 font-sans pb-6">
        <p>© 2026 TIỂU ĐOÀN SCTH30 - CỤC HẬU CẦN-KỸ THUẬT QUÂN ĐOÀN 34</p>
      </footer>

      {isTemplatePanelOpen && selectedVehicle && (
        <TemplateDamageProtocol
          vehicle={selectedVehicle}
          onClose={async () => {
            setIsTemplatePanelOpen(false);
            if (selectedVehicle) {
              const dps = await dbService.getDamageProtocols(selectedVehicle.vehicleId);
              setDamageProtocols(dps);
            }
          }}
        />
      )}

      <NotificationPanel />
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg 
      className={`animate-spin ${className}`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
