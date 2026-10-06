import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChief } from '../context/ChiefContext';
import { AttentionArea } from '../components/AttentionArea';
import { ChiefStatusCard } from '../components/ChiefStatusCard';
import { AgentGrid } from '../components/AgentGrid';
import { ActivityFeed } from '../components/ActivityFeed';
import { QuickActions } from '../components/QuickActions';
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
  const { 
    state, 
    forceSync, 
    pendingApprovalsCount 
  } = useChief();
  const { queuedCount } = useWorkerReports();

  const [isJobAgentOpen, setIsJobAgentOpen] = useState(false);
  const [isFarmAgentOpen, setIsFarmAgentOpen] = useState(false);
  const [isSystemDetailsOpen, setIsSystemDetailsOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [isWorkerReportOpen, setIsWorkerReportOpen] = useState(false);
  const [isOfflineQueueOpen, setIsOfflineQueueOpen] = useState(false);

  const jobAgent = state.agents.find(a => a.agent_id === 'job_agent') || state.agents[0];
  const farmAgent = state.agents.find(a => a.agent_id === 'farm_agent') || state.agents[1];

  return (
    <div className="space-y-6 pb-24">
      
      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Connectivity Banner */}
      <ConnectivityBanner
        connectivity={state.connectivity}
        pendingCount={state.pendingSyncCount}
        lastSyncTimestamp={state.lastSyncTimestamp}
        onSyncNow={forceSync}
        onOpenQueue={() => setIsOfflineQueueOpen(true)}
      />

      {/* Rapid Health Overview Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
            OPERATIONAL CONSOLE
          </h1>
          <p className="text-xs text-emerald-300/60 mt-0.5">
            Real-time telemetry feed synchronized with Authoritative Chief Backend
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-[#062416] border border-emerald-900/60 text-emerald-300 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Health Check: Nominal</span>
          </span>
        </div>
      </div>

      {/* 2. Priority Area: AttentionArea */}
      <AttentionArea
        items={state.attentionItems}
        onViewInbox={() => navigate('/inbox')}
      />

      {/* 3. Chief Status Card */}
      <ChiefStatusCard
        state={state}
        onOpenSystemDetails={() => setIsSystemDetailsOpen(true)}
      />

      {/* 4. Agent Overview: AgentGrid */}
      <AgentGrid
        agents={state.agents}
        onOpenAgent={(id) => {
          if (id === 'job_agent') setIsJobAgentOpen(true);
          else if (id === 'farm_agent') setIsFarmAgentOpen(true);
          else navigate('/agents');
        }}
      />

      {/* 5. Quick Actions */}
      <QuickActions
        onReviewApprovals={() => navigate('/inbox')}
        onViewOpportunities={() => setIsJobAgentOpen(true)}
        onFarmReport={() => setIsFarmAgentOpen(true)}
        onSystemStatus={() => setIsSystemDetailsOpen(true)}
        onWorkerReport={() => setIsWorkerReportOpen(true)}
        pendingApprovalsCount={pendingApprovalsCount}
        queuedReportsCount={queuedCount}
      />

      {/* 6. Recent Activity */}
      <ActivityFeed
        items={state.activity}
        onViewAllActivity={() => navigate('/activity')}
      />

      {/* 7. Security Policy & Authority Rules Compliance Bar */}
      <SecurityComplianceBadge />

      {/* Modals */}
      <WorkerReportModal
        isOpen={isWorkerReportOpen}
        onClose={() => setIsWorkerReportOpen(false)}
      />

      <JobAgentModal
        isOpen={isJobAgentOpen}
        onClose={() => setIsJobAgentOpen(false)}
        agent={jobAgent}
        onNavigateToApprovals={() => {
          setIsJobAgentOpen(false);
          navigate('/inbox');
        }}
      />

      <FarmAgentModal
        isOpen={isFarmAgentOpen}
        onClose={() => setIsFarmAgentOpen(false)}
        agent={farmAgent}
        onNavigateToApprovals={() => {
          setIsFarmAgentOpen(false);
          navigate('/inbox');
        }}
      />

      <SystemDetailsModal
        isOpen={isSystemDetailsOpen}
        onClose={() => setIsSystemDetailsOpen(false)}
        state={state}
        onNavigateToApprovals={() => {
          setIsSystemDetailsOpen(false);
          navigate('/inbox');
        }}
      />

      <ActivityLogModal
        isOpen={isActivityLogOpen}
        onClose={() => setIsActivityLogOpen(false)}
        activities={state.activity}
      />

      <OfflineQueueModal
        isOpen={isOfflineQueueOpen}
        onClose={() => setIsOfflineQueueOpen(false)}
      />

    </div>
  );
};
