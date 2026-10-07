import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CachedDataSource, QueueItem, QueueItemActionType } from '../types/queue';
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

function isExplicitChiefRejection(err: unknown): err is ChiefApiError {
  if (!(err instanceof ChiefApiError) || err.origin !== 'chief') return false;
  if (err.isNetworkError || err.isTimeout || err.isAborted || !err.statusCode || err.statusCode >= 500) return false;
  if ([401, 403, 404].includes(err.statusCode)) return false;
  return err.statusCode === 422 || err.code === 'POLICY_REJECTION' || err.code === 'VALIDATION_ERROR';
}

export const OfflineQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state: chiefState } = useChief();
  const { user } = useAuth();
  const isDev = isChiefDevMode();

  const [queue, setQueue] = useState<QueueItem[]>(() => isDev ? INITIAL_OFFLINE_QUEUE : []);
  const [isQueueLoaded, setIsQueueLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(null);
  const [networkOnline, setNetworkOnline] = useState<boolean>(() => navigator.onLine);

  useEffect(() => {
    let cancelled = false;
    setIsQueueLoaded(false);

    void queueStorage.getAll(user?.userId ?? null).then(stored => {
      if (cancelled) return;
      if (stored.length > 0) setQueue(stored);
      else setQueue(isDev ? INITIAL_OFFLINE_QUEUE : []);
      setIsQueueLoaded(true);
    }).catch(error => {
      console.warn('[OfflineQueueContext] Failed to load queue:', error);
      if (!cancelled) {
        setQueue(isDev ? INITIAL_OFFLINE_QUEUE : []);
        setIsQueueLoaded(true);
      }
    });

    return () => { cancelled = true; };
  }, [user?.userId, isDev]);

  useEffect(() => {
    if (!isQueueLoaded) return;
    void queueStorage.saveAll(queue, user?.userId ?? null);
  }, [queue, isQueueLoaded, user?.userId]);

  useEffect(() => {
    const online = () => setNetworkOnline(true);
    const offline = () => setNetworkOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  const isEffectivelyOffline = !networkOnline || chiefState.connectivity === 'offline' || chiefState.reachability === 'unreachable';
  const syncState: 'NEVER_SYNCED' | 'STALE' | 'CURRENT' = lastSyncTimestamp === null
    ? 'NEVER_SYNCED'
    : Date.now() - lastSyncTimestamp > 5 * 60 * 1000
      ? 'STALE'
      : 'CURRENT';
  const isDataStale = syncState === 'STALE';
  const pendingCount = queue.filter(item => item.status === 'pending' || item.status === 'failed_transient').length;
  const conflictCount = queue.filter(item => item.status === 'conflict').length;

  const cachedDataSources: CachedDataSource[] = isDev ? [
    {
      key: 'dev-fixture-farm',
      label: 'DEVELOPMENT CACHE FIXTURE — NOT REAL TELEMETRY',
      domain: 'Farm Agent',
      cachedAtTimestamp: Date.now() - 12 * 60 * 1000,
      lastSyncFormatted: 'Synthetic DEV snapshot',
      isStale: true,
      staleAfterMs: 5 * 60 * 1000
    }
  ] : [];

  const persistAndReplace = useCallback(async (next: QueueItem): Promise<boolean> => {
    if (!user?.userId) return false;
    const saved = await queueStorage.save(next, user.userId);
    if (!saved.success) return false;
    setQueue(previous => previous.map(item => item.id === next.id ? next : item));
    return true;
  }, [user?.userId]);

  const enqueueAction = useCallback(async (options: EnqueueOptions): Promise<{ success: boolean; item?: QueueItem; error?: string }> => {
    if (!user?.userId) return { success: false, error: 'Authenticated worker identity required.' };
    if (!options.isPolicyPermitted) {
      return {
        success: false,
        error: options.blockReasonIfUnsafe || 'This action is not permitted for offline queueing. No Chief decision occurred.'
      };
    }

    const item: QueueItem = {
      id: `local-q-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      actionType: options.actionType,
      title: options.title,
      domain: options.domain,
      createdAt: new Date().toISOString(),
      timestampFormatted: new Date().toLocaleString(),
      status: 'pending',
      retryCount: 0,
      maxRetries: MAX_BOUNDED_RETRIES,
      requiresUserIntervention: false,
      policyPermitted: true,
      // Worker-report queue entries persist the sanitized report data, never the modal's pre-sanitization draft.
      payload: options.reportPayload?.data ?? options.payload,
      payloadVersion: options.payloadVersion ?? (options.reportPayload ? 1 : undefined),
      reportPayload: options.reportPayload,
      workerAttribution: {
        userId: user.userId,
        userName: user.name,
        role: user.role
      }
    };

    const saved = await queueStorage.save(item, user.userId);
    if (!saved.success) return { success: false, error: saved.error || 'Action was not queued. No Chief decision occurred.' };
    setQueue(previous => [item, ...previous]);
    return { success: true, item };
  }, [user]);

  const syncQueueItem = useCallback(async (id: string): Promise<boolean> => {
    if (!user?.userId) return false;
    const item = queue.find(entry => entry.id === id);
    if (!item || item.status === 'unsupported' || isEffectivelyOffline) return false;

    if (item.retryCount >= item.maxRetries) {
      await persistAndReplace({
        ...item,
        status: 'failed_permanent',
        requiresUserIntervention: true,
        lastFailure: `Maximum bounded retries (${item.maxRetries}) exhausted. No Chief acceptance was recorded.`
      });
      return false;
    }

    if (item.actionType !== 'SUBMIT_WORKER_REPORT') {
      await persistAndReplace({
        ...item,
        status: 'unsupported',
        requiresUserIntervention: true,
        lastFailure: 'Sync adapter not provisioned. No authoritative Chief decision was made.'
      });
      return false;
    }

    if (!item.workerAttribution?.userId || item.workerAttribution.userId !== user.userId) {
      await persistAndReplace({
        ...item,
        status: 'failed_permanent',
        requiresUserIntervention: true,
        lastFailure: 'Authenticated actor does not match the queued record owner. No Chief decision was made.'
      });
      return false;
    }

    if (!item.reportPayload) {
      await persistAndReplace({
        ...item,
        status: 'failed_permanent',
        requiresUserIntervention: true,
        lastFailure: 'Legacy queued payload cannot be replayed safely. No Chief decision was made.'
      });
      return false;
    }

    const syncing: QueueItem = { ...item, status: 'syncing' };
    if (!await persistAndReplace(syncing)) return false;

    try {
      const replayPayload: WorkerReportItem = {
        ...item.reportPayload,
        status: 'syncing',
        syncAttempts: item.retryCount + 1
      };
      const response = await chiefApi.farm.submitWorkerReport(replayPayload);
      if (!response?.data || response.data.status !== 'accepted' || !response.data.verificationHash) {
        const failed: QueueItem = {
          ...item,
          status: 'failed_transient',
          retryCount: item.retryCount + 1,
          requiresUserIntervention: false,
          lastFailure: 'Backend response lacked positive acceptance proof. No confirmed synchronization recorded.'
        };
        await persistAndReplace(failed);
        return false;
      }

      const confirmed: QueueItem = {
        ...item,
        status: 'synced',
        retryCount: item.retryCount + 1,
        requiresUserIntervention: false,
        confirmedAt: new Date().toISOString(),
        confirmationHash: response.data.verificationHash,
        lastFailure: undefined
      };
      if (!await persistAndReplace(confirmed)) return false;
      setLastSyncTimestamp(Date.now());
      return true;
    } catch (err: unknown) {
      const message = err instanceof ChiefApiError ? err.message : 'Chief request failed';
      const nextRetryCount = item.retryCount + 1;

      if (err instanceof ChiefApiError && (err.origin === 'client' || err.code === 'CLIENT_VALIDATION_ERROR')) {
        await persistAndReplace({
          ...item,
          status: 'failed_permanent',
          retryCount: nextRetryCount,
          requiresUserIntervention: true,
          lastFailure: `Input needs correction — validated locally. No Chief decision has been made: ${message}`
        });
        return false;
      }

      if (isExplicitChiefRejection(err)) {
        await persistAndReplace({
          ...item,
          status: 'rejected_permanent',
          retryCount: nextRetryCount,
          requiresUserIntervention: true,
          lastFailure: `Rejected by Chief: ${message}`
        });
        return false;
      }

      await persistAndReplace({
        ...item,
        status: nextRetryCount >= item.maxRetries ? 'failed_permanent' : 'failed_transient',
        retryCount: nextRetryCount,
        requiresUserIntervention: nextRetryCount >= item.maxRetries,
        lastFailure: message
      });
      return false;
    }
  }, [queue, isEffectivelyOffline, persistAndReplace, user?.userId]);

  const syncAllEligible = useCallback(async (): Promise<{ synced: number; failed: number }> => {
    if (isEffectivelyOffline) return { synced: 0, failed: 0 };
    const eligible = queue.filter(item =>
      (item.status === 'pending' || item.status === 'failed_transient') &&
      !item.requiresUserIntervention &&
      item.retryCount < item.maxRetries
    );

    setIsSyncing(true);
    let synced = 0;
    let failed = 0;
    try {
      for (const item of eligible) {
        if (await syncQueueItem(item.id)) synced += 1;
        else failed += 1;
      }
    } finally {
      setIsSyncing(false);
    }
    return { synced, failed };
  }, [isEffectivelyOffline, queue, syncQueueItem]);

  const resolveConflict = useCallback(async (id: string, resolution: 'use_local' | 'accept_server' | 'discard'): Promise<void> => {
    if (!user?.userId) return;
    const item = queue.find(entry => entry.id === id);
    if (!item || item.status !== 'conflict') return;

    if (resolution === 'discard') {
      if (await queueStorage.delete(id, user.userId)) setQueue(previous => previous.filter(entry => entry.id !== id));
      return;
    }

    await persistAndReplace({
      ...item,
      status: 'conflict',
      requiresUserIntervention: true,
      lastFailure: `Conflict resolution adapter not provisioned for request "${resolution}". Conflict remains unresolved; no Chief reconciliation occurred.`
    });
  }, [persistAndReplace, queue, user?.userId]);

  const deleteQueueItem = useCallback(async (id: string): Promise<void> => {
    if (!user?.userId) return;
    if (await queueStorage.delete(id, user.userId)) setQueue(previous => previous.filter(item => item.id !== id));
  }, [user?.userId]);

  const clearCompleted = useCallback(async (): Promise<void> => {
    if (!user?.userId) return;
    const completed = queue.filter(item => item.status === 'synced');
    for (const item of completed) await queueStorage.delete(item.id, user.userId);
    setQueue(previous => previous.filter(item => item.status !== 'synced'));
  }, [queue, user?.userId]);

  return (
    <OfflineQueueContext.Provider value={{
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
    }}>
      {children}
    </OfflineQueueContext.Provider>
  );
};

export const useOfflineQueue = (): OfflineQueueContextType => {
  const context = useContext(OfflineQueueContext);
  if (!context) throw new Error('useOfflineQueue must be used within an OfflineQueueProvider');
  return context;
};
