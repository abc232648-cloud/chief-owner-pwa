import React from 'react';
import { WifiOff, Wifi, RefreshCw, AlertOctagon, ServerCrash, Clock } from 'lucide-react';
import { ConnectivityMode } from '../types/chief';
import { useOfflineQueue } from '../context/OfflineQueueContext';
import { useChief } from '../context/ChiefContext';

interface ConnectivityBannerProps {
  connectivity?: ConnectivityMode;
  pendingCount?: number;
  lastSyncTimestamp?: string;
  onSyncNow: () => void;
  onOpenQueue?: () => void;
}

export const ConnectivityBanner: React.FC<ConnectivityBannerProps> = ({
  onSyncNow,
  onOpenQueue
}) => {
  const { queue, conflictCount, isDataStale } = useOfflineQueue();
  const { networkOnline, chiefReachability, syncStatus, isSyncing, state } = useChief();

  const deviceNetwork = networkOnline ? 'ONLINE' : 'OFFLINE';
  const chiefBackend = 
    chiefReachability === 'reachable' ? 'REACHABLE' :
    chiefReachability === 'simulated' ? 'SIMULATED' :
    chiefReachability === 'degraded' ? 'DEGRADED' :
    'UNREACHABLE';
  const synchronization = 
    isSyncing ? 'SYNCING' :
    syncStatus === 'current' ? 'CURRENT' :
    syncStatus === 'pending' ? 'PENDING' :
    syncStatus === 'stale' ? 'STALE' :
    'NOT SYNCHRONIZED';

  // Only hide when completely nominal: device online, backend reachable, current sync, no queue, no conflict
  const isFullyNominal = 
    networkOnline && 
    chiefReachability === 'reachable' && 
    syncStatus === 'current' && 
    queue.length === 0 && 
    conflictCount === 0 && 
    !isDataStale;

  if (isFullyNominal) {
    return null;
  }

  // 1. Conflict state alert (Highest priority)
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

  const isCritical = !networkOnline || chiefReachability === 'unreachable';

  return (
    <div className={`rounded-xl border p-3.5 text-xs shadow-md space-y-2.5 ${
      isCritical 
        ? 'border-rose-900/70 bg-[#160609]/95 text-rose-200' 
        : 'border-amber-900/60 bg-[#171004]/95 text-amber-200'
    }`}>
      {/* Top row: Status message & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-start sm:items-center gap-2 min-w-0">
          {isCritical ? (
            !networkOnline ? (
              <WifiOff className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <ServerCrash className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
            )
          ) : isSyncing ? (
            <RefreshCw className="w-4 h-4 text-sky-400 shrink-0 animate-spin mt-0.5 sm:mt-0" />
          ) : (
            <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          )}
          <div>
            <span className="font-bold font-mono uppercase tracking-wider text-white">
              {!networkOnline 
                ? 'Device Network Offline' 
                : chiefReachability === 'unreachable'
                ? 'Chief Backend Unreachable'
                : chiefReachability === 'degraded'
                ? 'Chief Link Degraded'
                : chiefReachability === 'simulated'
                ? 'Simulated Development State'
                : 'Synchronization In Progress'}
              :
            </span>
            <span className="ml-1.5 font-sans">
              {!networkOnline
                ? 'Device has no Internet connection. Actions queued locally.'
                : chiefReachability === 'unreachable'
                ? syncStatus === 'stale' 
                  ? 'Serving cached data. Safety mutations fail closed.' 
                  : 'Backend unreachable. Real telemetry unavailable.'
                : syncStatus === 'stale'
                ? 'Serving cached snapshot. Synchronization recommended.'
                : queue.length > 0
                ? `${queue.length} offline changes queued.`
                : 'Telemetry synchronization required.'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {onOpenQueue && queue.length > 0 && (
            <button
              onClick={onOpenQueue}
              className="px-2.5 py-1 rounded bg-[#0a2e1b] hover:bg-[#0e3b23] text-emerald-200 border border-emerald-800 font-medium font-mono text-[11px]"
            >
              View Queue ({queue.length})
            </button>
          )}
          <button
            onClick={onSyncNow}
            disabled={isSyncing}
            className={`px-3 py-1 rounded font-medium font-mono text-[11px] flex items-center gap-1 transition-colors ${
              isCritical
                ? 'bg-rose-900/80 hover:bg-rose-800 text-rose-100 disabled:opacity-50'
                : 'bg-amber-900/80 hover:bg-amber-800 text-amber-100 disabled:opacity-50'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Retry Link'}</span>
          </button>
        </div>
      </div>

      {/* Distinct Connectivity Dimensions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-white/10 font-mono text-[11px]">
        <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
          <span className="text-white/60 text-[10px] uppercase font-semibold">Device Network:</span>
          <span className={`font-bold ${networkOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
            {deviceNetwork}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
          <span className="text-white/60 text-[10px] uppercase font-semibold">Chief Backend:</span>
          <span className={`font-bold ${
            chiefBackend === 'REACHABLE' ? 'text-emerald-400' :
            chiefBackend === 'SIMULATED' ? 'text-amber-400' :
            chiefBackend === 'DEGRADED' ? 'text-amber-400' :
            'text-rose-400'
          }`}>
            {chiefBackend}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
          <span className="text-white/60 text-[10px] uppercase font-semibold">Synchronization:</span>
          <span className={`font-bold ${
            synchronization === 'CURRENT' ? 'text-emerald-400' :
            synchronization === 'SYNCING' ? 'text-sky-400' :
            synchronization === 'PENDING' ? 'text-amber-400' :
            synchronization === 'STALE' ? 'text-amber-400' :
            'text-rose-400'
          }`}>
            {synchronization}
          </span>
        </div>
      </div>

      {/* Real Cache Timestamp and Age */}
      {(state.lastSyncTimestamp && state.lastSyncTimestamp !== 'Never') && (
        <div className="text-[10px] font-mono text-white/50 flex flex-wrap items-center justify-between pt-0.5">
          <span>Telemetry Currency: {state.lastSyncTimestamp}</span>
          {state.cacheAgeLabel && <span>{state.cacheAgeLabel}</span>}
        </div>
      )}
    </div>
  );
};
