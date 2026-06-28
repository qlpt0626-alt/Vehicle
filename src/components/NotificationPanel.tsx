import React, { useEffect, useState } from 'react';
import { logger, DEBUG_MODE } from '../utils/logger';
import { CheckCircle2, AlertTriangle, XCircle, Info, X, ChevronDown, ChevronUp } from 'lucide-react';

const NotificationItem: React.FC<{ log: any; removeLog: (id: string) => void }> = ({ log, removeLog }) => {
  const [showDetail, setShowDetail] = useState(false);

  let Icon = Info;
  let colorClass = 'bg-blue-50 text-blue-800 border-blue-200';
  let iconColor = 'text-blue-500';
  let symbol = 'ℹ';

  if (log.type === 'success') {
    Icon = CheckCircle2;
    colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    iconColor = 'text-emerald-500';
    symbol = '✓';
  } else if (log.type === 'warn') {
    Icon = AlertTriangle;
    colorClass = 'bg-amber-50 text-amber-800 border-amber-200';
    iconColor = 'text-amber-500';
    symbol = '⚠';
  } else if (log.type === 'error') {
    Icon = XCircle;
    colorClass = 'bg-red-50 text-red-800 border-red-200';
    iconColor = 'text-red-500';
    symbol = '✗';
  }

  const hasDetails = log.details && log.details.length > 0;

  return (
    <div className={`pointer-events-auto p-3 rounded-lg border shadow-lg flex flex-col gap-1 transition-all ${colorClass}`}>
      <div className="flex items-start gap-2">
        <span className="font-bold shrink-0">{symbol}</span>
        <div className="flex-1 text-sm flex gap-2">
          <span className="font-mono text-xs opacity-70 shrink-0 mt-0.5">{log.time}</span>
          <span className="font-medium">{log.shortMessage}</span>
        </div>
        {hasDetails && (
          <button onClick={() => setShowDetail(!showDetail)} className="text-xs underline opacity-70 hover:opacity-100 whitespace-nowrap shrink-0">
            {showDetail ? 'Ẩn' : 'Chi tiết'}
          </button>
        )}
        <button onClick={() => removeLog(log.id)} className="shrink-0 p-1 hover:bg-black/5 rounded ml-1">
          <X className="w-4 h-4 opacity-50" />
        </button>
      </div>
      
      {showDetail && hasDetails && (
        <div className="mt-2 text-xs font-mono bg-black/5 p-2 rounded overflow-auto max-h-48 opacity-80 whitespace-pre-wrap flex flex-col gap-1">
          {Array.isArray(log.details) 
            ? log.details.map((d, i) => {
                // If it's an Error object, format it safely.
                if (d instanceof Error) {
                  return <div key={i}>{d.message}{DEBUG_MODE && d.stack ? `\n${d.stack}` : ''}</div>;
                }
                if (typeof d === 'object') {
                  // If NOT in DEBUG_MODE, don't show full objects
                  if (!DEBUG_MODE) {
                    return <div key={i}>[Object Data]</div>;
                  }
                  return <div key={i}>{JSON.stringify(d, null, 2)}</div>;
                }
                return <div key={i}>{String(d)}</div>;
              })
            : (typeof log.details === 'object' 
                ? (DEBUG_MODE ? JSON.stringify(log.details, null, 2) : '[Object Data]') 
                : String(log.details))
          }
        </div>
      )}
    </div>
  );
};

export const NotificationPanel = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });
    return () => unsubscribe();
  }, []);

  if (logs.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {logs.map(log => (
        <NotificationItem key={log.id} log={log} removeLog={logger.removeLog.bind(logger)} />
      ))}
    </div>
  );
};

