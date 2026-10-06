import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { 
  ChiefState, 
  AttentionItem, 
  AgentState, 
  ActivityEvent, 
  StatusMessageOption, 
  ConnectivityMode 
} from '../types/chief';
import { 
  INITIAL_CHIEF_STATE, 
  INITIAL_ATTENTION_ITEMS, 
  INITIAL_AGENTS, 
  INITIAL_ACTIVITY 
} from '../data/mockChiefData';
import { 
  chiefApi, 
  ChiefApiError, 
  DataProvenance 
} from '../api';
import { useAuth } from './AuthContext';
import { isChiefDevMode } from '../config/devMode';

interface ChiefContextType {
  state: ChiefState;
  isSyncing: boolean;
  lastCorrelationId: string;
  dataProvenance: DataProvenance;
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
  const [state, setState] = useState<ChiefState>(INITIAL_CHIEF_STATE);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastCorrelationId, setLastCorrelationId] = useState<string>('cid_init_baseline');
  const [dataProvenance, setDataProvenance] = useState<DataProvenance>('mock_isolated');
  const [lastApiError, setLastApiError] = useState<ChiefApiError | null>(null);

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

  // Keep API client token configuration synced with active user session
  useEffect(() => {
    chiefApi.client.setConfig({
      getAuthTokenRef: () => user?.sessionTokenRef || null
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
      const [systemRes, agentsRes, attentionRes, activityRes] = await Promise.all([
        chiefApi.system.getStatus(controller.signal),
        chiefApi.agents.getAgents(controller.signal),
        chiefApi.attention.getItems(controller.signal),
        chiefApi.activity.getActivityLog({}, controller.signal)
      ]);

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setLastCorrelationId(systemRes.correlationId);
      setDataProvenance(systemRes.provenance);

      setState(prev => ({
        ...prev,
        platform_state: systemRes.data.platform_state,
        status_message: systemRes.data.status_message,
        lastSyncLabel: "Synced just now",
        lastSyncTimestamp: timeStr,
        pendingSyncCount: 0,
        metrics: {
          ...systemRes.data.metrics,
          lastSyncTimestamp: timeStr
        },
        agents: agentsRes.data,
        attentionItems: attentionRes.data,
        activity: activityRes.data
      }));
    } catch (err: unknown) {
      if (err instanceof ChiefApiError) {
        if (!err.isAborted) {
          setLastApiError(err);
          // If network failed, update state to cached snapshot mode gracefully
          setState(prev => ({
            ...prev,
            lastSyncLabel: `Last synced: ${prev.lastSyncTimestamp}`,
            connectivity: 'offline',
            metrics: {
              ...prev.metrics,
              sync: 'Stale'
            }
          }));
        }
      }
    } finally {
      setIsSyncing(false);
      activeSyncAbortRef.current = null;
    }
  };

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
        : newStatus === 'Attention required' 
        ? 'Attention' 
        : 'Running'
    }));
  };

  // Authoritative Human-Control Actions via Chief Attention API
  // Requirement: Double-submission protection & backend confirmation
  const approveItem = async (id: string): Promise<boolean> => {
    // Double-submission protection: reject concurrent calls for same item
    if (submittingItemIds.includes(id)) {
      return false;
    }

    setSubmittingItemIds(prev => [...prev, id]);
    clearItemError(id);

    // Optimistically mark submissionState as in_flight (status remains 'pending' until backend confirms)
    setState(prev => ({
      ...prev,
      attentionItems: prev.attentionItems.map(item =>
        item.id === id ? { ...item, submissionState: 'in_flight' as const, submissionError: undefined } : item
      )
    }));

    try {
      const res = await chiefApi.attention.approve(id);
      
      // Explicitly validate positive backend confirmation
      if (!res || !res.data || res.data.approved !== true) {
        throw new ChiefApiError({
          message: 'Chief backend response missing valid approval confirmation (approved: true required)',
          code: 'UNCONFIRMED_APPROVAL',
          statusCode: res?.status
        });
      }

      setLastCorrelationId(res.correlationId);

      // Backend confirmed: Seal approval
      setState(prev => {
        const targetItem = prev.attentionItems.find(i => i.id === id);
        const updatedItems = prev.attentionItems.map(item => 
          item.id === id 
            ? { ...item, status: 'approved' as const, submissionState: 'confirmed' as const, submissionError: undefined } 
            : item
        );
        
        const newActivity: ActivityEvent = {
          id: `act-${Date.now()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestampFull: `Today at ${new Date().toLocaleTimeString()}`,
          event: `Owner approved ASK gate: ${targetItem?.title || id}`,
          agent: "Chief Engine",
          severity: "nominal",
          hash: res.correlationId || res.data?.recordId || `appr_${id}`
        };

        return {
          ...prev,
          attentionItems: updatedItems,
          activity: [newActivity, ...prev.activity]
        };
      });
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof ChiefApiError ? err.message : 'Chief backend confirmation failed';
      if (err instanceof ChiefApiError) {
        setLastApiError(err);
      }
      setItemSubmissionErrors(prev => ({ ...prev, [id]: errMsg }));
      
      // Acceptance criterion: Failed submissions remain visibly unresolved (status: 'pending')
      setState(prev => ({
        ...prev,
        attentionItems: prev.attentionItems.map(item =>
          item.id === id ? { ...item, status: 'pending' as const, submissionState: 'failed' as const, submissionError: errMsg } : item
        )
      }));
      return false;
    } finally {
      setSubmittingItemIds(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const rejectItem = async (id: string): Promise<boolean> => {
    // Double-submission protection: reject concurrent calls for same item
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

      // Explicitly validate positive backend confirmation
      if (!res || !res.data || res.data.rejected !== true) {
        throw new ChiefApiError({
          message: 'Chief backend response missing valid rejection confirmation (rejected: true required)',
          code: 'UNCONFIRMED_REJECTION',
          statusCode: res?.status
        });
      }

      setLastCorrelationId(res.correlationId);

      // Backend confirmed: Seal rejection
      setState(prev => {
        const targetItem = prev.attentionItems.find(i => i.id === id);
        const updatedItems = prev.attentionItems.map(item => 
          item.id === id 
            ? { ...item, status: 'rejected' as const, submissionState: 'confirmed' as const, submissionError: undefined } 
            : item
        );

        const newActivity: ActivityEvent = {
          id: `act-${Date.now()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestampFull: `Today at ${new Date().toLocaleTimeString()}`,
          event: `Owner rejected dispatch: ${targetItem?.title || id}`,
          agent: "Chief Engine",
          severity: "notice",
          hash: res.correlationId || res.data?.recordId || `rej_${id}`
        };

        return {
          ...prev,
          attentionItems: updatedItems,
          activity: [newActivity, ...prev.activity]
        };
      });
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof ChiefApiError ? err.message : 'Chief rejection failed';
      if (err instanceof ChiefApiError) {
        setLastApiError(err);
      }
      setItemSubmissionErrors(prev => ({ ...prev, [id]: errMsg }));

      // Failed submission remains visibly unresolved
      setState(prev => ({
        ...prev,
        attentionItems: prev.attentionItems.map(item =>
          item.id === id ? { ...item, status: 'pending' as const, submissionState: 'failed' as const, submissionError: errMsg } : item
        )
      }));
      return false;
    } finally {
      setSubmittingItemIds(prev => prev.filter(itemId => itemId !== id));
    }
  };

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

      // Explicitly validate positive backend confirmation
      if (!res || !res.data || res.data.acknowledged !== true) {
        throw new ChiefApiError({
          message: 'Chief backend response missing valid STOP acknowledgment confirmation (acknowledged: true required)',
          code: 'UNCONFIRMED_STOP_ACK',
          statusCode: res?.status
        });
      }

      setLastCorrelationId(res.correlationId);

      setState(prev => {
        const updatedItems = prev.attentionItems.map(item => 
          item.id === id ? { ...item, status: 'acknowledged' as const, submissionState: 'confirmed' as const, submissionError: undefined } : item
        );

        const newActivity: ActivityEvent = {
          id: `act-${Date.now()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestampFull: `Today at ${new Date().toLocaleTimeString()}`,
          event: "Hardware STOP interlock acknowledged — Field technician dispatch ticket sealed",
          agent: "Farm Agent",
          severity: "interlock",
          hash: res.correlationId || `ack_${id}`
        };

        return {
          ...prev,
          attentionItems: updatedItems,
          activity: [newActivity, ...prev.activity]
        };
      });
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof ChiefApiError ? err.message : 'Hardware STOP acknowledgment failed';
      if (err instanceof ChiefApiError) {
        setLastApiError(err);
      }
      setItemSubmissionErrors(prev => ({ ...prev, [id]: errMsg }));

      setState(prev => ({
        ...prev,
        attentionItems: prev.attentionItems.map(item =>
          item.id === id ? { ...item, status: 'pending' as const, submissionState: 'failed' as const, submissionError: errMsg } : item
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
    setState(prev => ({
      ...prev,
      attentionItems: INITIAL_ATTENTION_ITEMS,
      agents: INITIAL_AGENTS,
      activity: INITIAL_ACTIVITY,
      status_message: "System operational",
      connectivity: "online",
      platform_state: "Running",
      pendingSyncCount: 0
    }));
  };

  const pendingItems = state.attentionItems.filter(i => i.status === 'pending');
  const stopInterlocksCount = pendingItems.filter(i => i.level === 'STOP').length;
  const pendingApprovalsCount = pendingItems.filter(i => i.level === 'Approval' || i.level === 'Approval required' || i.level === 'ASK').length;

  return (
    <ChiefContext.Provider
      value={{
        state,
        isSyncing,
        lastCorrelationId,
        dataProvenance,
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
