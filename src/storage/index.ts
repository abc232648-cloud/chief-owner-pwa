/**
 * CHIEF Versioned Client Storage Layer
 * 
 * Centralized, typed, privacy-preserving persistence for offline queues,
 * worker reports, and telemetry read cache metadata.
 */

import { QueueItem } from '../types/queue';
import { WorkerReportItem } from '../types/workerReport';
import { isChiefDevMode } from '../config/devMode';
import { 
  STORAGE_SCHEMA_VERSION, 
  StorageEnvironment, 
  STORE_NAMES, 
  PersistedRecord, 
  TelemetryCacheRecord,
  buildStorageNamespace 
} from './schema';
import { 
  isIndexedDBAvailable, 
  idbPut, 
  idbGet, 
  idbGetByUser, 
  idbDelete, 
  idbClearUserRecords,
  idbSyncUserRecords 
} from './idb';
import { runClientMigrations } from './migrations';
import { StoragePrivacyManager } from './privacy';

export * from './schema';
export { StoragePrivacyManager } from './privacy';

function getActiveEnvironment(): StorageEnvironment {
  return isChiefDevMode() ? 'DEV' : 'PROD';
}

function resolveUserNamespace(userId: string | null): string {
  if (userId && userId.trim().length > 0) {
    return userId.trim();
  }
  return 'unauthenticated';
}

// ---------------------------------------------------------------------------
// 1. OFFLINE QUEUE PERSISTENCE
// ---------------------------------------------------------------------------
export const queueStorage = {
  async getAll(userId: string | null): Promise<QueueItem[]> {
    const env = getActiveEnvironment();
    if (!isIndexedDBAvailable()) {
      return [];
    }

    try {
      await runClientMigrations(env, userId);
      const ns = resolveUserNamespace(userId);
      const records = await idbGetByUser<PersistedRecord<QueueItem>>(
        env,
        STORE_NAMES.QUEUE,
        ns
      );
      return records.map(r => r.data);
    } catch (err) {
      console.warn('[Chief Queue Storage] Failed to load queue records:', err);
      return [];
    }
  },

  async save(item: QueueItem, userId: string | null): Promise<{ success: boolean; error?: string }> {
    const env = getActiveEnvironment();
    if (!isIndexedDBAvailable()) {
      return { 
        success: false, 
        error: 'Secure browser database (IndexedDB) is unavailable or disabled in private browsing.' 
      };
    }

    try {
      const ns = resolveUserNamespace(userId);
      const record: PersistedRecord<QueueItem> = {
        id: item.id,
        userNamespace: ns,
        environment: env,
        schemaVersion: STORAGE_SCHEMA_VERSION,
        data: item,
        createdAt: item.createdAt ? new Date(item.createdAt).getTime() : Date.now(),
        updatedAt: Date.now()
      };

      await idbPut(env, STORE_NAMES.QUEUE, record);
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown storage write error';
      return { success: false, error: `Local persistence failed: ${msg}` };
    }
  },

  async delete(id: string): Promise<boolean> {
    const env = getActiveEnvironment();
    if (!isIndexedDBAvailable()) return false;
    try {
      await idbDelete(env, STORE_NAMES.QUEUE, id);
      return true;
    } catch {
      return false;
    }
  },

  async saveAll(items: QueueItem[], userId: string | null): Promise<void> {
    const env = getActiveEnvironment();
    if (!isIndexedDBAvailable()) return;
    try {
      const ns = resolveUserNamespace(userId);
      const records: PersistedRecord<QueueItem>[] = items.map(item => ({
        id: item.id,
        userNamespace: ns,
        environment: env,
        schemaVersion: STORAGE_SCHEMA_VERSION,
        data: item,
        createdAt: item.createdAt ? new Date(item.createdAt).getTime() : Date.now(),
        updatedAt: Date.now()
      }));
      await idbSyncUserRecords(env, STORE_NAMES.QUEUE, ns, records);
    } catch (err) {
      console.warn('[Chief Queue Storage] Failed to sync queue records:', err);
    }
  },

  async clearCompleted(userId: string | null): Promise<void> {
    const env = getActiveEnvironment();
    if (!isIndexedDBAvailable()) return;
    try {
      const items = await this.getAll(userId);
      for (const item of items) {
        if (item.status === 'synced') {
          await idbDelete(env, STORE_NAMES.QUEUE, item.id);
        }
      }
    } catch (err) {
      console.warn('[Chief Queue Storage] Failed to clear completed items:', err);
    }
  }
};

