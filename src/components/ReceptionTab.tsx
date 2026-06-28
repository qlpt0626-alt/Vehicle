import React from 'react';
import { formatVNTime } from '../utils/time';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { 
  PlusCircle, 
  Truck, 
  ClipboardList, 
  FileText, 
  UploadCloud, 
  Trash2, 
  FileSpreadsheet, 
  Image, 
  File, 
  X, 
  Eye, 
  ArrowLeft, 
  FolderOpen,
  Search,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { Vehicle, RepairHistory } from '../types';
import { ReceiveForm } from './ReceiveForm';
import { VehicleProfileCard } from './VehicleProfileCard';
import { HistoryTimeline } from './HistoryTimeline';
import { dbService, getCurrentUserSession } from '../services/dbService';
import { canViewModule, canEditModule } from '../services/permissionService';
import { canEditDocument } from '../services/ownershipService';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  url?: string;
  publicId?: string;
  subTab?: string;
  uploadedBy?: string;
  uploadedByUid?: string;
  uploadedByUsername?: string;
  uploadedByFullName?: string;
  uploadedByRole?: string;
  uploadedByUnit?: string;
  vehicleId?: string;
  plateNumber?: string;
}

import { uploadImageToCloudinary } from '../utils/cloudinary';

interface ReceptionTabProps {
  viewMode: string;
  setViewMode: (mode: any) => void;
  selectedVehicle: Vehicle | null;
  setSelectedVehicle: (v: Vehicle | null) => void;
  savedVehicles: Vehicle[];
  repairHistory: RepairHistory[];
  notFoundPlate: string | null;
  lastSearchedPlate: string;
  setNotFoundPlate: (p: string | null) => void;
  handleSaveSuccess: (plate: string) => Promise<void>;
  handleSearch: (plate: string) => Promise<void>;
  handleDeleteHistory: (historyId: string) => Promise<void>;
  handleDeleteVehicle: (vehicleId: string) => Promise<void>;
  currentUserRole?: string;
}

