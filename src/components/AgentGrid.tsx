import React from 'react';
import { Briefcase, Sprout, Zap, Cpu, ArrowUpRight, AlertCircle } from 'lucide-react';
import { AgentState } from '../types/chief';

interface AgentGridProps {
  agents: AgentState[];
  onOpenAgent: (agentId: string) => void;
}

export const AgentGrid: React.FC<AgentGridProps> = ({
  agents,
  onOpenAgent
}) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'job_agent': return Briefcase;
      case 'farm_agent': return Sprout;
      case 'energy_agent': return Zap;
      default: return Cpu;
    }
  };

  return (
    <section id="agent_overview" aria-label="Agent Overview" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-emerald-100 tracking-tight flex items-center gap-2">
          <span>Active Agents</span>
          <span className="text-xs font-mono text-emerald-400/60 font-normal">
            ({agents.length} Autonomous Units)
          </span>
        </h2>
        <span className="text-[11px] font-mono text-emerald-400/60">
          Heartbeats synchronized
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent) => {
          const Icon = getIcon(agent.agent_id);
          return (
            <div
              key={agent.agent_id}
              className="rounded-xl border border-emerald-900/40 bg-[#052114]/90 p-5 flex flex-col justify-between hover:border-emerald-800/60 transition-all group shadow-sm"
            >
              <div>
                
                {/* Header: Label, Status, and Heartbeat */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#0a2f1c] text-emerald-300 border border-emerald-800/60">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-white tracking-tight">
                          {agent.label}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {agent.status}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-300/60 mt-0.5 line-clamp-1">
                        {agent.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Simulation Warning for Farm Agent if present */}
                {agent.simulation_warning && (
                  <div className="mb-4 px-3 py-2 rounded-lg bg-amber-950/30 border border-amber-900/50 text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span className="text-[11px] leading-relaxed">
                      {agent.simulation_warning}
                    </span>
                  </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {agent.metrics.map((metric, idx) => {
                    const isAlertValue = metric.label === 'Approvals required' && Number(metric.value) > 0;
                    const isWarningValue = metric.label === 'Warnings' && Number(metric.value) > 0;
                    return (
                      <div 
                        key={idx}
                        className={`rounded-lg p-2.5 border transition-colors ${
                          isAlertValue 
                            ? 'bg-amber-950/20 border-amber-900/50 text-amber-300' 
                            : isWarningValue
                            ? 'bg-yellow-950/20 border-yellow-900/40 text-yellow-300'
                            : 'bg-[#03150d] border-emerald-950/80 text-emerald-100'
                        }`}
                      >
                        <div className="text-[11px] text-emerald-300/60 truncate">
                          {metric.label}
                        </div>
                        <div className="text-base font-semibold font-mono tabular-nums text-white mt-0.5 flex items-baseline justify-between">
                          <span>{metric.value}</span>
                          {isAlertValue && (
                            <span className="text-[10px] text-amber-400 font-mono">Action</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-emerald-950/80 flex items-center justify-between">
                <span className="text-[11px] text-emerald-400/60 font-mono">
                  Heartbeat: {agent.lastHeartbeat}
                </span>
                <button
                  onClick={() => onOpenAgent(agent.agent_id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide bg-[#0a2e1b] hover:bg-[#0f3e24] text-emerald-200 border border-emerald-800/60 transition-all"
                >
                  <span>Open {agent.label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </section>
  );
};
