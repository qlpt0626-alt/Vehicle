import React from 'react';
import { 
  FileText, 
  Trash2, 
  Printer, 
  Calendar
} from 'lucide-react';
import { DamageProtocol } from '../types';
import { canEditModule } from '../services/permissionService';

interface DamageProtocolListProps {
  protocols: DamageProtocol[];
  onDeleteProtocol: (protocolId: string) => Promise<void>;
  onPrintSelect: (protocol: DamageProtocol) => void;
  onViewSelect: (protocol: DamageProtocol) => void;
  activeProtocolId?: string;
  currentUserRole?: string;
}

export const DamageProtocolList: React.FC<DamageProtocolListProps> = ({
  protocols,
  onDeleteProtocol,
  onPrintSelect,
  onViewSelect,
  activeProtocolId,
  currentUserRole
}) => {
  const canEdit = currentUserRole ? canEditModule(currentUserRole as any, 'INSPECTION') : false;

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  if (protocols.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Main Protocol list */}
      <div className="space-y-3.5">
        {protocols.map((protocol, index) => {
          const isActive = activeProtocolId === protocol.protocolId;

          return (
            <div 
              key={`${protocol.protocolId || 'no-id'}-${index}`}
              className={`border rounded-xl transition-all overflow-hidden ${
                isActive 
                  ? 'border-emerald-500 bg-emerald-50/30 shadow-sm' 
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              {/* Box Header (Clickable block) */}
              <div 
                onClick={() => onViewSelect(protocol)}
                className="p-4 cursor-pointer flex items-center justify-between flex-wrap gap-4 select-none"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border ${isActive ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-stone-100 text-emerald-800 border-stone-200'}`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-stone-900 underline">
                        {protocol.plateNumber ? `Số đăng ký xe: ${protocol.plateNumber}` : protocol.reportNumber}
                      </span>
                      <span className="text-[10px] bg-stone-200/80 border border-stone-300/60 font-medium px-2 py-0.5 rounded text-stone-700">
                        {protocol.odometer}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium mt-0.5 flex flex-col gap-0.5">
                      <span className="text-stone-700">Biên bản: {protocol.reportNumber}</span>
                      <span className="text-stone-700">Người lập: <span className="font-bold">{(protocol.createdByName === 'admin' || protocol.lastEditedBy === 'admin') ? 'Lê Phương Đông' : (protocol.createdByName || protocol.lastEditedBy || 'Người dùng')}</span></span>
                      <span className="text-stone-700">Vai trò: <span className="font-bold">{protocol.createdByRole || 'Không xác định'}</span></span>
                      <span className="flex items-center gap-1 font-sans">
                        <Calendar className="h-3 w-3 inline text-stone-400" />
                        {formatDateString(protocol.createdDate)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onPrintSelect(protocol); }}
                    className="p-1.5 px-2 bg-white hover:bg-sky-50 text-sky-800 border border-stone-200 hover:border-sky-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    title="Chỉnh sửa / In"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>

                  {canEdit && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await onDeleteProtocol(protocol.protocolId);
                      }}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg transition-all cursor-pointer"
                      title="Xóa biên bản"
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
    </div>
  );
};
