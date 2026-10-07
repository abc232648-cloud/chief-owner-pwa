import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AttentionItem,
  ChiefBackendReachability,
  ChiefState,
  ConnectivityMode,
  StatusMessageOption,
  SynchronizationStatus
} from '../types/chief';
import {
  INITIAL_CHIEF_STATE,
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

const unavailableHealth = (): ChiefHealthState => ({
  healthy: false,
  invariantsPassed: false,
  latencyMs: -1,
  status: 'unavailable',
  label: 'Chief Health Unavailable',
  provenance: 'unavailable'
});

const simulatedHealth = (): ChiefHealthState => ({
  healthy: true,
  invariantsPassed: true,
  latencyMs: 14,
  status: 'healthy',
  label: 'SIMULATED HEALTH — NOT CHIEF HEALTH',
  provenance: 'mock_isolated'
});

function calculateCompositeProvenance(map: ResourceProvenanceMap): DataProvenance {
  const values = Object.values(map);
  if (values.every(value => value === 'live')) return 'live';
  if (values.every(value => value === 'mock_isolated')) return 'mock_isolated';
  if (values.every(value => value === 'cached')) return 'cached';
  if (values.includes('unavailable')) return 'unavailable';
  return 'cached';
}

function synchronizationFor(provenance: DataProvenance): SynchronizationStatus {
  if (provenance === 'live') return 'current';
  if (provenance === 'cached') return 'stale';
  // Development fixtures are deliberately not considered synchronized Chief state.
  return 'not_synchronized';
}

export const ChiefProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const isDev = isChiefDevMode();

  const [state, setState] = useState<ChiefState>(() =>
    isDev ? INITIAL_CHIEF_STATE : PRODUCTION_UNSYNCHRONIZED_CHIEF_STATE
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastCorrelationId, setLastCorrelationId] = useState('');
  const [lastApiError, setLastApiError] = useState<ChiefApiError | null>(null);
  const [resourceProvenance, setResourceProvenance] = useState<ResourceProvenanceMap>(() =>
    isDev
      ? { system: 'mock_isolated', agents: 'mock_isolated', attention: 'mock_isolated', activity: 'mock_isolated' }
      : { system: 'unavailable', agents: 'unavailable', attention: 'unavailable', activity: 'unavailable' }
  );
  const [networkOnline, setNetworkOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [chiefReachability, setChiefReachability] = useState<ChiefBackendReachability>(() =>
    isDev ? 'simulated' : 'unreachable'
  );
  const [healthState, setHealthState] = useState<ChiefHealthState>(() =>
    isDev ? simulatedHealth() : unavailableHealth()
  );
  const [submittingItemIds, setSubmittingItemIds] = useState<string[]>([]);
  const [itemSubmissionErrors, setItemSubmissionErrors] = useState<Record<string, string>>({});

  const activeSyncAbortRef = useRef<AbortController | null>(null);

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

  useEffect(() => {
    chiefApi.client.setConfig({
      getAuthTokenRef: () => (user && !user.isSimulated && user.sessionTokenRef ? user.sessionTokenRef : null)
    });
  }, [user]);

  const compositeProvenance = useMemo(
    () => calculateCompositeProvenance(resourceProvenance),
    [resourceProvenance]
  );
  const isFullyLive = compositeProvenance === 'live';
  const syncStatus = useMemo(
    () => synchronizationFor(compositeProvenance),
    [compositeProvenance]
  );
  const dataProvenance = compositeProvenance;

  const isItemSubmitting = (id: string) => submittingItemIds.includes(id);

  const clearItemError = (id: string) => {
    setItemSubmissionErrors(previous => {
      const next = { ...previous };
      delete next[id];
      return next;
    });
  };

  const cancelOngoingSync = () => {
    activeSyncAbortRef.current?.abort();
    activeSyncAbortRef.current = null;
    setIsSyncing(false);
  };

  const forceSync = async (): Promise<void> => {
    cancelOngoingSync();
    const controller = new AbortController();
    activeSyncAbortRef.current = controller;
    setIsSyncing(true);
    setLastApiError(null);

    try {
      const [systemResult, agentsResult, attentionResult, activityResult, healthResult] = await Promise.allSettled([
        chiefApi.system.getStatus(controller.signal),
        chiefApi.agents.getAgents(controller.signal),
        chiefApi.attention.getItems(controller.signal),
        chiefApi.activity.getActivityLog({}, controller.signal),
        chiefApi.system.getHealthCheck(controller.signal)
      ]);

      if (healthResult.status === 'fulfilled') {
        setHealthState({ ...healthResult.value.data, provenance: healthResult.value.provenance });
      } else {
        setHealthState(isDev ? simulatedHealth() : unavailableHealth());
      }

      const nextProvenance: ResourceProvenanceMap = {
        system: systemResult.status === 'fulfilled' ? systemResult.value.provenance : 'unavailable',
        agents: agentsResult.status === 'fulfilled' ? agentsResult.value.provenance : 'unavailable',
        attention: attentionResult.status === 'fulfilled' ? attentionResult.value.provenance : 'unavailable',
        activity: activityResult.status === 'fulfilled' ? activityResult.value.provenance : 'unavailable'
      };
      setResourceProvenance(nextProvenance);

      const provenance = calculateCompositeProvenance(nextProvenance);
      const values = Object.values(nextProvenance);
      const anyLive = values.includes('live');
      const anyMock = values.includes('mock_isolated');
      const anyCached = values.includes('cached');
      const nextReachability: ChiefBackendReachability = anyLive
        ? (values.every(value => value === 'live') ? 'reachable' : 'degraded')
        : anyMock
          ? 'simulated'
          : anyCached
            ? 'degraded'
            : 'unreachable';
      setChiefReachability(nextReachability);

      const fulfilledResults = [systemResult, agentsResult, attentionResult, activityResult]
        .filter(result => result.status === 'fulfilled') as PromiseFulfilledResult<any>[];
      const correlationId = fulfilledResults[0]?.value?.correlationId;
      if (typeof correlationId === 'string' && correlationId) setLastCorrelationId(correlationId);

      const firstFailure = [systemResult, agentsResult, attentionResult, activityResult]
        .find(result => result.status === 'rejected') as PromiseRejectedResult | undefined;
      if (firstFailure?.reason instanceof ChiefApiError && !firstFailure.reason.isAborted) {
        setLastApiError(firstFailure.reason);
      }

      const cachedTimestamps = fulfilledResults
        .map(result => result.value)
        .filter(value => value.provenance === 'cached' && typeof value.fetchedAt === 'number')
        .map(value => value.fetchedAt as number);
      const cacheTimestamp = cachedTimestamps.length ? Math.min(...cachedTimestamps) : undefined;
      const now = Date.now();
      const nowLabel = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      let lastSyncLabel = 'Chief data unavailable';
      let lastSyncTimestamp = 'Never';
      let cacheAgeLabel: string | undefined;
      let cacheTimeFormatted: string | undefined;

      if (provenance === 'live') {
        lastSyncLabel = `LIVE — synchronized at ${nowLabel}`;
        lastSyncTimestamp = nowLabel;
      } else if (provenance === 'cached' && cacheTimestamp) {
        const ageMinutes = Math.max(0, Math.floor((now - cacheTimestamp) / 60000));
        cacheTimeFormatted = new Date(cacheTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        cacheAgeLabel = ageMinutes < 1 ? 'Age: <1 minute' : `Age: ${ageMinutes} minute${ageMinutes === 1 ? '' : 's'}`;
        lastSyncLabel = `CACHED — from ${cacheTimeFormatted} • ${cacheAgeLabel}`;
        lastSyncTimestamp = `Cached from ${cacheTimeFormatted}`;
      } else if (provenance === 'mock_isolated') {
        lastSyncLabel = 'SIMULATED — development data; not synchronized with Chief';
        lastSyncTimestamp = 'Not synchronized';
      }

      setState(previous => {
        const systemData = systemResult.status === 'fulfilled' ? systemResult.value.data : null;
        const agents = agentsResult.status === 'fulfilled'
          ? agentsResult.value.data
          : nextProvenance.agents === 'cached' ? previous.agents : [];
        const attentionItems = attentionResult.status === 'fulfilled'
          ? attentionResult.value.data
          : nextProvenance.attention === 'cached' ? previous.attentionItems : [];
        const activity = activityResult.status === 'fulfilled'
          ? activityResult.value.data
          : nextProvenance.activity === 'cached' ? previous.activity : [];

        return {
          ...previous,
          platform_state: systemData ? systemData.platform_state : nextProvenance.system === 'cached' ? previous.platform_state : 'Maintenance',
          status_message: systemData ? systemData.status_message : nextProvenance.system === 'cached' ? previous.status_message : 'Backend unavailable',
          lastSyncLabel,
          lastSyncTimestamp,
          cacheTimestamp: provenance === 'cached' ? cacheTimestamp : provenance === 'live' ? now : undefined,
          cacheAgeLabel,
          cacheTimeFormatted,
          pendingSyncCount: 0,
          metrics: systemData ? {
            ...systemData.metrics,
            lastSyncTimestamp,
            backend: nextReachability === 'reachable' ? 'Online' : nextReachability === 'degraded' ? 'Degraded' : 'Offline',
            sync: provenance === 'live' ? 'Current' : provenance === 'cached' ? 'Stale' : 'Stale'
          } : {
            ...previous.metrics,
            backend: 'Offline',
            sync: 'Stale',
            lastSyncTimestamp
          },
          agents,
          attentionItems,
          activity,
          reachability: nextReachability,
          networkOnline,
          syncStatus: synchronizationFor(provenance),
          resourceProvenance: nextProvenance,
          compositeProvenance: provenance,
          isFullyLive: provenance === 'live'
        };
      });
    } catch (error: unknown) {
      if (error instanceof ChiefApiError && !error.isAborted) setLastApiError(error);
    } finally {
      setIsSyncing(false);
      activeSyncAbortRef.current = null;
    }
  };

  useEffect(() => {
    if (user) void forceSync();
    else {
      cancelOngoingSync();
      setState(isDev ? INITIAL_CHIEF_STATE : PRODUCTION_UNSYNCHRONIZED_CHIEF_STATE);
      setResourceProvenance(isDev
        ? { system: 'mock_isolated', agents: 'mock_isolated', attention: 'mock_isolated', activity: 'mock_isolated' }
        : { system: 'unavailable', agents: 'unavailable', attention: 'unavailable', activity: 'unavailable' });
      setChiefReachability(isDev ? 'simulated' : 'unreachable');
      setHealthState(isDev ? simulatedHealth() : unavailableHealth());
      setLastCorrelationId('');
      setLastApiError(null);
    }
    // Authentication identity is the intended trigger; forceSync is intentionally not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId, isDev]);

  const toggleConnectivity = () => {
    if (!isDev) return;
    setState(previous => {
      const next: ConnectivityMode = previous.connectivity === 'online'
        ? 'pending'
        : previous.connectivity === 'pending'
          ? 'offline'
          : 'online';
      return {
        ...previous,
        connectivity: next,
        status_message: next === 'offline' ? 'Limited connectivity' : next === 'pending' ? 'Synchronization pending' : 'System operational',
        pendingSyncCount: next === 'pending' ? 2 : 0,
        metrics: {
          ...previous.metrics,
          backend: next === 'offline' ? 'Offline' : 'Online',
          sync: 'Stale'
        }
      };
    });
  };

  const setConnectivity = (mode: ConnectivityMode) => {
    if (!isDev) return;
    setState(previous => ({
      ...previous,
      connectivity: mode,
      status_message: mode === 'offline' ? 'Limited connectivity' : mode === 'pending' ? 'Synchronization pending' : 'System operational',
      pendingSyncCount: mode === 'pending' ? 2 : 0,
      metrics: {
        ...previous.metrics,
        backend: mode === 'offline' ? 'Offline' : 'Online',
        sync: 'Stale'
      },
      syncStatus: 'not_synchronized'
    }));
  };

  const setStatusMessage = (status: StatusMessageOption) => {
    if (!isDev) return;
    setState(previous => ({
      ...previous,
      status_message: status,
      platform_state: status === 'Backend unavailable' || status === 'Maintenance mode' ? 'Maintenance' : 'Running'
    }));
  };

  const beginSubmission = (id: string) => {
    setSubmittingItemIds(previous => [...previous, id]);
    clearItemError(id);
    setState(previous => ({
      ...previous,
      attentionItems: previous.attentionItems.map(item =>
        item.id === id ? { ...item, submissionState: 'in_flight', submissionError: undefined } : item
      )
    }));
  };

  const failSubmission = (id: string, message: string) => {
    setItemSubmissionErrors(previous => ({ ...previous, [id]: message }));
    setState(previous => ({
      ...previous,
      attentionItems: previous.attentionItems.map(item =>
        item.id === id ? { ...item, submissionState: 'failed', submissionError: message } : item
      )
    }));
  };

  const confirmSubmission = (id: string, status: AttentionItem['status']) => {
    setState(previous => ({
      ...previous,
      attentionItems: previous.attentionItems.map(item =>
        item.id === id ? { ...item, status, submissionState: 'confirmed', submissionError: undefined } : item
      )
      // Deliberately do not append a local ActivityEvent. Audit evidence belongs to Chief;
      // the authoritative Activity endpoint will supply any event/hash/evidence on refresh.
    }));
  };

  const finishSubmission = (id: string) => {
    setSubmittingItemIds(previous => previous.filter(itemId => itemId !== id));
  };

  const approveItem = async (id: string): Promise<boolean> => {
    if (submittingItemIds.includes(id)) return false;
    beginSubmission(id);
    try {
      const response = await chiefApi.attention.approve(id);
      if (response.data?.approved !== true || !response.data.recordId) {
        throw new ChiefApiError({
          message: 'Backend approval response lacked positive confirmation.',
          code: 'UNCONFIRMED_APPROVAL'
        });
      }
      setLastCorrelationId(response.correlationId);
      confirmSubmission(id, 'approved');
      return true;
    } catch (error: unknown) {
      failSubmission(id, error instanceof Error ? error.message : 'Approval was not confirmed by Chief.');
      return false;
    } finally {
      finishSubmission(id);
    }
  };

  const rejectItem = async (id: string): Promise<boolean> => {
    if (submittingItemIds.includes(id)) return false;
    beginSubmission(id);
    try {
      const response = await chiefApi.attention.reject(id);
      if (response.data?.rejected !== true || !response.data.recordId) {
        throw new ChiefApiError({
          message: 'Backend rejection response lacked positive confirmation.',
          code: 'UNCONFIRMED_REJECTION'
        });
      }
      setLastCorrelationId(response.correlationId);
      confirmSubmission(id, 'rejected');
      return true;
    } catch (error: unknown) {
      failSubmission(id, error instanceof Error ? error.message : 'Rejection was not confirmed by Chief.');
      return false;
    } finally {
      finishSubmission(id);
    }
  };

  const acknowledgeStop = async (id: string): Promise<boolean> => {
    if (submittingItemIds.includes(id)) return false;
    beginSubmission(id);
    try {
      const response = await chiefApi.attention.acknowledgeStop(id);
      if (response.data?.acknowledged !== true || !response.data.ticketId) {
        throw new ChiefApiError({
          message: 'Backend STOP acknowledgement lacked positive confirmation.',
          code: 'UNCONFIRMED_STOP_ACK'
        });
      }
      setLastCorrelationId(response.correlationId);
      confirmSubmission(id, 'acknowledged');
      return true;
    } catch (error: unknown) {
      failSubmission(id, error instanceof Error ? error.message : 'STOP acknowledgement was not confirmed by Chief.');
      return false;
    } finally {
      finishSubmission(id);
    }
  };

  const resetState = () => {
    if (!isDev) return;
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
    setHealthState(simulatedHealth());
    setLastCorrelationId('');
    setLastApiError(null);
  };

  const pendingItems = state.attentionItems.filter(item => item.status === 'pending');
  const stopInterlocksCount = pendingItems.filter(item => item.level === 'STOP').length;
  const pendingApprovalsCount = pendingItems.filter(item =>
    item.level === 'Approval' || item.level === 'Approval required' || item.level === 'ASK'
  ).length;

  return (
    <ChiefContext.Provider value={{
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
    }}>
      {children}
    </ChiefContext.Provider>
  );
};

export const useChief = (): ChiefContextType => {
  const context = useContext(ChiefContext);
  if (!context) throw new Error('useChief must be used within a ChiefProvider');
  return context;
};
