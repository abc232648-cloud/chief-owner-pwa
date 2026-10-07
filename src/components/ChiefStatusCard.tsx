import React from 'react';
import { Cpu, Database, RefreshCw, ChevronRight, ShieldCheck } from 'lucide-react';
import { ChiefState } from '../types/chief';

interface ChiefStatusCardProps {
  state: ChiefState;
  onOpenSystemDetails: () => void;
}

export const ChiefStatusCard: React.FC<ChiefStatusCardProps> = ({ state, onOpenSystemDetails }) => {
  const provenance = state.compositeProvenance || 'unavailable';
  const isLive = provenance === 'live';
  const isCached = provenance === 'cached';
  const isMock = provenance === 'mock_isolated';
  const isUnavailable = provenance === 'unavailable';

  const sourceLabel = isLive
    ? 'Chief API response • live provenance'
    : isCached
      ? 'Client cache • last known Chief response'
      : isMock
        ? 'Development fixture • simulated data'
        : 'Chief data unavailable';

  const syncLabel = isLive
    ? 'Live response'
    : isCached
      ? state.cacheAgeLabel || 'Cached snapshot'
      : isMock
        ? 'DEV simulation'
        : 'Not synchronized';

  const policyLabel = isLive
    ? `Backend reported: ${state.metrics.policy_engine}`
    : isCached
      ? `Cached: ${state.metrics.policy_engine}`
      : isMock
        ? 'Simulated policy state'
        : 'Policy state unavailable';

  return (
    <section
      id="chief_status_card"
      aria-labelledby="chief-status-title"
      className="rounded-xl border border-emerald-900/40 bg-[#051f13]/90 p-5 shadow-sm hover:border-emerald-800/60 transition-colors"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-950/80">
        <div className="space-y-1">
          <p className={`text-[11px] font-mono uppercase tracking-wider ${
            isLive ? 'text-emerald-400' : isCached ? 'text-sky-300' : isMock ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {sourceLabel}
          </p>
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-full ${
                isLive ? 'bg-emerald-500' : isUnavailable ? 'bg-rose-500' : 'bg-amber-500'
              }`}
            />
            <h2 id="chief-status-title" className="text-lg font-semibold text-white tracking-tight">
              Platform state:{' '}
              <span className={`font-mono ${isLive ? 'text-emerald-400' : isUnavailable ? 'text-rose-400' : 'text-amber-400'}`}>
                {isUnavailable ? 'Unavailable' : state.platform_state}
              </span>
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenSystemDetails}
          className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-800/60 text-xs font-medium text-emerald-200 hover:text-white hover:border-emerald-700 bg-[#0a2e1b] hover:bg-[#0f3e24] transition-colors"
        >
          <span>System details</span>
          <ChevronRight className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
        <div className="rounded-lg bg-[#03140c] border border-emerald-950/80 p-3">
          <div className="flex items-center justify-between text-emerald-300/60 text-xs mb-1">
            <span className="font-mono text-[11px]">Backend</span>
            <Database className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <span className={`text-sm font-semibold font-mono ${isUnavailable ? 'text-rose-400' : 'text-white'}`}>
            {state.reachability === 'reachable' ? 'Reachable' : state.reachability === 'degraded' ? 'Degraded' : state.reachability === 'simulated' ? 'Simulated' : 'Unreachable'}
          </span>
          <p className="mt-1 text-[10px] text-emerald-300/50">No client-side uptime estimate</p>
        </div>

        <div className="rounded-lg bg-[#03140c] border border-emerald-950/80 p-3">
          <div className="flex items-center justify-between text-emerald-300/60 text-xs mb-1">
            <span className="font-mono text-[11px]">Policy state</span>
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <span className={`text-sm font-semibold font-mono ${isLive ? 'text-emerald-300' : 'text-amber-300'}`}>
            {policyLabel}
          </span>
        </div>

        <div className="rounded-lg bg-[#03140c] border border-emerald-950/80 p-3">
          <div className="flex items-center justify-between text-emerald-300/60 text-xs mb-1">
            <span className="font-mono text-[11px]">Data state</span>
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <span className={`text-sm font-semibold font-mono ${isLive ? 'text-white' : 'text-amber-300'}`}>
            {syncLabel}
          </span>
          <p className="mt-1 text-[10px] text-emerald-300/50">{state.lastSyncLabel}</p>
        </div>

        <div className="rounded-lg bg-[#03140c] border border-emerald-950/80 p-3">
          <div className="flex items-center justify-between text-emerald-300/60 text-xs mb-1">
            <span className="font-mono text-[11px]">Agent records</span>
            <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold text-white font-mono">
            {isUnavailable ? 0 : state.agents.length}
          </span>
          <p className="mt-1 text-[10px] text-emerald-300/50">
            {isLive ? 'Reported by live response' : isCached ? 'From cached response' : isMock ? 'DEV fixture records' : 'Unavailable'}
          </p>
        </div>
      </div>
    </section>
  );
};
