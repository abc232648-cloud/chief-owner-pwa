import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChief } from '../context/ChiefContext';
import { useAuth } from '../context/AuthContext';
import { FarmOperationalMode } from '../types/chief';
import { Card } from '../components/ui/Card';
import { AgentStatusBadge } from '../components/ui/AgentStatusBadge';
import { WarningBanner } from '../components/ui/WarningBanner';
import { ActionButton } from '../components/ui/ActionButton';
import { JobAgentModal } from '../components/JobAgentModal';
import { FarmAgentModal } from '../components/FarmAgentModal';
import { GenericAgentModal } from '../components/GenericAgentModal';
import { EmptyState } from '../components/ui/EmptyState';
import { 
  ArrowUpRight, 
  AlertOctagon, 
  Activity, 
  Layers, 
  FlaskConical, 
  Radio, 
  Wrench, 
  WifiOff, 
  CheckCircle2 
} from 'lucide-react';

export const AgentsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useChief();
  const { isDevMode } = useAuth();

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [farmModeOverride, setFarmModeOverride] = useState<FarmOperationalMode | null>(null);
  const [filterDomain, setFilterDomain] = useState<string>('all');

  const domains = ['all', ...Array.from(new Set(state.agents.map(a => a.domain || 'Core Engine').filter(Boolean)))];
  const filteredAgents = state.agents.filter(agent => {
    if (filterDomain === 'all') return true;
    return (agent.domain || 'Core Engine') === filterDomain;
  });

  const selectedAgent = state.agents.find(a => a.agent_id === selectedAgentId) || null;

  const agnProv = state.resourceProvenance?.agents || state.compositeProvenance;
  const isProvUnavailable = agnProv === 'unavailable';
  const isProvCached = agnProv === 'cached';
  const isProvMock = agnProv === 'mock_isolated';

  return (
    <div className="space-y-6 pb-24">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
            AGENT DOMAINS
          </h1>
          <p className="text-xs text-emerald-300/60 mt-0.5">
            {isProvUnavailable 
              ? 'Agent telemetry unavailable from Chief backend'
              : `${state.agents.length} Autonomous subsystems registered with Chief Central Policy Engine`}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono border flex items-center gap-1.5 shadow-sm ${
            agnProv === 'live' ? 'bg-[#062416] border-emerald-900/60 text-emerald-300' :
            agnProv === 'cached' ? 'bg-sky-950/40 border-sky-800 text-sky-200' :
            agnProv === 'mock_isolated' ? 'bg-amber-950/40 border-amber-800 text-amber-200' :
            'bg-rose-950/40 border-rose-900 text-rose-200'
          }`}>
            <Layers className="w-3.5 h-3.5" />
            <span>
              {agnProv === 'live' ? 'Policy System: Live' :
               agnProv === 'cached' ? 'Policy System: Cached' :
               agnProv === 'mock_isolated' ? 'Policy System: Simulated' :
               'Policy System: Unavailable'}
            </span>
          </span>
        </div>
      </div>

      {/* 2. Boundary Notice */}
      <WarningBanner
        level="simulation"
        title="Authoritative Data Provenance Boundary"
        message="Chief enforces strict isolation between live telemetry and synthetic simulation. Simulated Farm Agent inputs are strictly tagged to prevent mistaken operational execution."
      />

      {/* 3. Domain Filter */}
      {domains.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] font-mono text-emerald-400/60 uppercase tracking-wider mr-1">
            Filter:
          </span>
          {domains.map((dom) => (
            <button
              key={dom}
              onClick={() => setFilterDomain(dom)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors whitespace-nowrap ${
                filterDomain === dom 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'bg-[#062416] text-emerald-300/70 border border-emerald-950 hover:border-emerald-800'
              }`}
            >
              {dom === 'all' ? 'All Subsystems' : dom}
            </button>
          ))}
        </div>
      )}

      {/* 4. Data-Driven Agent Cards List */}
      <div className="space-y-4">
        {filteredAgents.length === 0 ? (
          <EmptyState
            title={isProvUnavailable ? "Agent Telemetry Unavailable" : "No Subsystems Found"}
            description={
              isProvUnavailable 
                ? "Cannot reach the Chief backend to inspect registered agent domains. Check network connection or Chief server status." 
                : "No autonomous agent subsystems match the selected filter."
            }
          />
        ) : (
          filteredAgents.map((agent) => {
          const isFarm = agent.agent_id === 'farm_agent';
          // In production, mode strictly comes from Chief backend state
          const effectiveMode = isFarm && isDevMode && farmModeOverride 
            ? farmModeOverride 
            : (agent.operationalMode || (agent.simulation_warning ? 'SIMULATION' : undefined));

          return (
            <Card
              key={agent.agent_id}
              id={`agent-card-${agent.agent_id}`}
              className="relative overflow-hidden"
              title={agent.label}
              subtitle={agent.domain || 'Autonomous Chief Subsystem'}
              action={
                <AgentStatusBadge
                  status={agent.status}
                  operationalMode={effectiveMode}
                  attentionCount={agent.attentionItemsCount}
                  heartbeat={agent.lastHeartbeat}
                />
              }
              footer={
                <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-[11px] font-mono text-emerald-400/60">
                    <span>Workflows: {agent.activeWorkflows}</span>
                    <span>•</span>
                    <span>Heartbeat: {agent.lastHeartbeat}</span>
                  </div>
                  <ActionButton
                    variant="secondary"
                    size="sm"
                    icon={<ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />}
                    onClick={() => setSelectedAgentId(agent.agent_id)}
                  >
                    Open {agent.label} Domain
                  </ActionButton>
                </div>
              }
            >
              {/* Short Meaningful Summary */}
              <div className="text-xs text-emerald-200/90 leading-relaxed font-sans">
                {agent.summary || agent.description}
              </div>

              {/* Farm Agent Visible Distinction Switcher (DEV MODE ONLY) */}
              {isFarm && isDevMode && (
                <div className="p-3 rounded-xl border border-amber-900/60 bg-[#0c1403] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-amber-300 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      [DEV SIMULATION TOOLING] Mode Override:
                    </span>
                    <span className="text-amber-400/80 text-[10px]">
                      Selected: <strong className="text-white">{effectiveMode}</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-mono">
                    {(['LIVE', 'SIMULATION', 'NOT CONFIGURED', 'OFFLINE'] as FarmOperationalMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setFarmModeOverride(mode)}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                          effectiveMode === mode 
                            ? mode === 'LIVE'
                              ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-sm'
                              : mode === 'SIMULATION'
                              ? 'bg-amber-950 border-amber-500 text-amber-200 shadow-sm'
                              : mode === 'NOT CONFIGURED'
                              ? 'bg-purple-950 border-purple-500 text-purple-200 shadow-sm'
                              : 'bg-zinc-900 border-zinc-500 text-zinc-300 shadow-sm'
                            : 'bg-[#062416] border-emerald-950 text-emerald-400/60 hover:text-white hover:border-emerald-800'
                        }`}
                      >
                        {mode === 'LIVE' && <Radio className="w-3 h-3 text-emerald-400" />}
                        {mode === 'SIMULATION' && <FlaskConical className="w-3 h-3 text-amber-400" />}
                        {mode === 'NOT CONFIGURED' && <Wrench className="w-3 h-3 text-purple-400" />}
                        {mode === 'OFFLINE' && <WifiOff className="w-3 h-3 text-zinc-400" />}
                        <span>{mode}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Data-Driven Domain Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                {agent.metrics.map((m, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2.5 rounded-xl border transition-colors ${
                      m.highlight 
                        ? 'bg-[#082d1c] border-emerald-700/60 shadow-sm' 
                        : 'bg-[#03140c] border-emerald-950/80'
                    }`}
                  >
                    <span className="text-emerald-300/60 text-[11px] block line-clamp-1">
                      {m.label}
                    </span>
                    <span className="text-base font-bold font-mono text-white tabular-nums">
                      {m.value} {m.unit || ''}
                    </span>
                  </div>
                ))}
              </div>

              {/* Last Meaningful Activity */}
              {agent.lastActivity && (
                <div className="pt-1 flex items-start gap-2 text-xs text-emerald-300/70">
                  <Activity className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-white font-medium">{agent.lastActivity.summary}</span>
                    <span className="text-[11px] font-mono text-emerald-400/50 ml-2">
                      ({agent.lastActivity.timestamp})
                    </span>
                  </div>
                </div>
              )}

              {/* Attention Badge or Nominal Indicator */}
              <div className="pt-1 flex items-center justify-between text-xs border-t border-emerald-950/70">
                {agent.attentionItemsCount && agent.attentionItemsCount > 0 ? (
                  <div className="flex items-center gap-1.5 text-amber-300 text-xs font-mono font-medium">
                    <AlertOctagon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      {agent.attentionItemsCount} {agent.attentionItemsCount === 1 ? 'item requires attention / approval' : 'items require attention / approval'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-400/80 text-xs font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Operating nominally under established policy</span>
                  </div>
                )}
                {agent.blockersCount && agent.blockersCount > 0 ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/80 border border-rose-800 text-rose-300">
                    {agent.blockersCount} STOP Interlock Active
                  </span>
                ) : null}
              </div>
            </Card>
          );
        })
      )}
      </div>

      {/* Domain Modals */}
      {selectedAgent?.agent_id === 'job_agent' && (
        <JobAgentModal
          isOpen={true}
          onClose={() => setSelectedAgentId(null)}
          agent={selectedAgent}
          onNavigateToApprovals={() => {
            setSelectedAgentId(null);
            navigate('/inbox');
          }}
        />
      )}

      {selectedAgent?.agent_id === 'farm_agent' && (
        <FarmAgentModal
          isOpen={true}
          onClose={() => setSelectedAgentId(null)}
          agent={selectedAgent}
          onNavigateToApprovals={() => {
            setSelectedAgentId(null);
            navigate('/inbox');
          }}
        />
      )}

      {selectedAgent && selectedAgent.agent_id !== 'job_agent' && selectedAgent.agent_id !== 'farm_agent' && (
        <GenericAgentModal
          isOpen={true}
          onClose={() => setSelectedAgentId(null)}
          agent={selectedAgent}
          onNavigateToApprovals={() => {
            setSelectedAgentId(null);
            navigate('/inbox');
          }}
        />
      )}

    </div>
  );
};
