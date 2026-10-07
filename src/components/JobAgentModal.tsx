import React, { useState } from 'react';
import { AlertOctagon, AlertTriangle, Briefcase, CheckCircle2, HelpCircle, ShieldCheck, X } from 'lucide-react';
import { AgentState } from '../types/chief';
import { useAuth } from '../context/AuthContext';
import { useChief } from '../context/ChiefContext';
import {
  APPLICANT_TRUTH_STORE,
  JOB_APPLICATIONS,
  JOB_DECISION_RECORDS,
  JOB_FAILURES,
  JOB_OPPORTUNITIES,
  JOB_OVERVIEW_METRICS
} from '../data/jobAgentData';
import { JobDecisionType, ScamRiskLevel } from '../types/jobAgent';

interface JobAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentState;
  onNavigateToApprovals: () => void;
}

type TabType = 'overview' | 'opportunities' | 'applications' | 'decisions' | 'failures' | 'truth';

function DecisionBadge({ decision }: { decision: JobDecisionType }) {
  const tone = decision === 'STOP'
    ? 'bg-rose-950 border-rose-700 text-rose-300'
    : decision === 'ASK'
      ? 'bg-amber-950 border-amber-700 text-amber-300'
      : decision === 'APPLY'
        ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
        : 'bg-zinc-900 border-zinc-700 text-zinc-300';
  return <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${tone}`}>{decision}</span>;
}

function RiskBadge({ risk }: { risk: ScamRiskLevel }) {
  const label = risk === 'verified_legitimate' ? 'DEV fixture: verification passed' : `${risk} risk`;
  const tone = risk === 'high'
    ? 'bg-rose-950 border-rose-700 text-rose-300'
    : risk === 'moderate'
      ? 'bg-amber-950 border-amber-700 text-amber-300'
      : 'bg-emerald-950 border-emerald-800 text-emerald-300';
  return <span className={`px-2 py-0.5 rounded border text-[10px] font-mono ${tone}`}>{label}</span>;
}

export const JobAgentModal: React.FC<JobAgentModalProps> = ({
  isOpen,
  onClose,
  agent,
  onNavigateToApprovals
}) => {
  const { isDevMode } = useAuth();
  const { state } = useChief();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!isOpen) return null;

  const provenance = state.resourceProvenance?.agents || state.compositeProvenance || 'unavailable';
  const sourceLabel = isDevMode
    ? 'Development fixtures — not user data'
    : provenance === 'live'
      ? 'Agent record received from live Chief API; Job truth/application feeds are not connected'
      : provenance === 'cached'
        ? 'Agent record from cached Chief response; Job truth/application feeds are not connected'
        : 'Job Agent backend data unavailable';

  const opportunities = isDevMode ? JOB_OPPORTUNITIES : [];
  const applications = isDevMode ? JOB_APPLICATIONS : [];
  const decisions = isDevMode ? JOB_DECISION_RECORDS : [];
  const failures = isDevMode ? JOB_FAILURES : [];

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'opportunities', label: `Opportunities (${opportunities.length})` },
    { id: 'applications', label: `Applications (${applications.length})` },
    { id: 'decisions', label: `Decisions (${decisions.length})` },
    { id: 'failures', label: `Failures (${failures.length})` },
    { id: 'truth', label: 'Truth boundary' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#021209]/85 backdrop-blur-sm" role="presentation">
      <div
        className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-emerald-900/50 bg-[#062416] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-agent-title"
      >
        <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-emerald-950/80 bg-[#04190e]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#0a2f1c] border border-emerald-800/60 text-emerald-300 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 id="job-agent-title" className="text-base font-semibold text-white tracking-tight">Job Agent domain</h2>
              <p className={`text-xs mt-0.5 font-mono ${isDevMode ? 'text-amber-300' : 'text-emerald-300/60'}`}>{sourceLabel}</p>
              <p className="text-[10px] mt-1 text-emerald-400/50 font-mono">
                Reported agent status: {agent.status} • This client does not independently certify operational state.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-emerald-300/60 hover:text-white hover:bg-[#0a2e1b]" aria-label="Close Job Agent dialog">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </header>

        {isDevMode && (
          <div className="px-6 py-2 bg-amber-950/40 border-b border-amber-800/60 text-amber-200 text-xs font-mono">
            DEV SIMULATION — all opportunities, employers, scores, decisions, receipts and applicant profile values below are synthetic fixtures.
          </div>
        )}

        <nav className="px-6 py-2 border-b border-emerald-950/80 bg-[#03140c] flex gap-1 overflow-x-auto" aria-label="Job Agent sections">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap ${activeTab === tab.id ? 'bg-emerald-600 text-white' : 'text-emerald-300/70 hover:text-white hover:bg-[#082a19]'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-6 overflow-y-auto max-h-[68vh] space-y-5">
          {!isDevMode && activeTab !== 'truth' && (
            <section className="rounded-xl border border-emerald-950/80 bg-[#03140c] p-6 text-center space-y-2">
              <Briefcase className="w-8 h-8 text-emerald-400 mx-auto" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-white">Authoritative Job Agent feed not provisioned</h3>
              <p className="text-xs text-emerald-300/60 max-w-xl mx-auto">
                Production does not display the bundled opportunity, application, decision or applicant-profile fixtures. Connect the Chief backend Job Agent endpoints before operational data can appear here.
              </p>
            </section>
          )}

          {activeTab === 'overview' && isDevMode && (
            <section className="space-y-3" aria-labelledby="job-dev-overview">
              <div>
                <h3 id="job-dev-overview" className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold">Development fixture metrics</h3>
                <p className="text-[11px] text-amber-300/60">These values exercise the UI only and are not Chief telemetry.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ['Scanned', JOB_OVERVIEW_METRICS.opportunitiesScanned],
                  ['Qualified', JOB_OVERVIEW_METRICS.qualified],
                  ['Strong matches', JOB_OVERVIEW_METRICS.strongMatches],
                  ['Started', JOB_OVERVIEW_METRICS.applicationsStarted],
                  ['Submitted fixture', JOB_OVERVIEW_METRICS.submitted],
                  ['Blocked fixture', JOB_OVERVIEW_METRICS.blocked],
                  ['ASK fixtures', JOB_OVERVIEW_METRICS.approvalRequests]
                ].map(([label, value]) => (
                  <div key={String(label)} className="p-3 rounded-xl border border-amber-900/40 bg-[#100d04]">
                    <span className="text-[10px] font-mono text-amber-300/60 block">{label}</span>
                    <span className="text-xl font-bold font-mono text-white">{value}</span>
                  </div>
                ))}
              </div>
              {JOB_OVERVIEW_METRICS.approvalRequests > 0 && (
                <button type="button" onClick={() => { onClose(); onNavigateToApprovals(); }} className="px-3 py-2 rounded-lg bg-amber-950 border border-amber-700 text-amber-200 text-xs font-mono">
                  Open Attention Inbox (DEV fixture)
                </button>
              )}
            </section>
          )}

          {activeTab === 'opportunities' && isDevMode && (
            <section className="space-y-3">
              {opportunities.map(opportunity => (
                <article key={opportunity.id} className="rounded-xl border border-emerald-950/80 bg-[#03140c] p-4 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{opportunity.role}</h3>
                      <p className="text-xs text-emerald-300/60">{opportunity.employer} • {opportunity.location}</p>
                    </div>
                    <DecisionBadge decision={opportunity.decision} />
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <RiskBadge risk={opportunity.scamRisk} />
                    <span className="text-[10px] font-mono text-amber-300">DEV score: {opportunity.opportunityScore}</span>
                  </div>
                  <p className="text-xs text-emerald-200/80">{opportunity.decisionReason}</p>
                  <p className="text-[10px] text-amber-300/60 font-mono">Fixture source: {opportunity.source}</p>
                </article>
              ))}
            </section>
          )}

          {activeTab === 'applications' && isDevMode && (
            <section className="space-y-3">
              {applications.map(application => (
                <article key={application.id} className="rounded-xl border border-emerald-950/80 bg-[#03140c] p-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{application.role}</h3>
                      <p className="text-xs text-emerald-300/60">{application.employer}</p>
                    </div>
                    <span className="text-[10px] font-mono text-amber-300">DEV: {application.lifecycleState}</span>
                  </div>
                  <p className="mt-2 text-xs text-emerald-200/80">{application.stateExplanation}</p>
                  {application.receiptId && <p className="mt-1 text-[10px] font-mono text-amber-300/70">Synthetic receipt fixture: {application.receiptId}</p>}
                </article>
              ))}
            </section>
          )}

          {activeTab === 'decisions' && isDevMode && (
            <section className="space-y-3">
              {decisions.map(decision => (
                <article key={decision.id} className="rounded-xl border border-emerald-950/80 bg-[#03140c] p-4 space-y-2">
                  <div className="flex justify-between gap-2"><span className="text-sm text-white font-semibold">{decision.role} • {decision.employer}</span><DecisionBadge decision={decision.decision} /></div>
                  <p className="text-xs text-emerald-200/80">{decision.authoritativeReason}</p>
                  <p className="text-[10px] text-amber-300/60 font-mono">Synthetic policy fixture: {decision.policyRule}</p>
                </article>
              ))}
            </section>
          )}

          {activeTab === 'failures' && isDevMode && (
            <section className="space-y-3">
              {failures.map(failure => (
                <article key={failure.id} className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <div><h3 className="text-sm text-white font-semibold">{failure.title}</h3><p className="text-xs text-rose-200/80 mt-1">{failure.details}</p><p className="text-[10px] font-mono text-rose-300/60 mt-1">DEV fixture • {failure.retryState}</p></div>
                  </div>
                </article>
              ))}
            </section>
          )}

          {activeTab === 'truth' && (
            <section className="space-y-4">
              <div className="rounded-xl border border-emerald-900/60 bg-[#03140c] p-4">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">Applicant truth boundary</h3>
                    <p className="text-xs text-emerald-300/70 mt-1">
                      The mobile client must never invent qualifications, professional experience, certifications, identity data or submission evidence. Production currently has no connected authoritative Applicant Truth Store.
                    </p>
                  </div>
                </div>
              </div>
              {isDevMode ? (
                <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300"><AlertOctagon className="w-4 h-4" aria-hidden="true" /><strong className="text-xs">DEVELOPMENT SAMPLE PROFILE</strong></div>
                  <p className="text-xs text-amber-200/80">{APPLICANT_TRUTH_STORE.title}</p>
                  <div><p className="text-[10px] font-mono uppercase text-amber-300/60 mb-1">Sample prohibitions</p><ul className="text-xs text-amber-100/80 list-disc pl-5 space-y-1">{APPLICANT_TRUTH_STORE.unverifiedProhibitions.map(item => <li key={item}>{item}</li>)}</ul></div>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-xs text-amber-300"><HelpCircle className="w-4 h-4 mt-0.5" aria-hidden="true" /><span>No candidate facts are available to this client until a Chief-authoritative truth-store endpoint is provisioned.</span></div>
              )}
            </section>
          )}
        </div>

        <footer className="px-6 py-3 border-t border-emerald-950/80 bg-[#04190e] flex items-center justify-between gap-3 text-[10px] font-mono text-emerald-400/50">
          <span>STOP remains non-bypassable • ASK requires explicit authority • no synthetic production submission evidence</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Client truth boundary</span>
        </footer>
      </div>
    </div>
  );
};