// ---------------------------------------------------------------------------
// 2. WORKER REPORT PERSISTENCE
// ---------------------------------------------------------------------------
export const reportStorage = {
  async getAll(userId: string | null): Promise<WorkerReportItem[]> {
    const env = getActiveEnvironment();
    if (!isIndexedDBAvailable()) {
      return [];
    }

    try {
      await runClientMigrations(env, userId);
      const ns = resolveUserNamespace(userId);
      const records = await idbGetByUser<PersistedRecord<WorkerReportItem>>(
        env,
        STORE_NAMES.REPORTS,
        ns
      );
      return records.map(r => r.data);
    } catch (err) {
      console.warn('[Chief Report Storage] Failed to load reports:', err);
      return [];
    }
  },

  async save(report: WorkerReportItem, userId: string | null): Promise<{ success: boolean; error?: string }> {
    const env = getActiveEnvironment();
    if (!isIndexedDBAvailable()) {
      return { 
        success: false, 
        error: 'Secure browser database (IndexedDB) is unavailable or disabled in private browsing.' 
      };
    }

    try {
      const ns = resolveUserNamespace(userId || report.workerId);
      const record: PersistedRecord<WorkerReportItem> = {
        id: report.id,
        userNamespace: ns,
        environment: env,
        schemaVersion: STORAGE_SCHEMA_VERSION,
        data: report,
        createdAt: new Date(report.createdAt).getTime() || Date.now(),
        updatedAt: Date.now()
      };

      await idbPut(env, STORE_NAMES.REPORTS, record);
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown storage write error';
      return { success: false, error: `Local persistence failed: ${msg}` };
    }
  },

  async delete(id: string): Promise<boolean> {
    const env = getActiveEnvironment();
    if (!isIndexedDBAvailable()) return false;
    try {
      await idbDelete(env, STORE_NAMES.REPORTS, id);
      return true;
    } catch {
      return false;
    }
  },

  async saveAll(reports: WorkerReportItem[], userId: string | null): Promise<void> {
    const env = getActiveEnvironment();
    if (!isIndexedDBAvailable()) return;
    try {
      const ns = resolveUserNamespace(userId);
      const records: PersistedRecord<WorkerReportItem>[] = reports.map(report => ({
        id: report.id,
        userNamespace: ns,
        environment: env,
        schemaVersion: STORAGE_SCHEMA_VERSION,
        data: report,
        createdAt: new Date(report.createdAt).getTime() || Date.now(),
        updatedAt: Date.now()
      }));
      await idbSyncUserRecords(env, STORE_NAMES.REPORTS, ns, records);
    } catch (err) {
      console.warn('[Chief Report Storage] Failed to sync reports:', err);
    }
  }
};

// ---------------------------------------------------------------------------
// 3. TELEMETRY READ CACHE PERSISTENCE
// ---------------------------------------------------------------------------
export const telemetryCacheStorage = {
  async get<T>(resourceKey: string, userId: string | null): Promise<TelemetryCacheRecord<T> | null> {
    const env = getActiveEnvironment();
    if (!isIndexedDBAvailable()) return null;

    try {
      const record = await idbGet<TelemetryCacheRecord<T>>(
        env,
        STORE_NAMES.TELEMETRY_CACHE,
        resourceKey
      );
      if (!record) return null;

      // Verify user namespace match
      const currentNs = resolveUserNamespace(userId);
      if (record.userNamespace !== currentNs) {
        return null; // Cross-user leak prevention
      }
      return record;
    } catch {
      return null;
    }
  },

  async set<T>(
    resourceKey: string,
    data: T,
    userId: string | null,
    correlationId: string,
    provenance: 'CHIEF_API_LIVE' | 'SESSION_CACHE' = 'CHIEF_API_LIVE',
    stalenessThresholdMs: number = 300000
  ): Promise<void> {
    const env = getActiveEnvironment();
    if (!isIndexedDBAvailable()) return;

    try {
      const currentNs = resolveUserNamespace(userId);
      const record: TelemetryCacheRecord<T> = {
        resourceKey,
        userNamespace: currentNs,
        environment: env,
        cachedAt: Date.now(),
        originalFetchAt: Date.now(),
        provenance,
        stalenessThresholdMs,
        correlationId,
        schemaVersion: STORAGE_SCHEMA_VERSION,
        data
      };

      await idbPut(env, STORE_NAMES.TELEMETRY_CACHE, record);
    } catch (err) {
      console.warn('[Chief Telemetry Cache Storage] Failed to cache entry:', err);
    }
  },

  async clearUserCache(userId: string | null): Promise<void> {
    const env = getActiveEnvironment();
    if (!isIndexedDBAvailable()) return;
    try {
      const ns = resolveUserNamespace(userId);
      await idbClearUserRecords(env, STORE_NAMES.TELEMETRY_CACHE, ns);
    } catch (err) {
      console.warn('[Chief Telemetry Cache Storage] Failed to clear user cache:', err);
    }
  }
};
