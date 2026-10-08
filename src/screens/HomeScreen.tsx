import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChief } from '../context/ChiefContext';
import { useAuth } from '../context/AuthContext';
import { AttentionArea } from '../components/AttentionArea';
import { ChiefStatusCard } from '../components/ChiefStatusCard';
import { AgentGrid } from '../components/AgentGrid';
import { ActivityFeed } from '../components/ActivityFeed';
import { QuickActions } from '../components/QuickActions';
import { FarmOperationsPanel } from '../components/FarmOperationsPanel';
import { ConnectivityBanner } from '../components/ConnectivityBanner';
import { SecurityComplianceBadge } from '../components/SecurityComplianceBadge';
import { PWAInstallBanner } from '../components/ui/PWAInstallBanner';
import { JobAgentModal } from '../components/JobAgentModal';
import { FarmAgentModal } from '../components/FarmAgentModal';
import { SystemDetailsModal } from '../components/SystemDetailsModal';
import { ActivityLogModal } from '../components/ActivityLogModal';
import { WorkerReportModal } from '../components/worker/WorkerReportModal';
import { OfflineQueueModal } from '../components/queue/OfflineQueueModal';
import { useWorkerReports } from '../context/WorkerReportContext';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isDevMode } = useAuth();
  const { state, healthState, forceSync, pendingApprovalsCount, compositeProvenance } = useChief();
  const { queuedCount } = useWorkerReports();

  const [isJobAgentOpen, setIsJobAgentOpen] = useState(false);
  const [isFarmAgentOpen, setIsFarmAgentOpen] = useState(false);
  const [isSystemDetailsOpen, setIsSystemDetailsOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [isWorkerReportOpen, setIsWorkerReportOpen] = useState(false);
  const [isOfflineQueueOpen, setIsOfflineQueueOpen] = useState(false);

  const jobAgent = state.agents.find(a => a.agent_id === 'job_agent') || state.agents[0];
  const farmAgent = state.agents.find(a => a.agent_id === 'farm_agent') || state.agents[1];

  const provenanceSubtitle = useMemo(() => {
    switch (compositeProvenance) {
      case 'live': return 'LIVE — synchronized with Chief backend';
      case 'cached': return 'CACHED — last known Chief state';
      case 'mock_isolated': return 'SIMULATED — development data';
      default: return 'Chief data unavailable';
    }
  }, [compositeProvenance]);

  const healthBadge = useMemo(() => {
    if (healthState.provenance === 'mock_isolated') return { dot: 'bg-amber-400', label: 'SIMULATED HEALTH — NOT CHIEF HEALTH', className: 'bg-amber-950/40 border-amber-800 text-amber-200 font-bold' };
    if (healthState.status === 'healthy' && healthState.provenance === 'live') return { dot: 'bg-emerald-400 animate-pulse', label: 'Health Check: Nominal (Live)', className: 'bg-[#062416] border-emerald-900/60 text-emerald-300' };
    if (healthState.status === 'degraded') return { dot: 'bg-amber-400', label: healthState.provenance === 'cached' ? 'Health Check: Cached Snapshot' : 'Chief Health Degraded', className: 'bg-amber-950/40 border-amber-800 text-amber-200' };
    return { dot: 'bg-rose-400', label: 'Chief Health Unavailable', className: 'bg-rose-950/40 border-rose-900 text-rose-200' };
  }, [healthState]);

  return (
    <div className="space-y-6 pb-24">
      <PWAInstallBanner />
      <ConnectivityBanner connectivity={state.connectivity} pendingCount={state.pendingSyncCount} lastSyncTimestamp={state.lastSyncTimestamp} onSyncNow={forceSync} onOpenQueue={() => setIsOfflineQueueOpen(true)} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div><h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>OPERATIONAL CONSOLE</h1><p className="text-xs text-emerald-300/60 mt-0.5 font-mono">{provenanceSubtitle}</p></div>
        <div className="flex items-center gap-2 self-start sm:self-center"><span className={`px-2.5 py-1 rounded-md text-[11px] font-mono border flex items-center gap-1.5 shadow-sm ${healthBadge.className}`}><span className={`w-1.5 h-1.5 rounded-full ${healthBadge.dot}`} /><span>{healthBadge.label}</span></span></div>
      </div>

      <AttentionArea items={state.attentionItems} onViewInbox={() => navigate('/inbox')} provenance={state.resourceProvenance?.attention || compositeProvenance} />
      <FarmOperationsPanel />
      <ChiefStatusCard state={state} onOpenSystemDetails={() => setIsSystemDetailsOpen(true)} />
      <AgentGrid agents={state.agents} onOpenAgent={(id) => { if (id === 'job_agent') setIsJobAgentOpen(true); else if (id === 'farm_agent') setIsFarmAgentOpen(true); else navigate('/agents'); }} provenance={state.resourceProvenance?.agents || compositeProvenance} />

      <QuickActions
        onReviewApprovals={() => navigate('/inbox')}
        onViewOpportunities={() => setIsJobAgentOpen(true)}
        onFarmReport={() => setIsFarmAgentOpen(true)}
        onSystemStatus={() => setIsSystemDetailsOpen(true)}
        onWorkerReport={isDevMode ? () => setIsWorkerReportOpen(true) : undefined}
        pendingApprovalsCount={pendingApprovalsCount}
        queuedReportsCount={isDevMode ? queuedCount : 0}
      />

      <ActivityFeed items={state.activity} onViewAllActivity={() => navigate('/activity')} provenance={state.resourceProvenance?.activity || compositeProvenance} />
      <SecurityComplianceBadge />

      {isDevMode && <WorkerReportModal isOpen={isWorkerReportOpen} onClose={() => setIsWorkerReportOpen(false)} />}
      <JobAgentModal isOpen={isJobAgentOpen} onClose={() => setIsJobAgentOpen(false)} agent={jobAgent} onNavigateToApprovals={() => { setIsJobAgentOpen(false); navigate('/inbox'); }} />
      <FarmAgentModal isOpen={isFarmAgentOpen} onClose={() => setIsFarmAgentOpen(false)} agent={farmAgent} onNavigateToApprovals={() => { setIsFarmAgentOpen(false); navigate('/inbox'); }} />
      <SystemDetailsModal isOpen={isSystemDetailsOpen} onClose={() => setIsSystemDetailsOpen(false)} state={state} onNavigateToApprovals={() => setIsSystemDetailsOpen(false)} />
      <ActivityLogModal isOpen={isActivityLogOpen} onClose={() => setIsActivityLogOpen(false)} activities={state.activity} />
      <OfflineQueueModal isOpen={isOfflineQueueOpen} onClose={() => setIsOfflineQueueOpen(false)} />
    </div>
  );
};
