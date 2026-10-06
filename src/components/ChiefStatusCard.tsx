import React from 'react';
import { ShieldCheck, Cpu, Database, RefreshCw, ChevronRight } from 'lucide-react';
import { ChiefState } from '../types/chief';

interface ChiefStatusCardProps {
  state: ChiefState;
  onOpenSystemDetails: () => void;
}

export const ChiefStatusCard: React.FC<ChiefStatusCardProps> = ({
  state,
  onOpenSystemDetails
}) => {
  return (
    <div 
      id="chief_status_card"
      className="rounded-xl border border-emerald-900/40 bg-[#051f13]/90 p-5 shadow-sm hover:border-emerald-800/60 transition-colors"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-950/80">
        
        {/* Source Authority & Platform State */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-300/60">
              Source Authority • Backend Chief State
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h3 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              Platform State: <span className="text-emerald-400 font-mono">{state.platform_state}</span>
            </h3>
          </div>
        </div>

        {/* Action: System Details */}
        <button
          onClick={onOpenSystemDetails}
          className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-800/60 text-xs font-medium text-emerald-200 hover:text-white hover:border-emerald-700 bg-[#0a2e1b] hover:bg-[#0f3e24] transition-colors"
        >
          <span>System details</span>
          <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
        </button>
      </div>

      {/* 4 Core Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
        
        {/* Metric 1: Backend */}
        <div className="rounded-lg bg-[#03140c] border border-emerald-950/80 p-3">
          <div className="flex items-center justify-between text-emerald-300/60 text-xs mb-1">
            <span className="font-mono text-[11px]">Backend</span>
            <Database className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-white font-mono">
              {state.metrics.backend}
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">99.98%</span>
          </div>
        </div>

        {/* Metric 2: Policy Engine */}
        <div className="rounded-lg bg-[#03140c] border border-emerald-950/80 p-3">
          <div className="flex items-center justify-between text-emerald-300/60 text-xs mb-1">
            <span className="font-mono text-[11px]">Policy Engine</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-emerald-400 font-mono">
              {state.metrics.policy_engine}
            </span>
            <span className="text-[11px] text-emerald-300/60 font-mono">Enforcing</span>
          </div>
        </div>

        {/* Metric 3: Sync */}
        <div className="rounded-lg bg-[#03140c] border border-emerald-950/80 p-3">
          <div className="flex items-center justify-between text-emerald-300/60 text-xs mb-1">
            <span className="font-mono text-[11px]">Sync State</span>
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-white font-mono">
              {state.metrics.sync}
            </span>
            <span className="text-[11px] text-emerald-300/60 font-mono">Authoritative</span>
          </div>
        </div>

        {/* Metric 4: Agents Active */}
        <div className="rounded-lg bg-[#03140c] border border-emerald-950/80 p-3">
          <div className="flex items-center justify-between text-emerald-300/60 text-xs mb-1">
            <span className="font-mono text-[11px]">Active Agents</span>
            <Cpu className="w-3.5 h-3.5 text-emerald-300" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-white font-mono">
              {state.metrics.agents_active}
            </span>
            <span className="text-[11px] text-emerald-300/60 font-mono">Running</span>
          </div>
        </div>

      </div>
    </div>
  );
};
