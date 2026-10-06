import React, { useState, useMemo } from 'react';
import { useChief } from '../context/ChiefContext';
import { useAuth } from '../context/AuthContext';
import { ActivitySeverity } from '../types/chief';
import { EmptyState } from '../components/ui/EmptyState';
import { 
  Search, 
  Download, 
  Check, 
  ShieldCheck, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  Briefcase, 
  Sprout, 
  Zap, 
  Cpu, 
  Radio, 
  Hash, 
  ShieldAlert 
} from 'lucide-react';

export const ActivityScreen: React.FC = () => {
  const { state } = useChief();

  const actProv = state.resourceProvenance?.activity || state.compositeProvenance;
  const isProvUnavailable = actProv === 'unavailable';
  const isProvCached = actProv === 'cached';
  const isProvMock = actProv === 'mock_isolated';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('All');
  const [selectedEventType, setSelectedEventType] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [timePeriod, setTimePeriod] = useState<'all' | 'today' | '24h'>('all');

  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const agentOptions = useMemo(() => {
    const list = Array.from(new Set(state.activity.map(a => a.agent).filter(Boolean)));
    return ['All', ...list];
  }, [state.activity]);

  const eventTypes: { label: string; value: string }[] = [
    { label: 'All Event Types', value: 'All' },
    { label: 'Agent Runs', value: 'agent_run' },
    { label: 'Decisions', value: 'decision' },
    { label: 'Approvals', value: 'approval' },
    { label: 'Rejections', value: 'rejection' },
    { label: 'STOP Events', value: 'stop_event' },
    { label: 'Applications', value: 'application' },
    { label: 'Farm Reports', value: 'farm_report' },
    { label: 'Alerts', value: 'alert' },
    { label: 'Sync Events', value: 'sync_event' },
    { label: 'Failures', value: 'failure' }
  ];

  const severities: { label: string; value: string }[] = [
    { label: 'All Severities', value: 'All' },
    { label: 'Nominal', value: 'nominal' },
    { label: 'Notice', value: 'notice' },
    { label: 'Warning', value: 'warning' },
    { label: 'STOP Interlock', value: 'interlock' },
    { label: 'Failure', value: 'failure' }
  ];

  const filteredEvents = useMemo(() => {
    return state.activity.filter(item => {
      const query = searchTerm.toLowerCase().trim();
      if (query) {
        const matchesEvent = item.event.toLowerCase().includes(query);
        const matchesHash = item.hash.toLowerCase().includes(query);
        const matchesActor = item.actor?.toLowerCase().includes(query) ?? false;
        const matchesSource = item.source?.toLowerCase().includes(query) ?? false;
        const matchesEntity = item.relatedEntity?.toLowerCase().includes(query) ?? false;
        const matchesRule = item.decisionEvidence?.ruleId?.toLowerCase().includes(query) ?? false;
        if (!matchesEvent && !matchesHash && !matchesActor && !matchesSource && !matchesEntity && !matchesRule) {
          return false;
        }
      }
      if (selectedAgent !== 'All' && item.agent !== selectedAgent) {
        return false;
      }
      if (selectedEventType !== 'All' && item.eventType !== selectedEventType) {
        return false;
      }
      if (selectedSeverity !== 'All' && item.severity !== selectedSeverity) {
        return false;
      }
      if (timePeriod === 'today') {
        const isToday = item.timestampFull.toLowerCase().includes('today');
        if (!isToday) return false;
      }
      return true;
    });
  }, [state.activity, searchTerm, selectedAgent, selectedEventType, selectedSeverity, timePeriod]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopyHash = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.activity, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `chief_authoritative_audit_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getSeverityBadge = (severity: ActivitySeverity) => {
    switch (severity) {
      case 'interlock':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/80 border border-rose-800 text-rose-300">
            <AlertOctagon className="w-3 h-3 text-rose-400" />
            <span>INTERLOCK</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/70 border border-amber-700 text-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>WARNING</span>
          </span>
        );
      case 'notice':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#0e3b23] border border-emerald-800 text-emerald-200">
            <span>NOTICE</span>
          </span>
        );
      case 'failure':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/60 border border-rose-900 text-rose-400">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>FAILURE</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 border border-emerald-900 text-emerald-400">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>NOMINAL</span>
          </span>
        );
    }
  };

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case 'Job Agent':
        return <Briefcase className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Farm Agent':
        return <Sprout className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Energy Agent':
        return <Zap className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Worker Link':
        return <Radio className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Cpu className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
            ACTIVITY &amp; AUDIT LOG
          </h1>
          <p className="text-xs text-emerald-300/60 mt-0.5 font-mono">
            {actProv === 'live'
              ? 'Authoritative Audit History • Cryptographically Sealed Invariant Ledger'
              : actProv === 'cached'
              ? 'CACHED — Offline audit snapshot of historical decisions'
              : actProv === 'mock_isolated'
              ? 'SIMULATED — Development test activity logs'
              : 'Chief activity logs currently unavailable from backend'}
          </p>
        </div>
        <button
          onClick={handleExportJson}
          className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-800/60 text-xs font-mono text-emerald-300 hover:text-white bg-[#062416] hover:bg-[#0a2f1c] transition-colors shadow-sm"
          title="Export authoritative audit events as sealed JSON"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export Sealed Ledger</span>
        </button>
      </div>

      {/* 2. Tamper-Proof Assurance Notice */}
      <div className="p-3.5 rounded-xl border border-emerald-900/50 bg-[#052114]/90 text-xs text-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Immutable Record:</strong> All events sealed with SHA-256 state hashes. Editing or deletion prohibited.
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/60 shrink-0">
          <Lock className="w-3.5 h-3.5" />
          <span>Read-Only Authority</span>
        </div>
      </div>

      {/* 3. Multi-Dimensional Filter Toolbar */}
      <div className="p-4 rounded-xl border border-emerald-950/80 bg-[#041a10]/90 space-y-3 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-emerald-400/60 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by event text, actor, source, related entity, rule ID, or hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#03140c] border border-emerald-950 text-white placeholder-emerald-400/40 text-xs focus:outline-none focus:border-emerald-600 font-mono transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div>
            <label className="text-[10px] text-emerald-400/60 uppercase tracking-wider block mb-1 font-semibold">
              Agent / Domain:
            </label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#03140c] border border-emerald-950 text-emerald-200 text-xs focus:outline-none focus:border-emerald-600"
            >
              {agentOptions.map(agent => (
                <option key={agent} value={agent}>{agent === 'All' ? 'All Subsystems' : agent}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-emerald-400/60 uppercase tracking-wider block mb-1 font-semibold">
              Event Type:
            </label>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#03140c] border border-emerald-950 text-emerald-200 text-xs focus:outline-none focus:border-emerald-600"
            >
              {eventTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-emerald-400/60 uppercase tracking-wider block mb-1 font-semibold">
              Severity / Status:
            </label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#03140c] border border-emerald-950 text-emerald-200 text-xs focus:outline-none focus:border-emerald-600"
            >
              {severities.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-emerald-400/60 uppercase tracking-wider block mb-1 font-semibold">
              Time Period:
            </label>
            <div className="grid grid-cols-2 gap-1 h-[33px]">
              <button
                type="button"
                onClick={() => setTimePeriod('all')}
                className={`rounded-lg border text-[11px] font-semibold transition-colors flex items-center justify-center ${
                  timePeriod === 'all' 
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' 
                    : 'bg-[#03140c] border-emerald-950 text-emerald-300/70 hover:text-white'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => setTimePeriod('today')}
                className={`rounded-lg border text-[11px] font-semibold transition-colors flex items-center justify-center ${
                  timePeriod === 'today' 
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' 
                    : 'bg-[#03140c] border-emerald-950 text-emerald-300/70 hover:text-white'
                }`}
              >
                Today
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Chronological Event Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-emerald-400/60 px-1">
          <span>Displaying {filteredEvents.length} chronological audit entries</span>
          <span>Newest First • Chronological Order</span>
        </div>

        {filteredEvents.length === 0 ? (
          <EmptyState
            title={
              isProvUnavailable ? "Chief Activity Logs Unavailable" :
              isProvCached ? "No Cached Activity Found" :
              "No Matching Audit Events"
            }
            description={
              isProvUnavailable ? "Cannot reach the Chief backend to load audit records or historical actions. Verify backend connectivity." :
              isProvCached ? "No audit records matching criteria in the offline cache snapshot." :
              "No audit ledger records match the selected filter criteria or search keyword."
            }
          />
        ) : (
          filteredEvents.map((item) => {
            const isExpanded = Boolean(expandedIds[item.id]);
            return (
              <div
                key={item.id}
                onClick={() => toggleExpand(item.id)}
                className={`rounded-xl border transition-all cursor-pointer select-none p-4 ${
                  item.severity === 'interlock'
                    ? 'border-rose-900/60 bg-[#140608]/90 hover:border-rose-700/80'
                    : item.severity === 'warning'
                    ? 'border-amber-900/50 bg-[#120e06]/90 hover:border-amber-700/80'
                    : item.severity === 'failure'
                    ? 'border-rose-950 bg-[#140608]/80 hover:border-rose-800'
                    : 'border-emerald-950/80 bg-[#052114]/90 hover:border-emerald-800/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                    <span className="font-mono text-emerald-400 font-bold tabular-nums text-xs whitespace-nowrap">
                      {item.time}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-[#03140c] border border-emerald-950 text-emerald-300 shrink-0">
                      {getAgentIcon(item.agent)}
                      <span>{item.agent}</span>
                    </span>
                    <div className="shrink-0">
                      {getSeverityBadge(item.severity)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <button
                      onClick={(e) => handleCopyHash(item.hash, e)}
                      className="px-2 py-0.5 rounded bg-[#03140c] border border-emerald-950 hover:border-emerald-800 text-[10px] font-mono text-emerald-400/80 hover:text-emerald-200 flex items-center gap-1 transition-colors"
                      title="Copy cryptographic SHA-256 seal"
                    >
                      <Hash className="w-3 h-3" />
                      <span>{copiedHash === item.hash ? 'COPIED' : item.hash.slice(0, 14) + '...'}</span>
                      {copiedHash === item.hash && <Check className="w-3 h-3 text-emerald-400" />}
                    </button>
                    <div className="text-emerald-400/60 p-0.5">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-xs text-white font-medium leading-snug">
                  {item.event}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-emerald-400/60">
                  <span>ID: {item.id}</span>
                  <span>•</span>
                  <span>{item.timestampFull}</span>
                  {item.actor && (
                    <>
                      <span>•</span>
                      <span>Actor: <strong className="text-emerald-200">{item.actor}</strong></span>
                    </>
                  )}
                </div>

                {isExpanded && (
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="mt-3.5 pt-3.5 border-t border-emerald-950/80 space-y-3 cursor-default animate-fadeIn text-xs font-mono"
                  >
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold block flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Authoritative Event Details &amp; Evidence Audit
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-[#03140c] border border-emerald-950 space-y-0.5">
                        <span className="text-emerald-400/60 block">Authoritative Actor:</span>
                        <span className="text-white font-medium">{item.actor || 'Chief Central Engine (Autonomous)'}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#03140c] border border-emerald-950 space-y-0.5">
                        <span className="text-emerald-400/60 block">Source Interface:</span>
                        <span className="text-white font-medium">{item.source || 'Chief Policy Evaluation Pipeline'}</span>
                      </div>
                      {item.relatedEntity && (
                        <div className="p-2.5 rounded-lg bg-[#03140c] border border-emerald-950 space-y-0.5">
                          <span className="text-emerald-400/60 block">Related Domain Entity:</span>
                          <span className="text-white font-medium">{item.relatedEntity}</span>
                        </div>
                      )}
                      <div className="p-2.5 rounded-lg bg-[#03140c] border border-emerald-950 space-y-0.5">
                        <span className="text-emerald-400/60 block">Cryptographic Hash Seal:</span>
                        <span className="text-emerald-300 font-bold break-all">{item.hash}</span>
                      </div>
                    </div>

                    {item.decisionEvidence && (
                      <div className="p-3 rounded-lg bg-[#03140c] border border-emerald-950 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-emerald-400 font-bold">Policy Rule Link: {item.decisionEvidence.ruleId || 'POLICY-NOMINAL'}</span>
                          <span className="text-emerald-400/60 text-[10px]">Verified against Invariant Tree</span>
                        </div>
                        {item.decisionEvidence.policyExplanation && (
                          <p className="text-emerald-200/90 text-xs font-sans leading-relaxed">
                            {item.decisionEvidence.policyExplanation}
                          </p>
                        )}
                        {item.decisionEvidence.parameters && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                            {Object.entries(item.decisionEvidence.parameters).map(([k, v]) => (
                              <div key={k} className="p-1.5 rounded bg-[#062416] border border-emerald-950 text-[10px]">
                                <span className="text-emerald-400/60 block">{k}:</span>
                                <span className="text-white font-bold">{v}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
