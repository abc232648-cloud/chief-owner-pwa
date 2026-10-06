import React from 'react';
import { Cpu, FlaskConical, Radio, AlertOctagon, Pause, PowerOff, Wrench, WifiOff } from 'lucide-react';
import { AgentStatus, FarmOperationalMode } from '../../types/chief';

interface AgentStatusBadgeProps {
  status: AgentStatus;
  operationalMode?: FarmOperationalMode;
  isSimulated?: boolean;
  heartbeat?: string;
  attentionCount?: number;
  className?: string;
}

export const AgentStatusBadge: React.FC<AgentStatusBadgeProps> = ({
  status,
  operationalMode,
  isSimulated = false,
  heartbeat,
  attentionCount,
  className = ''
}) => {
  const normStatus = (status || 'ACTIVE').toUpperCase();

  // Status configuration
  const getStatusBadge = () => {
    switch (normStatus) {
      case 'ACTIVE':
        return {
          classes: 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300',
          dot: 'bg-emerald-400 animate-pulse',
          label: 'ACTIVE'
        };
      case 'ATTENTION':
      case 'DEGRADED':
        return {
          classes: 'bg-amber-950/60 border-amber-800/80 text-amber-300',
          dot: 'bg-amber-400 animate-ping',
          label: 'ATTENTION'
        };
      case 'IDLE':
        return {
          classes: 'bg-[#042013] border-emerald-900/60 text-emerald-400/80',
          dot: 'bg-emerald-500/60',
          label: 'IDLE'
        };
      case 'PAUSED':
        return {
          classes: 'bg-zinc-950/80 border-zinc-800 text-zinc-400',
          dot: 'bg-zinc-500',
          label: 'PAUSED'
        };
      case 'OFFLINE':
        return {
          classes: 'bg-zinc-950 border-zinc-800 text-zinc-500',
          dot: 'bg-zinc-600',
          label: 'OFFLINE'
        };
      case 'DISABLED':
        return {
          classes: 'bg-zinc-950 border-zinc-900 text-zinc-600 line-through',
          dot: 'bg-zinc-700',
          label: 'DISABLED'
        };
      case 'ERROR':
        return {
          classes: 'bg-rose-950/80 border-rose-800 text-rose-300',
          dot: 'bg-rose-500 animate-pulse',
          label: 'ERROR'
        };
      case 'SIMULATION':
        return {
          classes: 'bg-amber-950/80 border-dashed border-amber-700 text-amber-300',
          dot: 'bg-amber-400',
          label: 'SIMULATION'
        };
      default:
        return {
          classes: 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300',
          dot: 'bg-emerald-400',
          label: status
        };
    }
  };

  const statusConfig = getStatusBadge();

  // Mode configuration (Critical requirement: Farm Agent must visibly distinguish LIVE, SIMULATION, NOT CONFIGURED, OFFLINE)
  const resolvedMode: FarmOperationalMode | undefined = operationalMode || (isSimulated ? 'SIMULATION' : undefined);

  return (
    <div className={`inline-flex items-center flex-wrap gap-2 text-xs font-mono ${className}`}>
      
      {/* 1. Primary Status Pill */}
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border font-medium ${statusConfig.classes}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
        <span>{statusConfig.label}</span>
      </span>

      {/* 2. Hardware / Data Provenance Mode Tag */}
      {resolvedMode === 'SIMULATION' && (
        <span 
          title="Data Provenance: Running synthetic software simulation, NOT connected to physical farm equipment"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/70 border border-amber-700/80 text-amber-200 text-[11px] uppercase tracking-wider font-bold shadow-sm"
        >
          <FlaskConical className="w-3.5 h-3.5 text-amber-300" />
          <span>SIMULATION MODE</span>
        </span>
      )}

      {resolvedMode === 'LIVE' && (
        <span 
          title="Data Provenance: Authenticated live physical sensor telemetry feed"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-700/70 text-emerald-300 text-[11px] uppercase tracking-wider font-semibold shadow-sm"
        >
          <Radio className="w-3 h-3 text-emerald-400" />
          <span>LIVE FEED</span>
        </span>
      )}

      {resolvedMode === 'NOT CONFIGURED' && (
        <span 
          title="Data Provenance: Hardware interfaces have not been provisioned or calibrated"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-950/50 border border-purple-800/70 text-purple-300 text-[11px] uppercase tracking-wider font-semibold"
        >
          <Wrench className="w-3 h-3 text-purple-400" />
          <span>NOT CONFIGURED</span>
        </span>
      )}

      {resolvedMode === 'OFFLINE' && (
        <span 
          title="Data Provenance: Telemetry connection to domain nodes is currently disconnected"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-400 text-[11px] uppercase tracking-wider font-semibold"
        >
          <WifiOff className="w-3 h-3 text-zinc-400" />
          <span>OFFLINE</span>
        </span>
      )}

      {/* 3. Attention Items Badge (if any) */}
      {typeof attentionCount === 'number' && attentionCount > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px] font-semibold">
          <AlertOctagon className="w-3 h-3 text-rose-400" />
          <span>{attentionCount} {attentionCount === 1 ? 'Action' : 'Actions'}</span>
        </span>
      )}

      {/* 4. Heartbeat */}
      {heartbeat && (
        <span className="text-emerald-400/50 text-[11px] hidden sm:inline">
          {heartbeat}
        </span>
      )}
    </div>
  );
};
