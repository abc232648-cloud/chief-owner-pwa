/**
 * CHIEF Client Storage Migrations
 * 
 * BATCH 13C.2A.2 IMMUTABLE SPECIFICATION:
 * - Deterministic migration of legacy databases (v1, v2) and localStorage into stable v3 database.
 * - Ownership validation:
 *   - Queue: record.userNamespace === record.data.workerAttribution.userId. If inconsistent/missing, quarantine into 'unauthenticated-legacy'.
 *   - Reports: record.userNamespace === record.data.workerId. If inconsistent/missing, quarantine into 'unauthenticated-legacy'.
 * - Exact payloads, timestamps, retry counts, and authentic verification hashes are strictly preserved.
 * - Old databases are retained if migration encounters any error.
 * - Old databases are deleted ONLY after destination writes and transactions commit successfully.
 * - Migration failures are never marked as completed.
 */

import { QueueItem } from '../types/queue';
import { WorkerReportItem } from '../types/workerReport';
import { 
  StorageEnvironment, 
  STORE_NAMES, 
  STORAGE_SCHEMA_VERSION, 
  PersistedRecord, 
  StorageMetadataRecord 
} from './schema';
import { idbPut, idbGet } from './idb';

function getAllFromStore<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    try {
      if (!db.objectStoreNames.contains(storeName)) {
        return resolve([]);
      }
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error || new Error(`Failed to read from legacy store ${storeName}`));
      tx.onerror = () => reject(tx.error || new Error(`Transaction error on legacy store ${storeName}`));
    } catch (err) {
      reject(err);
    }
  });
}

