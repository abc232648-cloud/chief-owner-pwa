import React, { useState } from 'react';
import { AlertCircle, AlertOctagon, CheckCircle2, Clock, Database, RotateCw, Trash2, Wifi, WifiOff, X, XCircle } from 'lucide-react';
import { useOfflineQueue } from '../../context/OfflineQueueContext';
import { useChief } from '../../context/ChiefContext';
import { useAuth } from '../../context/AuthContext';
import { QueueItemStatus } from '../../types/queue';

interface OfflineQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function StatusBadge({ status }: { status: QueueItemStatus }) {
  const config: Record<QueueItemStatus, { label: string; classes: string }> = {
    pending: { label: 'LOCAL PENDING', classes: 'bg-amber-950 border-amber-700 text-amber-300' },
    syncing: { label: 'REQUEST IN FLIGHT', classes: 'bg-sky-950 border-sky-700 text-sky-300' },
    synced: { label: 'CHIEF CONFIRMED', classes: 'bg-emerald-950 border-emerald-700 text-emerald-300' },
    failed_transient: { label: 'TRANSIENT FAILURE', classes: 'bg-amber-950 border-amber-700 text-amber-300' },
    failed_permanent: { label: 'LOCAL FAILURE', classes: 'bg-zinc-900 border-zinc-700 text-zinc-300' },
    rejected_permanent: { label: 'CHIEF REJECTED', classes: 'bg-rose-950 border-rose-700 text-rose-300' },
    conflict: { label: 'UNRESOLVED CONFLICT', classes: 'bg-purple-950 border-purple-700 text-purple-300' },
    unsupported: { label: 'SYNC NOT PROVISIONED', classes: 'bg-zinc-900 border-zinc-700 text-zinc-300' }
  };
  const item = config[status];
  return <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${item.classes}`}>{item.label}</span>;
}

export const OfflineQueueModal: React.FC<OfflineQueueModalProps> = ({ isOpen, onClose }) => {
  const {
    queue,
    pendingCount,
    conflictCount,
    isSyncing,
    lastSyncTimestamp,
    syncState,
    isDataStale,
    isEffectivelyOffline,
    syncQueueItem,
    syncAllEligible,
    resolveConflict,
    deleteQueueItem,
    clearCompleted,
    cachedDataSources
  } = useOfflineQueue();
  const { networkOnline, chiefReachability, toggleConnectivity } = useChief();
  const { isDevMode } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'conflict' | 'error' | 'synced'>('all');
  const [showCache, setShowCache] = useState(false);

  if (!isOpen) return null;

  const filtered = queue.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['pending', 'syncing', 'failed_transient'].includes(item.status);
    if (filter === 'conflict') return item.status === 'conflict';
    if (filter === 'error') return ['failed_permanent', 'rejected_permanent', 'unsupported'].includes(item.status);
    return item.status === 'synced';
  });

  const canAttemptSync = networkOnline && chiefReachability !== 'unreachable' && !isEffectivelyOffline;
  const lastSyncText = lastSyncTimestamp
    ? `Last confirmed queue synchronization: ${new Date(lastSyncTimestamp).toLocaleString()}`
    : 'No confirmed queue synchronization has been recorded on this client.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md" role="presentation">
      <div className="relative w-full max-w-3xl bg-[#041a10] border border-emerald-900/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="offline-queue-title">
        <header className="p-4 sm:p-5 border-b border-emerald-950/90 bg-[#03140c] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0a2e1b] border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0"><Database className="w-5 h-5" aria-hidden="true" /></div>
            <div>
              <h2 id="offline-queue-title" className="text-base font-bold text-white font-mono">Offline queue &amp; synchronization</h2>
              <p className="text-xs text-emerald-300/60 font-mono mt-0.5">{lastSyncText}</p>
              <p className="text-[10px] text-emerald-400/50 mt-1">Local persistence is not Chief acceptance. Only positive backend proof moves an item to CHIEF CONFIRMED.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => void syncAllEligible()}
              disabled={isSyncing || !canAttemptSync || pendingCount === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white flex items-center gap-1.5"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} aria-hidden="true" /> Attempt sync ({pendingCount})
            </button>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-emerald-300/60 hover:text-white hover:bg-[#0a2e1b]" aria-label="Close offline queue"><X className="w-5 h-5" aria-hidden="true" /></button>
          </div>
        </header>

        <section className="px-4 sm:px-5 py-3 border-b border-emerald-950/80 bg-[#03150d] grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono" aria-label="Connectivity status">
          <div className="rounded-lg border border-emerald-950/80 bg-[#021008] p-2.5 flex items-center gap-2">
            {networkOnline ? <Wifi className="w-4 h-4 text-emerald-400" aria-hidden="true" /> : <WifiOff className="w-4 h-4 text-rose-400" aria-hidden="true" />}
            <div><span className="text-emerald-300/60 block">Device network</span><strong className={networkOnline ? 'text-emerald-300' : 'text-rose-300'}>{networkOnline ? 'ONLINE' : 'OFFLINE'}</strong></div>
          </div>
          <div className="rounded-lg border border-emerald-950/80 bg-[#021008] p-2.5"><span className="text-emerald-300/60 block">Chief reachability</span><strong className={chiefReachability === 'reachable' ? 'text-emerald-300' : 'text-amber-300'}>{chiefReachability.toUpperCase()}</strong></div>
          <div className="rounded-lg border border-emerald-950/80 bg-[#021008] p-2.5"><span className="text-emerald-300/60 block">Queue sync state</span><strong className={syncState === 'CURRENT' ? 'text-emerald-300' : 'text-amber-300'}>{syncState.replace('_', ' ')}</strong></div>
          {isDevMode && <button type="button" onClick={toggleConnectivity} className="sm:col-span-3 justify-self-start px-2 py-1 rounded border border-amber-700 text-amber-300 bg-amber-950/30">DEV: toggle simulated client connectivity</button>}
        </section>

        {(isDataStale || syncState === 'NEVER_SYNCED') && (
          <div className="px-4 sm:px-5 py-2.5 border-b border-amber-900/50 bg-amber-950/20 text-xs text-amber-200 flex items-start gap-2">
            <Clock className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <strong>{syncState === 'NEVER_SYNCED' ? 'Never synchronized.' : 'Cached data is stale.'}</strong>{' '}
              This client does not infer current Chief state from local queue availability.
              {cachedDataSources.length > 0 && <button type="button" onClick={() => setShowCache(value => !value)} className="ml-2 underline text-amber-300">{showCache ? 'Hide cache details' : 'Show cache details'}</button>}
            </div>
          </div>
        )}

        {showCache && cachedDataSources.length > 0 && (
          <div className="px-4 sm:px-5 py-3 border-b border-emerald-950/80 bg-[#021008] space-y-2">
            {cachedDataSources.map(source => (
              <div key={source.key} className="rounded-lg border border-emerald-950/80 bg-[#04190e] p-2 text-[11px] font-mono flex justify-between gap-3"><span className="text-emerald-200">{source.label}</span><span className={source.isStale ? 'text-amber-300' : 'text-emerald-300'}>{source.lastSyncFormatted}</span></div>
            ))}
          </div>
        )}

        <nav className="px-4 sm:px-5 py-2 border-b border-emerald-950/80 bg-[#03140c] flex gap-1 overflow-x-auto" aria-label="Queue filters">
          {([
            ['all', `All (${queue.length})`],
            ['pending', `Pending (${pendingCount})`],
            ['conflict', `Conflicts (${conflictCount})`],
            ['error', 'Errors'],
            ['synced', 'Confirmed']
          ] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setFilter(id)} aria-pressed={filter === id} className={`px-3 py-1.5 rounded-lg text-[11px] font-mono whitespace-nowrap ${filter === id ? 'bg-emerald-600 text-white' : 'text-emerald-300/70 hover:bg-[#082a19]'}`}>{label}</button>
          ))}
        </nav>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-emerald-950/80 bg-[#03140c] p-6 text-center"><CheckCircle2 className="w-7 h-7 text-emerald-500/60 mx-auto" aria-hidden="true" /><p className="text-sm text-white mt-2">No queue items in this filter</p></div>
          ) : filtered.map(item => (
            <article key={item.id} className="rounded-xl border border-emerald-950/80 bg-[#03140c] p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><p className="text-[10px] font-mono text-emerald-400/50">LOCAL QUEUE ID: {item.id}</p><h3 className="text-sm font-semibold text-white mt-0.5">{item.title}</h3><p className="text-xs text-emerald-300/60">{item.domain} • {item.actionType}</p></div>
                <StatusBadge status={item.status} />
              </div>

              {item.lastFailure && <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-2.5 text-xs text-amber-200 flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" /><span>{item.lastFailure}</span></div>}

              {item.status === 'synced' && <p className="text-[11px] font-mono text-emerald-300">Backend proof: {item.confirmationHash || 'missing — item should not be considered confirmed'}</p>}

              {item.status === 'conflict' && item.conflictDetails && (
                <div className="rounded-lg border border-purple-800/60 bg-purple-950/20 p-3 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-purple-300"><AlertOctagon className="w-4 h-4" aria-hidden="true" /><strong>Unresolved conflict — no reconciliation has occurred.</strong></div>
                  <p className="text-purple-200/70">Local: {item.conflictDetails.localStateDescription}</p>
                  <p className="text-purple-200/70">Chief-reported: {item.conflictDetails.serverStateDescription}</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void resolveConflict(item.id, 'use_local')} className="px-2.5 py-1 rounded border border-purple-700 text-purple-200">Request use local</button>
                    <button type="button" onClick={() => void resolveConflict(item.id, 'accept_server')} className="px-2.5 py-1 rounded border border-purple-700 text-purple-200">Accept server state</button>
                    <button type="button" onClick={() => void resolveConflict(item.id, 'discard')} className="px-2.5 py-1 rounded border border-zinc-700 text-zinc-300">Discard local item</button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-950/60">
                <span className="text-[10px] font-mono text-emerald-400/50">Retries: {item.retryCount}/{item.maxRetries} • Created {item.timestampFormatted}</span>
                <div className="flex gap-2">
                  {['pending', 'failed_transient'].includes(item.status) && <button type="button" onClick={() => void syncQueueItem(item.id)} disabled={!canAttemptSync || isSyncing} className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-700 text-emerald-200 text-[11px] disabled:opacity-40">Attempt sync</button>}
                  <button type="button" onClick={() => void deleteQueueItem(item.id)} className="px-2.5 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-rose-300 text-[11px] flex items-center gap-1"><Trash2 className="w-3 h-3" aria-hidden="true" /> Delete local</button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <footer className="px-4 sm:px-5 py-3 border-t border-emerald-950/80 bg-[#03140c] flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-emerald-400/50">
          <span>Network online ≠ Chief reachable ≠ Chief accepted. These states remain separate.</span>
          <button type="button" onClick={() => void clearCompleted()} className="text-emerald-300 hover:underline">Clear locally stored confirmed items</button>
        </footer>
      </div>
    </div>
  );
};