export function ReceptionTab({
  viewMode,
  setViewMode,
  selectedVehicle,
  setSelectedVehicle,
  savedVehicles,
  repairHistory,
  notFoundPlate,
  lastSearchedPlate,
  setNotFoundPlate,
  handleSaveSuccess,
  handleSearch,
  handleDeleteHistory: propsHandleDeleteHistory,
  handleDeleteVehicle: propsHandleDeleteVehicle,
  currentUserRole
}: ReceptionTabProps) {
  const canEdit = currentUserRole ? canEditModule(currentUserRole as any, 'RECEPTION') : false;
  const currentUser = getCurrentUserSession();
  const canEditCurrentDocument = selectedVehicle ? canEditDocument(currentUser, selectedVehicle) : true;
  const canModifyReception = canEdit && canEditCurrentDocument;

  const handleDeleteHistory = async (historyId: string) => {
    const historyItem = repairHistory.find(h => (h as any).id === historyId || h.historyId === historyId);
    const canDeleteHistory = canEdit && (historyItem ? canEditDocument(currentUser, historyItem) : false);

    if (!canDeleteHistory) {
      alert('Bạn chỉ có quyền xem dữ liệu.');
      return;
    }
    return propsHandleDeleteHistory(historyId);
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    const vehicle = savedVehicles.find(v => v.vehicleId === vehicleId || v.plateNumber === vehicleId);
    const canDeleteVehicle = canEdit && (vehicle ? canEditDocument(currentUser, vehicle) : false);

    if (!canDeleteVehicle) {
      alert('Bạn chỉ có quyền xem dữ liệu.');
      return;
    }
    return propsHandleDeleteVehicle(vehicleId);
  };

  const [activeDocSubTab, setActiveDocSubTab] = React.useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFile[]>([]);
  const [docSearchQuery, setDocSearchQuery] = React.useState('');
  const [dragOver, setDragOver] = React.useState(false);
  const [previewFile, setPreviewFile] = React.useState<UploadedFile | null>(null);
  const [zoomLevel, setZoomLevel] = React.useState<number>(100);
  const [allFiles, setAllFiles] = React.useState<UploadedFile[]>([]);

  React.useEffect(() => {
    const fetchAllFiles = async () => {
      try {
        const q = query(
          collection(db, 'uploaded_files')
        );
        const snapshot = await getDocs(q);
        const files: UploadedFile[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data.isDeleted === true || data.isDeleted === 'true') return;
          files.push({ id: docSnap.id, ...data } as UploadedFile);
        });
        files.sort((a,b) => b.uploadedAt.localeCompare(a.uploadedAt));
        setAllFiles(files);
      } catch (error) {
        console.error("Error fetching all attachments:", error);
      }
    };
    fetchAllFiles();
  }, []);

  React.useEffect(() => {
    let list = activeDocSubTab ? allFiles.filter(f => f.subTab === activeDocSubTab) : [];
    
    // If a search query is typed, we show filtered results across tabs when activeDocSubTab is set OR just ignore activeDocSubTab?
    // Let's make it so if a search query is present, it overrules activeDocSubTab if we want "across tabs". But wait, if they search, it should show files across all tabs.
    if (docSearchQuery.trim()) {
      const q = docSearchQuery.trim().toLowerCase();
      list = allFiles.filter(f => 
        (f.plateNumber && f.plateNumber.toLowerCase().includes(q)) || 
        f.name.toLowerCase().includes(q)
      );
    } else {
      // Normal filtering by activeDocSubTab
      if (activeDocSubTab) {
        list = allFiles.filter(f => f.subTab === activeDocSubTab);
        if (selectedVehicle) {
          list = list.filter(f => f.plateNumber === selectedVehicle.plateNumber || f.vehicleId === selectedVehicle.vehicleId);
        }
      } else {
        list = [];
      }
    }
    
    setUploadedFiles(list);
    setPreviewFile(null);
  }, [activeDocSubTab, allFiles, selectedVehicle, docSearchQuery]);

  const countFiles = React.useCallback((subTab: string) => {
    let list = allFiles.filter(f => f.subTab === subTab);
    if (selectedVehicle) {
      list = list.filter(f => f.plateNumber === selectedVehicle.plateNumber || f.vehicleId === selectedVehicle.vehicleId);
    }
    return list.length;
  }, [allFiles, selectedVehicle]);

  const getExtensionType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
      return 'image';
    }
    if (['doc', 'docx'].includes(ext)) {
      return 'word';
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return 'excel';
    }
    if (ext === 'pdf') {
      return 'pdf';
    }
    return 'document';
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const addFiles = async (filesList: any[]) => {
    if (!canModifyReception) {
      alert('Bạn chỉ có quyền xem dữ liệu.');
      return;
    }
    for (const file of filesList) {
      try {
        const fileType = getExtensionType(file.name);
        
        // Upload to Cloudinary
        const result = await uploadImageToCloudinary(file);
        
        const currentUser = getCurrentUserSession();
        
        const newFile: Omit<UploadedFile, 'id'> = {
          name: file.name,
          size: formatBytes(file.size),
          type: fileType,
          uploadedAt: formatVNTime(new Date()),
          url: result.secure_url,
          publicId: result.public_id,
          subTab: activeDocSubTab as string,
          uploadedBy: currentUserRole || 'User',
          uploadedByUid: currentUser?.uid || '',
          uploadedByUsername: currentUser?.username || '',
          uploadedByFullName: currentUser?.fullName || '',
          uploadedByRole: currentUser?.role || '',
          uploadedByUnit: currentUser?.unit || '',
          vehicleId: selectedVehicle?.vehicleId || '',
          plateNumber: selectedVehicle?.plateNumber || ''
        };
        
        const docRef = await addDoc(collection(db, 'uploaded_files'), newFile);
        
        const fileWithId: UploadedFile = {
            id: docRef.id,
            ...newFile
        };
        
        setUploadedFiles(prev => [fileWithId, ...prev]);
        setAllFiles(prevAll => [fileWithId, ...prevAll]);
      } catch (error: any) {
        console.error(`Upload Error: ${error?.message || error}`);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canModifyReception) {
      alert('Bạn chỉ có quyền xem dữ liệu.');
      return;
    }
    if (!e.target.files) return;
    const filesList = Array.from(e.target.files) as File[];
    addFiles(filesList);
  };

  const handleDeleteFile = async (id: string) => {
    const fileItem = uploadedFiles.find(f => f.id === id) || allFiles.find(f => f.id === id);
    const targetDoc = fileItem ? {
      ...fileItem,
      createdBy: fileItem.uploadedByUid || (fileItem as any).createdBy,
      createdByUnit: fileItem.uploadedByUnit || (fileItem as any).createdByUnit
    } : null;
    
    const canDeleteFile = canEdit && (targetDoc ? canEditDocument(currentUser, targetDoc) : false);

    if (!canDeleteFile) {
      alert('Bạn chỉ có quyền xem dữ liệu.');
      return;
    }
    
    try {
      const currentUser = getCurrentUserSession();
      await updateDoc(doc(db, 'uploaded_files', id), {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.uid || "unknown",
        deletedByName: currentUser?.fullName || currentUser?.username || "Người dùng",
        deletedByRole: currentUser?.role || "Không xác định"
      });
      
      setUploadedFiles(prev => prev.filter(f => f.id !== id));
      setAllFiles(prevAll => prevAll.filter(f => f.id !== id));
      if (previewFile?.id === id) {
        setPreviewFile(null);
      }
    } catch (e) {
      console.error("Error deleting document:", e);
    }
  };

  if (viewMode === 'CREATE_PROTOCOL') {
    return (
      <div className="w-full font-sans animate-fade-in mt-3">
        {!canModifyReception && (
          <style>{`
            .lock-submit-btn button[type="submit"] { display: none !important; }
            .lock-upload #file-upload-input { display: none !important; }
          `}</style>
        )}
        <div className="bg-white p-5 md:p-8 rounded-2xl border border-stone-200 shadow-sm lock-submit-btn lock-upload">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-stone-150">
            <h3 className="font-extrabold text-stone-900 text-lg uppercase tracking-tight">Lập Biên bản Tiếp nhận Hồ sơ Xe</h3>
            <button
              onClick={() => setViewMode('BROWSE')}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 border border-stone-300 rounded-lg transition-all cursor-pointer"
            >
              Hủy tác vụ
            </button>
          </div>
          <ReceiveForm
            initialPlate={notFoundPlate || lastSearchedPlate}
            existingVehicle={selectedVehicle}
            onCancel={() => setViewMode('BROWSE')}
            onSaveSuccess={handleSaveSuccess}
            saveLogFn={async (v, h) => {
              if (!canModifyReception) {
                alert('Bạn chỉ có quyền xem dữ liệu.');
                return;
              }
              return dbService.saveRepairLog(v, h);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans animate-fade-in mt-3">
      {/* Left Side: Create action button config or active create form */}
      <div className="lg:col-span-4 lg:sticky lg:top-4 space-y-4">
        {/* Dynamic Secondary Sub-tabs for Dossier Attachments */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-stone-150 pb-2">
            <FolderOpen className="h-4.5 w-4.5 text-emerald-800" />
            <h4 className="font-extrabold text-stone-950 text-xs tracking-wider uppercase">Tài liệu hồ sơ đính kèm</h4>
          </div>
          
          {selectedVehicle && (
            <div className="text-[10px] text-stone-400 font-sans leading-relaxed border-b border-dashed border-stone-150 pb-2">
              Kèm theo xe đang chọn: <strong className="text-emerald-800 font-mono">{selectedVehicle.plateNumber}</strong>
            </div>
          )}

          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-stone-400" />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu theo số xe..."
              value={docSearchQuery}
              onChange={(e) => setDocSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder:font-normal text-stone-800"
            />
          </div>

          <div className="flex flex-col gap-2 font-sans">
            <button
              id="subtab-repair-order"
              onClick={() => setActiveDocSubTab(activeDocSubTab === 'REPAIR_ORDER' ? null : 'REPAIR_ORDER')}
              className={`w-full flex items-center justify-between py-2.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-left ${
                activeDocSubTab === 'REPAIR_ORDER'
                  ? 'bg-emerald-800 text-white border-emerald-950 shadow-md'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-emerald-50/50 hover:text-emerald-900 hover:border-emerald-250'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">Lệnh sửa chữa</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${activeDocSubTab === 'REPAIR_ORDER' ? 'bg-white text-emerald-900' : 'bg-stone-200 text-stone-600'}`}>
                {countFiles('REPAIR_ORDER')}
              </span>
            </button>

            <button
              id="subtab-vehicle-papers"
              onClick={() => setActiveDocSubTab(activeDocSubTab === 'VEHICLE_PAPERS' ? null : 'VEHICLE_PAPERS')}
              className={`w-full flex items-center justify-between py-2.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-left ${
                activeDocSubTab === 'VEHICLE_PAPERS'
                  ? 'bg-emerald-800 text-white border-emerald-950 shadow-md'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-emerald-50/50 hover:text-emerald-900 hover:border-emerald-250'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">Giấy tờ xe</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${activeDocSubTab === 'VEHICLE_PAPERS' ? 'bg-white text-emerald-900' : 'bg-stone-200 text-stone-600'}`}>
                {countFiles('VEHICLE_PAPERS')}
              </span>
            </button>

            <button
              id="subtab-intro-letter"
              onClick={() => setActiveDocSubTab(activeDocSubTab === 'INTRO_LETTER' ? null : 'INTRO_LETTER')}
              className={`w-full flex items-center justify-between py-2.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-left ${
                activeDocSubTab === 'INTRO_LETTER'
                  ? 'bg-emerald-800 text-white border-emerald-950 shadow-md'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-emerald-50/50 hover:text-emerald-900 hover:border-emerald-250'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">Giấy giới thiệu</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${activeDocSubTab === 'INTRO_LETTER' ? 'bg-white text-emerald-900' : 'bg-stone-200 text-stone-600'}`}>
                {countFiles('INTRO_LETTER')}
              </span>
            </button>

            <button
              id="subtab-tech-inspection"
              onClick={() => setActiveDocSubTab(activeDocSubTab === 'TECH_INSPECTION' ? null : 'TECH_INSPECTION')}
              className={`w-full flex items-center justify-between py-2.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-left ${
                activeDocSubTab === 'TECH_INSPECTION'
                  ? 'bg-emerald-800 text-white border-emerald-950 shadow-md'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-emerald-50/50 hover:text-emerald-900 hover:border-emerald-250'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">Biên bản kiểm tra Kỹ thuật xe-máy</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${activeDocSubTab === 'TECH_INSPECTION' ? 'bg-white text-emerald-900' : 'bg-stone-200 text-stone-600'}`}>
                {countFiles('TECH_INSPECTION')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Side: Displays received folder/dossiers list or selected dossier details */}
      <div className="lg:col-span-8 space-y-6">
        {(activeDocSubTab || docSearchQuery.trim()) ? (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden animate-fade-in p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-150 pb-4">
              <div>
                <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest mb-0.5">
                  {docSearchQuery.trim() ? 'Tìm kiếm' : (selectedVehicle ? `Hồ sơ đính kèm của xe: ${selectedVehicle.plateNumber}` : 'Hồ sơ tài liệu dùng chung')}
                </div>
                <h3 className="font-extrabold text-stone-900 text-base md:text-lg flex items-center gap-2.5 uppercase tracking-tight">
                  {docSearchQuery.trim() ? <Search className="h-5.5 w-5.5 text-emerald-800" /> : <FolderOpen className="h-5.5 w-5.5 text-emerald-800" />}
                  <span>
                    {docSearchQuery.trim() 
                      ? `Kết quả tìm kiếm cho: "${docSearchQuery.trim()}"`
                      : activeDocSubTab === 'REPAIR_ORDER' 
                      ? 'Biên mục: Lệnh sửa chữa' 
                      : activeDocSubTab === 'VEHICLE_PAPERS' 
                      ? 'Biên mục: Giấy tờ xe' 
                      : activeDocSubTab === 'INTRO_LETTER'
                      ? 'Biên mục: Giấy giới thiệu'
                      : 'Biên mục: Biên bản kiểm tra Kỹ thuật xe-máy'}
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                     setActiveDocSubTab(null);
                     setDocSearchQuery('');
                     // If they want to return completely to the main menu screen
                     // we could also clear the selected vehicle, but let's just 
                     // clear the document sub tab which is the standard "back" behavior
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 border border-stone-300 rounded-lg transition-all cursor-pointer"
                >
                  <span>← Quay lại menu màn hình</span>
                </button>
                <button
                  onClick={() => {
                     setActiveDocSubTab(null);
                     setDocSearchQuery('');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-all cursor-pointer"
                  title="Đóng"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Drag and Drop Zone - Only show when a specific subtab is selected */}
            {activeDocSubTab && canModifyReception && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files) {
                    addFiles(Array.from(e.dataTransfer.files) as File[]);
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
                  dragOver 
                    ? 'border-emerald-600 bg-emerald-50/40' 
                    : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50 hover:border-emerald-500/50'
                }`}
                onClick={() => document.getElementById('file-upload-input')?.click()}
              >
                <input
                  type="file"
                  id="file-upload-input"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <UploadCloud className="h-10 w-10 text-stone-400" />
                <div className="space-y-1">
                  <p className="text-xs font-extrabold text-stone-800">Kéo thả tệp hoặc nhấp để chọn tệp tài liệu tải lên</p>
                  <p className="text-[11px] text-stone-500">Hỗ trợ các định dạng: Ảnh (jpeg, png, gif), Word (docx), Excel (xlsx), PDF</p>
                </div>
              </div>
            )}

            {/* List of files */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h4 className="text-xs font-bold text-stone-550 uppercase tracking-wider">
                  {docSearchQuery.trim() ? `Tài liệu tìm thấy (${uploadedFiles.length})` : `Danh mục tệp đính kèm (${uploadedFiles.length})`}
                </h4>
                {uploadedFiles.length > 0 && !docSearchQuery.trim() && canModifyReception && (
                  <button
                    onClick={async () => {
                      if (window.confirm("Bộ kiểm xe: Bạn chắc chắn muốn xóa tất cả tài liệu hiện tại?")) {
                         const currentUser = getCurrentUserSession();
                         for (const file of uploadedFiles) {
                             try {
                                 await updateDoc(doc(db, 'uploaded_files', file.id), {
                                   isDeleted: true,
                                   deletedAt: new Date().toISOString(),
                                   deletedBy: currentUser?.uid || "unknown",
                                   deletedByName: currentUser?.fullName || currentUser?.username || "Người dùng",
                                   deletedByRole: currentUser?.role || "Không xác định"
                                 });
                             } catch(e) {}
                         }
                         setUploadedFiles([]);
                         setAllFiles([]);
                      }
                    }}
                    className="text-[10px] text-red-650 hover:text-red-800 font-bold transition-colors cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {uploadedFiles.length === 0 ? (
                <div className="text-center py-12 bg-stone-50/60 border border-stone-150 rounded-xl text-stone-400 text-xs">
                  Không tìm thấy tài liệu phù hợp. Vui lòng kéo thả hoặc click chọn tệp phía trên để bổ sung.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uploadedFiles.map((file) => (
                    <div 
                      key={file.id} 
                      className="p-3.5 bg-white border border-stone-200 rounded-xl hover:border-emerald-500/30 hover:shadow-sm transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          file.type === 'image' 
                            ? 'bg-blue-50 text-blue-700 border-blue-100' 
                            : file.type === 'excel'
                            ? 'bg-emerald-50 text-emerald-850 border-emerald-100'
                            : file.type === 'pdf'
                            ? 'bg-red-50 text-red-700 border-red-100'
                            : 'bg-stone-50 text-stone-600 border-stone-200'
                        }`}>
                          {file.type === 'image' ? (
                            <Image className="h-5 w-5" />
                          ) : file.type === 'excel' ? (
                            <FileSpreadsheet className="h-5 w-5" />
                          ) : (
                            <FileText className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-stone-800 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-[10px] text-stone-400 mt-0.5 font-mono flex items-center gap-1.5">
                            <span>{file.size}</span>
                            <span>•</span>
                            <span>{file.uploadedAt}</span>
                          </p>
                          <p className="text-[10px] text-stone-500 mt-1">
                            Người tải lên: <span className="font-semibold">{file.uploadedByUsername === 'admin' ? 'Lê Phương Đông' : (file.uploadedByFullName || file.uploadedByUsername || file.uploadedBy || 'Không xác định')}</span>
                          </p>
                          <p className="text-[10px] text-stone-500 mt-0.5">
                            Vai trò: <span className="font-medium text-stone-600">{file.uploadedByRole || 'Không xác định'}</span>
                            {file.plateNumber && (
                              <span className="ml-2 text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                Xe: {file.plateNumber}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0 opacity-80 md:opacity-0 group-hover:opacity-100 transition-all">
                        {file.url && (
                          <button
                            onClick={() => {
                              setPreviewFile(file);
                              setZoomLevel(100);
                            }}
                            className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = file.url || '#';
                            link.download = file.name;
                            link.click();
                          }}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition-colors cursor-pointer"
                          title="Tải về máy"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-150 text-red-650 rounded-lg transition-colors cursor-pointer"
                            title="Xóa tệp"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview Section */}
            {previewFile && (
              <div className="border border-emerald-800 bg-stone-900 text-white rounded-2xl p-4 md:p-5 relative animate-fade-in space-y-3">
                <div className="flex items-center justify-between border-b border-stone-850 pb-2">
                  <div className="flex items-center gap-2 text-xs text-stone-300 font-mono font-bold">
                    <span className="text-yellow-500 animate-pulse">&#x25CF;</span>
                    <span>BẢN TRỰC QUAN: {previewFile.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-stone-800 rounded-lg border border-stone-700 p-0.5">
                      <button
                        onClick={() => setZoomLevel(z => Math.max(z - 25, 25))}
                        className="p-1 px-2 text-stone-300 hover:text-white hover:bg-stone-700 rounded transition-colors cursor-pointer"
                        title="Thu nhỏ"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </button>
                      <span className="text-xs font-mono text-stone-300 w-12 text-center">{zoomLevel}%</span>
                      <button
                        onClick={() => setZoomLevel(z => Math.min(z + 25, 500))}
                        className="p-1 px-2 text-stone-300 hover:text-white hover:bg-stone-700 rounded transition-colors cursor-pointer"
                        title="Phóng to"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => setPreviewFile(null)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-lg transition-colors cursor-pointer border border-stone-700"
                    >
                      <span>← Quay lại danh sách</span>
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center p-6 bg-stone-950 rounded-xl min-h-[300px] border border-stone-850 overflow-auto">
                  {previewFile.type === 'image' ? (
                    <div className="w-full flex justify-center p-4">
                      <img 
                        src={previewFile.url} 
                        alt={previewFile.name} 
                        className="object-contain rounded-lg border border-stone-800 transition-transform duration-200 ease-out origin-top"
                        style={{ transform: `scale(${zoomLevel / 100})`, maxWidth: '100%' }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="text-center p-8 space-y-3 max-w-md">
                      <File className="h-14 w-14 mx-auto text-yellow-500 animate-bounce" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold">{previewFile.name}</p>
                        <p className="text-[11px] text-stone-400">Tài liệu định dạng đã được mã hóa an toàn ở bộ nhớ đệm cơ khí.</p>
                      </div>
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = previewFile.url || '#';
                          link.download = previewFile.name;
                          link.click();
                        }}
                        className="px-1 sm:px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow inline-flex items-center gap-2"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Tải xuống tệp và đọc</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : selectedVehicle ? (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between bg-white px-5 py-2 sm:py-3 rounded-xl border border-stone-200 shadow-sm">
              <span className="text-xs text-stone-500 font-medium font-sans">
                Đang hiển thị lý lý cơ học: <strong className="text-emerald-800 font-mono text-sm">{selectedVehicle.plateNumber}</strong>
              </span>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-stone-105 hover:bg-stone-200 text-stone-700 hover:text-stone-900 border border-stone-300 rounded-lg transition-all cursor-pointer"
              >
                ← Danh sách hồ sơ
              </button>
            </div>

            <VehicleProfileCard vehicle={selectedVehicle} />

            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-stone-150 pb-3">
                <ClipboardList className="h-5 w-5 text-emerald-800" />
                <h4 className="font-bold text-stone-900 text-sm tracking-tight uppercase">Lập biên bảo giao nhận ({repairHistory.length})</h4>
              </div>

              <HistoryTimeline history={repairHistory} onDeleteHistory={handleDeleteHistory} />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-emerald-950 to-emerald-900 px-6 py-2 sm:py-4 flex items-center justify-between text-white border-b border-emerald-800">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-yellow-500" />
                <h3 className="font-bold text-sm md:text-base tracking-tight uppercase">Danh mục hồ sơ xe đã tiếp nhận ({savedVehicles.length})</h3>
              </div>
            </div>

            {savedVehicles.length === 0 ? (
              <div className="p-12 text-center text-stone-500">
                Chưa có hồ sơ xe nào được tiếp nhận trong cơ sở dữ liệu. Vui lòng tạo mới cơ bản ở khung bên trái.
              </div>
            ) : (
              <div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 text-xs font-bold font-sans">
                      <th className="p-4">Biển số đăng ký</th>
                      <th className="p-4">Dòng xe / Nhãn hiệu</th>
                      <th className="p-4">Đơn vị sử dụng</th>
                      <th className="p-4">Số khung / Số máy</th>
                      <th className="p-4">Người lập hồ sơ</th>
                      <th className="p-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-150 text-sm">
                    {savedVehicles.map((v) => (
                      <tr 
                        key={v.vehicleId || v.plateNumber} 
                        className="hover:bg-emerald-50/45 transition-colors border-b border-stone-150 text-stone-800 font-sans"
                      >
                        <td className="p-4 font-mono font-bold text-emerald-900 text-sm">
                          {v.plateNumber}
                        </td>
                        <td className="p-4 font-semibold text-stone-900">
                          {v.brand || '---'}
                        </td>
                        <td className="p-4">
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-1 rounded text-xs font-semibold">
                            {v.createdByUnit || 'Tiểu đoàn 30'}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-[11px] text-stone-500">
                          <div className="flex flex-col gap-0.5">
                            <div><span className="text-stone-400 font-sans">Số khung:</span> {v.chassisNumber || '---'}</div>
                            <div><span className="text-stone-400 font-sans">Số máy:</span> {v.engineNumber || '---'}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-stone-700">{(v as any).createdByName || 'Nguyễn Văn A'}</div>
                          <div className="text-[10px] text-stone-400">{(v as any).createdByRank || 'Thiếu tá'} - {(v as any).createdByUnit || 'Tiểu đoàn 30'}</div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={async () => {
                                await handleSearch(v.plateNumber);
                              }}
                              className="bg-emerald-850 hover:bg-emerald-950 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5 border border-emerald-900"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span>Xem lý lịch quân bạ</span>
                            </button>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await handleDeleteVehicle(v.vehicleId || v.plateNumber);
                                }}
                                className="bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-stone-800 text-xs font-bold px-3 py-2 rounded-xl border border-stone-200 shadow-sm transition-all cursor-pointer inline-flex items-center gap-1"
                                title="Xóa khỏi phiên làm việc (Session)"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-stone-500" />
                                <span>Xóa</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
