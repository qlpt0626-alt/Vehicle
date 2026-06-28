import React, { useState, useEffect } from 'react';
import { PlusCircle, FileText, Printer, FileDown, Trash2, Search } from 'lucide-react';
import { Vehicle, DamageProtocol } from '../types';
import { MilitaryInspectionForm } from './MilitaryInspectionForm';
import { DetailedSelectionProtocolForm } from './DetailedSelectionProtocolForm';
import { DamageProtocolList } from './DamageProtocolList';
import { DamageProtocolForm } from './DamageProtocolForm';
import HyundaiCountyTemplate from '../HyundaiCountyTemplate.json';
import { formatVNTime } from '../utils/time';
import { canEditModule } from '../services/permissionService';
import { canEditDocument } from '../services/ownershipService';
import { getCurrentUserSession } from '../services/dbService';

interface InspectionTabProps {
  viewMode: string;
  setViewMode: (mode: any) => void;
  selectedVehicle: Vehicle | null;
  savedVehicles: Vehicle[];
  showDetailedInspectionForm: boolean;
  setShowDetailedInspectionForm: (show: boolean) => void;
  activeDamageProtocol: DamageProtocol | null;
  setActiveDamageProtocol: (p: DamageProtocol | null) => void;
  allDamageProtocols: DamageProtocol[];
  allVehicleInspectionForms: any[];
  loadAllDamageProtocols: () => Promise<void>;
  handleSaveDamageProtocol: (payload: any) => Promise<void>;
  handleDeleteDamageProtocol: (id: string) => Promise<void>;
  handleDeleteVehicleInspectionForm: (id: string) => Promise<void>;
  handlePrintDamageProtocol: (protocol: DamageProtocol) => void;
  currentUserRole?: string;
}

