import React from 'react';
import { WifiOff, AlertCircle } from 'lucide-react';

interface OfflineIndicatorProps {
  isOffline: boolean;
  lastSyncedAt?: string;
  onRetry?: () => void;
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOffline,
  lastSyncedAt,
  onRetry,
  className = ''
}) => {
  if (!isOffline) return null;

  return (
    <div 
      role="status"
      aria-live="polite"
      className={`rounded-xl border border-rose-900/60 bg-rose-950/40 p-3 text-xs text-rose-200 flex items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
        <div className="min-w-0">
          <span className="font-semibold text-rose-300 font-mono">Offline Client Mode: </span>
          <span className="text-slate-300">
            Displaying cached local snapshot. Changes queued.
          </span>
          {lastSyncedAt && (
            <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
              Last synced: {lastSyncedAt}
            </span>
          )}
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-2.5 py-1 rounded bg-rose-900/80 hover:bg-rose-800 text-rose-100 font-mono text-[11px] font-semibold shrink-0 transition-colors"
        >
          Reconnect
        </button>
      )}
    </div>
  );
};
