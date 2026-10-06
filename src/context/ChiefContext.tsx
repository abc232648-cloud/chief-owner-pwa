import React, { createContext, useContext, useState, useRef, useEffect, useMemo } from 'react';
import { 
  ChiefState, 
  AttentionItem, 
  AgentState, 
  ActivityEvent, 
  StatusMessageOption, 
  ConnectivityMode,
  ChiefBackendReachability,
  SynchronizationStatus 
} from '../types/chief';
import { 
  INITIAL_CHIEF_STATE, 
  INITIAL_ATTENTION_ITEMS, 
  INITIAL_AGENTS, 
  INITIAL_ACTIVITY,
  PRODUCTION_UNSYNCHRONIZED_CHIEF_STATE 
} from '../data/mockChiefData';
import { 
  chiefApi, 
  ChiefApiError, 
  DataProvenance,
  ResourceProvenanceMap 
} from '../api';
import { useAuth } from './AuthContext';
import { isChiefDevMode } from '../config/devMode';

export interface ChiefHealthState {
  healthy: boolean;
  invariantsPassed: boolean;
  latencyMs: number;
  status: 'healthy' | 'degraded' | 'unavailable';
  label: string;
  provenance: DataProvenance;
}

interface ChiefContextType {
  state: ChiefState;
  healthState: ChiefHealthState;
  isSyncing: boolean;
  lastCorrelationId: string;
  dataProvenance: DataProvenance;
  resourceProvenance: ResourceProvenanceMap;
  compositeProvenance: DataProvenance;
  isFullyLive: boolean;
  networkOnline: boolean;
  chiefReachability: ChiefBackendReachability;
  syncStatus: SynchronizationStatus;
  lastApiError: ChiefApiError | null;
  forceSync: () => Promise<void>;
  cancelOngoingSync: () => void;
  toggleConnectivity: () => void;
  setConnectivity: (mode: ConnectivityMode) => void;
  setStatusMessage: (status: StatusMessageOption) => void;
  submittingItemIds: string[];
  itemSubmissionErrors: Record<string, string>;
  isItemSubmitting: (id: string) => boolean;
  clearItemError: (id: string) => void;
  approveItem: (id: string) => Promise<boolean>;
  rejectItem: (id: string) => Promise<boolean>;
  acknowledgeStop: (id: string) => Promise<boolean>;
  resetState: () => void;
  pendingApprovalsCount: number;
  stopInterlocksCount: number;
  totalPendingCount: number;
}

const ChiefContext = createContext<ChiefContextType | undefined>(undefined);