export function InspectionTab({
  viewMode,
  setViewMode,
  selectedVehicle,
  savedVehicles,
  showDetailedInspectionForm,
  setShowDetailedInspectionForm,
  activeDamageProtocol,
  setActiveDamageProtocol,
  allDamageProtocols,
  allVehicleInspectionForms,
  loadAllDamageProtocols,
  handleSaveDamageProtocol,
  handleDeleteDamageProtocol,
  handleDeleteVehicleInspectionForm: originalHandleDeleteVehicleInspectionForm,
  handlePrintDamageProtocol,
  currentUserRole
}: InspectionTabProps) {
  
  const currentVehicleOrFallback = selectedVehicle || (savedVehicles.length > 0 ? savedVehicles[0] : null);
  const canEdit = currentUserRole ? canEditModule(currentUserRole as any, 'INSPECTION') : false;
  const currentUser = getCurrentUserSession();

  const canModifyInspectionDocument = (document: any) => {
    return canEdit && canEditDocument(currentUser, document);
  };

  const handleDeleteVehicleInspectionForm = async (id: string) => {
    const form = allVehicleInspectionForms.find(f => f.protocolId === id || f.id === id);
    if (!canModifyInspectionDocument(form)) {
      alert('Bạn chỉ có quyền xem dữ liệu.');
      return;
    }
    await originalHandleDeleteVehicleInspectionForm(id);
  };

  // States specified by user requirements
  const [selectedTemplate, setSelectedTemplate] = useState<any>(HyundaiCountyTemplate);
  const [activeFormMode, setActiveFormMode] = useState<'NONE' | 'GIAO_NHAN' | 'KIEM_CHON' | 'VIEW_PROTOCOL'>('NONE');
  const [protocolListTab, setProtocolListTab] = useState<'GIAO_NHAN' | 'KIEM_CHON'>('GIAO_NHAN');
  const [activeDetailedVehicle, setActiveDetailedVehicle] = useState<Vehicle | null>(currentVehicleOrFallback);
  const [activeDetailedFormId, setActiveDetailedFormId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Search filter derived states
  const filteredDamageProtocols = allDamageProtocols.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const pPlate = (p.plateNumber || '').toLowerCase();
    const pBrand = (p.brand || '').toLowerCase();
    const pReportNumber = (p.reportNumber || '').toLowerCase();
    return pPlate.includes(q) || pBrand.includes(q) || pReportNumber.includes(q);
  }).sort((a: any, b: any) => {
    const dateA = new Date(a.updatedAt || a.createdDate || a.createdAt || 0).getTime();
    const dateB = new Date(b.updatedAt || b.createdDate || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  const filteredVehicleInspectionForms = allVehicleInspectionForms.filter(form => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const vehicleInfo = savedVehicles.find(v => v.vehicleId === form.vehicleId);
    const displayPlateNumber = (form.plateNumber || vehicleInfo?.plateNumber || '').toLowerCase();
    const vehicleName = (form.vehicleName || '').toLowerCase();
    return displayPlateNumber.includes(q) || vehicleName.includes(q);
  }).sort((a: any, b: any) => {
    const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  useEffect(() => {
    if (selectedVehicle) {
      setActiveDetailedVehicle(selectedVehicle);
    }
  }, [selectedVehicle]);

  // Find which vehicles actually have damage protocols (biên bản giao nhận)
  let availableVehiclesForSelection = savedVehicles.filter(v => {
    const normVId = (v.vehicleId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const normVPlate = (v.plateNumber || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    return allDamageProtocols.some(p => {
      const normPId = (p.vehicleId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const normPPlate = (p.plateNumber || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      return (normVId && normPId === normVId) || (normVPlate && normPPlate === normVPlate) || (normPId === normVPlate) || (normPPlate === normVId);
    });
  });

  // Deduplicate initial availableVehiclesForSelection
  availableVehiclesForSelection = availableVehiclesForSelection.filter((v, i, self) => 
    i === self.findIndex((t) => t.vehicleId === v.vehicleId)
  );

  // Also include vehicles created virtually out of allDamageProtocols or allVehicleInspectionForms in case they were deleted from savedVehicles
  allDamageProtocols.forEach(p => {
    const id = p.vehicleId || p.plateNumber;
    if (id && !availableVehiclesForSelection.some(v => v.vehicleId === id || v.plateNumber === id || v.plateNumber === p.plateNumber)) {
      availableVehiclesForSelection.push({
        vehicleId: id,
        plateNumber: p.plateNumber || id || 'Không rõ',
        brand: p.brand || 'Hyundai County',
        vehicleType: p.vehicleType || 'Xe quân sự',
        vehicleGroup: '',
        chassisNumber: p.chassisNumber || '',
        engineNumber: p.engineNumber || '',
        yearOfManufacture: '',
        countryOfOrigin: '',
        createdAt: p.createdDate || new Date().toISOString(),
        createdBy: p.createdBy || p.createdByName || ''
      } as any);
    }
  });

  allVehicleInspectionForms.forEach(f => {
    const id = f.vehicleId;
    if (id && !availableVehiclesForSelection.some(v => v.vehicleId === id || (v as any).id === id)) {
      availableVehiclesForSelection.push({
        vehicleId: id,
        plateNumber: id || 'Không rõ',
        brand: f.vehicleName || 'Hyundai County',
        vehicleType: 'Xe quân sự',
        vehicleGroup: '',
        chassisNumber: '',
        engineNumber: '',
        yearOfManufacture: '',
        countryOfOrigin: '',
        createdAt: f.createdAt || new Date().toISOString(),
        createdBy: f.createdBy || f.createdByName || ''
      } as any);
    }
  });

  const emptyInspection = {
    headerData: {},
    formData: {},
    vehicle: currentVehicleOrFallback
  };

  const [currentInspection, setCurrentInspection] = useState<any>(emptyInspection);
  const [viewedProtocol, setViewedProtocol] = useState<DamageProtocol | null>(null);

  // Sync state if selectedVehicle updates
  useEffect(() => {
    setCurrentInspection({
      headerData: {},
      formData: {},
      vehicle: currentVehicleOrFallback
    });
  }, [selectedVehicle]);

  const createNewInspection = () => {
    if (!canEdit) {
      alert('Bạn chỉ có quyền xem dữ liệu.');
      return;
    }
    setActiveFormMode('GIAO_NHAN');
    setCurrentInspection({
      headerData: {
        reportNo: '',
        docDate: 'Gia Lai, ngày      tháng      năm 2026',
        repairLevel: '',
        repairGroup: '',
        vehicleName: currentVehicleOrFallback?.brand || 'Hyundai County',
        plateNumber: currentVehicleOrFallback?.plateNumber || '',
        chassisNumber: currentVehicleOrFallback?.chassisNumber || '',
        actualChassisNumber: currentVehicleOrFallback?.chassisNumber || '',
        engineNumber: currentVehicleOrFallback?.engineNumber || '',
        actualEngineNumber: currentVehicleOrFallback?.engineNumber || '',
        giverUnit: (currentVehicleOrFallback as any)?.unit || (currentVehicleOrFallback as any)?.createdByUnit || ''
      },
      formData: {},
      vehicle: currentVehicleOrFallback
    });
  };

  const resetForm = () => {
    // Only reset values inside the form, template and isFormOpen stay untouched
    setCurrentInspection((prev: any) => ({
      ...prev,
      headerData: {},
      formData: {}
    }));
  };

  const handleTạoBiênBản = () => {
    const hasValues = currentInspection && (
      (currentInspection.headerData && Object.keys(currentInspection.headerData).length > 0) ||
      (currentInspection.formData && Object.keys(currentInspection.formData).length > 0)
    );
    if (!hasValues) {
      createNewInspection();
    } else {
      resetForm();
    }
  };

  const handleDeleteAndSync = async (id: string) => {
    const protocol = allDamageProtocols.find(p => p.protocolId === id || (p as any).id === id);
    if (!canModifyInspectionDocument(protocol)) {
      alert('Bạn chỉ có quyền xem dữ liệu.');
      return;
    }
    if (currentInspection && currentInspection.protocolId === id) {
      resetForm();
    }
    if (viewedProtocol && viewedProtocol.protocolId === id) {
      setViewedProtocol(null);
      setActiveFormMode('NONE');
    }
    await handleDeleteDamageProtocol(id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans animate-fade-in mt-3">
      {/* 1. Left saved protocols sidebar list */}
      <div className="lg:col-span-4 lg:sticky lg:top-4 space-y-4">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 md:p-5 overflow-hidden animate-fade-in">
          <div className="flex items-center gap-2 border-b border-stone-150 pb-3 mb-4">
            <FileText className="h-5 w-5 text-yellow-600" />
            <h3 className="font-bold text-stone-900 text-sm tracking-tight uppercase">
              Danh mục biên bản
            </h3>
          </div>

          <div className="space-y-3 mb-6">
            <div 
              className={`p-3 rounded-xl border transition-all cursor-pointer ${activeFormMode === 'NONE' || activeFormMode === 'VIEW_PROTOCOL' ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-stone-50 border-stone-200 hover:border-emerald-300 hover:bg-white'}`}
              onClick={() => {
                resetForm();
                setActiveFormMode('NONE');
              }}
            >
              <div className="flex items-center gap-2">
                <FileText className={`h-5 w-5 ${activeFormMode === 'NONE' || activeFormMode === 'VIEW_PROTOCOL' ? 'text-emerald-700' : 'text-stone-400'}`} />
                <div>
                  <h5 className={`font-bold text-sm ${activeFormMode === 'NONE' || activeFormMode === 'VIEW_PROTOCOL' ? 'text-emerald-800' : 'text-stone-700'}`}>Danh sách biên bản</h5>
                  <p className="text-[11px] text-stone-500 mt-0.5">Quản lý các biên bản đã lưu trữ...</p>
                </div>
              </div>
            </div>

            {canEdit && (
              <>
                <div 
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${activeFormMode === 'GIAO_NHAN' ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-stone-50 border-stone-200 hover:border-emerald-300 hover:bg-white'}`}
                  onClick={() => {
                    createNewInspection();
                    setActiveFormMode('GIAO_NHAN');
                  }}
                >
                  <div className="flex items-center gap-2">
                    <FileText className={`h-5 w-5 ${activeFormMode === 'GIAO_NHAN' ? 'text-emerald-700' : 'text-stone-400'}`} />
                    <div>
                      <h5 className={`font-bold text-sm ${activeFormMode === 'GIAO_NHAN' ? 'text-emerald-800' : 'text-stone-700'}`}>Lập biên bản giao nhận</h5>
                      <p className="text-[11px] text-stone-500 mt-0.5">Biểu mẫu giám định tình trạng kỹ thuật...</p>
                    </div>
                  </div>
                </div>

                <div 
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${activeFormMode === 'KIEM_CHON' ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-stone-50 border-stone-200 hover:border-emerald-300 hover:bg-white'}`}
                  onClick={() => {
                    setActiveDetailedFormId(null);
                    setActiveDetailedVehicle(selectedVehicle || currentVehicleOrFallback);
                    setActiveFormMode('KIEM_CHON');
                  }}
                >
                  <div className="flex items-center gap-2">
                    <FileText className={`h-5 w-5 ${activeFormMode === 'KIEM_CHON' ? 'text-emerald-700' : 'text-stone-400'}`} />
                    <div>
                      <h5 className={`font-bold text-sm ${activeFormMode === 'KIEM_CHON' ? 'text-emerald-800' : 'text-stone-700'}`}>Biên bản kiểm chọn</h5>
                      <p className="text-[11px] text-stone-500 mt-0.5">Biểu mẫu kiểm tra tình trạng Hỏng/Thiếu/Sửa chữa...</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Right/Main Detailed Form layout */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-stone-200 shadow-sm animate-fade-in flex flex-col h-full min-h-[500px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-stone-150">
            <div>
              <h3 className="font-extrabold text-stone-900 text-base uppercase tracking-tight flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-800" />
                {activeFormMode === 'GIAO_NHAN' ? 'Lập biên bản giao nhận TBKT vào sửa chữa' :
                 activeFormMode === 'KIEM_CHON' ? 'Biên bản kiểm chọn tình trạng' :
                 activeFormMode === 'VIEW_PROTOCOL' ? 'Chi tiết biên bản đã lưu' :
                 'Danh sách biên bản đã lưu'}
              </h3>
              <p className="text-[11px] text-stone-500 font-medium">
                {activeFormMode === 'NONE' ? 'Quản lý các biên bản kiểm tra tình trạng vũ khí, trang bị kỹ thuật' : 'Lưu trữ biểu mẫu kiểm tra gầm bệ, động cơ cơ giới quân dụng dã chiến'}
              </p>
            </div>
            
            {activeFormMode !== 'NONE' && (
              <button
                onClick={() => {
                  resetForm();
                  setActiveFormMode('NONE');
                }}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg shadow-sm transition-all cursor-pointer"
                title="Đóng biểu mẫu / Xem trước"
              >
                <span>Đóng không gian hiển thị</span>
              </button>
            )}
          </div>

          <div className="flex-1 flex flex-col">
            {activeFormMode === 'GIAO_NHAN' ? (
              <MilitaryInspectionForm
                vehicle={currentVehicleOrFallback}
                initialForm={currentInspection}
                currentUserRole={currentUserRole}
                onClose={async () => {
                  resetForm();
                  setActiveFormMode('NONE');
                }}
                onSave={async (savedForm: any, isSilent: boolean) => {
                  if (!isSilent) {
                    await loadAllDamageProtocols();
                    if (savedForm) {
                      setActiveFormMode('NONE');
                    }
                  } else {
                    // Running in the background silently.
                    // Do NOT update currentInspection or trigger loadAllDamageProtocols
                    // because it causes the form to re-render and interrupts user typing.
                  }
                }}
                onReset={resetForm}
              />
            ) : activeFormMode === 'VIEW_PROTOCOL' && viewedProtocol ? (
              <div className="bg-stone-100 flex flex-col h-full font-sans overflow-y-auto space-y-6 pb-20 rounded-xl relative">
                {/* Unified Views Header */}
                <div className="bg-white border-b border-stone-200 p-4 sticky top-0 z-20 flex shadow-sm justify-between items-center shrink-0">
                  <div className="font-bold text-stone-800 md:text-lg flex items-center gap-2">
                    <FileText className="h-6 w-6 text-emerald-600" />
                    Hồ sơ chi tiết xe: <span className="text-emerald-700">{viewedProtocol.vehicleId || (viewedProtocol as any).plateNumber || 'Không rõ'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setActiveFormMode('NONE')} className="px-5 py-2 cursor-pointer bg-stone-50 border border-stone-300 rounded-lg hover:bg-stone-100 font-bold text-sm text-stone-700 transition">
                      Đóng màn hình
                    </button>
                  </div>
                </div>

                <div className="p-4 md:p-6 space-y-8 flex-1">
                   {/* BIÊN BẢN GIAO NHẬN (DAMAGE PROTOCOL) */}
                   <div className="bg-white rounded-xl shadow border border-stone-200 overflow-hidden shrink-0">
                      <div className="bg-emerald-50 border-b border-emerald-100 p-4">
                         <h3 className="font-bold text-emerald-800 text-lg uppercase">I. Biên bản giao nhận TBKT</h3>
                      </div>
                      <div className="p-2 pointer-events-none opacity-95 relative">
                         <DamageProtocolForm 
                           initialProtocol={viewedProtocol} 
                           currentUserRole={currentUserRole}
                           savedVehicles={availableVehiclesForSelection}
                           onClose={() => {}}
                           onSave={async () => {}}
                           onReset={() => {}}
                         />
                      </div>
                      <div className="p-4 bg-stone-50 border-t border-stone-200 text-center">
                        <button onClick={() => { setCurrentInspection(viewedProtocol); setActiveFormMode('GIAO_NHAN'); }} className="px-6 py-2 pointer-events-auto bg-emerald-600 cursor-pointer text-white rounded-lg font-bold shadow hover:bg-emerald-700 transition">
                          Mở chi tiết Biên bản giao nhận
                        </button>
                      </div>
                   </div>

                   {/* BIÊN BẢN KIỂM CHỌN (MILITARY INSPECTION) */}
                   <div className="bg-white rounded-xl shadow border border-stone-200 overflow-hidden shrink-0">
                      <div className="bg-blue-50 border-b border-blue-100 p-4">
                         <h3 className="font-bold text-blue-800 text-lg uppercase">II. Biên bản kiểm chọn chi tiết</h3>
                      </div>
                      <div className="p-2 pointer-events-none opacity-95 relative">
                         <DetailedSelectionProtocolForm 
                           vehicle={{ vehicleId: viewedProtocol.vehicleId, plateNumber: (viewedProtocol as any).plateNumber, brand: 'Hyundai County' } as any}
                           savedVehicles={availableVehiclesForSelection}
                           onClose={() => {}}
                           currentUserRole={currentUserRole}
                         />
                      </div>
                      <div className="p-4 bg-stone-50 border-t border-stone-200 text-center">
                        <button 
                          onClick={() => { 
                            setActiveDetailedVehicle({ vehicleId: viewedProtocol.vehicleId, plateNumber: (viewedProtocol as any).plateNumber, brand: 'Hyundai County' } as any);
                            setActiveDetailedFormId(null); 
                            setActiveFormMode('KIEM_CHON'); 
                          }} 
                          className="px-6 py-2 pointer-events-auto bg-blue-600 cursor-pointer text-white rounded-lg font-bold shadow hover:bg-blue-700 transition"
                        >
                          Mở chi tiết Biên bản kiểm chọn
                        </button>
                      </div>
                   </div>
                </div>
              </div>
            ) : activeFormMode === 'KIEM_CHON' ? (
              <DetailedSelectionProtocolForm
                vehicle={activeDetailedVehicle || currentVehicleOrFallback}
                savedVehicles={availableVehiclesForSelection}
                initialFormId={activeDetailedFormId}
                currentUserRole={currentUserRole}
                onClose={() => setActiveFormMode('NONE')}
                onSaveSuccess={async () => {
                  await loadAllDamageProtocols();
                }}
              />
            ) : (
              <div className="flex-1 flex flex-col p-2">
                
                {/* Search Bar */}
                <div className="mb-4 relative max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-stone-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm theo số đăng ký xe, tên xe hoặc số biên bản..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder:font-normal text-stone-800"
                  />
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-6 border-b border-stone-200 pb-2">
                  <button
                    onClick={() => setProtocolListTab('GIAO_NHAN')}
                    className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-colors ${
                      protocolListTab === 'GIAO_NHAN'
                        ? 'bg-emerald-50 text-emerald-800 border-b-2 border-emerald-600'
                        : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                    }`}
                  >
                    Biên bản giao nhận TBKT
                  </button>
                  <button
                    onClick={() => setProtocolListTab('KIEM_CHON')}
                    className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-colors ${
                      protocolListTab === 'KIEM_CHON'
                        ? 'bg-emerald-50 text-emerald-800 border-b-2 border-emerald-600'
                        : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                    }`}
                  >
                    Biên bản kiểm chọn chi tiết
                  </button>
                </div>

                {protocolListTab === 'GIAO_NHAN' && (
                  allDamageProtocols.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-stone-50 rounded-xl border border-dashed border-stone-300">
                      <div className="h-16 w-16 bg-stone-100 rounded-full flex items-center justify-center mb-4 text-stone-400">
                        <FileText className="h-8 w-8" />
                      </div>
                      <h3 className="text-sm font-bold text-stone-700 mb-2">Chưa có biên bản giao nhận nào</h3>
                      <p className="text-xs text-stone-500 max-w-sm mb-6">Bạn chưa lập biên bản nào. Vui lòng bấm vào "Lập biên bản giao nhận" để tạo mới.</p>
                      {canEdit && (
                        <button
                          onClick={() => {
                            createNewInspection();
                            setActiveFormMode('GIAO_NHAN');
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-sm shadow-emerald-600/20"
                        >
                          <PlusCircle className="h-4 w-4" />
                          <span>Lập biên bản đầu tiên</span>
                        </button>
                      )}
                    </div>
                  ) : filteredDamageProtocols.length > 0 ? (
                    <div className="animate-fade-in">
                      <DamageProtocolList
                        protocols={filteredDamageProtocols}
                        onDeleteProtocol={handleDeleteAndSync}
                        activeProtocolId={activeFormMode === 'VIEW_PROTOCOL' ? viewedProtocol?.protocolId : undefined}
                        onPrintSelect={(protocol) => {
                          setCurrentInspection(protocol);
                          setActiveFormMode('GIAO_NHAN');
                        }}
                        onViewSelect={(protocol) => {
                          setCurrentInspection(protocol);
                          setActiveFormMode('GIAO_NHAN');
                        }}
                        currentUserRole={currentUserRole}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-stone-50 rounded-xl border border-dashed border-stone-300">
                      <h3 className="text-sm font-bold text-stone-700 mb-1">Không tìm thấy kết quả</h3>
                      <p className="text-xs text-stone-500">Đã tìm kiếm với "{searchQuery}"</p>
                    </div>
                  )
                )}

                {protocolListTab === 'KIEM_CHON' && (
                  allVehicleInspectionForms && allVehicleInspectionForms.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-stone-50 rounded-xl border border-dashed border-stone-300">
                      <div className="h-16 w-16 bg-stone-100 rounded-full flex items-center justify-center mb-4 text-stone-400">
                        <FileText className="h-8 w-8" />
                      </div>
                      <h3 className="text-sm font-bold text-stone-700 mb-2">Chưa có biên bản kiểm chọn nào</h3>
                      <p className="text-xs text-stone-500 max-w-sm mb-6">Chưa có biên bản kiểm chọn chi tiết nào được lập.</p>
                    </div>
                  ) : filteredVehicleInspectionForms.length > 0 ? (
                    <div className="animate-fade-in space-y-3.5">
                      {filteredVehicleInspectionForms.map((form, index) => {
                        const vehicleInfo = savedVehicles.find(v => v.vehicleId === form.vehicleId);
                        const displayPlateNumber = form.plateNumber || vehicleInfo?.plateNumber || 'Biển số không xác định';
                        
                        return (
                        <div 
                          key={form.docId || form.protocolId || form.vehicleId ? `${form.docId}-${form.protocolId}-${form.vehicleId}-${index}` : index}
                          className="border border-stone-200 bg-white hover:border-stone-300 rounded-xl transition-all overflow-hidden p-4 cursor-pointer flex items-center justify-between flex-wrap gap-4 select-none"
                          onClick={() => {
                            const formId = form.id || form.docId || form.protocolId || form.vehicleId;
                            setActiveDetailedFormId(formId);
                            setActiveDetailedVehicle({ vehicleId: form.vehicleId, plateNumber: displayPlateNumber, brand: form.vehicleName || 'Hyundai County' } as any);
                            setActiveFormMode('KIEM_CHON');
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 text-emerald-600">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-[15px] text-stone-800">
                                  {displayPlateNumber}
                                </h4>
                                <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-bold rounded">
                                  CHI TIẾT
                                </span>
                              </div>
                              <p className="text-xs text-stone-500 font-medium font-mono">
                                {form.vehicleName || 'Biên bản kiểm chọn'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6 text-xs text-stone-500 font-medium">
                            <div className="flex items-center gap-1.5 hidden sm:flex">
                              Lưu lúc: {formatVNTime(form.updatedAt) || "Không rõ"}
                            </div>
                            <div className="flex items-center gap-1.5">
                              Người lập: <span className="font-bold text-stone-700">{form.createdByName || 'Người dùng'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 hidden sm:flex">
                              Vai trò: <span className="font-bold text-stone-700">{form.createdByRole || 'Không xác định'}</span>
                            </div>
                            
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              {canEdit && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const idToDelete = form.id || form.docId || form.protocolId || form.vehicleId;
                                    if (idToDelete) {
                                      if (activeDetailedFormId === idToDelete) {
                                        setActiveDetailedFormId(null);
                                        setActiveFormMode('NONE');
                                      }
                                      if (viewedProtocol && viewedProtocol.protocolId === idToDelete) {
                                        setViewedProtocol(null);
                                        setActiveFormMode('NONE');
                                      }
                                      await handleDeleteVehicleInspectionForm(idToDelete);
                                    }
                                  }}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg transition-all cursor-pointer"
                                  title="Xóa biên bản kiểm chọn"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-stone-50 rounded-xl border border-dashed border-stone-300">
                      <h3 className="text-sm font-bold text-stone-700 mb-1">Không tìm thấy kết quả</h3>
                      <p className="text-xs text-stone-500">Đã tìm kiếm với "{searchQuery}"</p>
                    </div>
                  )
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
