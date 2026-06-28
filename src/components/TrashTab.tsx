import React, { useState, useEffect } from 'react';
import { RefreshCw, RotateCcw, AlertTriangle, FileText, Trash2, Eye, X, ArrowLeft } from 'lucide-react';
import { dbService } from '../services/dbService';
import { getCurrentUserSession } from '../services/dbService';
import { logger } from '../utils/logger';
import { formatVNTime } from '../utils/time';

import { ReceiveForm } from './ReceiveForm';
import { DamageProtocolForm } from './DamageProtocolForm';
import { MilitaryInspectionForm } from './MilitaryInspectionForm';
import { EngineInspectionBeforeRepairForm } from './EngineInspectionBeforeRepairForm';
import { BodyInspectionBeforeRepairForm } from './BodyInspectionBeforeRepairForm';
import { InteriorInspectionBeforeRepairForm } from './InteriorInspectionBeforeRepairForm';
import { GeneralDisassemblyRepairForm } from './GeneralDisassemblyRepairForm';
import { EngineComponentDisassemblyForm } from './EngineComponentDisassemblyForm';
import { PartsCleaningRepairForm } from './PartsCleaningRepairForm';
import { EngineComponentRepairForm } from './EngineComponentRepairForm';
import { PaintInspectionBeforeRepairForm } from './PaintInspectionBeforeRepairForm';
import { TaskPlanForm } from './TaskPlanForm';
import { TaskReportForm } from './TaskReportForm';

interface TrashTabProps {
  onBack: () => void;
}

const getRoleLabel = (role: string | undefined | null): string => {
  if (!role) return 'Không xác định';
  const roleMap: Record<string, string> = {
    'dai_doi_truong': 'Đại đội trưởng',
    'pho_dai_doi_truong': 'Phó Đại đội trưởng',
    'trung_doi_truong': 'Trung đội trưởng',
    'to_truong': 'Tổ trưởng',
    'kcs': 'Nhân viên KCS',
    'tro_ly_ky_thuat': 'Trợ lý kỹ thuật'
  };
  return roleMap[role] || role;
};

