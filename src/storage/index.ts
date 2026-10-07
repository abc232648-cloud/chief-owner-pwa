/**
 * CHIEF Versioned Client Storage Layer
 *
 * Centralized, typed, privacy-preserving persistence for offline queues
 * and worker reports, with compound primary keys and strict user isolation.
 *
 * BATCH 13C.2A.2 SAFETY REPAIR:
 * - Background saveAll() is allowed only after that exact environment/user namespace
 *   has been successfully loaded in the current runtime.
 * - Production records are additionally ownership-checked before any write.
 * - This storage-level gate prevents stale React state from User A being written
 *   into User B's namespace during authentication/session transitions.
 */

import { QueueItem } from '../types/queue';
import { WorkerReportItem } from '../types/workerReport';
import { isChiefDevMode } from '../config/devMode';
import {
  STORAGE_SCHEMA_VERSION,
  StorageEnvironment,
  STORE_NAMES,
  PersistedRecord
} from './schema';
import {
  isIndexedDBAvailable,
  idbPut,
  idbGetByUser,
  idbDeleteUserRecord,
  idbSyncUserRecords
} from './idb';
import { runClientMigrations } from './migrations';
import { StoragePrivacyManager } from './privacy';
import { operationalWorkTracker } from './operationalWorkTracker';

export * from './schema';
export { StoragePrivacyManager } from './privacy';
export { operationalWorkTracker } from './operationalWorkTracker';

const loadedQueueNamespaces = new Set<string>();
const loadedReportNamespaces = new Set<string>();

function getActiveEnvironment(): StorageEnvironment {
  return isChiefDevMode() ? 'DEV' : 'PROD';
}

function normalizeAuthenticatedUserId(userId: string | null): string | null {
  if (userId && typeof userId === 'string' && userId.trim().length > 0) {
    return userId.trim();
  }
  return null;
}

function resolveUserNamespace(userId: string | null): string {
  return normalizeAuthenticatedUserId(userId) || 'unauthenticated';
}

function runtimeNamespaceKey(environment: StorageEnvironment, userNamespace: string): string {
  return `${environment}:${userNamespace}`;
}

function queueOwnershipError(
  environment: StorageEnvironment,
  items: QueueItem[],
  userId: string | null
): string | null {
  if (environment !== 'PROD' || items.length === 0) {
    return null;
  }

  const authenticatedUserId = normalizeAuthenticatedUserId(userId);
  if (!authenticatedUserId) {
    return 'Authenticated user namespace required for production queue persistence.';
  }

  for (const item of items) {
    const attributedUserId = item.workerAttribution?.userId?.trim();
    if (!attributedUserId || attributedUserId !== authenticatedUserId) {
      return `Queue ownership mismatch for record ${item.id}. Persistence blocked.`;
    }
  }

  return null;
}

function reportOwnershipError(
  environment: StorageEnvironment,
  reports: WorkerReportItem[],
  userId: string | null
): string | null {
  if (environment !== 'PROD' || reports.length === 0) {
    return null;
  }

  const authenticatedUserId = normalizeAuthenticatedUserId(userId);
  if (!authenticatedUserId) {
    return 'Authenticated user namespace required for production report persistence.';
  }

  for (const report of reports) {
    const reportWorkerId = report.workerId?.trim();
    if (!reportWorkerId || reportWorkerId !== authenticatedUserId) {
      return `Report ownership mismatch for record ${report.id}. Persistence blocked.`;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// 1. OFFLINE QUEUE PERSISTENCE
// ---------------------------------------------------------------------------
export const queueStorage = {
  async getAll(userId: string | null): Promise<QueueItem[]> {
    const env = getActiveEnvironment();
    const ns = resolveUserNamespace(userId);
    const namespaceKey = runtimeNamespaceKey(env, ns);

    // Reset the runtime gate before every load attempt. This is intentionally
    // synchronous so a same-render save effect cannot reuse a previous load marker.
    loadedQueueNamespaces.delete(namespaceKey);

    if (!isIndexedDBAvailable()) {
      throw new Error('Secure browser database (IndexedDB) is unavailable or disabled in private browsing.');
    }

    try {
      await runClientMigrations(env);
      const records = await idbGetByUser<PersistedRecord<QueueItem>>(
        env,
        STORE_NAMES.QUEUE,
        ns
      );
      loadedQueueNamespaces.add(namespaceKey);
      return records.map(r => r.data);
    } catch (err) {
      loadedQueueNamespaces.delete(namespaceKey);
      console.warn('[Chief Queue Storage] Failed to load queue records:', err);
      throw err;
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

    const ownershipError = queueOwnershipError(env, [item], userId);
    if (ownershipError) {
      return { success: false, error: ownershipError };
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

    const ns = resolveUserNamespace(userId);
    const namespaceKey = runtimeNamespaceKey(env, ns);

    // Central race guard: never persist component state into a namespace that
    // has not completed its own load in this runtime.
    if (!loadedQueueNamespaces.has(namespaceKey)) {
      console.warn(`[Chief Queue Storage] Background persistence blocked: namespace ${namespaceKey} is not loaded.`);
      return;
    }

    const ownershipError = queueOwnershipError(env, items, userId);
    if (ownershipError) {
      console.warn(`[Chief Queue Storage] ${ownershipError}`);
      return;
    }

    try {
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
    const ns = resolveUserNamespace(userId);
    const namespaceKey = runtimeNamespaceKey(env, ns);

    loadedReportNamespaces.delete(namespaceKey);

    if (!isIndexedDBAvailable()) {
      throw new Error('Secure browser database (IndexedDB) is unavailable or disabled in private browsing.');
    }

    try {
      await runClientMigrations(env);
      const records = await idbGetByUser<PersistedRecord<WorkerReportItem>>(
        env,
        STORE_NAMES.REPORTS,
        ns
      );
      loadedReportNamespaces.add(namespaceKey);
      return records.map(r => r.data);
    } catch (err) {
      loadedReportNamespaces.delete(namespaceKey);
      console.warn('[Chief Report Storage] Failed to load reports:', err);
      throw err;
    }
  },

  /**
   * Critical report writes throw on persistence failure rather than returning a
   * false-success-shaped value. Existing callers that inspect success continue
   * to receive { success: true } after a committed transaction; unchecked callers
   * can no longer continue and claim "queued" after a failed write.
   */
  async save(report: WorkerReportItem, userId: string | null): Promise<{ success: boolean; error?: string }> {
    const env = getActiveEnvironment();
    if (!isIndexedDBAvailable()) {
      throw new Error('Secure browser database (IndexedDB) is unavailable or disabled in private browsing.');
    }

    const ownershipError = reportOwnershipError(env, [report], userId);
    if (ownershipError) {
      throw new Error(ownershipError);
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
      throw new Error(`Local persistence failed: ${msg}`);
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

    const ns = resolveUserNamespace(userId);
    const namespaceKey = runtimeNamespaceKey(env, ns);

    if (!loadedReportNamespaces.has(namespaceKey)) {
      console.warn(`[Chief Report Storage] Background persistence blocked: namespace ${namespaceKey} is not loaded.`);
      return;
    }

    const ownershipError = reportOwnershipError(env, reports, userId);
    if (ownershipError) {
      console.warn(`[Chief Report Storage] ${ownershipError}`);
      return;
    }

    try {
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
