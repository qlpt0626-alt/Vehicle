import React, { useState, useEffect } from 'react';
import { Calendar, FileCheck, Search, PlusCircle, LayoutDashboard, FileText, Trash2, X, Filter } from 'lucide-react';
import { TaskPlanForm } from './TaskPlanForm';
import { TaskReportForm } from './TaskReportForm';
import { DataService } from '../firebase';
import { getCurrentUserSession } from '../services/dbService';
import { formatVNTime, parseDate } from '../utils/time';

import { getModuleForTemplateType } from '../utils/formModules';
import { canEditModule } from '../services/permissionService';
import { userService } from '../services/userService';

const formatDateObj = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export function OperationsTab() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'PLAN' | 'REPORT'>('ALL');
  
  const [operationsData, setOperationsData] = useState<any[]>([]);

  const [showTaskPlanForm, setShowTaskPlanForm] = useState(false);
  const [activeTaskPlanId, setActiveTaskPlanId] = useState<string | undefined>(undefined);

  const [showTaskReportForm, setShowTaskReportForm] = useState(false);
  const [activeTaskReportId, setActiveTaskReportId] = useState<string | undefined>(undefined);

  // Filters State
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');
  const [appliedFilterType, setAppliedFilterType] = useState('ALL');

  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  useEffect(() => {
    loadOperations();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const users = await userService.loadUsers();
      const map: Record<string, string> = {};
      users.forEach(u => {
        map[u.uid] = u.fullName || u.username;
        if (u.username) map[u.username] = u.fullName || u.username;
      });
      setUsersMap(map);
    } catch (err) {
      console.warn("Could not load users for map:", err);
    }
  };

  const loadOperations = async () => {
    try {
      let localPlans: any[] = [];
      let localReports: any[] = [];
      try {
        localPlans = JSON.parse(localStorage.getItem('local_TASK_PLAN') || '[]');
      } catch (e) {}
      try {
        localReports = JSON.parse(localStorage.getItem('local_TASK_REPORT') || '[]');
      } catch (e) {}
      
      const combinedMap = new Map();
      [...localPlans, ...localReports].forEach((f: any) => {
        if (f && f.id) combinedMap.set(f.id, f);
      });

      try {
        const dbForms = await DataService.load('repairForms');
        if (Array.isArray(dbForms)) {
          dbForms.forEach((dbF: any) => {
            const actualModule = dbF.module || getModuleForTemplateType(dbF.templateType);
            if (actualModule === 'OPERATIONS') {
              const localItem = combinedMap.get(dbF.id);
              const isDeletedLocally = localItem && (localItem.isDeleted === true || localItem.isDeleted === 'true');
              if (!isDeletedLocally) {
                if (combinedMap.has(dbF.id)) {
                  combinedMap.set(dbF.id, { ...combinedMap.get(dbF.id), ...dbF });
                } else {
                  combinedMap.set(dbF.id, dbF);
                }
              }
            }
          });
        }
      } catch (e) {}

      const mergedForms = Array.from(combinedMap.values());
      const filteredForms = mergedForms.filter((f: any) => {
        const actualModule = f.module || getModuleForTemplateType(f.templateType);
        return actualModule === 'OPERATIONS' &&
               f.isDeleted !== true &&
               f.isDeleted !== 'true';
      });

      setOperationsData(filteredForms);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyFilter = () => {
    setAppliedStartDate(filterStartDate);
    setAppliedEndDate(filterEndDate);
    setAppliedFilterType(filterType);
    
    // Sync sidebar active tab based on filter type for consistency
    if (filterType === 'ALL') setActiveTab('ALL');
    else if (filterType === 'TASK_PLAN') setActiveTab('PLAN');
    else if (filterType === 'TASK_REPORT') setActiveTab('REPORT');
  };

  const handleClearFilter = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterType('ALL');
    
    setAppliedStartDate('');
    setAppliedEndDate('');
    setAppliedFilterType('ALL');
    setActiveTab('ALL');
  };

  const setQuickFilter = (type: string) => {
    const today = new Date();
    let start = new Date(today);
    let end = new Date(today);
    
    if (type === 'TODAY') {
      // already today
    } else if (type === 'THIS_WEEK') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(today.setDate(diff));
      end = new Date(start);
      end.setDate(end.getDate() + 6);
    } else if (type === 'THIS_MONTH') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (type === 'THIS_YEAR') {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
    }

    setFilterStartDate(formatDateObj(start));
    setFilterEndDate(formatDateObj(end));
  };

  const handleDeleteForm = async (e: React.MouseEvent, formId: string, templateType: string) => {
    e.stopPropagation();

    const currentUser = getCurrentUserSession();
    
    const formRecord = operationsData.find(f => f.id === formId);
    const isAdmin = currentUser?.role === 'admin';
    const isOwner = !!currentUser && !!formRecord && (formRecord.createdBy === currentUser.uid || formRecord.createdBy === currentUser.username);

    if (!isAdmin && !isOwner) {
      alert('Bạn chỉ có quyền xóa hồ sơ do mình tạo.');
      return;
    }

    const canEdit = currentUser ? canEditModule(currentUser.role, 'OPERATIONS') : false;
    if (!canEdit) {
      alert('Bạn không có quyền thực hiện thao tác này.');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn xóa hồ sơ này?')) return;

    try {
      const currentUser = getCurrentUserSession();
      const storeKey = templateType === 'TASK_PLAN' ? `local_TASK_PLAN` : `local_TASK_REPORT`;

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
        (item: any) => item.id && formId && String(item.id).trim().toLowerCase() === String(formId).trim().toLowerCase()
      );
      
      const updateData = {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.uid || currentUser?.username || "unknown",
          deletedByName: currentUser?.fullName || currentUser?.username || "Người dùng",
          deletedByRole: currentUser?.role || "Không xác định",
      };

      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...updateData };
      } else {
        const existingInState = operationsData.find((f) => f.id === formId);
        list.push({
          ...(existingInState || {}),
          id: formId,
          module: "OPERATIONS",
          templateType,
          ...updateData
        });
      }
      localStorage.setItem(storeKey, JSON.stringify(list));

      // Optimistic update
      setOperationsData(prev => prev.filter((f) => f.id !== formId));

      try {
        await DataService.update("repairForms", formId, updateData);
      } catch (err) {}

      loadOperations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSidebarClick = (tabId: 'ALL' | 'PLAN' | 'REPORT') => {
    setActiveTab(tabId);
    let newFilterType = 'ALL';
    if (tabId === 'PLAN') newFilterType = 'TASK_PLAN';
    if (tabId === 'REPORT') newFilterType = 'TASK_REPORT';

    setFilterType(newFilterType);
    setAppliedFilterType(newFilterType);
  };

  // Filter Data
  const getFilteredData = () => {
    let invalidCreatedAtCount = 0;

    const filtered = operationsData.filter(form => {
      // Type Filter
      if (appliedFilterType !== 'ALL' && form.templateType !== appliedFilterType) return false;
      
      const parsedDate = parseDate(form.createdAt);
      const isInvalidDate = !parsedDate;
      if (isInvalidDate) {
        invalidCreatedAtCount++;
      }

      // Date Filter
      if (appliedStartDate || appliedEndDate) {
        if (isInvalidDate || !parsedDate) return false;
        
        const formDateStr = parsedDate.toISOString().split('T')[0];
        
        if (appliedStartDate && formDateStr < appliedStartDate) return false;
        if (appliedEndDate && formDateStr > appliedEndDate) return false;
      }
      return true;
    }).sort((a: any, b: any) => {
      const dateA = parseDate(a.updatedAt || a.createdAt);
      const dateB = parseDate(b.updatedAt || b.createdAt);
      const timeA = dateA ? dateA.getTime() : 0;
      const timeB = dateB ? dateB.getTime() : 0;
      return timeB - timeA;
    });

    return { filtered, invalidCreatedAtCount };
  };

  const { filtered: displayedForms, invalidCreatedAtCount } = getFilteredData();

  useEffect(() => {
    if (invalidCreatedAtCount > 0) {
      console.warn(`Phát hiện ${invalidCreatedAtCount} hồ sơ có createdAt không hợp lệ`);
    }
  }, [invalidCreatedAtCount]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans animate-fade-in mt-3">
      {/* Sidebar */}
      <div className="lg:col-span-3 xl:col-span-3 lg:sticky lg:top-4 space-y-4">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 md:p-5 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-stone-150 pb-3 mb-4">
            <LayoutDashboard className="h-5 w-5 text-emerald-700" />
            <h3 className="font-bold text-stone-900 text-sm tracking-tight uppercase">
              Điều hành công việc
            </h3>
          </div>

          <div className="space-y-3">
            <div 
              className={`p-3 rounded-xl border transition-all cursor-pointer ${activeTab === 'ALL' ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-stone-50 border-stone-200 hover:border-emerald-300 hover:bg-white'}`}
              onClick={() => handleSidebarClick('ALL')}
            >
              <div className="flex items-center gap-2">
                <FileText className={`h-5 w-5 ${activeTab === 'ALL' ? 'text-emerald-700' : 'text-stone-400'}`} />
                <div>
                  <h5 className={`font-bold text-sm ${activeTab === 'ALL' ? 'text-emerald-800' : 'text-stone-700'}`}>Tất cả hồ sơ</h5>
                  <p className="text-[11px] text-stone-500 mt-0.5">Hiển thị toàn bộ dữ liệu</p>
                </div>
              </div>
            </div>

            <div 
              className={`p-3 rounded-xl border transition-all cursor-pointer ${activeTab === 'PLAN' ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-stone-50 border-stone-200 hover:border-emerald-300 hover:bg-white'}`}
              onClick={() => handleSidebarClick('PLAN')}
            >
              <div className="flex items-center gap-2">
                <Calendar className={`h-5 w-5 ${activeTab === 'PLAN' ? 'text-emerald-700' : 'text-stone-400'}`} />
                <div>
                  <h5 className={`font-bold text-sm ${activeTab === 'PLAN' ? 'text-emerald-800' : 'text-stone-700'}`}>Kế hoạch nhiệm vụ</h5>
                  <p className="text-[11px] text-stone-500 mt-0.5">Lập kế hoạch công việc</p>
                </div>
              </div>
            </div>

            <div 
              className={`p-3 rounded-xl border transition-all cursor-pointer ${activeTab === 'REPORT' ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-stone-50 border-stone-200 hover:border-emerald-300 hover:bg-white'}`}
              onClick={() => handleSidebarClick('REPORT')}
            >
              <div className="flex items-center gap-2">
                <FileCheck className={`h-5 w-5 ${activeTab === 'REPORT' ? 'text-emerald-700' : 'text-stone-400'}`} />
                <div>
                  <h5 className={`font-bold text-sm ${activeTab === 'REPORT' ? 'text-emerald-800' : 'text-stone-700'}`}>Báo cáo kết quả</h5>
                  <p className="text-[11px] text-stone-500 mt-0.5">Báo cáo thực hiện hàng ngày</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-9 xl:col-span-9 space-y-4">
        
        {/* Filter Section */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4 border-b border-stone-150 pb-3">
            <Filter className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-sm text-stone-900 uppercase tracking-tight">Tìm kiếm & Lọc dữ liệu</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">Loại hồ sơ</label>
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 text-sm rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="ALL">Tất cả</option>
                <option value="TASK_PLAN">Kế hoạch nhiệm vụ</option>
                <option value="TASK_REPORT">Báo cáo kết quả</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">Từ ngày (Theo ngày tạo)</label>
              <input 
                type="date" 
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 text-sm rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">Đến ngày (Theo ngày tạo)</label>
              <input 
                type="date" 
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 text-sm rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-stone-400 uppercase mr-1">Lọc nhanh:</span>
              <button onClick={() => setQuickFilter('TODAY')} className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors">Hôm nay</button>
              <button onClick={() => setQuickFilter('THIS_WEEK')} className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors">Tuần này</button>
              <button onClick={() => setQuickFilter('THIS_MONTH')} className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors">Tháng này</button>
              <button onClick={() => setQuickFilter('THIS_YEAR')} className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors">Năm nay</button>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                onClick={handleClearFilter}
                className="flex-1 sm:flex-none px-4 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Xóa lọc
              </button>
              <button 
                onClick={handleApplyFilter}
                className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Tìm kiếm
              </button>
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 md:p-6 min-h-[400px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-stone-150 pb-4">
            <div>
              <h3 className="font-bold text-stone-900 text-lg uppercase">
                {appliedFilterType === 'ALL' ? 'Tất cả hồ sơ điều hành' : (appliedFilterType === 'TASK_PLAN' ? 'Danh sách Kế hoạch' : 'Danh sách Báo cáo')}
              </h3>
              <p className="text-sm text-stone-500 mt-1">
                Hiển thị {displayedForms.length} kết quả
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                   setActiveTaskPlanId(undefined);
                   setShowTaskPlanForm(true);
                }}
                className="bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 px-3 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 shrink-0"
              >
                <PlusCircle className="h-4 w-4" />
                Kế hoạch
              </button>
              <button 
                onClick={() => {
                   setActiveTaskReportId(undefined);
                   setShowTaskReportForm(true);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
              >
                <PlusCircle className="h-4 w-4" />
                Báo cáo
              </button>
            </div>
          </div>

          {displayedForms.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedForms.map((form) => (
                  <div
                    key={form.id}
                    onClick={() => {
                      if (form.templateType === 'TASK_PLAN') {
                        setActiveTaskPlanId(form.id);
                        setShowTaskPlanForm(true);
                      } else {
                        setActiveTaskReportId(form.id);
                        setShowTaskReportForm(true);
                      }
                    }}
                    className="bg-stone-50 rounded-xl shadow-sm border border-stone-200 p-5 cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group relative"
                  >
                    <button
                      onClick={(e) => handleDeleteForm(e, form.id, form.templateType)}
                      className="absolute top-4 right-4 p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors z-10"
                      title="Xóa hồ sơ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 group-hover:bg-emerald-200 transition-colors">
                        {form.templateType === 'TASK_PLAN' ? <Calendar className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-md mr-7 border ${form.templateType === 'TASK_PLAN' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {form.templateType === 'TASK_PLAN' ? 'KẾ HOẠCH' : 'BÁO CÁO'}
                      </span>
                    </div>
                    <h5 className="font-bold text-emerald-900 mb-1 line-clamp-1 pr-6 uppercase tracking-tight">
                      {form.templateName}
                    </h5>
                    
                    <div className="text-sm text-stone-600 mb-2 font-medium flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase text-stone-400 font-bold bg-white px-1.5 py-0.5 rounded border border-stone-200">
                        N.Tạo: {form.createdAt ? formatVNTime(form.createdAt) : ''}
                      </span>
                      {form.templateType === 'TASK_PLAN' && form.formData?.week && (
                         <span className="text-[10px] uppercase text-stone-400 font-bold bg-white px-1.5 py-0.5 rounded border border-stone-200">Tuần {form.formData.week}</span>
                      )}
                      {form.templateType === 'TASK_PLAN' && form.formData?.year && (
                         <span className="text-[10px] uppercase text-stone-400 font-bold bg-white px-1.5 py-0.5 rounded border border-stone-200">Năm {form.formData.year}</span>
                      )}
                      {form.templateType === 'TASK_REPORT' && form.formData?.unit && (
                         <span className="text-[10px] uppercase text-stone-400 font-bold bg-white px-1.5 py-0.5 rounded border border-stone-200">Đơn vị: {form.formData.unit}</span>
                      )}
                    </div>
                    
                    <p className="text-xs text-stone-500 line-clamp-1 border-t border-stone-200 pt-3 mt-1">
                      Người lập: <span className="font-semibold text-stone-700">{usersMap[form.createdBy] || form.createdByName || form.createdBy || 'Không rõ'}</span>
                    </p>
                  </div>
                ))}
             </div>
          ) : (
             <div className="bg-stone-50 border border-stone-100 rounded-xl p-8 flex flex-col items-center justify-center text-center mt-8">
               <Search className="h-12 w-12 text-stone-300 mb-3" />
               <h4 className="font-bold text-stone-700 text-lg">Không tìm thấy dữ liệu</h4>
               <p className="text-stone-500 text-sm mt-1 max-w-sm">
                 Không có hồ sơ nào khớp với bộ lọc hiện tại. Hãy thử thay đổi khoảng thời gian hoặc loại hồ sơ.
               </p>
               { (appliedStartDate || appliedEndDate || appliedFilterType !== 'ALL') && (
                 <button onClick={handleClearFilter} className="mt-4 px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm font-bold text-stone-600 shadow-sm hover:bg-stone-50">
                    Xóa bộ lọc
                 </button>
               )}
             </div>
          )}
        </div>
      </div>

      {showTaskPlanForm && (
        <TaskPlanForm
          existingFormId={activeTaskPlanId}
          initialData={operationsData.find(f => f.id === activeTaskPlanId)}
          onClose={() => setShowTaskPlanForm(false)}
          onSaved={() => {
            loadOperations();
          }}
        />
      )}

      {showTaskReportForm && (
        <TaskReportForm
          existingFormId={activeTaskReportId}
          initialData={operationsData.find(f => f.id === activeTaskReportId)}
          onClose={() => setShowTaskReportForm(false)}
          onSaved={() => {
            loadOperations();
          }}
        />
      )}
    </div>
  );
}

