import React from 'react';
import { WifiOff, RefreshCw, AlertOctagon } from 'lucide-react';
import { ConnectivityMode } from '../types/chief';
import { useOfflineQueue } from '../context/OfflineQueueContext';

interface ConnectivityBannerProps {
  connectivity: ConnectivityMode;
  pendingCount: number;
  lastSyncTimestamp: string;
  onSyncNow: () => void;
  onOpenQueue?: () => void;
}

export const ConnectivityBanner: React.FC<ConnectivityBannerProps> = ({
  connectivity,
  pendingCount,
  lastSyncTimestamp,
  onSyncNow,
  onOpenQueue
}) => {
  const { queue, conflictCount, isDataStale } = useOfflineQueue();

  if (connectivity === 'online' && queue.length === 0 && !isDataStale) {
    return null;
  }

  // Conflict state alert (Highest priority)
  if (conflictCount > 0) {
    return (
      <div className="rounded-xl border border-purple-800/80 bg-purple-950/60 p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-purple-200 shadow-md">
        <div className="flex items-center gap-2.5">
          <AlertOctagon className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
          <div>
            <span className="font-bold text-white uppercase tracking-wider font-mono">
              Reconciliation Conflict ({conflictCount} items):
            </span>
            <span className="text-purple-300 ml-1.5 font-mono">
              Local queued data conflicts with server baseline. User intervention required.
            </span>
          </div>
        </div>
        {onOpenQueue && (
          <button
            onClick={onOpenQueue}
            className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-bold font-mono text-[11px] shrink-0 self-start sm:self-auto shadow-sm"
          >
            Resolve Conflicts →
          </button>
        )}
      </div>
    );
  }

  if (connectivity === 'offline') {
    return (
      <div className="rounded-xl border border-rose-900/60 bg-rose-950/40 p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-200">
        <div className="flex items-center gap-2.5">
          <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
          <div>
            <span className="font-semibold text-rose-300">⚠ OFFLINE MODE: </span>
            <span>Local mobile queue active ({queue.length} items). Safety approvals remain locked. Last synchronized: {lastSyncTimestamp}.</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {onOpenQueue && (
            <button
              onClick={onOpenQueue}
              className="px-2.5 py-1 rounded bg-[#0a2e1b] hover:bg-[#0e3b23] text-emerald-200 border border-emerald-800 font-medium font-mono text-[11px]"
            >
              View Queue ({queue.length})
            </button>
          )}
          <button
            onClick={onSyncNow}
            className="px-3 py-1 rounded bg-rose-900/80 hover:bg-rose-800 text-rose-100 font-medium font-mono text-[11px]"
          >
            Retry Link
          </button>
        </div>
      </div>
    );
  }

  // Pending State
  return (
    <div className="rounded-xl border border-amber-900/50 bg-amber-950/30 p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 shadow-sm">
      <div className="flex items-center gap-2.5">
        <RefreshCw className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
        <div>
          <span className="font-semibold text-amber-300">⟳ {queue.length || pendingCount} changes in offline sync queue.</span>
          <span className="text-emerald-300/60 ml-1">Cached reads served safely with bounded retries.</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
        {onOpenQueue && (
          <button
            onClick={onOpenQueue}
            className="px-2.5 py-1 rounded bg-[#0a2e1b] hover:bg-[#0e3b23] text-emerald-200 border border-emerald-800 font-medium font-mono text-[11px]"
          >
            Inspect Queue
          </button>
        )}
        <button
          onClick={onSyncNow}
          className="px-3 py-1 rounded bg-amber-900/80 hover:bg-amber-800 text-amber-100 font-medium font-mono text-[11px]"
        >
          Flush Queue Now
        </button>
      </div>
    </div>
  );
};
