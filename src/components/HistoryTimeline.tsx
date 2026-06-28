import React, { useState } from 'react';
import { Calendar, AlertTriangle, CheckCircle, Flame, FileText, ChevronDown, ChevronUp, MessageSquare, ClipboardCheck, Trash2, Loader2 } from 'lucide-react';
import { RepairHistory, TECHNICAL_SECTIONS_LABEL, TechnicalSections, TechnicalStatus } from '../types';
import { formatVNTime } from '../utils/time';

interface HistoryTimelineProps {
  history: RepairHistory[];
  onDeleteHistory: (historyId: string) => Promise<void>;
}

export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({ history, onDeleteHistory }) => {
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({
    [history[0]?.historyId || '']: true // expand the most recent item by default
  });

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
    setErrorMessage(null);
  };

  const handleConfirmDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await onDeleteHistory(id);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Delete error:", err);
      setErrorMessage("Không thể xóa biên bản này. Vui lòng thử lại sau.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
    setErrorMessage(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getStatusStyle = (status: TechnicalStatus) => {
    const s = (status || '').toLowerCase().trim();
    if (s === 'tốt' || s === '') {
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-100 text-emerald-800'
      };
    }
    // Substring pattern matching
    const isFailure = s.includes('hỏng') || s.includes('gãy') || s.includes('vỡ') || s.includes('cháy') || s.includes('nứt') || s.includes('chập');
    const isWarning = s.includes('sửa') || s.includes('yếu') || s.includes('kém') || s.includes('lỏng') || s.includes('rò') || s.includes('kiểm tra');
    
    if (isFailure) {
      return {
        bg: 'bg-rose-50 text-rose-800 border-rose-300',
        dot: 'bg-rose-500 animate-pulse',
        badge: 'bg-rose-100 text-rose-800 font-semibold'
      };
    } else if (isWarning) {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
        badge: 'bg-amber-100 text-amber-800 font-semibold'
      };
    } else {
      return {
        bg: 'bg-stone-50 text-stone-700 border-stone-200',
        dot: 'bg-stone-500',
        badge: 'bg-stone-150 text-stone-805 font-medium'
      };
    }
  };

  const formatDateString = (dateStr: string) => {
    try {
      if (!dateStr) return 'Chưa xác định';
      // If it contains dash, convert from YYYY-MM-DD
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  if (history.length === 0) {
    return (
      <div id="no-history-view" className="bg-stone-50 rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
        <Calendar className="h-10 w-10 mx-auto text-stone-400 mb-2" />
        <p className="font-medium font-sans">Chưa có lịch sử tiếp nhận sửa chữa nào cho xe.</p>
        <p className="text-xs text-stone-500/80 mt-1">Chọn nút "Tạo hồ sơ mới" để ghi nhận biên bản kỹ thuật đầu tiên.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <h3 className="text-base md:text-lg font-bold font-sans text-stone-900 flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-emerald-800" />
          <span>Nhật Ký & Lịch Sử Giao Nhận Sửa Chữa ({history.length})</span>
        </h3>
        <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-full">
          Mới nhất lên đầu
        </span>
      </div>

      <div className="relative border-l-2 border-stone-200 pl-6 ml-4 space-y-8">
        {history.map((log) => {
          const isExpanded = !!expandedItems[log.historyId];
          
          // Determine overall status severity for the outer ribbon/dot indicator
          const statuses: string[] = [
            (log.engineStatus || '').toLowerCase(),
            (log.electricalStatus || '').toLowerCase(),
            (log.chassisStatus || '').toLowerCase(),
            (log.bodyStatus || '').toLowerCase(),
            (log.cushionStatus || '').toLowerCase(),
            (log.tireBatteryStatus || '').toLowerCase(),
            (log.specialEquipmentStatus || '').toLowerCase(),
            (log.accessoryStatus || '').toLowerCase(),
            (log.paintStatus || '').toLowerCase()
          ];
          
          let dominantStatus: string = 'Tốt';
          const hasFailure = statuses.some(s => s.includes('hỏng') || s.includes('gãy') || s.includes('vỡ') || s.includes('cháy') || s.includes('nứt') || s.includes('chập'));
          const hasWarning = statuses.some(s => s.includes('sửa') || s.includes('yếu') || s.includes('kém') || s.includes('lỏng') || s.includes('rò') || s.includes('kiểm tra'));
          
          if (hasFailure) {
            dominantStatus = 'Hỏng';
          } else if (hasWarning) {
            dominantStatus = 'Cần sửa chữa';
          }
          
          const dotStyle = getStatusStyle(dominantStatus);

          return (
            <div key={log.historyId} id={`timeline-item-${log.historyId}`} className="relative">
              {/* Timeline dot indicator */}
              <span className={`absolute -left-[33px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-white ${dotStyle.dot}`} />

              <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden transition-all duration-200">
                {/* Header Accordion Bar */}
                <div 
                  onClick={() => toggleExpand(log.historyId)}
                  className="p-4 bg-stone-50/70 hover:bg-stone-50 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="text-base font-bold font-sans text-emerald-900">
                      Biên bản #{log.reportNumber || 'N/A'}
                    </span>
                    <span className="text-xs bg-stone-200/85 text-stone-700 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDateString(log.receiveDate)}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded border ${dotStyle.bg}`}>
                      {dominantStatus === 'Tốt' ? 'Đạt tiêu chuẩn bảo quản' : `Có chi tiết kỹ thuật hỏng hóc/cần sửa`}
                    </span>
                    
                    {/* Display Creator metadata exactly as requested */}
                    <div className="w-full text-xs text-stone-500 font-sans mt-0.5 flex flex-wrap gap-2 items-center">
                      <span className="text-stone-400">Người tạo:</span>
                      <strong className="text-stone-700">{log.createdByName || 'Nguyễn Văn A'}</strong>
                      <span className="text-stone-300">|</span>
                      <span className="text-stone-400">Cấp bậc:</span>
                      <strong className="text-stone-700">{log.createdByRank || 'Thiếu tá'}</strong>
                      <span className="text-stone-300">|</span>
                      <span className="text-stone-400">Ngày giờ:</span>
                      <strong className="text-stone-700">{formatVNTime(log.createdAt || log.receiveDate) || formatDateString(log.receiveDate)}</strong>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-stone-400">
                    <span className="text-xs font-medium hidden sm:inline text-stone-500">
                      {isExpanded ? 'Điểm nhỏ lại' : 'Xem chi tiết'}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-5 border-t border-stone-150 animate-fade-in space-y-4">
                    {/* Deliver details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-stone-50/50 p-3 rounded-lg border border-stone-100">
                      <div>
                        <span className="text-stone-500 font-medium">Người bàn giao:</span>{' '}
                        <strong className="text-stone-800 font-sans">{log.giver || 'Chưa rõ'}</strong>
                      </div>
                      <div>
                        <span className="text-stone-500 font-medium">Người tiếp nhận:</span>{' '}
                        <strong className="text-stone-800 font-sans">{log.receiver || 'Chưa rõ'}</strong>
                      </div>
                    </div>

                    {/* 9 Technical checklists mapping */}
                    <div>
                      <span className="block text-xs font-bold text-stone-600 uppercase tracking-widest mb-2.5 font-sans">
                        Đánh Giá Trạng Thái Kỹ Thuật Các Hệ Thống (Xem chi tiết)
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {Object.keys(TECHNICAL_SECTIONS_LABEL).map((sectKey) => {
                          const statusVal = log[sectKey as keyof TechnicalSections] as TechnicalStatus || 'Tốt';
                          const systemLabel = TECHNICAL_SECTIONS_LABEL[sectKey as keyof TechnicalSections];
                          const badgeSettings = getStatusStyle(statusVal);

                          return (
                            <div 
                              key={sectKey} 
                              className="p-3 bg-stone-50/50 border border-stone-200/80 rounded-lg text-xs space-y-1.5 flex flex-col justify-between"
                            >
                              <span className="text-stone-500 font-bold block uppercase tracking-wider font-sans text-[10px]">{systemLabel}</span>
                              <span className={`inline-block px-2.5 py-1.5 text-stone-800 bg-white font-medium font-sans rounded border border-stone-150 break-words`}>
                                {statusVal}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notes & comments sections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="p-3 bg-stone-50/50 border border-stone-200 rounded-lg">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-stone-600 uppercase tracking-wider mb-2 font-sans">
                          <MessageSquare className="h-3.5 w-3.5 text-emerald-800" />
                          Ghi chú tình trạng ngoại dạng / sự cố
                        </span>
                        <p className="text-sm text-stone-800 font-sans bg-white p-2.5 rounded border border-stone-200 whitespace-pre-wrap leading-relaxed min-h-[50px]">
                          {log.note || 'Không ghi nhận sự cố bất thường.'}
                        </p>
                      </div>

                      <div className="p-3 bg-stone-50/50 border border-stone-200 rounded-lg">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-stone-600 uppercase tracking-wider mb-2 font-sans">
                          <FileText className="h-3.5 w-3.5 text-emerald-800" />
                          Ý kiến & Nhận xét của Đơn vị
                        </span>
                        <p className="text-sm text-stone-800 font-sans bg-white p-2.5 rounded border border-stone-200 whitespace-pre-wrap leading-relaxed min-h-[50px]">
                          {log.unitComment || 'Nhất trí với bàn giao thực tế.'}
                        </p>
                      </div>
                    </div>

                    {/* Delete entry action section */}
                    <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                      <span className="text-stone-500 font-sans text-[11px]">
                        Mã lưu trữ quân tịch: <code className="font-mono bg-stone-105 px-1.5 py-0.5 rounded text-stone-600 border border-stone-200/50">{log.historyId}</code>
                      </span>
                      
                      <div className="flex items-center gap-2 self-end">
                        {confirmDeleteId === log.historyId ? (
                          <div className="flex items-center gap-2 bg-red-50 border border-red-200 p-1.5 rounded-lg">
                            <span className="text-red-800 font-bold shrink-0 text-[11px]">Chắc chắn xóa?</span>
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={(e) => handleConfirmDelete(log.historyId, e)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md transition-colors cursor-pointer disabled:opacity-50 text-[11px] flex items-center gap-1"
                            >
                              {isDeleting && <Loader2 className="h-3 w-3 animate-spin" />}
                              <span>Xác nhận xóa</span>
                            </button>
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={handleCancelDelete}
                              className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-stone-750 font-bold rounded-md transition-colors cursor-pointer text-[11px]"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteClick(log.historyId, e)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 hover:border-red-350 hover:text-red-800 font-semibold rounded-lg transition-all cursor-pointer text-[11px]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Xóa biên bản này</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {confirmDeleteId === log.historyId && errorMessage && (
                      <div className="text-right text-xs text-red-600 font-semibold font-sans mt-1">
                        {errorMessage}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
