import React, { useState } from 'react';
import { useChief } from '../context/ChiefContext';
import { useAuth } from '../context/AuthContext';
import { useOfflineQueue } from '../context/OfflineQueueContext';
import { StopBadge, AskBadge, ApprovalBadge, WarningBadge, InfoBadge } from '../components/ui/PolicyBadges';
import { Card } from '../components/ui/Card';
import { ActionButton } from '../components/ui/ActionButton';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { UnauthorizedView } from '../components/auth/UnauthorizedView';
import { AttentionItem, AttentionLevel } from '../types/chief';
import { UserCapability } from '../types/auth';
import { 
  Check, 
  XCircle, 
  AlertOctagon, 
  RotateCcw, 
  Lock, 
  CheckCircle2, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  Activity, 
  WifiOff 
} from 'lucide-react';

export const InboxScreen: React.FC = () => {
  const { 
    state, 
    approveItem, 
    rejectItem, 
    acknowledgeStop, 
    resetState,
    isItemSubmitting,
    itemSubmissionErrors
  } = useChief();
  const { hasCapability, user } = useAuth();
  const { isEffectivelyOffline } = useOfflineQueue();

  const [activeTab, setActiveTab] = useState<'all' | 'stop' | 'ask' | 'warning' | 'info' | 'resolved'>('all');
  const [expandedEvidenceIds, setExpandedEvidenceIds] = useState<Record<string, boolean>>({});

  const [deniedCapability, setDeniedCapability] = useState<{
    capability: UserCapability;
    actionName: string;
  } | null>(null);

  const [offlineBlockedModal, setOfflineBlockedModal] = useState<{
    title: string;
    actionName: string;
  } | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject' | 'acknowledge';
    item: AttentionItem | null;
  }>({
    isOpen: false,
    type: 'approve',
    item: null
  });

  if (!hasCapability('can_view_inbox')) {
    return (
      <div className="py-8 space-y-4">
        <UnauthorizedView
          requiredCapability="can_view_inbox"
          actionName="View Operational Attention Inbox"
        />
      </div>
    );
  }

  const getPriorityWeight = (level: AttentionLevel): number => {
    switch (level) {
      case 'STOP':
        return 1;
      case 'ASK':
      case 'Approval':
      case 'Approval required':
        return 2;
      case 'Warning':
        return 3;
      case 'Information':
        return 4;
      default:
        return 5;
    }
  };

  const sortedItems = [...state.attentionItems].sort((a, b) => {
    const weightA = getPriorityWeight(a.level);
    const weightB = getPriorityWeight(b.level);
    if (weightA !== weightB) {
      return weightA - weightB;
    }
    return 0;
  });

  const pendingItems = sortedItems.filter(i => i.status === 'pending');
  const stopItems = pendingItems.filter(i => i.level === 'STOP');
  const askAndApprovalItems = pendingItems.filter(i => i.level === 'ASK' || i.level === 'Approval' || i.level === 'Approval required');
  const warningItems = pendingItems.filter(i => i.level === 'Warning');
  const infoItems = pendingItems.filter(i => i.level === 'Information');
  const resolvedItems = sortedItems.filter(i => i.status !== 'pending');

  const filteredItems = sortedItems.filter(item => {
    if (activeTab === 'all') return item.status === 'pending';
    if (activeTab === 'stop') return item.status === 'pending' && item.level === 'STOP';
    if (activeTab === 'ask') return item.status === 'pending' && (item.level === 'ASK' || item.level === 'Approval' || item.level === 'Approval required');
    if (activeTab === 'warning') return item.status === 'pending' && item.level === 'Warning';
    if (activeTab === 'info') return item.status === 'pending' && item.level === 'Information';
    if (activeTab === 'resolved') return item.status !== 'pending';
    return true;
  });

  const toggleEvidence = (id: string) => {
    setExpandedEvidenceIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleTriggerApprove = (item: AttentionItem) => {
    if (isItemSubmitting(item.id)) return;
    if (isEffectivelyOffline) {
      setOfflineBlockedModal({
        title: item.title,
        actionName: 'Approve Action'
      });
      return;
    }
    if (!hasCapability('can_approve_application')) {
      setDeniedCapability({
        capability: 'can_approve_application',
        actionName: `Approve: ${item.title}`
      });
      return;
    }
    setConfirmDialog({
      isOpen: true,
      type: 'approve',
      item
    });
  };

  const handleTriggerReject = (item: AttentionItem) => {
    if (isItemSubmitting(item.id)) return;
    if (isEffectivelyOffline) {
      setOfflineBlockedModal({
        title: item.title,
        actionName: 'Reject Action'
      });
      return;
    }
    if (!hasCapability('can_reject_application')) {
      setDeniedCapability({
        capability: 'can_reject_application',
        actionName: `Reject: ${item.title}`
      });
      return;
    }
    setConfirmDialog({
      isOpen: true,
      type: 'reject',
      item
    });
  };

  const handleTriggerAcknowledge = (item: AttentionItem) => {
    if (isItemSubmitting(item.id)) return;
    if (isEffectivelyOffline) {
      setOfflineBlockedModal({
        title: item.title,
        actionName: 'Acknowledge Hardware Interlock'
      });
      return;
    }
    if (!hasCapability('can_acknowledge_stop')) {
      setDeniedCapability({
        capability: 'can_acknowledge_stop',
        actionName: `Acknowledge Hardware Interlock: ${item.title}`
      });
      return;
    }
    setConfirmDialog({
      isOpen: true,
      type: 'acknowledge',
      item
    });
  };

  const handleConfirmAction = async () => {
    const item = confirmDialog.item;
    if (!item) return;
    const actionType = confirmDialog.type;
    setConfirmDialog({ isOpen: false, type: 'approve', item: null });

    if (actionType === 'approve') {
      await approveItem(item.id);
    } else if (actionType === 'reject') {
      await rejectItem(item.id);
    } else if (actionType === 'acknowledge') {
      await acknowledgeStop(item.id);
    }
  };

  const renderBadge = (level: AttentionLevel) => {
    switch (level) {
      case 'STOP':
        return <StopBadge size="sm" />;
      case 'ASK':
        return <AskBadge size="sm" />;
      case 'Approval':
      case 'Approval required':
        return <ApprovalBadge size="sm" />;
      case 'Warning':
        return <WarningBadge size="sm" />;
      case 'Information':
        return <InfoBadge size="sm" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* 1. Header & Priority Declaration */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
            PRIMARY HUMAN-CONTROL SURFACE
          </h1>
          <p className="text-xs text-emerald-300/60 mt-0.5 font-mono">
            Priority Hierarchy: <strong className="text-rose-400">STOP</strong> &gt; <strong className="text-amber-400">ASK / Approval</strong> &gt; <strong className="text-amber-300/80">Warning</strong> &gt; <strong className="text-cyan-400">Information</strong>
          </p>
        </div>
        <button
          onClick={resetState}
          className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-800/60 text-xs font-mono text-emerald-300/80 hover:text-white bg-[#062416] hover:bg-[#0a2f1c] transition-colors shadow-sm"
          title="Reset to authoritative baseline queue"
        >
          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
          <span>Reset Queue Baseline</span>
        </button>
      </div>

      {/* Offline Safety Declaration */}
      {isEffectivelyOffline && (
        <div className="p-3.5 rounded-xl border border-rose-900/80 bg-[#160609] text-xs font-mono text-rose-200 flex items-center gap-3 shadow-md">
          <WifiOff className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
          <div>
            <span className="font-bold text-white block uppercase tracking-wider">
              LIVE VALIDATION REQUIRED (DEVICE OFFLINE):
            </span>
            <span className="text-rose-300/80">
              High-impact approvals (ASK gates) and STOP acknowledgments require an active uplink and cannot be queued offline.
            </span>
          </div>
        </div>
      )}

      {/* 2. Authority & Operator Policy Bounds */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-emerald-900/50 bg-[#052114]/90 text-xs font-mono shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-emerald-400/70">Operator Authority:</span>
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold uppercase">
            {user?.role}
          </span>
          <span className="text-emerald-300/60 hidden md:inline">({user?.name})</span>
        </div>
        <div className="text-[11px] text-emerald-400/60 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Safety Rule #1: STOP decisions cannot be overridden remotely</span>
        </div>
      </div>

      {/* 3. Filter Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-xl font-mono whitespace-nowrap transition-colors ${
            activeTab === 'all' 
              ? 'bg-emerald-600 text-white font-semibold shadow-sm' 
              : 'text-emerald-300/70 hover:text-white bg-[#062416] border border-emerald-950'
          }`}
        >
          All Pending ({pendingItems.length})
        </button>
        <button
          onClick={() => setActiveTab('stop')}
          className={`px-3 py-1.5 rounded-xl font-mono whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'stop' 
              ? 'bg-rose-950 text-rose-200 border border-rose-700 font-semibold shadow-sm' 
              : 'text-rose-400/80 hover:text-rose-200 bg-[#062416] border border-emerald-950'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span>STOP ({stopItems.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('ask')}
          className={`px-3 py-1.5 rounded-xl font-mono whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'ask' 
              ? 'bg-amber-950 text-amber-200 border border-amber-700 font-semibold shadow-sm' 
              : 'text-amber-400/80 hover:text-amber-200 bg-[#062416] border border-emerald-950'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>ASK &amp; Approvals ({askAndApprovalItems.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('warning')}
          className={`px-3 py-1.5 rounded-xl font-mono whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'warning' 
              ? 'bg-amber-950/70 text-amber-200 border border-amber-700 font-semibold' 
              : 'text-emerald-300/70 hover:text-white bg-[#062416] border border-emerald-950'
          }`}
        >
          <span>Warnings ({warningItems.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`px-3 py-1.5 rounded-xl font-mono whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'info' 
              ? 'bg-cyan-950 text-cyan-200 border border-cyan-700 font-semibold' 
              : 'text-emerald-300/70 hover:text-white bg-[#062416] border border-emerald-950'
          }`}
        >
          <span>Info ({infoItems.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          className={`px-3 py-1.5 rounded-xl font-mono whitespace-nowrap transition-colors ml-auto ${
            activeTab === 'resolved' 
              ? 'bg-[#0a2f1c] text-emerald-200 font-semibold border border-emerald-700' 
              : 'text-emerald-300/60 hover:text-white bg-[#062416] border border-emerald-950'
          }`}
        >
          Resolved Archive ({resolvedItems.length})
        </button>
      </div>

      {/* 4. Actionable Items List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <EmptyState
            title="Queue Cleared"
            description="All active interlocks nominal. No human intervention is currently blocked or requested by Chief Central Engine."
          />
        ) : (
          filteredItems.map(item => {
            const isStop = item.level === 'STOP';
            const isAskOrApproval = item.level === 'ASK' || item.level === 'Approval' || item.level === 'Approval required';
            const isPending = item.status === 'pending';
            const isSubmitting = isItemSubmitting(item.id);
            const submissionError = item.submissionError || itemSubmissionErrors[item.id];
            const isEvidenceExpanded = Boolean(expandedEvidenceIds[item.id]);
            const canApprove = hasCapability('can_approve_application');
            const canAcknowledge = hasCapability('can_acknowledge_stop');
            const evidenceData = item.supportingEvidence || item.details;

            return (
              <Card
                key={item.id}
                id={`attention-item-${item.id}`}
                className={`transition-all ${
                  isStop 
                    ? 'border-rose-900/60 bg-[#160609]/90' 
                    : isPending && isAskOrApproval
                    ? 'border-amber-900/50 bg-[#140f06]/90'
                    : 'border-emerald-900/40 bg-[#052114]/90'
                }`}
                title={item.title}
                subtitle={`${item.sourceAgent || item.source} • Logged at ${item.timestamp}`}
                action={renderBadge(item.level)}
                footer={
                  isPending ? (
                    <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                      
                      {isStop ? (
                        <>
                          <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-mono">
                            <Lock className="w-3.5 h-3.5 shrink-0" />
                            <span>Interlock Engaged • Remote Override Prohibited</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ActionButton
                              variant="destructive"
                              size="sm"
                              isLoading={isSubmitting}
                              disabled={isSubmitting}
                              icon={<AlertOctagon className="w-3.5 h-3.5" />}
                              onClick={() => handleTriggerAcknowledge(item)}
                            >
                              {isSubmitting 
                                ? 'Sealing Dispatch...' 
                                : canAcknowledge 
                                ? 'Acknowledge & Seal Field Ticket' 
                                : 'Dispatch Field Ticket (Requires Permission)'}
                            </ActionButton>
                          </div>
                        </>
                      ) : isAskOrApproval ? (
                        <>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400/60">
                            <span>Authority State: {item.currentAuthorityState || 'DECISION_REQUIRED'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ActionButton
                              variant="outline"
                              size="sm"
                              disabled={isSubmitting}
                              icon={<XCircle className="w-3.5 h-3.5 text-rose-400" />}
                              onClick={() => handleTriggerReject(item)}
                            >
                              Reject
                            </ActionButton>
                            <ActionButton
                              variant="primary"
                              size="sm"
                              isLoading={isSubmitting}
                              disabled={isSubmitting}
                              icon={<Check className="w-3.5 h-3.5" />}
                              onClick={() => handleTriggerApprove(item)}
                            >
                              {isSubmitting 
                                ? 'Awaiting Chief Confirmation...' 
                                : canApprove 
                                ? 'Approve & Dispatch' 
                                : 'Approve (Permission Restricted)'}
                            </ActionButton>
                          </div>
                        </>
                      ) : (
                        <div className="w-full flex items-center justify-between text-xs font-mono text-emerald-400/60">
                          <span>Advisory acknowledged automatically under policy</span>
                          <span className="text-[11px]">State: {item.currentAuthorityState || 'NOMINAL'}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-between text-xs font-mono text-emerald-400/80">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Action sealed: <strong>{item.status.toUpperCase()}</strong></span>
                      </span>
                      <span className="text-[11px] text-emerald-400/50">Authoritative Chief state updated</span>
                    </div>
                  )
                }
              >
                {/* Error Banner if Submission Failed */}
                {submissionError && isPending && (
                  <div className="p-3 rounded-xl border border-rose-800 bg-rose-950/60 text-rose-200 text-xs flex items-start gap-2.5 shadow-sm">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block font-mono text-[11px] text-rose-300">
                        SUBMISSION UNRESOLVED: Chief Engine rejected update
                      </span>
                      <p className="mt-0.5 leading-snug">{submissionError}</p>
                    </div>
                  </div>
                )}

                {/* Explanation */}
                <div className="space-y-1.5 text-xs text-emerald-200/90 leading-relaxed font-sans">
                  <p>{item.explanation || item.description}</p>
                </div>

                {/* Proposed Action & Risk */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-xs">
                  {item.proposedAction && (
                    <div className="p-3 rounded-xl border border-emerald-950/80 bg-[#03140c] space-y-1">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block font-semibold">
                        Proposed Action:
                      </span>
                      <p className="text-white text-xs leading-snug">{item.proposedAction}</p>
                    </div>
                  )}
                  {item.riskImpact && (
                    <div className={`p-3 rounded-xl border space-y-1 ${
                      isStop 
                        ? 'border-rose-950/80 bg-[#1e070a]' 
                        : 'border-emerald-950/80 bg-[#03140c]'
                    }`}>
                      <span className={`text-[10px] font-mono uppercase tracking-wider block font-semibold ${
                        isStop ? 'text-rose-400' : 'text-amber-400'
                      }`}>
                        Risk &amp; Impact:
                      </span>
                      <p className="text-emerald-100 text-xs leading-snug">{item.riskImpact}</p>
                    </div>
                  )}
                </div>

                {/* STOP Specific Permitted Remediation */}
                {isStop && item.permittedRemediation && (
                  <div className="p-3 rounded-xl border border-rose-900/60 bg-rose-950/40 text-xs text-rose-200 space-y-1">
                    <span className="font-mono text-[11px] font-bold text-rose-300 uppercase tracking-wider block flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                      Permitted Remediation Protocol:
                    </span>
                    <p className="leading-snug">{item.permittedRemediation}</p>
                  </div>
                )}

                {/* Supporting Evidence Toggle */}
                {evidenceData && Object.keys(evidenceData).length > 0 && (
                  <div className="pt-2 border-t border-emerald-950/70">
                    <button
                      type="button"
                      onClick={() => toggleEvidence(item.id)}
                      className="text-xs font-mono text-emerald-400 hover:text-emerald-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>{isEvidenceExpanded ? 'Hide Supporting Evidence' : 'Inspect Supporting Evidence & Telemetry'}</span>
                      {isEvidenceExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {isEvidenceExpanded && (
                      <div className="mt-2.5 p-3 rounded-xl bg-[#03140c] border border-emerald-950/80 space-y-2 animate-fadeIn text-xs font-mono">
                        <span className="text-[10px] text-emerald-400/60 uppercase tracking-wider block font-semibold">
                          Authoritative Evidence Log • Chief Sensor Readout
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(evidenceData).map(([key, val]) => (
                            <div key={key} className="p-2 rounded-lg bg-[#062416] border border-emerald-950">
                              <span className="text-[10px] text-emerald-400/60 block">{key}</span>
                              <span className="text-white font-medium break-all">{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Unauthorized Intervention Modal */}
      {deniedCapability && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#021209]/85 backdrop-blur-sm animate-fadeIn">
          <UnauthorizedView
            requiredCapability={deniedCapability.capability}
            actionName={deniedCapability.actionName}
            onBack={() => setDeniedCapability(null)}
          />
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={
          confirmDialog.type === 'approve'
            ? 'Confirm Intervention Approval'
            : confirmDialog.type === 'reject'
            ? 'Confirm Intervention Rejection'
            : 'Acknowledge Hardware Interlock'
        }
        description={
          confirmDialog.type === 'approve'
            ? `Are you sure you want to approve "${confirmDialog.item?.title}"? Chief Agent will proceed with external dispatch.`
            : confirmDialog.type === 'reject'
            ? `Are you sure you want to reject "${confirmDialog.item?.title}"? The proposed workflow will be aborted.`
            : 'Hardware STOP interlocks cannot be overridden remotely. Acknowledging will seal a field technician dispatch ticket in Chief central engine.'
        }
        confirmLabel={
          confirmDialog.type === 'approve'
            ? 'Approve Action'
            : confirmDialog.type === 'reject'
            ? 'Reject Action'
            : 'Seal Technician Ticket'
        }
        variant={confirmDialog.type === 'reject' || confirmDialog.type === 'acknowledge' ? 'danger' : 'primary'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog({ isOpen: false, type: 'approve', item: null })}
      />

      {/* Never Queue Blindly Safety Modal */}
      {offlineBlockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#160609] border border-rose-800 rounded-2xl p-5 shadow-2xl space-y-4 font-mono text-xs text-rose-200">
            <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
              <Lock className="w-5 h-5 text-rose-500" />
              <span>NEVER QUEUE BLINDLY (POLICY BLOCKED)</span>
            </div>
            <p className="leading-relaxed text-white">
              The action <strong>"{offlineBlockedModal.actionName}"</strong> for <strong>"{offlineBlockedModal.title}"</strong> cannot be queued offline.
            </p>
            <p className="text-rose-300/90 leading-relaxed bg-[#0a0204] p-3 rounded-lg border border-rose-950">
              Sensitive human-control decisions (ASK gate approvals, dispatch rejections, and hardware STOP acknowledgments) require active, real-time verification against backend invariants. This prevents desynchronized or hazardous actions from executing blindly.
            </p>
            <button
              onClick={() => setOfflineBlockedModal(null)}
              className="w-full py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-center"
            >
              Understood &amp; Dismiss
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
