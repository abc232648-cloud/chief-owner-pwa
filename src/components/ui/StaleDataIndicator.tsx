import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';

interface StaleDataIndicatorProps {
  lastSyncTimestamp: string;
  isStale?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export const StaleDataIndicator: React.FC<StaleDataIndicatorProps> = ({
  lastSyncTimestamp,
  isStale = false,
  onRefresh,
  isRefreshing = false,
  className = ''
}) => {
  return (
    <div className={`inline-flex items-center gap-2 text-[11px] font-mono ${className}`}>
      <span className={`inline-flex items-center gap-1 ${isStale ? 'text-amber-400' : 'text-slate-400'}`}>
        <Clock className="w-3 h-3" />
        <span>{isStale ? 'Cached view — ' : 'Current — '}</span>
        <span className="text-slate-300 tabular-nums">{lastSyncTimestamp}</span>
      </span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1 rounded text-slate-400 hover:text-cyan-300 disabled:opacity-50 transition-colors"
          title="Refresh authoritative state"
          aria-label="Refresh data"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      )}
    </div>
  );
};
