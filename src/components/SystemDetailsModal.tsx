import React from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';
import { ChiefState } from '../types/chief';

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
  if (!isOpen) return null;

  const prov = state.compositeProvenance || 'unavailable';
  const isLive = prov === 'live';
  const isMock = prov === 'mock_isolated';
  const isCached = prov === 'cached';
  const isUnavailable = prov === 'unavailable';

  const pendingInterlocksCount = state.attentionItems.filter(i => i.status === 'pending').length;

  const sourceSubtitle = 
    isLive ? 'Source Authority: Backend Chief State • Verified Live Telemetry' :
    isCached ? 'Source Authority: Local Snapshot • Unconfirmed Offline Cache' :
    isMock ? 'Source Authority: Development Mock Fixture • Simulated Data' :
    'Source Authority: Unreachable • Telemetry Unavailable';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#021209]/85 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-emerald-900/50 bg-[#062416] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-950/80 bg-[#04190e]">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
              isLive ? 'bg-emerald-950/80 border-emerald-800/60 text-emerald-400' :
              isUnavailable ? 'bg-rose-950/80 border-rose-800/60 text-rose-400' :
              'bg-amber-950/80 border-amber-800/60 text-amber-400'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                System Diagnostics &amp; Telemetry Provenance
              </h2>
              <p className={`text-xs font-mono ${
                isLive ? 'text-emerald-300/80' : isUnavailable ? 'text-rose-300/80' : 'text-amber-300/80'
              }`}>
                {sourceSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300/60 hover:text-white hover:bg-[#0a2e1b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          
          {/* Section 1: Rapid Health Verification Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-300/60 font-bold flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400' : isUnavailable ? 'bg-rose-500' : 'bg-amber-400'}`} />
                Operational Acceptance Verification
              </h3>
              <span className={`text-[11px] font-mono ${isLive ? 'text-emerald-400' : 'text-amber-400'}`}>
                Health Score: {isUnavailable ? 'N/A' : `${state.metrics.healthScore}/100`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Check 1 */}
              <div className="p-4 rounded-xl border border-emerald-950/80 bg-[#03140c] flex items-start gap-3">
                {isLive ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : isUnavailable ? (
                  <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-xs font-semibold text-white">Criterion 1: System Health Determination</h4>
                  <p className="text-[11px] text-emerald-300/70 mt-0.5">
                    Backend: <span className="text-emerald-400 font-mono font-medium">{isUnavailable ? 'Offline' : state.metrics.backend}</span> • 
                    Uptime: <span className="text-white font-mono">{isUnavailable ? 'N/A' : state.metrics.uptime}</span> • 
                    Status: <span className="text-emerald-300 font-mono">{state.status_message}</span>
                  </p>
                  <span className={`inline-block mt-1 text-[10px] font-mono ${
                    isLive ? 'text-emerald-400' : isUnavailable ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    {isLive ? 'Verified with live backend' : isUnavailable ? 'Failed: Chief backend unreachable' : 'Simulated dev fixture — Not live health'}
                  </span>
                </div>
              </div>

              {/* Check 2 */}
              <div className="p-4 rounded-xl border border-emerald-950/80 bg-[#03140c] flex items-start gap-3">
                {pendingInterlocksCount > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                ) : isUnavailable ? (
                  <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-xs font-semibold text-white">Criterion 2: Blocked Processes &amp; Interventions</h4>
                  <p className="text-[11px] text-emerald-300/70 mt-0.5">
                    {isUnavailable ? (
                      <span className="text-rose-300 font-mono">Attention items unavailable: Failed to reach backend inbox.</span>
                    ) : (
                      <>Queued items: <span className="text-amber-400 font-mono font-medium">{pendingInterlocksCount} requiring review</span>. Priority ordering enforced (STOP &gt; ASK &gt; Warning).</>
                    )}
                  </p>
                  {!isUnavailable && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToApprovals();
                      }}
                      className="mt-1 text-[10px] font-mono text-emerald-400 hover:underline"
                    >
                      Open Attention Inbox →
                    </button>
                  )}
                </div>
              </div>

              {/* Check 3 */}
              <div className="p-4 rounded-xl border border-emerald-950/80 bg-[#03140c] flex items-start gap-3">
                {isLive ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-xs font-semibold text-white">Criterion 3: Active Agent Status</h4>
                  <p className="text-[11px] text-emerald-300/70 mt-0.5">
                    {isLive 
                      ? 'Autonomous agents healthy. Heartbeats verified against Chief Engine.'
                      : isMock 
                      ? 'Simulated agent loop active. Synthetic heartbeats, not verified against live engine.'
                      : isCached
                      ? 'Cached agent state. Live heartbeat evidence not confirmed.'
                      : 'Agent telemetry unavailable. No heartbeat evidence.'
                    }
                  </p>
                  <span className={`inline-block mt-1 text-[10px] font-mono ${
                    isLive ? 'text-emerald-400' : isUnavailable ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    {isLive ? 'Heartbeat pulses verified' : isUnavailable ? 'Heartbeat unverified' : 'Simulated heartbeats'}
                  </span>
                </div>
              </div>

              {/* Check 4 */}
              <div className="p-4 rounded-xl border border-emerald-950/80 bg-[#03140c] flex items-start gap-3">
                {isLive ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : isUnavailable ? (
                  <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-xs font-semibold text-white">Criterion 4: Currency &amp; Sync Verification</h4>
                  <p className="text-[11px] text-emerald-300/70 mt-0.5">
                    Mode: <span className="text-white font-mono">{state.connectivity.toUpperCase()}</span> • 
                    Status: <span className="text-emerald-300 font-mono">{state.lastSyncLabel}</span> • 
                    Timestamp: <span className="text-emerald-200/80 font-mono">{state.lastSyncTimestamp}</span>
                  </p>
                  <span className={`inline-block mt-1 text-[10px] font-mono ${
                    isLive ? 'text-emerald-400' : isUnavailable ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    {isLive ? 'Authoritative state verified' : isCached ? 'Cached snapshot — Not live' : isMock ? 'Synthetic data — Not authoritative' : 'Unsynchronized — Telemetry unavailable'}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Policy Engine Invariants */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-300/60 font-bold">
              Chief Policy Engine Active Invariants
            </h3>
            
            <div className="rounded-xl border border-emerald-950/80 bg-[#03140c] divide-y divide-emerald-950/80 text-xs font-mono">
              <div className="p-3 flex items-center justify-between">
                <span className="text-emerald-200/80">INV-01: Single Source of Truth</span>
                <span className={`font-semibold ${
                  isLive ? 'text-emerald-400' : isUnavailable ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {isLive ? 'ENFORCED (Backend Authoritative)' : isMock ? 'SIMULATED (Development Fixture)' : isCached ? 'UNCONFIRMED (Offline Cache Snapshot)' : 'UNVERIFIED (Backend Unreachable)'}
                </span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-emerald-200/80">INV-02: Hardware STOP Interlock Immutability</span>
                <span className="text-emerald-400 font-semibold">ENFORCED (Client Remote Overrides Prohibited)</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-emerald-200/80">INV-03: External Dispatch ASK Gate</span>
                <span className="text-emerald-400 font-semibold">ENFORCED (Human Approval Gate Mandatory)</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-emerald-200/80">INV-04: Zero Token &amp; Credential Transmission</span>
                <span className="text-emerald-400 font-semibold">ENFORCED (Sanitized Payload Boundary)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-emerald-950/80 bg-[#04190e] flex items-center justify-between text-xs font-mono text-emerald-400/50">
          <span>Backend Chief State Core v2.4.1</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0a2e1b] hover:bg-[#0f3d24] text-emerald-200 font-medium text-xs border border-emerald-800/60 transition-colors"
          >
            Dismiss Diagnostics
          </button>
        </div>

      </div>
    </div>
  );
};