const TrashItemViewer = ({ item, onClose, onRestore }: { item: any, onClose: () => void, onRestore: () => void }) => {
  const currentUser = getCurrentUserSession();
  let formContent = null;

  if (!item) return null;

  if (item.type === 'VEHICLE') {
    formContent = <ReceiveForm existingVehicle={item} initialPlate={item.plateNumber} onCancel={onClose} onSaveSuccess={() => {}} saveLogFn={async () => {}} />
  } else if (item.type === 'DAMAGE_PROTOCOL') {
    formContent = <DamageProtocolForm initialProtocol={item} vehicle={null} onCancel={onClose} onSave={async () => {}} />
  } else if (item.type === 'INSPECTION_FORM') {
    formContent = <MilitaryInspectionForm initialForm={item} vehicle={null} onClose={onClose} onSave={() => {}} />
  } else if (item.templateType === 'BODY_PRE_REPAIR') {
    formContent = <BodyInspectionBeforeRepairForm initialData={item} existingFormId={item.id} onClose={onClose} />
  } else if (item.templateType === 'INTERIOR_PRE_REPAIR') {
    formContent = <InteriorInspectionBeforeRepairForm initialData={item} existingFormId={item.id} onClose={onClose} />
  } else if (item.templateType === 'GENERAL_DISASSEMBLY_REPAIR') {
    formContent = <GeneralDisassemblyRepairForm initialData={item} existingFormId={item.id} onClose={onClose} />
  } else if (item.templateType === 'ENGINE_COMPONENT_DISASSEMBLY') {
    formContent = <EngineComponentDisassemblyForm initialData={item} existingFormId={item.id} onClose={onClose} />
  } else if (item.templateType === 'PARTS_CLEANING_REPAIR') {
    formContent = <PartsCleaningRepairForm initialData={item} existingFormId={item.id} onClose={onClose} />
  } else if (item.templateType === 'ENGINE_COMPONENT_REPAIR') {
    formContent = <EngineComponentRepairForm initialData={item} existingFormId={item.id} onClose={onClose} />
  } else if (item.templateType === 'PAINT_PRE_REPAIR') {
    formContent = <PaintInspectionBeforeRepairForm initialData={item} existingFormId={item.id} onClose={onClose} />
  } else if (item.templateType === 'ENGINE_PRE_REPAIR' || item.type === 'REPAIR_FORM') {
    if (item.templateType === 'TASK_PLAN') {
      formContent = <TaskPlanForm initialData={item} existingFormId={item.id} onClose={onClose} />
    } else if (item.templateType === 'TASK_REPORT') {
      formContent = <TaskReportForm initialData={item} existingFormId={item.id} onClose={onClose} />
    } else {
      formContent = <EngineInspectionBeforeRepairForm initialData={item} existingFormId={item.id} onClose={onClose} />
    }
  } else {
    formContent = (
      <div className="p-8 text-center text-stone-500">
        <p>Không có giao diện xem trước cho loại tài liệu này.</p>
        <pre className="mt-4 p-4 bg-stone-100 rounded text-left text-xs overflow-auto h-48">{JSON.stringify(item, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative trash-viewer-overlay">
        <style>{`
          /* Prevent inner form from covering the viewer overlay */
          .inner-form-wrapper > div {
             position: relative !important;
             inset: auto !important;
             z-index: 1 !important;
             height: 100% !important;
             display: flex !important;
             flex-direction: column !important;
             background: transparent !important;
          }

          /* Hide inner buttons */
          .inner-form-wrapper button {
            display: none !important;
          }
          
          /* Disable inputs */
          .inner-form-wrapper input,
          .inner-form-wrapper textarea,
          .inner-form-wrapper select {
            pointer-events: none !important;
            border-color: transparent !important;
            background-color: transparent !important;
            color: inherit !important;
            resize: none !important;
          }
           .inner-form-wrapper .lucide-trash-2,
           .inner-form-wrapper .lucide-plus,
           .inner-form-wrapper .lucide-save,
           .inner-form-wrapper .lucide-pencil {
             display: none !important;
           }
        `}</style>
        
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 sm:py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <span className="font-bold text-amber-900">Tài liệu này đang nằm trong Thùng rác</span>
              <p className="text-xs text-amber-700 font-medium">Chế độ xem (Chỉ đọc). Các thuộc tính có thể không đầy đủ.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 trash-viewer-actions pointer-events-auto">
            {currentUser?.role === 'admin' && (
              <button onClick={onRestore} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-sm font-bold transition-all shadow-sm">
                <RotateCcw className="h-4 w-4" />
                Khôi phục
              </button>
            )}
            <button onClick={onClose} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-sm font-bold transition-all">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto bg-stone-50/50 p-0 sm:p-2">
           <div className="inner-form-wrapper pointer-events-auto h-full">
              {formContent}
           </div>
        </div>
      </div>
    </div>
  );
};

export const TrashTab = ({ onBack }: TrashTabProps) => {
  const [deletedItems, setDeletedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [searchDeletedBy, setSearchDeletedBy] = useState('');
  const currentUser = getCurrentUserSession();
  const isAdmin = currentUser && ['admin'].includes(currentUser.role);

  const loadDeleted = async () => {
    setIsLoading(true);
    try {
      const items = await dbService.getSystemTrash();
      setDeletedItems(items);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeleted();
  }, []);

  const handleRestore = async (id: string, type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await dbService.restoreTrashItem(id, type);
      setDeletedItems((prev) => prev.filter((p) => p.id !== id));
      logger.success("Đã khôi phục dữ liệu.");
    } catch (error) {
      logger.error("Không thể khôi phục dữ liệu.", error);
    }
  };

  const handlePermanentDelete = async (id: string, type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    if (window.confirm("CẢNH BÁO: Dữ liệu bị xóa vĩnh viễn không thể khôi phục. Bạn có chắc chắn muốn xóa?")) {
      try {
        await dbService.permanentDeleteTrashItem(id, type);
        setDeletedItems((prev) => prev.filter((p) => p.id !== id));
        logger.success("Đã xóa dữ liệu vĩnh viễn.");
      } catch (error) {
        logger.error("Không thể xóa vĩnh viễn.", error);
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-1 sm:px-4 w-full flex flex-col items-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-stone-800">Quyền truy cập bị từ chối</h2>
        <p className="text-stone-500 mt-2 mb-6">Chỉ Admin mới có quyền truy cập Thùng rác hệ thống.</p>
        <button onClick={onBack} className="px-6 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg font-bold text-sm">
          Quay lại
        </button>
      </div>
    );
  }

  const filteredItems = deletedItems.filter(item => 
    !searchDeletedBy || 
    (item.deletedByName && item.deletedByName.toLowerCase().includes(searchDeletedBy.toLowerCase())) ||
    (item.deletedBy && typeof item.deletedBy === 'string' && item.deletedBy.toLowerCase().includes(searchDeletedBy.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-1 sm:px-4 w-full animate-fade-in font-sans">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-200">
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
            Thùng rác hệ thống
          </h2>
          <p className="text-sm text-stone-500 font-medium mt-1">Quản lý và khôi phục các dữ liệu đã xóa trên toàn hệ thống</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadDeleted}
            className="flex items-center gap-2 px-1 sm:px-4 py-2 hover:bg-stone-200 text-stone-700 rounded-xl transition-all cursor-pointer font-bold text-sm bg-stone-100 shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Làm mới</span>
          </button>
          <button
            onClick={onBack}
            className="flex items-center justify-center gap-2 px-5 py-2 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-xl transition-all cursor-pointer font-bold text-sm bg-white shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-3 items-center">
         <input 
           type="text" 
           placeholder="Tìm theo người xóa..." 
           value={searchDeletedBy}
           onChange={(e) => setSearchDeletedBy(e.target.value)}
           className="px-1 sm:px-4 py-2 rounded-xl border border-stone-200 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all outline-none text-sm w-64 bg-white"
         />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-stone-500 text-sm font-medium flex flex-col items-center">
            <RefreshCw className="h-6 w-6 animate-spin text-stone-300 mb-3" />
            Đang tải dữ liệu...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-stone-500 flex flex-col items-center">
            <div className="h-16 w-16 bg-stone-100 rounded-full flex items-center justify-center mb-4 text-stone-400">
              <FileText className="h-8 w-8" />
            </div>
            <p className="font-bold text-stone-700 text-base mb-1">Thùng rác trống</p>
            <p className="text-sm">Không có dữ liệu nào bị xóa.</p>
          </div>
        ) : (
          <div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="px-5 py-2 sm:py-3 text-xs font-black text-stone-500 uppercase tracking-wider">Tên dữ liệu</th>
                  <th className="px-5 py-2 sm:py-3 text-xs font-black text-stone-500 uppercase tracking-wider">Loại dữ liệu</th>
                  <th className="px-5 py-2 sm:py-3 text-xs font-black text-stone-500 uppercase tracking-wider">Người xóa</th>
                  <th className="px-5 py-2 sm:py-3 text-xs font-black text-stone-500 uppercase tracking-wider">Ngày xóa</th>
                  <th className="px-5 py-2 sm:py-3 text-right text-xs font-black text-stone-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150">
                {filteredItems.map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-5 py-2 sm:py-4 font-bold text-sm text-stone-900">
                      {item.name}
                    </td>
                    <td className="px-5 py-2 sm:py-4 text-sm font-medium text-stone-600">
                      <span className="px-2.5 py-1 bg-stone-100 rounded text-stone-600 font-bold text-xs">{item.typeName}</span>
                    </td>
                    <td className="px-5 py-2 sm:py-4 text-sm">
                      <div className="font-bold text-stone-900 whitespace-normal">
                        Người xóa: {item.deletedByName || item.deletedBy || 'Không rõ'}
                      </div>
                      <div className="text-xs text-stone-500 font-medium whitespace-normal mt-0.5">
                        Chức vụ: {getRoleLabel(item.deletedByRole)}
                      </div>
                    </td>
                    <td className="px-5 py-2 sm:py-4 text-sm font-medium text-stone-500">
                      {formatVNTime(item.deletedAt) || "Không rõ"}
                    </td>
                    <td className="px-5 py-2 sm:py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingItem(item);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          title="Xem"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Xem</span>
                        </button>
                        {currentUser?.role === 'admin' && (
                          <button
                            onClick={(e) => handleRestore(item.id, item.type, e)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            title="Khôi phục"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Khôi phục</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => handlePermanentDelete(item.id, item.type, e)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          title="Xóa vĩnh viễn"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Xóa vĩnh viễn</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {viewingItem && (
        <TrashItemViewer 
          item={viewingItem} 
          onClose={() => setViewingItem(null)} 
          onRestore={() => {
            handleRestore(viewingItem.id, viewingItem.type, { stopPropagation: () => {} } as any);
            setViewingItem(null);
          }} 
        />
      )}
    </div>
  );
};