async function migrateLegacyDatabase(legacyDbName: string, environment: StorageEnvironment): Promise<void> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return;

  let legacyDb: IDBDatabase | null = null;

  try {
    legacyDb = await new Promise<IDBDatabase | null>((resolve, reject) => {
      const req = window.indexedDB.open(legacyDbName);
      let wasUpgrade = false;
      req.onupgradeneeded = () => {
        // If DB did not exist previously, opening it triggers upgradeneeded with empty stores
        wasUpgrade = true;
      };
      req.onsuccess = () => {
        const db = req.result;
        if (wasUpgrade && db.objectStoreNames.length === 0) {
          // Database was created freshly just by opening; nothing to migrate
          db.close();
          window.indexedDB.deleteDatabase(legacyDbName);
          resolve(null);
        } else {
          resolve(db);
        }
      };
      req.onerror = () => reject(req.error || new Error(`Failed to open legacy DB: ${legacyDbName}`));
      req.onblocked = () => reject(new Error(`Opening legacy DB [${legacyDbName}] was blocked`));
    });

    if (!legacyDb) return;

    // 1. Read legacy queue records
    if (legacyDb.objectStoreNames.contains(STORE_NAMES.QUEUE)) {
      const rawQueueRecords = await getAllFromStore<any>(legacyDb, STORE_NAMES.QUEUE);
      for (const rec of rawQueueRecords) {
        const item: QueueItem = rec.data || rec;
        if (!item || !item.id) continue;

        let sanitizedItem: QueueItem = { ...item };

        // OWNERSHIP VALIDATION:
        // Must match record.userNamespace === record.data.workerAttribution.userId.
        // Otherwise quarantine in 'unauthenticated-legacy'. NEVER attach to current user.
        const claimedNamespace = rec.userNamespace;
        const attributedUser = sanitizedItem.workerAttribution?.userId;
        const isOwnerConsistent = claimedNamespace && 
          attributedUser && 
          claimedNamespace.trim() === attributedUser.trim() &&
          claimedNamespace !== 'unauthenticated' &&
          claimedNamespace !== 'unauthenticated-legacy';

        const finalNamespace = isOwnerConsistent ? claimedNamespace.trim() : 'unauthenticated-legacy';

        // Replay safety check
        const actionTypeStr = String(sanitizedItem.actionType || '').toUpperCase();
        if (actionTypeStr === 'SUBMIT_WORKER_REPORT') {
          if (!sanitizedItem.reportPayload || typeof sanitizedItem.reportPayload !== 'object') {
            sanitizedItem = {
              ...sanitizedItem,
              status: 'failed_permanent',
              lastFailure: 'Legacy queued payload cannot be replayed safely. No Chief decision was made.'
            };
          }
        }

        const v3Record: PersistedRecord<QueueItem> = {
          userNamespace: finalNamespace,
          id: sanitizedItem.id,
          environment,
          schemaVersion: STORAGE_SCHEMA_VERSION,
          data: sanitizedItem,
          createdAt: sanitizedItem.createdAt ? new Date(sanitizedItem.createdAt).getTime() : Date.now(),
          updatedAt: Date.now()
        };

        // Write to stable database and await transaction commit
        await idbPut(environment, STORE_NAMES.QUEUE, v3Record);
      }
    }

    // 2. Read legacy worker reports
    if (legacyDb.objectStoreNames.contains(STORE_NAMES.REPORTS)) {
      const rawReportRecords = await getAllFromStore<any>(legacyDb, STORE_NAMES.REPORTS);
      for (const rec of rawReportRecords) {
        const report: WorkerReportItem = rec.data || rec;
        if (!report || !report.id) continue;

        const sanitizedReport: WorkerReportItem = { ...report };

        // OWNERSHIP VALIDATION:
        // Must match record.userNamespace === record.data.workerId
        const claimedNamespace = rec.userNamespace;
        const reportWorkerId = sanitizedReport.workerId;
        const isOwnerConsistent = claimedNamespace && 
          reportWorkerId && 
          claimedNamespace.trim() === reportWorkerId.trim() &&
          claimedNamespace !== 'unauthenticated' &&
          claimedNamespace !== 'unauthenticated-legacy';

        const finalNamespace = isOwnerConsistent ? claimedNamespace.trim() : 'unauthenticated-legacy';

        // Never fabricate accepted_by_chief without backend proof
        if (sanitizedReport.status === 'accepted_by_chief' && !sanitizedReport.backendConfirmationHash) {
          sanitizedReport.status = 'saved_locally';
        }

        const v3Record: PersistedRecord<WorkerReportItem> = {
          userNamespace: finalNamespace,
          id: sanitizedReport.id,
          environment,
          schemaVersion: STORAGE_SCHEMA_VERSION,
          data: sanitizedReport,
          createdAt: sanitizedReport.createdAt ? new Date(sanitizedReport.createdAt).getTime() : Date.now(),
          updatedAt: Date.now()
        };

        await idbPut(environment, STORE_NAMES.REPORTS, v3Record);
      }
    }

    // 3. Close legacy database
    legacyDb.close();
    legacyDb = null;

    // 4. Only after all writes succeed, delete the legacy database
    await new Promise<void>((resolve, reject) => {
      const delReq = window.indexedDB.deleteDatabase(legacyDbName);
      delReq.onsuccess = () => resolve();
      delReq.onerror = () => reject(delReq.error || new Error(`Failed to delete legacy DB ${legacyDbName}`));
      delReq.onblocked = () => {
        // Even if delete is blocked by pending connections, data is safely in stable DB
        resolve();
      };
    });
  } catch (err) {
    if (legacyDb) {
      legacyDb.close();
    }
    // Propagate error: DO NOT delete old database or mark migration complete
    throw err;
  }
}

