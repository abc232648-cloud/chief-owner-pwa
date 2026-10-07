import React from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';
import { ChiefState } from '../types/chief';
import { useChief } from '../context/ChiefContext';

interface SystemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: ChiefState;
  onNavigateToApprovals: () => void;
}

export const SystemDetailsModal: React.FC<SystemDetailsModalProps> = ({
  isOpen,
  onClose,
  state,
  onNavigateToApprovals
}) => {
  const { healthState, networkOnline, chiefReachability, syncStatus } = useChief();

  if (!isOpen) return null;

  const provenance = state.compositeProvenance || 'unavailable';
  const isLive = provenance === 'live';
  const isCached = provenance === 'cached';
  const isMock = provenance === 'mock_isolated';
  const isUnavailable = provenance === 'unavailable';
  const backendInvariantEvidence = healthState.provenance === 'live' && healthState.invariantsPassed === true;
  const pendingAttentionCount = state.attentionItems.filter(item => item.status === 'pending').length;

  const sourceSubtitle = isLive
    ? 'Live Chief API data received; individual claims require their own evidence'
    : isCached
      ? 'Cached Chief response; live state is not currently reverified'
      : isMock
        ? 'Development fixture; simulated data only'
        : 'Chief data unavailable';

  const sourceTone = isLive ? 'text-emerald-300/80' : isUnavailable ? 'text-rose-300/80' : 'text-amber-300/80';

  const invariantLabel = backendInvariantEvidence
    ? 'Backend health response reports invariants passed'
    : 'Client-required rule — not currently backend-verified';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#021209]/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="system-details-title"
    >
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-emerald-900/50 bg-[#062416] shadow-2xl overflow-hidden">
        <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-emerald-950/80 bg-[#04190e]">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
              isLive ? 'bg-emerald-950/80 border-emerald-800/60 text-emerald-400' :
              isUnavailable ? 'bg-rose-950/80 border-rose-800/60 text-rose-400' :
              'bg-amber-950/80 border-amber-800/60 text-amber-400'
            }`}>
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 id="system-details-title" className="text-base font-semibold text-white tracking-tight">
                System diagnostics &amp; data provenance
              </h2>
              <p className={`text-xs font-mono ${sourceTone}`}>{sourceSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close system diagnostics"
            className="p-1.5 rounded-lg text-emerald-300/60 hover:text-white hover:bg-[#0a2e1b] transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </header>

        <div className="p-6 overflow-y-auto space-y-6">
          <section aria-labelledby="diagnostics-connectivity-title" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 id="diagnostics-connectivity-title" className="text-xs font-mono uppercase tracking-wider text-emerald-300/60 font-bold">
                Connectivity and evidence state
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                isLive ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300' :
                isUnavailable ? 'bg-rose-950/70 border-rose-800 text-rose-300' :
                'bg-amber-950/70 border-amber-800 text-amber-300'
              }`}>
                {provenance.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-xl border border-emerald-950/80 bg-[#03140c]">
                <div className="flex items-start gap-3">
                  {networkOnline ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" /> : <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" aria-hidden="true" />}
                  <div>
                    <h4 className="font-semibold text-white">Device network</h4>
                    <p className="mt-1 text-emerald-300/70 font-mono">{networkOnline ? 'Browser reports online' : 'Browser reports offline'}</p>
                    <p className="mt-1 text-[10px] text-emerald-400/50">Internet state alone does not prove Chief reachability.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-950/80 bg-[#03140c]">
                <div className="flex items-start gap-3">
                  {chiefReachability === 'reachable' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" /> : <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />}
                  <div>
                    <h4 className="font-semibold text-white">Chief backend</h4>
                    <p className="mt-1 text-emerald-300/70 font-mono">Reachability: {chiefReachability}</p>
                    <p className="mt-1 text-[10px] text-emerald-400/50">Synchronization: {syncStatus.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-950/80 bg-[#03140c]">
                <div className="flex items-start gap-3">
                  {healthState.provenance === 'live' && healthState.healthy ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" /> : <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />}
                  <div>
                    <h4 className="font-semibold text-white">Health endpoint</h4>
                    <p className="mt-1 text-emerald-300/70 font-mono">{healthState.label}</p>
                    <p className="mt-1 text-[10px] text-emerald-400/50">
                      Provenance: {healthState.provenance.replace('_', ' ')}{healthState.latencyMs >= 0 ? ` • ${healthState.latencyMs} ms` : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-950/80 bg-[#03140c]">
                <div className="flex items-start gap-3">
                  {pendingAttentionCount > 0 ? <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" /> : <HelpCircle className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />}
                  <div>
                    <h4 className="font-semibold text-white">Attention records</h4>
                    <p className="mt-1 text-emerald-300/70 font-mono">
                      {isUnavailable ? 'Unavailable' : `${pendingAttentionCount} pending record${pendingAttentionCount === 1 ? '' : 's'}`}
                    </p>
                    {!isUnavailable && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToApprovals();
                        }}
                        className="mt-2 text-[10px] font-mono text-emerald-400 hover:underline"
                      >
                        Open attention inbox →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="diagnostics-source-title" className="space-y-3">
            <h3 id="diagnostics-source-title" className="text-xs font-mono uppercase tracking-wider text-emerald-300/60 font-bold">
              Resource provenance
            </h3>
            <div className="rounded-xl border border-emerald-950/80 bg-[#03140c] divide-y divide-emerald-950/80 text-xs font-mono">
              {(['system', 'agents', 'attention', 'activity'] as const).map(resource => (
                <div key={resource} className="p-3 flex items-center justify-between gap-4">
                  <span className="text-emerald-200/90 capitalize">{resource}</span>
                  <span className="text-emerald-400 uppercase">{state.resourceProvenance?.[resource]?.replace('_', ' ') || 'unavailable'}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-emerald-300/60 font-mono">
              Last state label: {state.lastSyncLabel}. A live transport response does not by itself prove heartbeat, policy enforcement, cryptographic signing, or uptime.
            </p>
          </section>

          <section aria-labelledby="diagnostics-invariants-title" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 id="diagnostics-invariants-title" className="text-xs font-mono uppercase tracking-wider text-emerald-300/60 font-bold">
                Chief safety contract
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                backendInvariantEvidence ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300' : 'bg-amber-950/70 border-amber-800 text-amber-300'
              }`}>
                {backendInvariantEvidence ? 'health response verified' : 'client requirement'}
              </span>
            </div>
            <div className="rounded-xl border border-emerald-950/80 bg-[#03140c] divide-y divide-emerald-950/80 text-xs font-mono">
              {[
                ['Single source of truth', 'Mobile does not create Chief authority'],
                ['STOP immutability', 'Mobile cannot override STOP'],
                ['ASK gate', 'Mobile cannot silently convert ASK to AUTO'],
                ['Credential boundary', 'Client must not persist backend secrets or raw auth headers']
              ].map(([title, detail]) => (
                <div key={title} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                  <div>
                    <span className="text-emerald-200/90 block">{title}</span>
                    <span className="text-[10px] text-emerald-400/50">{detail}</span>
                  </div>
                  <span className={backendInvariantEvidence ? 'text-emerald-400' : 'text-amber-400'}>{invariantLabel}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="px-6 py-3 border-t border-emerald-950/80 bg-[#04190e] flex items-center justify-between gap-3 text-xs font-mono text-emerald-400/50">
          <span>Chief Mobile client diagnostics</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0a2e1b] hover:bg-[#0f3d24] text-emerald-200 font-medium text-xs border border-emerald-800/60 transition-colors"
          >
            Dismiss diagnostics
          </button>
        </footer>
      </div>
    </div>
  );
};
