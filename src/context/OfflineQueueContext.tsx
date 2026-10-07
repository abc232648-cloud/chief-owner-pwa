import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  QueueItem, 
  QueueItemActionType, 
  CachedDataSource 
} from '../types/queue';
import { INITIAL_OFFLINE_QUEUE } from '../data/mockOfflineQueue';
import { useChief } from './ChiefContext';
import { useAuth } from './AuthContext';
import { chiefApi, ChiefApiError } from '../api';
import { WorkerReportItem } from '../types/workerReport';
import { isChiefDevMode } from '../config/devMode';
import { queueStorage } from '../storage';

const MAX_BOUNDED_RETRIES = 3;

interface EnqueueOptions {
  actionType: QueueItemActionType;
  title: string;
  domain: 'Farm Agent' | 'Job Agent' | 'Chief Central';
  payload: Record<string, any>;
  isPolicyPermitted: boolean;
  blockReasonIfUnsafe?: string;
  payloadVersion?: number;
  reportPayload?: WorkerReportItem;
}

interface OfflineQueueContextType {
  queue: QueueItem[];
  pendingCount: number;
  conflictCount: number;
  isSyncing: boolean;
  lastSyncTimestamp: number | null;
  syncState: 'NEVER_SYNCED' | 'STALE' | 'CURRENT';
  isDataStale: boolean;
  isEffectivelyOffline: boolean;
  enqueueAction: (options: EnqueueOptions) => Promise<{ success: boolean; item?: QueueItem; error?: string }>;
  syncQueueItem: (id: string) => Promise<boolean>;
  syncAllEligible: () => Promise<{ synced: number; failed: number }>;
  resolveConflict: (id: string, resolution: 'use_local' | 'accept_server' | 'discard') => Promise<void>;
  deleteQueueItem: (id: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
  cachedDataSources: CachedDataSource[];
}

const OfflineQueueContext = createContext<OfflineQueueContextType | undefined>(undefined);

export const OfflineQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state: chiefState } = useChief();
  const { user } = useAuth();
  const isDev = isChiefDevMode();

  // Load initial queue
  // BATCH 13C.2A: Versioned client storage layer with authenticated user isolation
  const [queue, setQueue] = useState<QueueItem[]>(() => {
    // Fresh production install MUST start empty
    if (!isDev) {
      return [];
    }
    return INITIAL_OFFLINE_QUEUE;
  });
  const [isQueueLoaded, setIsQueueLoaded] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);
  // BATCH 13B.3.1.1 Requirement 6: Fresh production install must have lastSyncTimestamp = null (Never synchronized)
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(() => {
    return isDev ? Date.now() - 1000 * 60 * 12 : null;
  });
  const [networkOnline, setNetworkOnline] = useState<boolean>(navigator.onLine);

  // Load user-scoped queue records from versioned storage
  useEffect(() => {
    let isCancelled = false;

    const loadUserQueue = async () => {
      try {
        const stored = await queueStorage.getAll(user?.userId ?? null);
        if (!isCancelled) {
          if (stored && stored.length > 0) {
            setQueue(stored);
          } else if (isDev) {
            setQueue(INITIAL_OFFLINE_QUEUE);
          } else {
            setQueue([]);
          }
          setIsQueueLoaded(true);
        }
      } catch (err) {
        console.warn('[OfflineQueueContext] Error loading queue from IndexedDB:', err);
        if (!isCancelled) {
          setIsQueueLoaded(true);
        }
      }
    };

    setIsQueueLoaded(false);
    loadUserQueue();

    return () => {
      isCancelled = true;
    };
  }, [user?.userId, isDev]);

  // Persist queue to versioned IndexedDB with user namespace isolation
  useEffect(() => {
    if (!isQueueLoaded) return;
    queueStorage.saveAll(queue, user?.userId ?? null);
  }, [queue, isQueueLoaded, user?.userId]);

  // Online / Offline window listeners
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

  const isEffectivelyOffline = !networkOnline || chiefState.connectivity === 'offline';
  
  // BATCH 13B.3.1.1 Requirement 7: Distinguish NEVER_SYNCED from STALE CACHE
  // - no cache + no prior sync -> NEVER_SYNCED (not stale)
  // - genuine cached data older than threshold -> STALE
  // - live/current -> CURRENT
  const syncState: 'NEVER_SYNCED' | 'STALE' | 'CURRENT' = 
    lastSyncTimestamp === null
      ? 'NEVER_SYNCED'
      : (Date.now() - lastSyncTimestamp > 1000 * 60 * 5)
      ? 'STALE'
      : 'CURRENT';

  const isDataStale = syncState === 'STALE';

  const pendingCount = queue.filter(q => q.status === 'pending' || q.status === 'failed_transient').length;
  const conflictCount = queue.filter(q => q.status === 'conflict').length;

  // BATCH 13B.3.1 Requirement 2 & BATCH 13B.3.1.1 Requirement 6: Remove fake cached data sources from production
  // Production cachedDataSources must reflect only genuine cached Chief resources.
  // If none exist: cachedDataSources = []
  // DEV: Synthetic cached-source examples clearly labelled DEVELOPMENT CACHE FIXTURE — NOT REAL TELEMETRY
  const cachedDataSources: CachedDataSource[] = (isDev && lastSyncTimestamp !== null) ? [
    {
      key: 'flock_telemetry',
      label: 'House 1 & 2 Poultry Telemetry [DEV FIXTURE]',
      domain: 'Farm Agent',
      cachedAtTimestamp: lastSyncTimestamp,
      lastSyncFormatted: '12m ago (Simulated Sensor Snap)',
      isStale: isDataStale,
      staleAfterMs: 1000 * 60 * 5
    },
    {
      key: 'interlock_status',
      label: 'Zone B Pressure Relief Interlock Hardware Register [DEV FIXTURE]',
      domain: 'Farm Agent',
      cachedAtTimestamp: lastSyncTimestamp,
      lastSyncFormatted: '12m ago',
      isStale: isDataStale,
      staleAfterMs: 1000 * 60 * 2
    },
    {
      key: 'job_applications',
      label: 'Application Lifecycle State Machine & Decision Registry [DEV FIXTURE]',
      domain: 'Job Agent',
      cachedAtTimestamp: lastSyncTimestamp,
      lastSyncFormatted: '12m ago',
      isStale: isDataStale,
      staleAfterMs: 1000 * 60 * 10
    }
  ] : [];

  // Enqueue an action — CRITICAL SAFETY CHECK: NEVER QUEUE BLINDLY
  // BATCH 13C.2A.1: Durable persistence MUST succeed before claiming queued success.
  const enqueueAction = useCallback(async (options: EnqueueOptions): Promise<{ success: boolean; item?: QueueItem; error?: string }> => {
    // BATCH 13B.3: Authenticated worker identity required. Never invent worker identity.
    if (!user || !user.userId) {
      return { success: false, error: 'Authenticated worker identity required.' };
    }

    if (!options.isPolicyPermitted) {
      const errorMsg = options.blockReasonIfUnsafe || 
        'Live Authoritative Validation Required: This high-impact action cannot be queued offline. Active Chief Central Policy Engine verification is mandatory.';
      return { success: false, error: errorMsg };
    }

    const now = new Date();
    const id = `qid-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const newItem: QueueItem = {
      id,
      actionType: options.actionType,
      title: options.title,
      domain: options.domain,
      createdAt: now.toISOString(),
      timestampFormatted: 'Just now',
      status: 'pending',
      retryCount: 0,
      maxRetries: MAX_BOUNDED_RETRIES,
      requiresUserIntervention: false,
      policyPermitted: true,
      payload: options.payload,
      payloadVersion: options.payloadVersion ?? (options.reportPayload ? 1 : undefined),
      reportPayload: options.reportPayload,
      workerAttribution: {
        userId: user.userId,
        userName: user.name,
        role: user.role
      }
    };

    // Await durable IndexedDB persistence FIRST
    const saveRes = await queueStorage.save(newItem, user.userId);
    if (!saveRes.success) {
      return {
        success: false,
        error: saveRes.error || 'Durable local storage failed. Action was not queued. No Chief decision occurred.'
      };
    }

    // Only after durable persistence succeeds, update in-memory state
    setQueue(prev => [newItem, ...prev]);
    return { success: true, item: newItem };
  }, [user]);

  /**
   * Sync a single queue item.
   * Requirement 5: A queue record may become synced ONLY after a real backend/API operation confirms it.
   * If Chief backend cannot confirm, leave record pending or failed_transient. Do NOT fabricate confirmation hashes.
   * Requirement 3 (Batch 13A.1):
   * An action for which no live sync adapter exists must NOT become rejected_permanent.
   * Use explicit status 'unsupported' with wording:
   * "Sync adapter not provisioned. No authoritative Chief decision was made."
   * Set requiresUserIntervention: true. Do not automatically retry unsupported actions.
   */
  const syncQueueItem = useCallback(async (id: string): Promise<boolean> => {
    const item = queue.find(q => q.id === id);
    if (!item) return false;

    // Do not automatically retry unsupported actions
    if (item.status === 'unsupported') {
      return false;
    }

    // Check bounded retries: if exhausted on transport errors, become failed_permanent (NOT rejected_permanent)
    if (item.retryCount >= item.maxRetries && item.status !== 'conflict') {
      setQueue(prev => prev.map(q => 
        q.id === id 
          ? { 
              ...q, 
              status: 'failed_permanent',
              requiresUserIntervention: true,
              lastFailure: `Maximum bounded retries (${MAX_BOUNDED_RETRIES}) exhausted. Retrying halted by policy.`
            } 
          : q
      ));
      return false;
    }

    if (isEffectivelyOffline) {
      return false;
    }

    // Fast-path: Actions for which no live sync adapter exists must NOT be retried or claim backend rejection
    if (item.actionType !== 'SUBMIT_WORKER_REPORT') {
      setQueue(prev => prev.map(q => 
        q.id === id 
          ? {
              ...q,
              status: 'unsupported',
              requiresUserIntervention: true,
              lastFailure: 'Sync adapter not provisioned. No authoritative Chief decision was made.'
            }
          : q
      ));
      return false;
    }

    // BATCH 13B.3: Authenticated worker identity required. Never invent worker identity.
    if (!item.workerAttribution || !item.workerAttribution.userId) {
      setQueue(prev => prev.map(q => 
        q.id === id 
          ? {
              ...q,
              status: 'failed_permanent',
              requiresUserIntervention: true,
              lastFailure: 'Authenticated worker identity required. Offline record lacks authenticated actor attribution.'
            }
          : q
      ));
      return false;
    }

    // BATCH 13B.3.1 Requirement 3: Preserve the exact offline worker-report payload
    // If an old queue item lacks the required exact payload:
    // do not guess or infer/default the category (no defaulting category = 'water');
    // mark it failed_permanent;
    // state: 'Legacy queued payload cannot be replayed safely. No Chief decision was made.'
    if (!item.reportPayload) {
      setQueue(prev => prev.map(q => 
        q.id === id 
          ? {
              ...q,
              status: 'failed_permanent',
              requiresUserIntervention: true,
              lastFailure: 'Legacy queued payload cannot be replayed safely. No Chief decision was made.'
            }
          : q
      ));
      return false;
    }

    // Set status to syncing in-flight
    setQueue(prev => prev.map(q => 
      q.id === id ? { ...q, status: 'syncing' } : q
    ));

    try {
      // Submit the original report payload unchanged except for fields explicitly allowed to change,
      // such as retry counters or transport metadata
      const replayPayload: WorkerReportItem = {
        ...item.reportPayload,
        status: 'syncing',
        syncAttempts: item.retryCount + 1
      };

      const res = await chiefApi.farm.submitWorkerReport(replayPayload);

      // BATCH 13B.3 Requirement 8: Offline replay requires positive backend acceptance
      // Require status === 'accepted' AND valid backend verification/receipt identifier.
      // An ambiguous or malformed response must NOT become synced.
      if (!res || !res.data || res.data.status !== 'accepted' || !res.data.verificationHash) {
        setQueue(prev => prev.map(q => 
          q.id === id 
            ? {
                ...q,
                status: 'failed_transient',
                retryCount: q.retryCount + 1,
                requiresUserIntervention: false,
                lastFailure: 'Ambiguous or unconfirmed backend response: Positive acceptance proof missing'
              }
            : q
        ));
        return false;
      }

      // Genuine confirmation received from backend
      setQueue(prev => prev.map(q => 
        q.id === id 
          ? {
              ...q,
              status: 'synced',
              retryCount: q.retryCount + 1,
              requiresUserIntervention: false,
              confirmedAt: `Today at ${new Date().toLocaleTimeString()}`,
              confirmationHash: res.data.verificationHash,
              lastFailure: undefined
            }
          : q
      ));
      setLastSyncTimestamp(Date.now());
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof ChiefApiError ? err.message : 'Uplink transmission failed';

      // Client validation is NOT a Chief rejection
      const isClientValidationError = err instanceof ChiefApiError && (
        err.origin === 'client' || err.code === 'CLIENT_VALIDATION_ERROR'
      );

      if (isClientValidationError) {
        setQueue(prev => prev.map(q => 
          q.id === id 
            ? {
                ...q,
                status: 'failed_permanent',
                retryCount: q.retryCount + 1,
                requiresUserIntervention: true,
                lastFailure: `Input needs correction — Validated locally. No Chief decision has been made: ${errMsg}`
              }
            : q
        ));
        return false;
      }

      // Genuine authoritative backend rejection: only explicit 422 or policy validation error from Chief backend
      const isAuthoritativeRejection = err instanceof ChiefApiError && 
        err.origin !== 'client' && (
          err.statusCode === 422 || 
          err.code === 'POLICY_REJECTION' || 
          err.code === 'VALIDATION_ERROR'
        );

      setQueue(prev => prev.map(q => 
        q.id === id 
          ? {
              ...q,
              status: isAuthoritativeRejection 
                ? 'rejected_permanent' 
                : (q.retryCount + 1 >= q.maxRetries ? 'failed_permanent' : 'failed_transient'),
              retryCount: q.retryCount + 1,
              requiresUserIntervention: isAuthoritativeRejection || q.retryCount + 1 >= q.maxRetries,
              lastFailure: isAuthoritativeRejection ? `Rejected by Chief: ${errMsg}` : errMsg
            }
          : q
      ));
      return false;
    }
  }, [queue, isEffectivelyOffline]);

  // Flush all eligible queue items
  const syncAllEligible = useCallback(async (): Promise<{ synced: number; failed: number }> => {
    if (isEffectivelyOffline) {
      return { synced: 0, failed: 0 };
    }

    setIsSyncing(true);
    let synced = 0;
    let failed = 0;

    const eligibleItems = queue.filter(q => 
      (q.status === 'pending' || q.status === 'failed_transient') && 
      !q.requiresUserIntervention && 
      q.retryCount < q.maxRetries
    );

    for (const item of eligibleItems) {
      const ok = await syncQueueItem(item.id);
      if (ok) synced++;
      else failed++;
    }

    setIsSyncing(false);
    return { synced, failed };
  }, [isEffectivelyOffline, queue, syncQueueItem]);

  /**
   * Conflict resolution.
   * Requirement 6: Must NOT immediately create fake synced state or fake hashes.
   * If no backend implementation exists yet, keep conflict unresolved and clearly report
   * that authoritative reconciliation is unavailable.
   */
  const resolveConflict = useCallback(async (
    id: string, 
    resolution: 'use_local' | 'accept_server' | 'discard'
  ) => {
    if (resolution === 'discard') {
      setQueue(prev => prev.filter(q => q.id !== id));
      return;
    }

    // Since authoritative 3-way reconciliation endpoint is not provisioned on backend yet:
    // FAIL-CLOSED: Do NOT fabricate synced state or fake hashes!
    // Keep conflict unresolved and clearly inform operator:
    setQueue(prev => prev.map(q => 
      q.id === id 
        ? {
            ...q,
            status: 'conflict',
            requiresUserIntervention: true,
            lastFailure: `Authoritative reconciliation unavailable: Server endpoint for '${resolution}' is not connected. Conflict remains unresolved.`
          }
        : q
    ));
  }, []);

  const deleteQueueItem = async (id: string): Promise<void> => {
    await queueStorage.delete(id, user?.userId ?? null);
    setQueue(prev => prev.filter(q => q.id !== id));
  };

  const clearCompleted = async (): Promise<void> => {
    await queueStorage.clearCompleted(user?.userId ?? null);
    setQueue(prev => prev.filter(q => q.status !== 'synced'));
  };

  return (
    <OfflineQueueContext.Provider
      value={{
        queue,
        pendingCount,
        conflictCount,
        isSyncing,
        lastSyncTimestamp,
        syncState,
        isDataStale,
        isEffectivelyOffline,
        enqueueAction,
        syncQueueItem,
        syncAllEligible,
        resolveConflict,
        deleteQueueItem,
        clearCompleted,
        cachedDataSources
      }}
    >
      {children}
    </OfflineQueueContext.Provider>
  );
};

export const useOfflineQueue = (): OfflineQueueContextType => {
  const context = useContext(OfflineQueueContext);
  if (!context) {
    throw new Error('useOfflineQueue must be used within an OfflineQueueProvider');
  }
  return context;
};
