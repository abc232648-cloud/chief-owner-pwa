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
import { ArrowUpRight, AlertOctagon, Activity, Layers, FlaskConical, Radio, Wrench, WifiOff, CheckCircle2 } from 'lucide-react';

export const AgentsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useChief();
  const { isDevMode } = useAuth();

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [farmModeOverride, setFarmModeOverride] = useState<FarmOperationalMode | null>(null);
  const [filterDomain, setFilterDomain] = useState<string>('all');

  const provenance = state.resourceProvenance?.agents || state.compositeProvenance || 'unavailable';
  const isUnavailable = provenance === 'unavailable';
  const isCached = provenance === 'cached';
  const isMock = provenance === 'mock_isolated';
  const isLive = provenance === 'live';

  const domains = ['all', ...Array.from(new Set(state.agents.map(agent => agent.domain || 'Core Engine').filter(Boolean)))];
  const filteredAgents = state.agents.filter(agent => filterDomain === 'all' || (agent.domain || 'Core Engine') === filterDomain);
  const selectedAgent = state.agents.find(agent => agent.agent_id === selectedAgentId) || null;

  const sourceDescription = isLive
    ? `${state.agents.length} agent record${state.agents.length === 1 ? '' : 's'} received from the live Chief API`
    : isCached
      ? `${state.agents.length} agent record${state.agents.length === 1 ? '' : 's'} from the last cached Chief response`
      : isMock
        ? `${state.agents.length} development fixture record${state.agents.length === 1 ? '' : 's'} — not operational data`
        : 'Agent data is unavailable from the Chief backend';

  const sourceLabel = isLive ? 'LIVE RESPONSE' : isCached ? 'CACHED RESPONSE' : isMock ? 'DEV FIXTURE' : 'UNAVAILABLE';

  return (
    <main className="space-y-6 pb-24" aria-labelledby="agents-screen-title">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h1 id="agents-screen-title" className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" aria-hidden="true" />
            AGENT DOMAINS
          </h1>
          <p className="text-xs text-emerald-300/60 mt-0.5">{sourceDescription}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono border flex items-center gap-1.5 self-start sm:self-center ${
          isLive ? 'bg-[#062416] border-emerald-900/60 text-emerald-300' :
          isCached ? 'bg-sky-950/40 border-sky-800 text-sky-200' :
          isMock ? 'bg-amber-950/40 border-amber-800 text-amber-200' :
          'bg-rose-950/40 border-rose-900 text-rose-200'
        }`}>
          <Layers className="w-3.5 h-3.5" aria-hidden="true" />
          {sourceLabel}
        </span>
      </div>

      <WarningBanner
        level="simulation"
        title="Data provenance boundary"
        message="The mobile client keeps live, cached, unavailable and DEV fixture states distinct. A displayed agent status is a reported data field; the client does not independently certify backend policy enforcement or heartbeat integrity."
      />

      {domains.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar" aria-label="Filter agent domains">
          <span className="text-[11px] font-mono text-emerald-400/60 uppercase tracking-wider mr-1">Filter:</span>
          {domains.map(domain => (
            <button
              key={domain}
              type="button"
              onClick={() => setFilterDomain(domain)}
              aria-pressed={filterDomain === domain}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors whitespace-nowrap ${
                filterDomain === domain
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-[#062416] text-emerald-300/70 border border-emerald-950 hover:border-emerald-800'
              }`}
            >
              {domain === 'all' ? 'All subsystems' : domain}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {filteredAgents.length === 0 ? (
          <EmptyState
            title={isUnavailable ? 'Agent data unavailable' : 'No subsystems found'}
            description={isUnavailable
              ? 'The client has no current or eligible cached Chief agent data to display.'
              : 'No agent records match the selected filter.'}
          />
        ) : filteredAgents.map(agent => {
          const isFarm = agent.agent_id === 'farm_agent';
          const effectiveMode = isFarm && isDevMode && farmModeOverride
            ? farmModeOverride
            : (agent.operationalMode || (agent.simulation_warning ? 'SIMULATION' : undefined));

          const noAttentionText = isLive
            ? 'No attention items reported in the live response'
            : isCached
              ? 'No attention items in the cached snapshot'
              : isMock
                ? 'DEV fixture has no attention items'
                : 'Attention state unavailable';

          return (
            <Card
              key={agent.agent_id}
              id={`agent-card-${agent.agent_id}`}
              className="relative overflow-hidden"
              title={agent.label}
              subtitle={agent.domain || 'Chief subsystem'}
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
                    <span>Workflows reported: {agent.activeWorkflows}</span>
                    <span aria-hidden="true">•</span>
                    <span>Heartbeat field: {agent.lastHeartbeat || 'Not reported'}</span>
                  </div>
                  <ActionButton
                    variant="secondary"
                    size="sm"
                    icon={<ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />}
                    onClick={() => setSelectedAgentId(agent.agent_id)}
                  >
                    Open {agent.label}
                  </ActionButton>
                </div>
              }
            >
              <div className="text-xs text-emerald-200/90 leading-relaxed">{agent.summary || agent.description}</div>

              {isFarm && isDevMode && (
                <div className="p-3 rounded-xl border border-amber-900/60 bg-[#0c1403] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono gap-2">
                    <span className="text-amber-300 uppercase tracking-wider font-semibold">DEV mode override</span>
                    <span className="text-amber-400/80 text-[10px]">Selected: <strong className="text-white">{effectiveMode}</strong></span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-mono">
                    {(['LIVE', 'SIMULATION', 'NOT CONFIGURED', 'OFFLINE'] as FarmOperationalMode[]).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setFarmModeOverride(mode)}
                        aria-pressed={effectiveMode === mode}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 ${
                          effectiveMode === mode ? 'bg-amber-950 border-amber-500 text-amber-100' : 'bg-[#062416] border-emerald-950 text-emerald-400/60 hover:text-white'
                        }`}
                      >
                        {mode === 'LIVE' && <Radio className="w-3 h-3" aria-hidden="true" />}
                        {mode === 'SIMULATION' && <FlaskConical className="w-3 h-3" aria-hidden="true" />}
                        {mode === 'NOT CONFIGURED' && <Wrench className="w-3 h-3" aria-hidden="true" />}
                        {mode === 'OFFLINE' && <WifiOff className="w-3 h-3" aria-hidden="true" />}
                        <span>{mode}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-amber-300/70">This override changes DEV presentation only; it does not create live Chief state.</p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                {agent.metrics.map((metric, index) => (
                  <div key={`${metric.label}-${index}`} className={`p-2.5 rounded-xl border ${metric.highlight ? 'bg-[#082d1c] border-emerald-700/60' : 'bg-[#03140c] border-emerald-950/80'}`}>
                    <span className="text-emerald-300/60 text-[11px] block line-clamp-1">{metric.label}</span>
                    <span className="text-base font-bold font-mono text-white tabular-nums">{metric.value} {metric.unit || ''}</span>
                  </div>
                ))}
              </div>

              {agent.lastActivity && (
                <div className="pt-1 flex items-start gap-2 text-xs text-emerald-300/70">
                  <Activity className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <span className="text-white font-medium">{agent.lastActivity.summary}</span>
                    <span className="text-[11px] font-mono text-emerald-400/50 ml-2">({agent.lastActivity.timestamp})</span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-3 text-xs border-t border-emerald-950/70">
                {agent.attentionItemsCount && agent.attentionItemsCount > 0 ? (
                  <div className="flex items-center gap-1.5 text-amber-300 font-mono font-medium">
                    <AlertOctagon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{agent.attentionItemsCount} attention item{agent.attentionItemsCount === 1 ? '' : 's'} reported</span>
                  </div>
                ) : (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${isUnavailable ? 'text-zinc-400' : 'text-emerald-400/80'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{noAttentionText}</span>
                  </div>
                )}
                {!!agent.blockersCount && agent.blockersCount > 0 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/80 border border-rose-800 text-rose-300">
                    {agent.blockersCount} STOP record{agent.blockersCount === 1 ? '' : 's'} reported
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {selectedAgent?.agent_id === 'job_agent' && (
        <JobAgentModal
          isOpen
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
          isOpen
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
          isOpen
          onClose={() => setSelectedAgentId(null)}
          agent={selectedAgent}
          onNavigateToApprovals={() => {
            setSelectedAgentId(null);
            navigate('/inbox');
          }}
        />
      )}
    </main>
  );
};