export async function runClientMigrations(environment: StorageEnvironment): Promise<void> {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  const migrationKey = `chief_migration_status_${environment.toLowerCase()}_v${STORAGE_SCHEMA_VERSION}`;

  try {
    // 1. Check if migration has already been executed for this environment and schema version
    const migrationMeta = await idbGet<StorageMetadataRecord>(
      environment,
      STORE_NAMES.METADATA,
      migrationKey
    );

    if (migrationMeta && migrationMeta.updatedAt) {
      return; // Already completed for this environment
    }

    // 2. Migrate legacy v1 and v2 physical IndexedDB databases if present
    const legacyDbV1 = `chief_storage_${environment.toLowerCase()}_v1`;
    const legacyDbV2 = `chief_storage_${environment.toLowerCase()}_v2`;

    await migrateLegacyDatabase(legacyDbV1, environment);
    await migrateLegacyDatabase(legacyDbV2, environment);

    // 3. Migrate Legacy LocalStorage Queue Items
    const queueKey = environment === 'PROD' 
      ? 'chief_offline_queue_prod_v2' 
      : 'chief_offline_queue_dev_v2';
    
    const rawQueue = localStorage.getItem(queueKey);
    if (rawQueue) {
      const parsed = JSON.parse(rawQueue) as QueueItem[];
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          let sanitizedItem: QueueItem = { ...item };

          // STRICT OWNERSHIP RULE:
          const attributedUser = sanitizedItem.workerAttribution?.userId;
          const ownerNamespace = (attributedUser && typeof attributedUser === 'string' && attributedUser.trim().length > 0)
            ? attributedUser.trim()
            : 'unauthenticated-legacy';

          // REPLAY SAFETY CHECK:
          const actionTypeStr = String(sanitizedItem.actionType || '').toUpperCase();
          if (actionTypeStr === 'SUBMIT_WORKER_REPORT') {
            if (!sanitizedItem.reportPayload || typeof sanitizedItem.reportPayload !== 'object') {
              sanitizedItem = {
                ...sanitizedItem,
                status: 'failed_permanent',
                lastFailure: 'Legacy queued payload cannot be replayed safely. No Chief decision was made.'
              };
            }
          }

          const record: PersistedRecord<QueueItem> = {
            userNamespace: ownerNamespace,
            id: sanitizedItem.id,
            environment,
            schemaVersion: STORAGE_SCHEMA_VERSION,
            data: sanitizedItem,
            createdAt: sanitizedItem.createdAt ? new Date(sanitizedItem.createdAt).getTime() : Date.now(),
            updatedAt: Date.now()
          };

          await idbPut(environment, STORE_NAMES.QUEUE, record);
        }
      }
      localStorage.removeItem(queueKey);
    }

    // 4. Migrate Legacy LocalStorage Worker Reports
    const reportKey = environment === 'PROD' 
      ? 'chief_worker_reports_prod_v1' 
      : 'chief_worker_reports_dev_v1';

    const rawReports = localStorage.getItem(reportKey);
    if (rawReports) {
      const parsedReports = JSON.parse(rawReports) as WorkerReportItem[];
      if (Array.isArray(parsedReports)) {
        for (const report of parsedReports) {
          const sanitizedReport: WorkerReportItem = { ...report };

          const workerId = sanitizedReport.workerId;
          const ownerNamespace = (workerId && typeof workerId === 'string' && workerId.trim().length > 0)
            ? workerId.trim()
            : 'unauthenticated-legacy';

          // Guarantee local status is never escalated to accepted_by_chief without proof
          if (sanitizedReport.status === 'accepted_by_chief' && !sanitizedReport.backendConfirmationHash) {
            sanitizedReport.status = 'saved_locally';
          }

          const record: PersistedRecord<WorkerReportItem> = {
            userNamespace: ownerNamespace,
            id: sanitizedReport.id,
            environment,
            schemaVersion: STORAGE_SCHEMA_VERSION,
            data: sanitizedReport,
            createdAt: sanitizedReport.createdAt ? new Date(sanitizedReport.createdAt).getTime() : Date.now(),
            updatedAt: Date.now()
          };

          await idbPut(environment, STORE_NAMES.REPORTS, record);
        }
      }
      localStorage.removeItem(reportKey);
    }

    // 5. Record migration completion in metadata ONLY after all steps succeed
    await idbPut(environment, STORE_NAMES.METADATA, {
      key: migrationKey,
      value: { completed: true, environment, version: STORAGE_SCHEMA_VERSION },
      environment,
      schemaVersion: STORAGE_SCHEMA_VERSION,
      updatedAt: Date.now()
    });
  } catch (err) {
    // DO NOT write completed flag on failure; surface failure
    console.error(`[Chief Storage Migration] Migration failed for ${environment}:`, err);
    throw err;
  }
}