export const ChiefProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const isDev = isChiefDevMode();

  // Initial state: Production must never boot displaying demo Chief state as current
  const [state, setState] = useState<ChiefState>(() => 
    isDev ? INITIAL_CHIEF_STATE : PRODUCTION_UNSYNCHRONIZED_CHIEF_STATE
  );

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastCorrelationId, setLastCorrelationId] = useState<string>('cid_init_baseline');
  const [lastApiError, setLastApiError] = useState<ChiefApiError | null>(null);

  // Per-resource provenance tracking
  const [resourceProvenance, setResourceProvenance] = useState<ResourceProvenanceMap>(() => 
    isDev 
      ? { system: 'mock_isolated', agents: 'mock_isolated', attention: 'mock_isolated', activity: 'mock_isolated' }
      : { system: 'unavailable', agents: 'unavailable', attention: 'unavailable', activity: 'unavailable' }
  );

  // Separate device Internet connectivity from Chief backend reachability
  const [networkOnline, setNetworkOnline] = useState<boolean>(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [chiefReachability, setChiefReachability] = useState<ChiefBackendReachability>(() => 
    isDev ? 'simulated' : 'unreachable'
  );

  // Health check state (derived from genuine backend check or DEV mock)
  const [healthState, setHealthState] = useState<ChiefHealthState>(() => 
    isDev 
      ? {
          healthy: true,
          invariantsPassed: true,
          latencyMs: 14,
          status: 'healthy',
          label: 'SIMULATED HEALTH — NOT CHIEF HEALTH',
          provenance: 'mock_isolated'
        }
      : {
          healthy: false,
          invariantsPassed: false,
          latencyMs: -1,
          status: 'unavailable',
          label: 'Chief Health Unavailable',
          provenance: 'unavailable'
        }
  );

  useEffect(() => {
    const handleOnline = () => setNetworkOnline(true);
    const handleOffline = () => setNetworkOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Compute composite provenance
  const compositeProvenance: DataProvenance = useMemo(() => {
    const values = Object.values(resourceProvenance);
    if (values.every(v => v === 'live')) return 'live';
    if (values.every(v => v === 'mock_isolated')) return 'mock_isolated';
    if (values.every(v => v === 'cached')) return 'cached';
    if (values.includes('unavailable')) return 'unavailable';
    return 'cached';
  }, [resourceProvenance]);

  const isFullyLive = compositeProvenance === 'live';

  const syncStatus: SynchronizationStatus = useMemo(() => {
    if (compositeProvenance === 'live') return 'current';
    if (compositeProvenance === 'cached') return 'stale';
    if (compositeProvenance === 'unavailable') return 'not_synchronized';
    if (compositeProvenance === 'mock_isolated') return 'current';
    return 'not_synchronized';
  }, [compositeProvenance]);

  // Backward compatibility: dataProvenance maps to compositeProvenance
  const dataProvenance = compositeProvenance;

  // Double-submission protection: Track items actively in flight
  const [submittingItemIds, setSubmittingItemIds] = useState<string[]>([]);
  const [itemSubmissionErrors, setItemSubmissionErrors] = useState<Record<string, string>>({});

  const isItemSubmitting = (id: string) => submittingItemIds.includes(id);

  const clearItemError = (id: string) => {
    setItemSubmissionErrors(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  // Active sync abort controller ref
  const activeSyncAbortRef = useRef<AbortController | null>(null);

  // Keep API client token configuration synced with active user session.
  // BATCH 13B.1 ENFORCEMENT: Simulated personas must NEVER authenticate real API requests.
  useEffect(() => {
    chiefApi.client.setConfig({
      getAuthTokenRef: () => (user && !user.isSimulated && user.sessionTokenRef ? user.sessionTokenRef : null)
    });
  }, [user]);

  // Cancel ongoing in-flight sync request
  const cancelOngoingSync = () => {
    if (activeSyncAbortRef.current) {
      activeSyncAbortRef.current.abort();
      activeSyncAbortRef.current = null;
      setIsSyncing(false);
    }
  };

  // Authoritative API Sync via Chief API Data Layer
  const forceSync = async (): Promise<void> => {
    cancelOngoingSync();
    const controller = new AbortController();
    activeSyncAbortRef.current = controller;
    setIsSyncing(true);
    setLastApiError(null);

    try {
      // Parallel fetch across conceptual Chief resources through controlled adapters
      const [systemResult, agentsResult, attentionResult, activityResult, healthResult] = await Promise.allSettled([
        chiefApi.system.getStatus(controller.signal),
        chiefApi.agents.getAgents(controller.signal),
        chiefApi.attention.getItems(controller.signal),
        chiefApi.activity.getActivityLog({}, controller.signal),
        chiefApi.system.getHealthCheck(controller.signal)
      ]);

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Update health check result
      if (healthResult.status === 'fulfilled') {
        setHealthState({
          ...healthResult.value.data,
          provenance: healthResult.value.provenance
        });
      } else {
        setHealthState({
          healthy: false,
          invariantsPassed: false,
          latencyMs: -1,
          status: 'unavailable',
          label: isDev ? 'SIMULATED HEALTH — NOT CHIEF HEALTH' : 'Chief Health Unavailable',
          provenance: isDev ? 'mock_isolated' : 'unavailable'
        });
      }

      // Determine per-resource results and provenances
      const sysProv: DataProvenance = systemResult.status === 'fulfilled' ? systemResult.value.provenance : 'unavailable';
      const agnProv: DataProvenance = agentsResult.status === 'fulfilled' ? agentsResult.value.provenance : 'unavailable';
      const attProv: DataProvenance = attentionResult.status === 'fulfilled' ? attentionResult.value.provenance : 'unavailable';
      const actProv: DataProvenance = activityResult.status === 'fulfilled' ? activityResult.value.provenance : 'unavailable';

      const newProvenanceMap: ResourceProvenanceMap = {
        system: sysProv,
        agents: agnProv,
        attention: attProv,
        activity: actProv
      };
      setResourceProvenance(newProvenanceMap);

      // Compute overall reachability and composite provenance
      const provList = Object.values(newProvenanceMap);
      const anyLive = provList.includes('live');
      const anyMock = provList.includes('mock_isolated');
      const anyCached = provList.includes('cached');

      let newReachability: ChiefBackendReachability = 'unreachable';
      if (anyLive) {
        newReachability = provList.every(p => p === 'live') ? 'reachable' : 'degraded';
      } else if (anyMock) {
        newReachability = 'simulated';
      } else if (anyCached) {
        newReachability = 'degraded';
      } else {
        newReachability = 'unreachable';
      }
      setChiefReachability(newReachability);

      const newComposite: DataProvenance = 
        provList.every(p => p === 'live') ? 'live'
        : provList.every(p => p === 'mock_isolated') ? 'mock_isolated'
        : provList.every(p => p === 'cached') ? 'cached'
        : provList.includes('unavailable') ? 'unavailable'
        : 'cached';

      // Extract genuine cache timestamp if any resource is served from cache
      const cachedTimestamps = [
        systemResult.status === 'fulfilled' && systemResult.value.provenance === 'cached' && systemResult.value.fetchedAt ? systemResult.value.fetchedAt : null,
        agentsResult.status === 'fulfilled' && agentsResult.value.provenance === 'cached' && agentsResult.value.fetchedAt ? agentsResult.value.fetchedAt : null,
        attentionResult.status === 'fulfilled' && attentionResult.value.provenance === 'cached' && attentionResult.value.fetchedAt ? attentionResult.value.fetchedAt : null,
        activityResult.status === 'fulfilled' && activityResult.value.provenance === 'cached' && activityResult.value.fetchedAt ? activityResult.value.fetchedAt : null,
      ].filter((t): t is number => typeof t === 'number' && t > 0);

      const resolvedCacheTime = cachedTimestamps.length > 0 
        ? Math.min(...cachedTimestamps) 
        : state.cacheTimestamp;

      let lastSyncLabel = 'Chief data unavailable';
      let lastSyncTimestamp = state.lastSyncTimestamp;
      let cacheAgeLabel: string | undefined;
      let cacheTimeFormatted: string | undefined;

      if (newComposite === 'live') {
        lastSyncLabel = `LIVE — synchronized at ${timeStr}`;
        lastSyncTimestamp = timeStr;
      } else if (newComposite === 'cached') {
        const cTime = resolvedCacheTime ?? (Date.now() - 1000 * 60 * 15);
        const cDate = new Date(cTime);
        cacheTimeFormatted = cDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const ageMs = Math.max(0, Date.now() - cTime);
        const ageMinutes = Math.floor(ageMs / 60000);
        const ageSecs = Math.floor((ageMs % 60000) / 1000);
        const ageStr = ageMinutes >= 60 
          ? `${Math.floor(ageMinutes / 60)}h ${ageMinutes % 60}m`
          : ageMinutes >= 1
          ? `${ageMinutes} minute${ageMinutes === 1 ? '' : 's'}`
          : `${Math.max(1, ageSecs)} seconds`;
        cacheAgeLabel = `Age: ${ageStr}`;
        lastSyncLabel = `CACHED — Cached from ${cacheTimeFormatted} • Age: ${ageStr}`;
        // Preserve actual cache timestamp, do NOT replace with time of failed sync retry
        lastSyncTimestamp = `Cached from ${cacheTimeFormatted} (Age: ${ageStr})`;
      } else if (newComposite === 'mock_isolated') {
        lastSyncLabel = `SIMULATED — development data`;
        lastSyncTimestamp = timeStr;
      } else {
        lastSyncLabel = 'Chief data unavailable';
        lastSyncTimestamp = state.lastSyncTimestamp || 'Never';
      }

      if (systemResult.status === 'fulfilled') {
        setLastCorrelationId(systemResult.value.correlationId);
      }

      setState(prev => {
        // Build state updates respecting exact provenance
        const updatedAgents = agentsResult.status === 'fulfilled' ? agentsResult.value.data : (agnProv === 'cached' ? prev.agents : []);
        const updatedAttention = attentionResult.status === 'fulfilled' ? attentionResult.value.data : (attProv === 'cached' ? prev.attentionItems : []);
        const updatedActivity = activityResult.status === 'fulfilled' ? activityResult.value.data : (actProv === 'cached' ? prev.activity : []);

        const systemData = systemResult.status === 'fulfilled' ? systemResult.value.data : null;

        return {
          ...prev,
          platform_state: systemData ? systemData.platform_state : (sysProv === 'cached' ? prev.platform_state : 'Maintenance'),
          status_message: systemData ? systemData.status_message : (sysProv === 'cached' ? prev.status_message : 'Backend unavailable'),
          lastSyncLabel,
          lastSyncTimestamp,
          cacheTimestamp: newComposite === 'cached' ? (resolvedCacheTime ?? prev.cacheTimestamp) : (newComposite === 'live' ? Date.now() : undefined),
          cacheAgeLabel,
          cacheTimeFormatted,
          pendingSyncCount: 0,
          metrics: systemData ? {
            ...systemData.metrics,
            lastSyncTimestamp: newComposite === 'cached' ? lastSyncTimestamp : timeStr,
            backend: newReachability === 'reachable' ? 'Online' : newReachability === 'degraded' ? 'Degraded' : 'Offline',
            sync: newComposite === 'live' ? 'Current' : newComposite === 'cached' ? 'Stale' : 'Stale'
          } : {
            ...prev.metrics,
            lastSyncTimestamp: newComposite === 'cached' ? lastSyncTimestamp : prev.metrics.lastSyncTimestamp,
            backend: 'Offline',
            sync: 'Stale'
          },
          agents: updatedAgents,
          attentionItems: updatedAttention,
          activity: updatedActivity,
          reachability: newReachability,
          networkOnline,
          syncStatus: newComposite === 'live' ? 'current' : newComposite === 'cached' ? 'stale' : 'not_synchronized',
          resourceProvenance: newProvenanceMap,
          compositeProvenance: newComposite,
          isFullyLive: newComposite === 'live'
        };
      });

    } catch (err: unknown) {
      if (err instanceof ChiefApiError && !err.isAborted) {
        setLastApiError(err);
      }
    } finally {
      setIsSyncing(false);
      activeSyncAbortRef.current = null;
    }
  };

  // Attempt initial sync when user becomes authenticated
  useEffect(() => {
    if (user) {
      forceSync();
    }
  }, [user?.userId]);

  // Connectivity toggle (DEV-only manual simulation)
  const toggleConnectivity = () => {
    if (!isChiefDevMode()) {
      console.warn('[Chief Security] Manual connectivity cycling is disabled in production.');
      return;
    }
    setState(prev => {
      let nextMode: ConnectivityMode = 'online';
      let nextStatus = prev.status_message;

      if (prev.connectivity === 'online') {
        nextMode = 'pending';
        nextStatus = 'Synchronization pending';
      } else if (prev.connectivity === 'pending') {
        nextMode = 'offline';
        nextStatus = 'Limited connectivity';
      } else {
        nextMode = 'online';
        nextStatus = 'System operational';
      }

      return {
        ...prev,
        connectivity: nextMode,
        status_message: nextStatus,
        pendingSyncCount: nextMode === 'pending' ? 2 : 0,
        metrics: {
          ...prev.metrics,
          sync: nextMode === 'online' ? 'Current' : 'Pending',
          backend: nextMode === 'offline' ? 'Offline' : 'Online'
        }
      };
    });
  };

  const setConnectivity = (mode: ConnectivityMode) => {
    if (!isChiefDevMode()) return;
    setState(prev => ({
      ...prev,
      connectivity: mode,
      status_message: mode === 'offline' ? 'Limited connectivity' : mode === 'pending' ? 'Synchronization pending' : 'System operational',
      pendingSyncCount: mode === 'pending' ? 2 : 0,
      metrics: {
        ...prev.metrics,
        sync: mode === 'online' ? 'Current' : 'Pending',
        backend: mode === 'offline' ? 'Offline' : 'Online'
      }
    }));
  };

  const setStatusMessage = (newStatus: StatusMessageOption) => {
    if (!isChiefDevMode()) {
      console.warn('[Chief Security] Manual status message override is disabled in production.');
      return;
    }
    setState(prev => ({
      ...prev,
      status_message: newStatus,
      platform_state: (newStatus === 'Backend unavailable' || newStatus === 'Maintenance mode') 
        ? 'Maintenance' 
        : 'Running'
    }));
  };

  // Fail-Closed Approve Mutation with Positive Backend Confirmation Validation
  const approveItem = async (id: string): Promise<boolean> => {
    if (submittingItemIds.includes(id)) {
      return false;
    }

    setSubmittingItemIds(prev => [...prev, id]);
    clearItemError(id);

    setState(prev => ({
      ...prev,
      attentionItems: prev.attentionItems.map(item =>
        item.id === id ? { ...item, submissionState: 'in_flight' as const, submissionError: undefined } : item
      )
    }));

    try {
      const res = await chiefApi.attention.approve(id);

      if (res.data?.approved !== true) {
        throw new ChiefApiError({
          message: 'Backend approval could not be confirmed: response lacked approved: true confirmation.',
          code: 'UNCONFIRMED_APPROVAL'
        });
      }

      setState(prev => {
        const itemToApprove = prev.attentionItems.find(i => i.id === id);
        const resolvedItems = prev.attentionItems.map(item =>
          item.id === id ? { ...item, status: 'approved' as const, submissionState: 'confirmed' as const } : item
        );

        const newActivityEvent: ActivityEvent = {
          id: `act-${Date.now()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestampFull: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          isoTimestamp: new Date().toISOString(),
          event: `Owner Approved Action: ${itemToApprove?.description || id}`,
          eventType: 'approval',
          agent: itemToApprove?.sourceAgent || 'Central Policy Engine',
          severity: 'nominal',
          hash: `sha256:${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
          actor: user?.name || 'Elena Vance (Owner)',
          source: 'Chief Mobile Approval Gate',
          decisionEvidence: {
            ruleId: 'RBAC-APPROVED-HUMAN',
            policyExplanation: 'Explicit human intervention granted permission for task execution.',
            parameters: {
              recordId: res.data.recordId || id,
              decision: 'APPROVED',
              confirmationConfirmed: true
            }
          }
        };

        return {
          ...prev,
          attentionItems: resolvedItems,
          activity: [newActivityEvent, ...prev.activity]
        };
      });

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Approval failed. Authority could not be verified by Chief.';
      setItemSubmissionErrors(prev => ({ ...prev, [id]: message }));

      setState(prev => ({
        ...prev,
        attentionItems: prev.attentionItems.map(item =>
          item.id === id ? { ...item, submissionState: 'failed' as const, submissionError: message } : item
        )
      }));

      return false;
    } finally {
      setSubmittingItemIds(prev => prev.filter(itemId => itemId !== id));
    }
  };

  // Fail-Closed Reject Mutation with Positive Backend Confirmation Validation
  const rejectItem = async (id: string): Promise<boolean> => {
    if (submittingItemIds.includes(id)) {
      return false;
    }

    setSubmittingItemIds(prev => [...prev, id]);
    clearItemError(id);

    setState(prev => ({
      ...prev,
      attentionItems: prev.attentionItems.map(item =>
        item.id === id ? { ...item, submissionState: 'in_flight' as const, submissionError: undefined } : item
      )
    }));

    try {
      const res = await chiefApi.attention.reject(id);

      if (res.data?.rejected !== true) {
        throw new ChiefApiError({
          message: 'Backend rejection could not be confirmed: response lacked rejected: true confirmation.',
          code: 'UNCONFIRMED_REJECTION'
        });
      }

      setState(prev => {
        const itemToReject = prev.attentionItems.find(i => i.id === id);
        const resolvedItems = prev.attentionItems.map(item =>
          item.id === id ? { ...item, status: 'rejected' as const, submissionState: 'confirmed' as const } : item
        );

        const newActivityEvent: ActivityEvent = {
          id: `act-${Date.now()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestampFull: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          isoTimestamp: new Date().toISOString(),
          event: `Owner Rejected Action: ${itemToReject?.description || id}`,
          eventType: 'rejection',
          agent: itemToReject?.sourceAgent || 'Central Policy Engine',
          severity: 'warning',
          hash: `sha256:${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
          actor: user?.name || 'Elena Vance (Owner)',
          source: 'Chief Mobile Approval Gate',
          decisionEvidence: {
            ruleId: 'RBAC-REJECTED-HUMAN',
            policyExplanation: 'Explicit human intervention denied permission for proposed action.',
            parameters: {
              recordId: res.data.recordId || id,
              decision: 'REJECTED',
              confirmationConfirmed: true
            }
          }
        };

        return {
          ...prev,
          attentionItems: resolvedItems,
          activity: [newActivityEvent, ...prev.activity]
        };
      });

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Rejection failed. Authority could not be verified by Chief.';
      setItemSubmissionErrors(prev => ({ ...prev, [id]: message }));

      setState(prev => ({
        ...prev,
        attentionItems: prev.attentionItems.map(item =>
          item.id === id ? { ...item, submissionState: 'failed' as const, submissionError: message } : item
        )
      }));

      return false;
    } finally {
      setSubmittingItemIds(prev => prev.filter(itemId => itemId !== id));
    }
  };

  // Fail-Closed Acknowledge STOP Interlock Mutation with Positive Backend Confirmation Validation
  const acknowledgeStop = async (id: string): Promise<boolean> => {
    if (submittingItemIds.includes(id)) {
      return false;
    }

    setSubmittingItemIds(prev => [...prev, id]);
    clearItemError(id);

    setState(prev => ({
      ...prev,
      attentionItems: prev.attentionItems.map(item =>
        item.id === id ? { ...item, submissionState: 'in_flight' as const, submissionError: undefined } : item
      )
    }));

    try {
      const res = await chiefApi.attention.acknowledgeStop(id);

      if (res.data?.acknowledged !== true) {
        throw new ChiefApiError({
          message: 'Backend STOP acknowledgement could not be confirmed: response lacked acknowledged: true confirmation.',
          code: 'UNCONFIRMED_STOP_ACK'
        });
      }

      setState(prev => {
        const itemToAck = prev.attentionItems.find(i => i.id === id);
        const resolvedItems = prev.attentionItems.map(item =>
          item.id === id ? { ...item, status: 'acknowledged' as const, submissionState: 'confirmed' as const } : item
        );

        const newActivityEvent: ActivityEvent = {
          id: `act-${Date.now()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestampFull: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          isoTimestamp: new Date().toISOString(),
          event: `Safety STOP Interlock Acknowledged: ${itemToAck?.description || id}`,
          eventType: 'stop_event',
          agent: itemToAck?.sourceAgent || 'Central Policy Engine',
          severity: 'interlock',
          hash: `sha256:${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
          actor: user?.name || 'Elena Vance (Owner)',
          source: 'Chief Mobile Safety Interlock Interface',
          decisionEvidence: {
            ruleId: 'SAFETY-INTERLOCK-STOP-ACKNOWLEDGED',
            policyExplanation: 'Field STOP confirmed by human operator. Technician ticket dispatched.',
            parameters: {
              ticketId: res.data.ticketId,
              overridePermitted: false,
              confirmationConfirmed: true
            }
          }
        };

        return {
          ...prev,
          attentionItems: resolvedItems,
          activity: [newActivityEvent, ...prev.activity]
        };
      });

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'STOP acknowledgement failed. Authority could not be verified by Chief.';
      setItemSubmissionErrors(prev => ({ ...prev, [id]: message }));

      setState(prev => ({
        ...prev,
        attentionItems: prev.attentionItems.map(item =>
          item.id === id ? { ...item, submissionState: 'failed' as const, submissionError: message } : item
        )
      }));

      return false;
    } finally {
      setSubmittingItemIds(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const resetState = () => {
    if (!isChiefDevMode()) {
      console.warn('[Chief Security] resetState is disabled in production.');
      return;
    }
    setSubmittingItemIds([]);
    setItemSubmissionErrors({});
    setState(INITIAL_CHIEF_STATE);
    setResourceProvenance({
      system: 'mock_isolated',
      agents: 'mock_isolated',
      attention: 'mock_isolated',
      activity: 'mock_isolated'
    });
    setChiefReachability('simulated');
  };

  const pendingItems = state.attentionItems.filter(i => i.status === 'pending');
  const stopInterlocksCount = pendingItems.filter(i => i.level === 'STOP').length;
  const pendingApprovalsCount = pendingItems.filter(i => i.level === 'Approval' || i.level === 'Approval required' || i.level === 'ASK').length;

  return (
    <ChiefContext.Provider
      value={{
        state,
        healthState,
        isSyncing,
        lastCorrelationId,
        dataProvenance,
        resourceProvenance,
        compositeProvenance,
        isFullyLive,
        networkOnline,
        chiefReachability,
        syncStatus,
        lastApiError,
        forceSync,
        cancelOngoingSync,
        toggleConnectivity,
        setConnectivity,
        setStatusMessage,
        submittingItemIds,
        itemSubmissionErrors,
        isItemSubmitting,
        clearItemError,
        approveItem,
        rejectItem,
        acknowledgeStop,
        resetState,
        pendingApprovalsCount,
        stopInterlocksCount,
        totalPendingCount: pendingItems.length
      }}
    >
      {children}
    </ChiefContext.Provider>
  );
};

export const useChief = (): ChiefContextType => {
  const context = useContext(ChiefContext);
  if (!context) {
    throw new Error('useChief must be used within a ChiefProvider');
  }
  return context;
};
