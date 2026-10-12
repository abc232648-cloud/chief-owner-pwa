import React from 'react';
import { X, Cpu, ShieldCheck, Activity } from 'lucide-react';
import { AgentState } from '../types/chief';
import { AgentStatusBadge } from './ui/AgentStatusBadge';

interface GenericAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentState | null;
  onNavigateToApprovals: () => void;
}

export const GenericAgentModal: React.FC<GenericAgentModalProps> = ({
  isOpen,
  onClose,
  agent,
  onNavigateToApprovals
}) => {
  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#021209]/85 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-emerald-900/50 bg-[#062416] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="generic-agent-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-950/80 bg-[#04190e]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0a2f1c] border border-emerald-800/60 text-emerald-300 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="generic-agent-title" className="text-base font-semibold text-white tracking-tight">
                  {agent.label}
                </h2>
                <AgentStatusBadge
                  status={agent.status}
                  operationalMode={agent.operationalMode}
                  heartbeat={agent.lastHeartbeat}
                />
              </div>
              <p className="text-xs text-emerald-300/60 mt-0.5">
                {agent.domain || 'Domain not reported'} • Workflows reported: {agent.activeWorkflows}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300/60 hover:text-white hover:bg-[#0a2e1b] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[68vh] space-y-5">
          
          {/* Summary */}
          <div className="p-4 rounded-xl border border-emerald-950/80 bg-[#03140c] space-y-1.5">
            <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block font-semibold">
              Operational Scope &amp; Mission
            </span>
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              {agent.description}
            </p>
            {agent.summary && (
              <p className="text-xs text-emerald-400/80 font-mono pt-1">
                {agent.summary}
              </p>
            )}
          </div>

          {/* Telemetry Metrics Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
              Chief-Reported Domain Fields
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {agent.metrics.map((m, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-xl border border-emerald-950/80 bg-[#03140c] space-y-1"
                >
                  <span className="text-[11px] text-emerald-300/60 block line-clamp-1">
                    {m.label}
                  </span>
                  <span className="text-base font-bold font-mono text-white tabular-nums">
                    {m.value} {m.unit || ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Last Activity & Attention Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Last Meaningful Activity */}
            <div className="p-4 rounded-xl border border-emerald-950/80 bg-[#03140c] space-y-2">
              <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block font-semibold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Last Meaningful Event</span>
              </span>
              {agent.lastActivity ? (
                <div className="space-y-1 text-xs">
                  <p className="text-white leading-snug">{agent.lastActivity.summary}</p>
                  <span className="text-[11px] font-mono text-emerald-400/60 block">
                    Recorded: {agent.lastActivity.timestamp}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-emerald-300/50">No recent events reported in this view.</p>
              )}
            </div>

            {/* Invariants & Policy Bounds */}
            <div className="p-4 rounded-xl border border-emerald-950/80 bg-[#03140c] space-y-2">
              <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Policy &amp; Attention Presentation</span>
              </span>
              <div className="space-y-1.5 text-xs text-emerald-200/80">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-emerald-300/60">Attention items:</span>
                  <span className={agent.attentionItemsCount ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                    {agent.attentionItemsCount ?? 'Not reported'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-emerald-300/60">Policy invariants:</span>
                  <span className="text-emerald-300/70">Not reported here</span>
                </div>
                {agent.attentionItemsCount && agent.attentionItemsCount > 0 ? (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToApprovals();
                    }}
                    className="w-full mt-2 py-1.5 px-3 rounded-lg text-xs font-mono bg-amber-950/60 border border-amber-800 text-amber-300 hover:bg-amber-900/60 transition-colors text-center"
                  >
                    View Attention Queue ({agent.attentionItemsCount})
                  </button>
                ) : null}
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-emerald-950/80 bg-[#04190e] flex items-center justify-between text-xs">
          <span className="font-mono text-[11px] text-emerald-400/60">
            Chief-Reported Presentation Data
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-emerald-800/60 bg-[#0a2f1c] hover:bg-[#0e3b23] text-emerald-100 font-mono text-xs transition-colors"
          >
            Close Domain View
          </button>
        </div>
      </div>
    </div>
  );
};
