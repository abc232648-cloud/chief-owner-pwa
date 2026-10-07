/**
 * CHIEF Versioned Client Storage Layer
 * 
 * Centralized, typed, privacy-preserving persistence for offline queues
 * and worker reports, with compound primary keys and strict user isolation.
 */

import { QueueItem } from '../types/queue';
import { WorkerReportItem } from '../types/workerReport';
import { isChiefDevMode } from '../config/devMode';
import { 
  STORAGE_SCHEMA_VERSION, 
  StorageEnvironment, 
  STORE_NAMES, 
  PersistedRecord, 
  buildStorageNamespace 
} from './schema';
import { 
  isIndexedDBAvailable, 
  idbPut, 
  idbGet, 
  idbGetUserRecord,
  idbGetByUser, 
  idbDeleteUserRecord, 
  idbClearUserRecords,
  idbSyncUserRecords 
} from './idb';
import { runClientMigrations } from './migrations';
import { StoragePrivacyManager } from './privacy';
import { operationalWorkTracker } from './operationalWorkTracker';

export * from './schema';
export { StoragePrivacyManager } from './privacy';
export { operationalWorkTracker } from './operationalWorkTracker';

function getActiveEnvironment(): StorageEnvironment {
  return isChiefDevMode() ? 'DEV' : 'PROD';
}

function resolveUserNamespace(userId: string | null): string {
  if (userId && typeof userId === 'string' && userId.trim().length > 0) {
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
      await runClientMigrations(env);
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
        userNamespace: ns,
        id: item.id,
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

  async delete(id: string, userId: string | null): Promise<boolean> {
    const env = getActiveEnvironment();
    if (!isIndexedDBAvailable()) return false;
    try {
      const ns = resolveUserNamespace(userId);
      await idbDeleteUserRecord(env, STORE_NAMES.QUEUE, ns, id);
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
        userNamespace: ns,
        id: item.id,
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
          await this.delete(item.id, userId);
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
      await runClientMigrations(env);
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
      const ns = resolveUserNamespace(userId);
      const record: PersistedRecord<WorkerReportItem> = {
        userNamespace: ns,
        id: report.id,
        environment: env,
        schemaVersion: STORAGE_SCHEMA_VERSION,
        data: report,
        createdAt: report.createdAt ? new Date(report.createdAt).getTime() : Date.now(),
        updatedAt: Date.now()
      };

      await idbPut(env, STORE_NAMES.REPORTS, record);
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown storage write error';
      return { success: false, error: `Local persistence failed: ${msg}` };
    }
  },

  async delete(id: string, userId: string | null): Promise<boolean> {
    const env = getActiveEnvironment();
    if (!isIndexedDBAvailable()) return false;
    try {
      const ns = resolveUserNamespace(userId);
      await idbDeleteUserRecord(env, STORE_NAMES.REPORTS, ns, id);
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
        userNamespace: ns,
        id: report.id,
        environment: env,
        schemaVersion: STORAGE_SCHEMA_VERSION,
        data: report,
        createdAt: report.createdAt ? new Date(report.createdAt).getTime() : Date.now(),
        updatedAt: Date.now()
      }));
      await idbSyncUserRecords(env, STORE_NAMES.REPORTS, ns, records);
    } catch (err) {
      console.warn('[Chief Report Storage] Failed to sync reports:', err);
    }
  }
};
