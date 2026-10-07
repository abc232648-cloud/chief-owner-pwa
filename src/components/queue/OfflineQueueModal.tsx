import React, { useState } from 'react';
import { 
  X, 
  Wifi, 
  WifiOff, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCw, 
  Layers, 
  Trash2, 
  ShieldCheck, 
  Lock, 
  XCircle, 
  AlertOctagon, 
  Database,
  AlertCircle 
} from 'lucide-react';
import { useOfflineQueue } from '../../context/OfflineQueueContext';
import { useChief } from '../../context/ChiefContext';
import { useAuth } from '../../context/AuthContext';
import { QueueItemStatus } from '../../types/queue';

interface OfflineQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineQueueModal: React.FC<OfflineQueueModalProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    queue, 
    pendingCount, 
    conflictCount, 
    isSyncing, 
    isEffectivelyOffline, 
    isDataStale,
    syncQueueItem, 
    syncAllEligible, 
    resolveConflict, 
    deleteQueueItem, 
    clearCompleted,
    cachedDataSources
  } = useOfflineQueue();
  const { toggleConnectivity } = useChief();
  const { isDevMode } = useAuth();

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'conflict' | 'permanent_error' | 'synced'>('all');
  const [showPolicyGuidelines, setShowPolicyGuidelines] = useState(false);
  const [showCachedSources, setShowCachedSources] = useState(false);

  if (!isOpen) return null;

  const filteredItems = queue.filter(item => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return item.status === 'pending' || item.status === 'syncing' || item.status === 'failed_transient';
    if (filterStatus === 'conflict') return item.status === 'conflict';
    if (filterStatus === 'permanent_error') return item.status === 'rejected_permanent' || item.status === 'failed_permanent' || item.status === 'unsupported';
    if (filterStatus === 'synced') return item.status === 'synced';
    return true;
  });

  const renderStatusBadge = (status: QueueItemStatus, requiresIntervention: boolean) => {
    switch (status) {
      case 'synced':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-600 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>CONFIRMED SYNC</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-950 text-amber-200 border border-amber-600 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>PENDING QUEUE</span>
          </span>
        );
      case 'syncing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-sky-950 text-sky-200 border border-sky-600 shadow-sm">
            <RotateCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
            <span>IN-FLIGHT SYNC</span>
          </span>
        );
      case 'failed_transient':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>TRANSIENT RETRY</span>
          </span>
        );
      case 'conflict':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-950 text-purple-200 border border-purple-500 shadow-sm animate-pulse">
            <AlertOctagon className="w-3.5 h-3.5 text-purple-400" />
            <span>CONFLICT DETECTED</span>
          </span>
        );
      case 'unsupported':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-zinc-900 text-zinc-300 border border-zinc-700 shadow-sm">
            <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span>UNSUPPORTED SYNC</span>
          </span>
        );
      case 'failed_permanent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-950 text-amber-200 border border-amber-600 shadow-sm">
            <XCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>FAILED (PERMANENT)</span>
          </span>
        );
      case 'rejected_permanent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-950 text-rose-200 border border-rose-600 shadow-sm">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>CHIEF REJECTED</span>
          </span>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="offline-queue-title"
    >
      <div className="relative w-full max-w-2xl bg-[#041a10] border border-emerald-900/80 rounded-2xl shadow-2xl shadow-black/80 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* 1. Header Bar */}
        <div className="p-4 sm:p-5 border-b border-emerald-950/90 bg-[#03140c] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0a2e1b] border border-emerald-800 flex items-center justify-center text-emerald-400 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="offline-queue-title" className="text-base font-bold text-white tracking-tight font-mono">
                  OFFLINE QUEUE &amp; SYNC ENGINE
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  BOUNDED RETRIES
                </span>
              </div>
              <p className="text-xs text-emerald-400/80 font-mono mt-0.5">
                Authoritative local cache with cryptographic audit reconciliation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => syncAllEligible()}
              disabled={isSyncing || isEffectivelyOffline || pendingCount === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync All ({pendingCount})</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-300/60 hover:text-white hover:bg-[#0a2e1b] transition-colors"
              aria-label="Close offline queue"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Incomplete Network State Banner */}
        <div className={`px-4 sm:px-6 py-2.5 border-b text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          isEffectivelyOffline 
            ? 'bg-amber-950/60 border-amber-900/70 text-amber-200' 
            : 'bg-[#03180e] border-emerald-950/80 text-emerald-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {isEffectivelyOffline ? (
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            ) : (
              <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <div>
              <span className="font-bold">
                {isEffectivelyOffline ? 'OFFLINE (LOCAL CACHE ACTIVE):' : 'CHIEF UPLINK ONLINE:'}
              </span>
              {' '}
              <span>
                {isEffectivelyOffline
                  ? 'Submissions are queued locally. Live safety interlocks remain locked.'
                  : 'Direct synchronization loop to Chief Central Policy Engine active.'
                }
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isDevMode && (
              <button
                onClick={toggleConnectivity}
                className="px-2 py-0.5 rounded text-[10px] font-bold border transition-colors bg-[#021209] hover:bg-[#062617] border-amber-600 text-amber-300"
                title="[DEV ONLY] Toggle network simulation"
              >
                {isEffectivelyOffline ? 'Switch Online (DEV)' : 'Simulate Offline (DEV)'}
              </button>
            )}
          </div>
        </div>

        {/* 3. Stale-Data Indication Bar */}
        {isDataStale && (
          <div className="px-4 sm:px-6 py-2 bg-amber-950/40 border-b border-amber-900/40 flex items-center justify-between gap-2 text-[11px] font-mono text-amber-300">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                <strong>STALE TELEMETRY DETECTED:</strong> Last authoritative sync was over 5 minutes ago. Readings are cached.
              </span>
            </div>
            <button
              onClick={() => setShowCachedSources(!showCachedSources)}
              className="text-amber-400 underline hover:text-white shrink-0 text-[10px]"
            >
              {showCachedSources ? 'Hide Sources ▲' : 'Inspect Cached Reads ▼'}
            </button>
          </div>
        )}

        {/* Cached Data Sources List (if expanded) */}
        {showCachedSources && (
          <div className="px-4 sm:px-6 py-3 bg-[#021008] border-b border-emerald-950/80 space-y-2 text-xs font-mono">
            <span className="text-emerald-400 uppercase tracking-wider text-[10px] font-bold block">
              Safe Cached Reads In-Memory
            </span>
            <div className="space-y-1.5">
              {cachedDataSources.map(ds => (
                <div key={ds.key} className="p-2 rounded-lg bg-[#04190e] border border-emerald-950 flex items-center justify-between">
                  <div>
                    <span className="text-white text-xs block">{ds.label}</span>
                    <span className="text-[10px] text-emerald-400/60">{ds.domain} • Cached: {ds.lastSyncFormatted}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    ds.isStale ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300'
                  }`}>
                    {ds.isStale ? 'STALE' : 'FRESH'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Policy Notice: Never Queue Blindly Accordion */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#03150d] border-b border-emerald-950/80 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-emerald-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Policy Rules: High-impact approvals never queue blindly</span>
          </div>
          <button
            onClick={() => setShowPolicyGuidelines(!showPolicyGuidelines)}
            className="text-[10px] text-emerald-400 hover:text-white underline"
          >
            {showPolicyGuidelines ? 'Hide Rules ▲' : 'View Safety Invariants ▼'}
          </button>
        </div>

        {showPolicyGuidelines && (
          <div className="px-4 sm:px-6 py-3 bg-[#020e06] border-b border-emerald-950/80 text-xs font-mono space-y-2 text-emerald-300/90 leading-relaxed">
            <p>
              <strong>NEVER QUEUE BLINDLY PRINCIPLE:</strong> Sensitive approvals (such as chemical formulation dispatches, high-risk job applications, or hardware interlock overrides) require active live verification against backend invariants.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded bg-[#03180c] border border-emerald-900/60 space-y-1">
                <span className="text-emerald-400 font-bold block">✓ Permitted to Queue Offline:</span>
                <ul className="list-disc pl-4 text-emerald-400/70 space-y-0.5">
                  <li>Worker observations &amp; daily logs</li>
                  <li>Mortality tallies &amp; water readings</li>
                  <li>Inspection photos &amp; task checklists</li>
                </ul>
              </div>
              <div className="p-2 rounded bg-[#180507] border border-rose-900/60 space-y-1 text-rose-200">
                <span className="text-rose-400 font-bold block">✕ Live Only (Never Queued):</span>
                <ul className="list-disc pl-4 text-rose-300/70 space-y-0.5">
                  <li>Chemical &amp; hazardous dispatches</li>
                  <li>Safety interlock overrides</li>
                  <li>Sensitive job submissions</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 5. Filter Chips & Queue Counts */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#03140c] border-b border-emerald-950/80 flex items-center justify-between text-xs font-mono gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === 'all' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-400/70 hover:bg-[#072416]'
              }`}
            >
              All ({queue.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === 'pending' ? 'bg-amber-600 text-black font-bold' : 'text-amber-400/70 hover:bg-[#072416]'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('conflict')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === 'conflict' ? 'bg-purple-600 text-white font-bold' : 'text-purple-400/70 hover:bg-[#072416]'
              }`}
            >
              Conflicts ({conflictCount})
            </button>
            <button
              onClick={() => setFilterStatus('permanent_error')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === 'permanent_error' ? 'bg-rose-700 text-white font-bold' : 'text-rose-400/70 hover:bg-[#072416]'
              }`}
            >
              Halted / Errors
            </button>
          </div>
          <button
            onClick={clearCompleted}
            className="text-[10px] text-emerald-400/60 hover:text-white shrink-0 underline"
          >
            Clear Synced
          </button>
        </div>

        {/* 6. Queue Items Scroll Area */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[55vh] space-y-3.5">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center bg-[#03140c] rounded-xl border border-emerald-950 text-emerald-400/60 font-mono space-y-2">
              <Layers className="w-8 h-8 mx-auto text-emerald-600/40" />
              <p>No offline items in this filter view.</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border text-xs font-mono space-y-3 transition-colors ${
                  item.status === 'conflict'
                    ? 'bg-[#120519] border-purple-900/80 shadow-md'
                    : item.status === 'rejected_permanent'
                    ? 'bg-[#180508] border-rose-900/80'
                    : item.status === 'failed_permanent'
                    ? 'bg-[#180e05] border-amber-900/80'
                    : item.status === 'unsupported'
                    ? 'bg-[#121415] border-zinc-800'
                    : item.status === 'synced'
                    ? 'bg-[#03180d] border-emerald-950'
                    : 'bg-[#03140c] border-emerald-950/80'
                }`}
              >
                {/* Item Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{item.title}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {item.domain}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400/60 block mt-0.5">
                      Action: <strong>{item.actionType}</strong> • Created {item.timestampFormatted}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {renderStatusBadge(item.status, item.requiresUserIntervention)}
                  </div>
                </div>

                {/* Bounded Retries Metadata Display */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] p-2 rounded-lg bg-[#021008] border border-emerald-950">
                  <div>
                    <span className="text-emerald-400/60 block">Retry Count</span>
                    <span className="text-white font-bold">{item.retryCount} of {item.maxRetries} (Bounded)</span>
                  </div>
                  <div>
                    <span className="text-emerald-400/60 block">Intervention Required</span>
                    <span className={item.requiresUserIntervention ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                      {item.requiresUserIntervention ? 'YES (Manual Action)' : 'No (Automated)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-400/60 block">Policy Permitted</span>
                    <span className="text-emerald-300 font-bold">YES (Valid Queueable)</span>
                  </div>
                  <div>
                    <span className="text-emerald-400/60 block">Worker Attribution</span>
                    <span className="text-white truncate block">{item.workerAttribution?.userName || 'Authenticated Worker Required'}</span>
                  </div>
                </div>

                {/* Last Failure Explanation */}
                {item.lastFailure && (
                  <div className={`p-2 rounded-lg text-[11px] leading-relaxed ${
                    item.status === 'conflict'
                      ? 'bg-purple-950/60 border border-purple-800 text-purple-200'
                      : item.status === 'rejected_permanent'
                      ? 'bg-rose-950/60 border border-rose-800 text-rose-200'
                      : item.status === 'unsupported'
                      ? 'bg-zinc-900/80 border border-zinc-700 text-zinc-300'
                      : 'bg-amber-950/40 border border-amber-800 text-amber-200'
                  }`}>
                    <span className="font-bold block mb-0.5">Last Failure / Exception:</span>
                    <span>{item.lastFailure}</span>
                  </div>
                )}

                {/* Conflict Resolution Inspection Drawer */}
                {item.status === 'conflict' && item.conflictDetails && (
                  <div className="p-3.5 rounded-xl bg-[#1c0827] border border-purple-600/80 space-y-3">
                    <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
                      <AlertOctagon className="w-4 h-4 text-purple-400" />
                      <span>Reconciliation Required (Version Mismatch)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-[#0e0414] border border-purple-900/60 space-y-1">
                        <span className="text-purple-400 font-bold block">Central Server Baseline:</span>
                        <p className="text-purple-200">{item.conflictDetails.serverStateDescription}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#0e0414] border border-purple-900/60 space-y-1">
                        <span className="text-emerald-400 font-bold block">Local Queued State:</span>
                        <p className="text-emerald-200">{item.conflictDetails.localStateDescription}</p>
                      </div>
                    </div>
                    {/* Conflict Resolution Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                      <button
                        onClick={() => resolveConflict(item.id, 'use_local')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
                      >
                        Keep Local Data (Attempt Push)
                      </button>
                      <button
                        onClick={() => resolveConflict(item.id, 'accept_server')}
                        className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-bold transition-colors"
                      >
                        Accept Server Baseline
                      </button>
                      <button
                        onClick={() => resolveConflict(item.id, 'discard')}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
                      >
                        Discard Local Item
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirmed Synced Metadata (ONLY on real sync) */}
                {item.status === 'synced' && (
                  <div className="p-2 rounded-lg bg-[#021008] border border-emerald-950 text-[10px] text-emerald-400/80 flex items-center justify-between">
                    <span>Cryptographic Confirmation: {item.confirmationHash?.slice(0, 24)}...</span>
                    <span>Confirmed at {item.confirmedAt}</span>
                  </div>
                )}

                {/* Card Actions Row */}
                <div className="flex items-center justify-between pt-1 border-t border-emerald-950/60 text-[11px]">
                  <span className="text-emerald-400/60">
                    ID: {item.id}
                  </span>
                  <div className="flex items-center gap-2">
                    {(item.status === 'pending' || item.status === 'failed_transient') && (
                      <button
                        onClick={() => syncQueueItem(item.id)}
                        disabled={isEffectivelyOffline || isSyncing}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold text-[10px] flex items-center gap-1"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Sync Now</span>
                      </button>
                    )}
                    {item.status === 'rejected_permanent' && (
                      <button
                        onClick={() => syncQueueItem(item.id)}
                        disabled={isEffectivelyOffline}
                        className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 text-black font-bold text-[10px]"
                        title="Force revalidation after correction"
                      >
                        Force Revalidate
                      </button>
                    )}
                    <button
                      onClick={() => deleteQueueItem(item.id)}
                      className="p-1 rounded text-rose-400/70 hover:text-rose-300 hover:bg-rose-950"
                      title="Discard item from offline queue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 7. Footer Status */}
        <div className="p-3 sm:p-4 border-t border-emerald-950/90 bg-[#021007] text-[11px] font-mono text-emerald-400/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Chief Mobile Resilient Queue • Fail-Closed Invariant Active</span>
          </div>
          <div>
            <span>Max Retries: 3 attempts (Bounded)</span>
          </div>
        </div>

      </div>
    </div>
  );
};
