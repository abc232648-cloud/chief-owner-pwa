import React, { useState } from 'react';
import { 
  X, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Lock, 
  AlertOctagon, 
  Check, 
  XCircle, 
  HelpCircle, 
  AlertTriangle
} from 'lucide-react';
import { AgentState } from '../types/chief';
import { 
  APPLICANT_TRUTH_STORE, 
  JOB_OVERVIEW_METRICS, 
  JOB_OPPORTUNITIES, 
  JOB_APPLICATIONS, 
  JOB_DECISION_RECORDS, 
  JOB_FAILURES 
} from '../data/jobAgentData';
import { 
  JobDecisionType, 
  JobApplicationLifecycleState, 
  ScamRiskLevel 
} from '../types/jobAgent';

interface JobAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentState;
  onNavigateToApprovals: () => void;
}

type TabType = 'overview' | 'opportunities' | 'applications' | 'decisions' | 'failures' | 'history';

export const JobAgentModal: React.FC<JobAgentModalProps> = ({
  isOpen,
  onClose,
  onNavigateToApprovals
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [oppFilter, setOppFilter] = useState<'all' | 'apply' | 'ask' | 'stop' | 'reject'>('all');

  if (!isOpen) return null;

  const filteredOpportunities = JOB_OPPORTUNITIES.filter(opp => {
    if (oppFilter === 'apply') return opp.decision === 'APPLY';
    if (oppFilter === 'ask') return opp.decision === 'ASK';
    if (oppFilter === 'stop') return opp.decision === 'STOP';
    if (oppFilter === 'reject') return opp.decision === 'REJECT';
    return true;
  });

  const renderScamBadge = (scamRisk: ScamRiskLevel) => {
    switch (scamRisk) {
      case 'verified_legitimate':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 border border-emerald-800 text-emerald-300">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>VERIFIED LEGITIMATE</span>
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 border border-emerald-900 text-emerald-400">
            <span>LOW RISK</span>
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 border border-amber-700 text-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>MODERATE RISK</span>
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/90 border border-rose-700 text-rose-300">
            <AlertOctagon className="w-3 h-3 text-rose-400" />
            <span>HIGH SCAM RISK</span>
          </span>
        );
    }
  };

  const renderDecisionBadge = (decision: JobDecisionType) => {
    switch (decision) {
      case 'APPLY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-mono text-[11px] font-bold bg-emerald-950/80 border border-emerald-700 text-emerald-300">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>APPLY</span>
          </span>
        );
      case 'ASK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-mono text-[11px] font-bold bg-amber-950/80 border border-amber-700 text-amber-300">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>ASK</span>
          </span>
        );
      case 'STOP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-mono text-[11px] font-bold bg-rose-950/90 border border-rose-700 text-rose-300">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>STOP</span>
          </span>
        );
      case 'REJECT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-mono text-[11px] font-bold bg-zinc-900 border border-zinc-700 text-zinc-400">
            <XCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span>REJECT</span>
          </span>
        );
    }
  };

  const renderLifecycleBadge = (state: JobApplicationLifecycleState) => {
    switch (state) {
      case 'receipt captured':
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-950/80 border border-emerald-700 text-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span className="uppercase">{state}</span>
          </span>
        );
      case 'needs attention':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-950/90 border border-amber-600 text-amber-200 animate-pulse">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            <span className="uppercase">NEEDS ATTENTION</span>
          </span>
        );
      case 'blocked':
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-mono text-[10px] font-bold bg-rose-950/80 border border-rose-800 text-rose-300">
            <AlertOctagon className="w-3 h-3 text-rose-400" />
            <span className="uppercase">{state}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-mono text-[10px] font-semibold bg-[#03140c] border border-emerald-950 text-emerald-300">
            <span className="uppercase">{state}</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#021209]/85 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-emerald-900/50 bg-[#062416] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-agent-title"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-950/80 bg-[#04190e]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0a2f1c] border border-emerald-800/60 text-emerald-300 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="job-agent-title" className="text-base font-semibold text-white tracking-tight">
                  Job Agent Operational Domain
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[11px] bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-emerald-300/60 mt-0.5 font-mono">
                Applicant Truth Store Invariant Enforced • No Fabricated Credentials
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

        {/* Navigation Tabs */}
        <div className="px-6 py-2 border-b border-emerald-950/80 bg-[#03140c] flex items-center gap-1 text-xs overflow-x-auto no-scrollbar font-mono">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'opportunities', label: `Opportunities (${JOB_OPPORTUNITIES.length})` },
            { id: 'applications', label: `Applications (${JOB_APPLICATIONS.length})` },
            { id: 'decisions', label: `Decisions (${JOB_DECISION_RECORDS.length})` },
            { id: 'failures', label: `Failures (${JOB_FAILURES.length})` },
            { id: 'history', label: 'History' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-emerald-300/70 hover:text-white hover:bg-[#082a19]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[68vh] space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  Authoritative Pipeline Telemetry
                </h3>
                <p className="text-xs text-emerald-300/60 mt-0.5">
                  Metrics strictly sourced from backend Job Agent engine without fabrication
                </p>
              </div>

              {/* 7 Required Overview Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-emerald-950/80 bg-[#03140c] space-y-1">
                  <span className="text-[11px] font-mono text-emerald-400/60 block">Opportunities Scanned</span>
                  <span className="text-xl font-bold font-mono text-white tabular-nums">{JOB_OVERVIEW_METRICS.opportunitiesScanned}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-emerald-950/80 bg-[#03140c] space-y-1">
                  <span className="text-[11px] font-mono text-emerald-400/60 block">Qualified</span>
                  <span className="text-xl font-bold font-mono text-white tabular-nums">{JOB_OVERVIEW_METRICS.qualified}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-emerald-950/80 bg-[#03140c] space-y-1">
                  <span className="text-[11px] font-mono text-emerald-400/60 block">Strong Matches</span>
                  <span className="text-xl font-bold font-mono text-emerald-300 tabular-nums">{JOB_OVERVIEW_METRICS.strongMatches}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-emerald-950/80 bg-[#03140c] space-y-1">
                  <span className="text-[11px] font-mono text-emerald-400/60 block">Applications Started</span>
                  <span className="text-xl font-bold font-mono text-white tabular-nums">{JOB_OVERVIEW_METRICS.applicationsStarted}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-emerald-950/80 bg-[#03140c] space-y-1">
                  <span className="text-[11px] font-mono text-emerald-400/60 block">Submitted (Verified)</span>
                  <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">{JOB_OVERVIEW_METRICS.submitted}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-rose-950/80 bg-[#160609] space-y-1">
                  <span className="text-[11px] font-mono text-rose-400/70 block">Blocked by Policy</span>
                  <span className="text-xl font-bold font-mono text-rose-300 tabular-nums">{JOB_OVERVIEW_METRICS.blocked}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-amber-950/80 bg-[#161006] space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-mono text-amber-400/70 block">Approval Requests Queued</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold font-mono text-amber-300 tabular-nums">{JOB_OVERVIEW_METRICS.approvalRequests}</span>
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToApprovals();
                      }}
                      className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-amber-950 text-amber-200 border border-amber-700 hover:bg-amber-900 transition-colors"
                    >
                      Review in Inbox →
                    </button>
                  </div>
                </div>
              </div>

              {/* CANDIDATE TRUTH STORE CARD */}
              <div className="p-5 rounded-xl border border-emerald-900/60 bg-[#052114] space-y-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <h4 className="text-sm font-semibold text-white tracking-tight">
                        Applicant Truth Store — Immutable Candidate Baseline
                      </h4>
                    </div>
                    <p className="text-xs text-emerald-300/70 mt-0.5">
                      Chief Safety Invariant: The UI and Job Agent must NEVER claim qualifications unapproved by Truth Store
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold shrink-0">
                    SEALED AUDIT
                  </span>
                </div>

                {/* Verified Profile */}
                <div className="p-3.5 rounded-lg bg-[#03140c] border border-emerald-950 space-y-2 text-xs font-mono">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-emerald-200">
                    <span><strong>Verified Title:</strong> {APPLICANT_TRUTH_STORE.title}</span>
                    <span className="text-emerald-400/70">{APPLICANT_TRUTH_STORE.verifiedSeniority}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-emerald-400/60 uppercase block mb-1 font-semibold">
                      Authoritatively Verified Core Capabilities:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {APPLICANT_TRUTH_STORE.verifiedSkills.map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-[#062416] border border-emerald-900/60 text-emerald-300 text-[11px]">
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Explicit Prohibitions Banner */}
                <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-900/50 space-y-1.5 text-xs">
                  <span className="font-mono text-[11px] text-rose-300 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                    Prohibited Unverified Claims (Strictly Barred from Fabrication):
                  </span>
                  <ul className="space-y-1 text-rose-200/80 font-mono text-[11px] pl-4 list-disc">
                    {APPLICANT_TRUTH_STORE.unverifiedProhibitions.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OPPORTUNITIES */}
          {activeTab === 'opportunities' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-emerald-400/60 text-[11px] uppercase tracking-wider mr-1">Filter Decision:</span>
                  {(['all', 'apply', 'ask', 'stop', 'reject'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setOppFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                        oppFilter === f 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'bg-[#03140c] text-emerald-300/70 border border-emerald-950 hover:border-emerald-800'
                      }`}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
                <span className="text-emerald-400/60 text-[11px]">Showing {filteredOpportunities.length} opportunities</span>
              </div>

              <div className="space-y-4">
                {filteredOpportunities.map(opp => (
                  <div 
                    key={opp.id}
                    className="p-5 rounded-xl border border-emerald-950/80 bg-[#041a10] hover:border-emerald-800/60 transition-colors space-y-3.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white tracking-tight">
                            {opp.role}
                          </h4>
                          <span className="text-xs font-mono text-emerald-300/70">
                            @ {opp.employer}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-400/70 font-mono mt-0.5">
                          {opp.location} • {opp.remoteInfo} • Source: {opp.source}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {renderDecisionBadge(opp.decision)}
                        <div className="px-2.5 py-0.5 rounded font-mono text-xs font-bold bg-[#03140c] border border-emerald-950 text-emerald-400">
                          {opp.opportunityScore}% Match
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#03140c] border border-emerald-950 text-xs font-mono">
                      <span className="text-emerald-200">
                        <strong>Compensation:</strong> {opp.compensation || 'Unspecified in posting'}
                      </span>
                      <div className="flex items-center gap-2">
                        {renderScamBadge(opp.scamRisk)}
                        <span className="text-[11px] text-emerald-400/60">
                          {opp.verificationState.verificationLabel}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-emerald-200/90 leading-relaxed font-sans">
                      <strong>Chief Decision Rationale:</strong> {opp.decisionReason}
                    </div>

                    {opp.strongestMatches.length > 0 && (
                      <div className="space-y-1 text-xs">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
                          Verified Strongest Matches (Applicant Truth Store):
                        </span>
                        <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                          {opp.strongestMatches.map((m, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-[#062416] border border-emerald-800/60 text-emerald-300">
                              ✓ {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {opp.gaps.length > 0 && (
                      <div className="space-y-1 text-xs">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold block">
                          Truthful Discrepancies &amp; Gaps:
                        </span>
                        <ul className="list-disc pl-4 text-emerald-300/70 text-[11px] font-mono space-y-0.5">
                          {opp.gaps.map((g, idx) => (
                            <li key={idx}>{g}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {opp.scamRisk !== 'verified_legitimate' && (
                      <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/60 text-xs text-rose-300 space-y-0.5">
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider block">
                          Scam Risk Analysis Note:
                        </span>
                        <p>{opp.scamRiskNotes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: APPLICATIONS */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400/60 uppercase tracking-wider">
                  Candidate Application Lifecycles ({JOB_APPLICATIONS.length})
                </span>
                <span className="text-emerald-400/50 text-[11px]">
                  States: discovered → evaluated → approved → preparing → submitted → receipt captured
                </span>
              </div>
              <div className="space-y-4">
                {JOB_APPLICATIONS.map(app => (
                  <div 
                    key={app.id}
                    className="p-5 rounded-xl border border-emerald-950/80 bg-[#041a10] space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-white tracking-tight">
                          {app.role}
                        </h4>
                        <p className="text-xs text-emerald-300/70 font-mono mt-0.5">
                          {app.employer} • Started: {app.startedAt}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {renderLifecycleBadge(app.lifecycleState)}
                      </div>
                    </div>
                    <p className="text-xs text-emerald-200/90 leading-relaxed font-sans">
                      {app.stateExplanation}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-950/80 text-[11px] font-mono text-emerald-400/60">
                      <span>Transport: {app.submissionMedium}</span>
                      {app.packageHash && <span>Hash: {app.packageHash}</span>}
                      {app.receiptId && (
                        <span className="text-emerald-300 font-bold">
                          Receipt: {app.receiptId}
                        </span>
                      )}
                    </div>
                    {app.requiresAttention && (
                      <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800 text-xs text-amber-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>{app.attentionReason}</span>
                        </div>
                        <button
                          onClick={() => {
                            onClose();
                            onNavigateToApprovals();
                          }}
                          className="px-3 py-1 rounded bg-amber-900/80 text-white font-mono text-xs font-semibold hover:bg-amber-800 transition-colors"
                        >
                          View in Inbox
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DECISIONS */}
          {activeTab === 'decisions' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  Authoritative Backend Policy Decisions
                </h3>
                <p className="text-xs text-emerald-300/60 mt-0.5">
                  Supported decisions: APPLY, REJECT, STOP, ASK
                </p>
              </div>
              <div className="space-y-3">
                {JOB_DECISION_RECORDS.map(dec => (
                  <div 
                    key={dec.id}
                    className="p-4 rounded-xl border border-emerald-950/80 bg-[#041a10] space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-sm font-bold text-white block">{dec.role}</span>
                        <span className="text-xs text-emerald-300/60 font-mono">{dec.employer}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderDecisionBadge(dec.decision)}
                        <span className="text-xs font-mono text-emerald-400 font-bold">{dec.matchScore}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-emerald-200/90 leading-relaxed font-sans">
                      {dec.authoritativeReason}
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-emerald-400/60">
                      <span>Policy Rule: <strong>{dec.policyRule}</strong></span>
                      <span>Decided: {dec.decidedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FAILURES */}
          {activeTab === 'failures' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold">
                  Subsystem Failures &amp; Policy Holds
                </h3>
                <p className="text-xs text-emerald-300/60 mt-0.5">
                  Log of transport throttles, scam domain holds, and truth store mismatch rejections
                </p>
              </div>
              <div className="space-y-3">
                {JOB_FAILURES.map(fail => (
                  <div 
                    key={fail.id}
                    className="p-4 rounded-xl border border-rose-950/80 bg-[#160609] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 font-mono">
                      <span className="font-bold text-rose-300 flex items-center gap-1.5">
                        <AlertOctagon className="w-4 h-4 text-rose-400" />
                        <span>{fail.title}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-200 border border-rose-800 text-[10px] font-bold">
                        {fail.category}
                      </span>
                    </div>
                    <p className="text-rose-100/90 leading-relaxed font-sans">
                      {fail.details}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-rose-950 text-[11px] font-mono text-rose-300/70">
                      <span>Entity: {fail.relatedEntity}</span>
                      <span>State: <strong>{fail.retryState}</strong></span>
                      <span>Error: {fail.errorSignature}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  Job Agent Pipeline Chronology
                </h3>
                <p className="text-xs text-emerald-300/60 mt-0.5">
                  Chronological execution history and policy gate evaluations
                </p>
              </div>
              <div className="space-y-2.5">
                {[
                  { time: "07:31 AM", event: "Completed career index scan: 18 opportunities evaluated against Truth Store", code: "SCAN_NOMINAL" },
                  { time: "07:25 AM", event: "Compensation threshold rule triggered on Nexus Grid role; ASK gate flagged", code: "ASK_GATE_SET" },
                  { time: "07:20 AM", event: "Crypto Genesis Global Network domain blocked by Scam Risk Guard", code: "STOP_SCAM_BLOCKED" },
                  { time: "07:15 AM", event: "CyberDefense SOC architect role rejected: Truth Store lacks certified SOC credentials", code: "REJECT_TRUTH_GAP" },
                  { time: "07:10 AM", event: "Candidate cover letter tailored for Vanguard Tech Senior Staff Platform Engineer", code: "DRAFT_PREPARED" },
                  { time: "06:55 AM", event: "Aurora Systems application package completed; waiting on operator ASK approval", code: "ASK_DISPATCH_HOLD" },
                  { time: "05:50 AM", event: "Remote Greenhouse ATS rate limit (HTTP 429) backoff delay engaged (+300s)", code: "RETRY_RATE_LIMIT" }
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-lg border border-emerald-950/80 bg-[#03140c] flex items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-bold">{item.time}</span>
                      <span className="text-emerald-100">{item.event}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400/50 px-1.5 py-0.5 rounded bg-[#062416] border border-emerald-950 shrink-0">
                      {item.code}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-emerald-950/80 bg-[#04190e] flex items-center justify-between text-xs font-mono">
          <span className="text-emerald-400/60">
            Authoritative Job Agent Subsystem • Policy Engine Governed
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-emerald-800/60 bg-[#0a2f1c] hover:bg-[#0e3b23] text-emerald-100 transition-colors"
          >
            Close Job Agent Domain
          </button>
        </div>

      </div>
    </div>
  );
};
