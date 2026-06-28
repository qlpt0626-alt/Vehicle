import React, { useState, useEffect, useRef } from 'react';
import { X, Save, FileDown, Printer, Plus, Trash2 } from 'lucide-react';
import { getCurrentUserSession } from '../services/dbService';
import { DataService } from '../firebase';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import { userService } from '../services/userService';
import { canEditModule } from '../services/permissionService';

// Default struct for TaskPlan
const DEFAULT_TASKS = [
  { id: 1, date: '', content: '', assignedTo: '' }
];

interface Props {
  existingFormId?: string;
  onSaved?: (payload?: any) => void;
  onClose: () => void;
  initialData?: any;
}

export const TaskPlanForm: React.FC<Props> = ({ existingFormId, initialData, onSaved, onClose }) => {
  const [zoom, setZoom] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 800) {
      return Math.max(30, Math.floor((window.innerWidth) / 7.94));
    }
    return 100;
  });
  const printRef = useRef<HTMLDivElement>(null);
  const currentUser = getCurrentUserSession();

  const isAdmin = currentUser?.role === 'admin';
  const isOwner = !!currentUser && !!initialData && (initialData.createdBy === currentUser.uid || initialData.createdBy === currentUser.username);
  const canEditOps = currentUser ? canEditModule(currentUser.role, 'OPERATIONS') : false;
  const hasPermission = canEditOps && (!existingFormId || isAdmin || isOwner);

  const [usersList, setUsersList] = useState<any[]>([]);

  const [formData, setFormData] = useState(() => {
    return {
      unit: 'Xưởng SCTH30',
      subUnit: 'Đại đội sửa chữa Xe-máy',
      week: '',
      month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
      year: new Date().getFullYear().toString(),
      createdBy: currentUser?.fullName || '',
      createdDate: new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      tasks: [...DEFAULT_TASKS]
    };
  });

  const [docId, setDocId] = useState(() => {
    if (existingFormId) return existingFormId;
    const baseId = `TASKPLAN_${Date.now()}`;
    return baseId.replace(/[^a-zA-Z0-9_\-]/g, '_');
  });

  useEffect(() => {
    loadData();
    const loadUsers = async () => {
      try {
        const users = await userService.loadUsers();
        setUsersList(users);
      } catch (err) {}
    };
    loadUsers();
  }, [docId, initialData]);

  const loadData = async () => {
    try {
      let foundDoc = initialData || null;

      // Check local storage first
      const storeKey = `local_TASK_PLAN`;
      let localData = localStorage.getItem(storeKey);
      
      const list = localData ? JSON.parse(localData) : [];
      let matchedCount = 0;

      if (!foundDoc && existingFormId) {
        foundDoc = list.find((item: any) => item.id === existingFormId && !item.isDeleted);
        if (foundDoc) matchedCount++;
      }

      // If not in local storage check firebase
      if (!foundDoc && existingFormId) {
        const dbDoc = await DataService.get('repairForms', existingFormId); // keep under standard unified collections
        if (dbDoc && !dbDoc.isDeleted) {
          foundDoc = dbDoc;
          matchedCount++;
        }
      }

      if (foundDoc) {
        if (foundDoc.formData) {
           // Ensure it has tasks array
           const data = { ...foundDoc.formData };
           if (!data.tasks || data.tasks.length === 0) {
              data.tasks = [...DEFAULT_TASKS];
           }
           if (data.subUnit === undefined) {
              data.subUnit = 'Đại đội sửa chữa Xe-máy';
           }
           setFormData(data);
        }
        if (foundDoc.id && foundDoc.id !== docId) {
          setDocId(foundDoc.id);
        }
      } 
    } catch (err) {
      console.warn('Error loading form data:', err);
    }
  };

  const handleSave = async () => {
    if (!hasPermission) {
      alert('Bạn không có quyền thực hiện thao tác này.');
      return;
    }

    try {
      const currentUser = getCurrentUserSession();
      
      let docExists = false;
      let existingDoc = null;
      try {
        existingDoc = await DataService.get('repairForms', docId);
        if (existingDoc && !existingDoc.isDeleted) {
          docExists = true;
        }
      } catch (err) {}

      const payload = {
        id: docId,
        vehicleId: 'NA', // Not tied to a vehicle
        module: 'OPERATIONS',
        templateType: 'TASK_PLAN',
        templateName: 'Kế hoạch nhiệm vụ chuyên môn của đơn vị',
        stageName: 'Kế hoạch nhiệm vụ',
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
      
      // Update local storage cache
      const storeKey = `local_TASK_PLAN`;
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

      if (onSaved) onSaved(payload);
      onClose();
    } catch (err) {
      console.error('Không thể lưu dữ liệu.', err);
    }
  };

  const handleDelete = async () => {
    if (!hasPermission) {
      alert('Bạn không có quyền thực hiện thao tác này.');
      return;
    }

    let confirmed = false;
    try {
      confirmed = window.confirm('Bạn có chắc chắn muốn xóa kế hoạch này?');
    } catch (err) {
      confirmed = true;
    }

    if (!confirmed) return;

    try {
      const currentUser = getCurrentUserSession();
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
      
      const storeKey = `local_TASK_PLAN`;
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
          vehicleId: 'NA',
          module: 'OPERATIONS',
          templateType: 'TASK_PLAN',
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser?.uid || currentUser?.username || "unknown",
          deletedByName: currentUser?.fullName || currentUser?.username || "Người dùng",
          deletedByRole: currentUser?.role || "Không xác định",
        });
      }
      localStorage.setItem(storeKey, JSON.stringify(list));
      
      if (onSaved) onSaved(); 
      onClose();
    } catch (err) {
      console.error('Không thể xóa dữ liệu.', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleTaskChange = (index: number, field: string, value: string) => {
    const newTasks = [...formData.tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setFormData({ ...formData, tasks: newTasks });
  };

  const addTaskRow = () => {
    if (!hasPermission) {
      alert('Bạn không có quyền thực hiện thao tác này.');
      return;
    }

    const newTasks = [...formData.tasks];
    newTasks.push({ id: Date.now(), date: '', content: '', assignedTo: '' });
    setFormData({ ...formData, tasks: newTasks });
  };

  const removeTaskRow = (index: number) => {
    if (!hasPermission) {
      alert('Bạn không có quyền thực hiện thao tác này.');
      return;
    }

    const newTasks = [...formData.tasks];
    newTasks.splice(index, 1);
    setFormData({ ...formData, tasks: newTasks });
  };

  const [activeSelectIndex, setActiveSelectIndex] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-100/90 backdrop-blur-sm overflow-hidden print:bg-white print:static print:h-auto print:overflow-visible">
      
      {/* Header controls */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between shrink-0 print:hidden">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-500 hover:text-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-stone-200"></div>
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
            <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="px-2 py-1 hover:bg-white rounded text-sm text-stone-600 font-medium">-</button>
            <span className="text-sm font-mono text-stone-600 w-12 text-center">{zoom}%</span>
            <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="px-2 py-1 hover:bg-white rounded text-sm text-stone-600 font-medium">+</button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {existingFormId && hasPermission && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDelete();
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
            >
              <Trash2 className="w-4 h-4" />
              Xóa
            </button>
          )}
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
          {hasPermission && (
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              Lưu kế hoạch
            </button>
          )}
        </div>
      </div>

      {/* Form Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full flex sm:justify-center p-2 sm:p-8 print:p-0 print:block" onClick={() => setActiveSelectIndex(null)}>
        <div 
          ref={printRef}
          style={{ 
            zoom: `${zoom}%`,
            fontFamily: '"Times New Roman", Times, serif'
          }}
          className="bg-white shadow-xl w-[210mm] min-w-[210mm] min-h-[297mm] p-[10mm] sm:p-[20mm] mx-auto text-black print:shadow-none print:m-0 print:p-0 print:max-w-none origin-top-left sm:origin-top print:!zoom-100 relative"
        >
          <fieldset disabled={!hasPermission} className="border-0 p-0 m-0 min-w-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-10">
            <div className="text-center font-bold">
               <input 
                  type="text" 
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className="text-base text-center bg-transparent outline-none m-0 leading-tight border-b border-dotted border-transparent hover:border-black focus:border-black transition-colors min-w-[200px]" 
                />
               <input 
                  type="text" 
                  value={formData.subUnit}
                  onChange={(e) => setFormData({...formData, subUnit: e.target.value})}
                  className="text-base text-center block bg-transparent outline-none m-0 mt-1 leading-tight border-b border-dotted border-transparent hover:border-black focus:border-black transition-colors min-w-[200px]" 
                />
            </div>
          </div>

          <div className="text-center mb-8 relative">
            <h1 className="text-xl font-bold uppercase m-0 leading-tight mb-3">KẾ HOẠCH NHIỆM VỤ CHUYÊN MÔN CỦA ĐƠN VỊ</h1>
            <div className="flex justify-center items-center gap-4 text-[15px] font-bold">
               <div className="flex items-end gap-1">
                 <span>Tuần</span>
                 <input 
                    type="text" 
                    value={formData.week}
                    onChange={(e) => setFormData({...formData, week: e.target.value})}
                    className="w-12 text-center border-b border-dotted border-black bg-transparent outline-none pb-0" 
                  />
               </div>
               <div className="flex items-end gap-1">
                 <span>Tháng</span>
                 <input 
                    type="text" 
                    value={formData.month || ''}
                    onChange={(e) => setFormData({...formData, month: e.target.value})}
                    className="w-12 text-center border-b border-dotted border-black bg-transparent outline-none pb-0" 
                  />
               </div>
               <div className="flex items-end gap-1">
                 <span>Năm</span>
                 <input 
                    type="text" 
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className="w-16 text-center border-b border-dotted border-black bg-transparent outline-none pb-0" 
                  />
               </div>
            </div>
          </div>

          <div className="mb-4 flex flex-col items-end gap-2 text-[15px]">
            <div className="flex items-end gap-2 w-[250px]">
               <span className="whitespace-nowrap italic">Ngày lập:</span>
               <input 
                  type="text" 
                  value={formData.createdDate}
                  onChange={(e) => setFormData({...formData, createdDate: e.target.value})}
                  className="border-b border-dotted border-black flex-1 bg-transparent outline-none pb-0 font-bold" 
               />
            </div>
            <div className="flex items-end gap-2 w-[250px]">
               <span className="whitespace-nowrap italic">Người lập:</span>
               <input 
                  type="text" 
                  value={formData.createdBy}
                  onChange={(e) => setFormData({...formData, createdBy: e.target.value})}
                  className="border-b border-dotted border-black flex-1 bg-transparent outline-none pb-0 font-bold" 
               />
            </div>
          </div>

          <div className="mb-6 relative">
            <table className="w-full border-collapse border border-black text-[15px]">
              <thead>
                <tr>
                  <th className="border border-black px-2 py-2 text-center w-32 font-bold">Thứ ngày</th>
                  <th className="border border-black px-2 py-2 text-center font-bold">Nội dung công việc</th>
                  <th className="border border-black px-2 py-2 text-center w-48 font-bold">Phụ trách thực hiện</th>
                  <th className="border-0 w-8 print:hidden"></th>
                </tr>
              </thead>
              <tbody>
                {formData.tasks.map((item: any, index: number) => (
                    <tr className="group" key={item.id || index}>
                      <td className="border border-black p-0 align-top">
                        <AutoResizeTextarea 
                          value={item.date || ''}
                          onChange={(e) => handleTaskChange(index, 'date', e.target.value)}
                          className="w-full h-full min-h-[48px] bg-transparent outline-none px-2 py-2 text-center text-emerald-800 print:text-black font-semibold"
                          placeholder="Thứ..."
                        />
                      </td>
                      <td className="border border-black p-0 align-top">
                        <AutoResizeTextarea 
                          value={item.content || ''}
                          onChange={(e) => handleTaskChange(index, 'content', e.target.value)}
                          className="w-full h-full min-h-[48px] bg-transparent outline-none px-2 py-2 text-emerald-800 print:text-black"
                          placeholder="Nhập nội dung..."
                        />
                      </td>
                      <td className="border border-black p-0 align-top relative">
                        <div 
                           className="w-full h-full min-h-[48px] px-2 py-2 flex items-start text-emerald-800 print:text-black cursor-pointer font-bold relative"
                           onClick={(e) => { e.stopPropagation(); setActiveSelectIndex(index); }}
                        >
                          <span className="flex-1 whitespace-pre-wrap">{item.assignedTo || 'Chọn người pt...'}</span>
                        </div>
                        {activeSelectIndex === index && (
                          <div className="absolute top-10 left-0 w-full min-w-[200px] bg-white border border-stone-200 shadow-xl rounded-lg z-50 print:hidden mt-2 font-sans overflow-hidden">
                             <div className="sticky top-0 bg-stone-100 flex justify-between items-center px-3 py-2 border-b border-stone-200">
                                <span className="text-xs font-bold uppercase text-stone-600">Chọn cán bộ</span>
                                <button className="text-stone-400 hover:text-stone-800" onClick={(e) => { e.stopPropagation(); setActiveSelectIndex(null); }}><X className="w-4 h-4" /></button>
                             </div>
                             <div className="max-h-60 overflow-y-auto">
                               {usersList.length > 0 ? (
                                  usersList.map((u) => (
                                    <div 
                                      key={u.username}
                                      className="px-3 py-2 border-b border-stone-100 hover:bg-emerald-50 cursor-pointer transition-colors"
                                      onClick={(e) => {
                                         e.stopPropagation();
                                         handleTaskChange(index, 'assignedTo', u.fullName);
                                        setActiveSelectIndex(null);
                                      }}
                                    >
                                      <div className="font-bold text-sm text-stone-800">{u.fullName}</div>
                                      <div className="text-xs text-stone-500">{u.rank}</div>
                                    </div>
                                  ))
                               ) : (
                                  <div className="px-3 py-4 text-center text-stone-500 text-sm">Không có dữ liệu CB</div>
                               )}
                                 <div 
                                    className="px-3 py-2 bg-stone-50 hover:bg-stone-100 cursor-pointer transition-colors text-center font-bold text-stone-500 text-sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleTaskChange(index, 'assignedTo', '');
                                        setActiveSelectIndex(null);
                                    }}
                                 >
                                    Xóa chọn
                                 </div>
                             </div>
                          </div>
                        )}
                      </td>
                      <td className="border-0 px-2 py-2 print:hidden align-top text-center w-10">
                        <button
                          onClick={() => removeTaskRow(index)}
                          className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Xóa dòng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
            
            <button 
              onClick={addTaskRow}
              className="mt-3 flex items-center justify-center gap-2 w-full py-2 border border-dashed border-emerald-300 text-emerald-600 rounded-lg hover:bg-emerald-50 hover:border-emerald-400 transition-colors print:hidden font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Thêm dòng nhiệm vụ
            </button>
          </div>

          <div className="flex justify-end mt-16 text-center pr-10">
            <div className="flex flex-col items-center">
              <p className="font-bold text-[15px] mb-12">NGƯỜI LẬP KẾ HOẠCH</p>
              <input 
                type="text" 
                className="w-full text-center outline-none bg-transparent font-bold text-[15px] print:text-black" 
                value={formData['sign_NGƯỜI LẬP KẾ HOẠCH'] || ''} 
                onChange={(e) => setFormData({...formData, 'sign_NGƯỜI LẬP KẾ HOẠCH': e.target.value})}
                placeholder="..."
              />
              <input 
                 type="text" 
                 value={formData.createdBy}
                 onChange={(e) => setFormData({...formData, createdBy: e.target.value})}
                 className="font-bold text-[15px] text-center bg-transparent outline-none m-0 leading-tight border-b border-dotted border-transparent hover:border-black focus:border-black transition-colors min-w-[200px]" 
               />
            </div>
          </div>
          </fieldset>
        </div>
      </div>
    </div>
  );
};
