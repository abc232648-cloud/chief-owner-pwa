/**
 * CHIEF Client Storage Migrations
 *
 * BATCH 13C.2A.2 SAFETY REPAIR:
 * - Deterministic migration of legacy databases (v1, v2) and localStorage into the stable database.
 * - Ownership validation:
 *   - Queue: record.userNamespace === record.data.workerAttribution.userId. If inconsistent/missing, quarantine.
 *   - Reports: record.userNamespace === record.data.workerId. If inconsistent/missing, quarantine.
 * - Quarantine namespaces include migration provenance so unrelated ambiguous records cannot collide solely by ID.
 * - Migration is two-phase: copy/validate every source first, then mark complete, then clean legacy sources.
 * - Genuine legacy sources are never deleted when copy/validation fails.
 * - Malformed records without a safe stable identity fail the source migration rather than being silently discarded.
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

interface LegacyDatabaseCopyResult {
  name: string;
  existed: boolean;
}

function getAllFromStore<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    try {
      if (!db.objectStoreNames.contains(storeName)) {
        resolve([]);
        return;
      }

      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      let result: T[] = [];

      req.onsuccess = () => {
        result = (req.result as T[]) || [];
      };
      req.onerror = () => reject(req.error || new Error(`Failed to read from legacy store ${storeName}`));
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error || new Error(`Transaction error on legacy store ${storeName}`));
      tx.onabort = () => reject(new Error(`Transaction aborted on legacy store ${storeName}`));
    } catch (err) {
      reject(err);
    }
  });
}

function safeStorageTimestamp(primary: unknown, secondary: unknown): number {
  if (typeof primary === 'number' && Number.isFinite(primary)) {
    return primary;
  }

  if (typeof secondary === 'string' || typeof secondary === 'number') {
    const parsed = new Date(secondary).getTime();
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  // Wrapper timestamps are client-storage metadata, not Chief evidence.
  return Date.now();
}

function legacyQuarantineNamespace(source: string, claimedNamespace: unknown): string {
  const claimed = typeof claimedNamespace === 'string' && claimedNamespace.trim().length > 0
    ? claimedNamespace.trim()
    : 'unknown';
  return `unauthenticated-legacy:${source}:${claimed}`;
}

async function openLegacyDatabaseIfPresent(legacyDbName: string): Promise<IDBDatabase | null> {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open(legacyDbName);
    let createdByProbe = false;

    req.onupgradeneeded = () => {
      // Opening a nonexistent DB creates an empty version-1 DB. It is not a genuine migration source.
      createdByProbe = true;
    };

    req.onsuccess = () => {
      const db = req.result;
      if (createdByProbe && db.objectStoreNames.length === 0) {
        db.close();
        const cleanup = window.indexedDB.deleteDatabase(legacyDbName);
        cleanup.onsuccess = () => resolve(null);
        cleanup.onerror = () => resolve(null);
        cleanup.onblocked = () => resolve(null);
        return;
      }
      resolve(db);
    };

    req.onerror = () => reject(req.error || new Error(`Failed to open legacy DB: ${legacyDbName}`));
    req.onblocked = () => reject(new Error(`Opening legacy DB [${legacyDbName}] was blocked`));
  });
}

async function copyLegacyDatabase(
  legacyDbName: string,
  environment: StorageEnvironment
): Promise<LegacyDatabaseCopyResult> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return { name: legacyDbName, existed: false };
  }

  let legacyDb: IDBDatabase | null = null;

  try {
    legacyDb = await openLegacyDatabaseIfPresent(legacyDbName);
    if (!legacyDb) {
      return { name: legacyDbName, existed: false };
    }

    if (legacyDb.objectStoreNames.contains(STORE_NAMES.QUEUE)) {
      const rawQueueRecords = await getAllFromStore<any>(legacyDb, STORE_NAMES.QUEUE);

      for (const rec of rawQueueRecords) {
        const item: QueueItem | undefined = rec?.data || rec;
        if (!item || typeof item.id !== 'string' || item.id.trim().length === 0) {
          throw new Error(`Malformed legacy queue record without stable identity in ${legacyDbName}. Source retained.`);
        }

        let sanitizedItem: QueueItem = { ...item };
        const claimedNamespace = rec?.userNamespace;
        const attributedUser = sanitizedItem.workerAttribution?.userId;
        const isOwnerConsistent =
          typeof claimedNamespace === 'string' &&
          typeof attributedUser === 'string' &&
          claimedNamespace.trim().length > 0 &&
          attributedUser.trim().length > 0 &&
          claimedNamespace.trim() === attributedUser.trim() &&
          claimedNamespace !== 'unauthenticated' &&
          claimedNamespace !== 'unauthenticated-legacy';

        const finalNamespace = isOwnerConsistent
          ? claimedNamespace.trim()
          : legacyQuarantineNamespace(legacyDbName, claimedNamespace);

        const actionTypeStr = String(sanitizedItem.actionType || '').toUpperCase();
        if (actionTypeStr === 'SUBMIT_WORKER_REPORT' &&
            (!sanitizedItem.reportPayload || typeof sanitizedItem.reportPayload !== 'object')) {
          sanitizedItem = {
            ...sanitizedItem,
            status: 'failed_permanent',
            lastFailure: 'Legacy queued payload cannot be replayed safely. No Chief decision was made.'
          };
        }

        const vCurrentRecord: PersistedRecord<QueueItem> = {
          userNamespace: finalNamespace,
          id: sanitizedItem.id,
          environment,
          schemaVersion: STORAGE_SCHEMA_VERSION,
          data: sanitizedItem,
          createdAt: safeStorageTimestamp(rec?.createdAt, sanitizedItem.createdAt),
          updatedAt: safeStorageTimestamp(rec?.updatedAt, undefined)
        };

        await idbPut(environment, STORE_NAMES.QUEUE, vCurrentRecord);
      }
    }

    if (legacyDb.objectStoreNames.contains(STORE_NAMES.REPORTS)) {
      const rawReportRecords = await getAllFromStore<any>(legacyDb, STORE_NAMES.REPORTS);

      for (const rec of rawReportRecords) {
        const report: WorkerReportItem | undefined = rec?.data || rec;
        if (!report || typeof report.id !== 'string' || report.id.trim().length === 0) {
          throw new Error(`Malformed legacy report without stable identity in ${legacyDbName}. Source retained.`);
        }

        const sanitizedReport: WorkerReportItem = { ...report };
        const claimedNamespace = rec?.userNamespace;
        const reportWorkerId = sanitizedReport.workerId;
        const isOwnerConsistent =
          typeof claimedNamespace === 'string' &&
          typeof reportWorkerId === 'string' &&
          claimedNamespace.trim().length > 0 &&
          reportWorkerId.trim().length > 0 &&
          claimedNamespace.trim() === reportWorkerId.trim() &&
          claimedNamespace !== 'unauthenticated' &&
          claimedNamespace !== 'unauthenticated-legacy';

        const finalNamespace = isOwnerConsistent
          ? claimedNamespace.trim()
          : legacyQuarantineNamespace(legacyDbName, claimedNamespace);

        // Never preserve an authoritative-looking accepted state without actual backend proof.
        if (sanitizedReport.status === 'accepted_by_chief' && !sanitizedReport.backendConfirmationHash) {
          sanitizedReport.status = 'saved_locally';
        }

        const vCurrentRecord: PersistedRecord<WorkerReportItem> = {
          userNamespace: finalNamespace,
          id: sanitizedReport.id,
          environment,
          schemaVersion: STORAGE_SCHEMA_VERSION,
          data: sanitizedReport,
          createdAt: safeStorageTimestamp(rec?.createdAt, sanitizedReport.createdAt),
          updatedAt: safeStorageTimestamp(rec?.updatedAt, undefined)
        };

        await idbPut(environment, STORE_NAMES.REPORTS, vCurrentRecord);
      }
    }

    legacyDb.close();
    legacyDb = null;
    return { name: legacyDbName, existed: true };
  } catch (err) {
    if (legacyDb) {
      legacyDb.close();
    }
    // No source deletion occurs here. Global migration cleanup happens only after every source copies successfully.
    throw err;
  }
}

async function deleteLegacyDatabaseBestEffort(legacyDbName: string): Promise<void> {
  await new Promise<void>((resolve) => {
    const req = window.indexedDB.deleteDatabase(legacyDbName);
    req.onsuccess = () => resolve();
    req.onerror = () => {
      console.warn(`[Chief Storage Migration] Legacy DB cleanup failed for ${legacyDbName}; migrated destination data is retained.`);
      resolve();
    };
    req.onblocked = () => {
      console.warn(`[Chief Storage Migration] Legacy DB cleanup blocked for ${legacyDbName}; source retained.`);
      resolve();
    };
  });
}

async function copyLegacyLocalStorageQueue(
  environment: StorageEnvironment,
  queueKey: string
): Promise<boolean> {
  const rawQueue = localStorage.getItem(queueKey);
  if (!rawQueue) {
    return false;
  }

  const parsed = JSON.parse(rawQueue) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(`Legacy queue source ${queueKey} is not an array. Source retained.`);
  }

  const seenKeys = new Set<string>();

  for (const rawItem of parsed) {
    const item = rawItem as QueueItem;
    if (!item || typeof item.id !== 'string' || item.id.trim().length === 0) {
      throw new Error(`Malformed legacy queue record without stable identity in ${queueKey}. Source retained.`);
    }

    let sanitizedItem: QueueItem = { ...item };
    const attributedUser = sanitizedItem.workerAttribution?.userId;
    const ownerNamespace =
      typeof attributedUser === 'string' && attributedUser.trim().length > 0
        ? attributedUser.trim()
        : legacyQuarantineNamespace(`localStorage:${queueKey}`, undefined);

    const destinationKey = `${ownerNamespace}\u0000${sanitizedItem.id}`;
    if (seenKeys.has(destinationKey)) {
      throw new Error(`Duplicate legacy queue identity ${sanitizedItem.id} in ${queueKey}. Source retained.`);
    }
    seenKeys.add(destinationKey);

    const actionTypeStr = String(sanitizedItem.actionType || '').toUpperCase();
    if (actionTypeStr === 'SUBMIT_WORKER_REPORT' &&
        (!sanitizedItem.reportPayload || typeof sanitizedItem.reportPayload !== 'object')) {
      sanitizedItem = {
        ...sanitizedItem,
        status: 'failed_permanent',
        lastFailure: 'Legacy queued payload cannot be replayed safely. No Chief decision was made.'
      };
    }

    const record: PersistedRecord<QueueItem> = {
      userNamespace: ownerNamespace,
      id: sanitizedItem.id,
      environment,
      schemaVersion: STORAGE_SCHEMA_VERSION,
      data: sanitizedItem,
      createdAt: safeStorageTimestamp(undefined, sanitizedItem.createdAt),
      updatedAt: Date.now()
    };

    await idbPut(environment, STORE_NAMES.QUEUE, record);
  }

  return true;
}

async function copyLegacyLocalStorageReports(
  environment: StorageEnvironment,
  reportKey: string
): Promise<boolean> {
  const rawReports = localStorage.getItem(reportKey);
  if (!rawReports) {
    return false;
  }

  const parsed = JSON.parse(rawReports) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(`Legacy report source ${reportKey} is not an array. Source retained.`);
  }

  const seenKeys = new Set<string>();

  for (const rawReport of parsed) {
    const report = rawReport as WorkerReportItem;
    if (!report || typeof report.id !== 'string' || report.id.trim().length === 0) {
      throw new Error(`Malformed legacy report without stable identity in ${reportKey}. Source retained.`);
    }

    const sanitizedReport: WorkerReportItem = { ...report };
    const workerId = sanitizedReport.workerId;
    const ownerNamespace =
      typeof workerId === 'string' && workerId.trim().length > 0
        ? workerId.trim()
        : legacyQuarantineNamespace(`localStorage:${reportKey}`, undefined);

    const destinationKey = `${ownerNamespace}\u0000${sanitizedReport.id}`;
    if (seenKeys.has(destinationKey)) {
      throw new Error(`Duplicate legacy report identity ${sanitizedReport.id} in ${reportKey}. Source retained.`);
    }
    seenKeys.add(destinationKey);

    if (sanitizedReport.status === 'accepted_by_chief' && !sanitizedReport.backendConfirmationHash) {
      sanitizedReport.status = 'saved_locally';
    }

    const record: PersistedRecord<WorkerReportItem> = {
      userNamespace: ownerNamespace,
      id: sanitizedReport.id,
      environment,
      schemaVersion: STORAGE_SCHEMA_VERSION,
      data: sanitizedReport,
      createdAt: safeStorageTimestamp(undefined, sanitizedReport.createdAt),
      updatedAt: Date.now()
    };

    await idbPut(environment, STORE_NAMES.REPORTS, record);
  }

  return true;
}

export async function runClientMigrations(environment: StorageEnvironment): Promise<void> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return;
  }

  const migrationKey = `chief_migration_status_${environment.toLowerCase()}_v${STORAGE_SCHEMA_VERSION}`;

  try {
    const migrationMeta = await idbGet<StorageMetadataRecord>(
      environment,
      STORE_NAMES.METADATA,
      migrationKey
    );

    if (migrationMeta && migrationMeta.updatedAt) {
      return;
    }

    // ---------------------------
    // PHASE A: COPY / VALIDATE
    // ---------------------------
    // Do not delete any genuine migration source during this phase.
    const legacyDbV1 = `chief_storage_${environment.toLowerCase()}_v1`;
    const legacyDbV2 = `chief_storage_${environment.toLowerCase()}_v2`;

    const copiedLegacyDatabases: LegacyDatabaseCopyResult[] = [];
    copiedLegacyDatabases.push(await copyLegacyDatabase(legacyDbV1, environment));
    copiedLegacyDatabases.push(await copyLegacyDatabase(legacyDbV2, environment));

    let queueKey: string | null = null;
    let reportKey: string | null = null;
    let queueSourceCopied = false;
    let reportSourceCopied = false;

    try {
      // Access may itself be restricted by browser privacy settings.
      const storage = window.localStorage;
      queueKey = environment === 'PROD'
        ? 'chief_offline_queue_prod_v2'
        : 'chief_offline_queue_dev_v2';
      reportKey = environment === 'PROD'
        ? 'chief_worker_reports_prod_v1'
        : 'chief_worker_reports_dev_v1';

      queueSourceCopied = await copyLegacyLocalStorageQueue(environment, queueKey);
      reportSourceCopied = await copyLegacyLocalStorageReports(environment, reportKey);
      void storage; // documents that successful localStorage access is part of Phase A.
    } catch (err) {
      // No source has been removed yet. Propagate so completion metadata is not written.
      throw err;
    }

    // ---------------------------
    // PHASE B: COMMIT / CLEANUP
    // ---------------------------
    // Destination records are committed. Mark migration complete before cleanup so cleanup
    // failure cannot cause destructive reprocessing; legacy sources are merely redundant now.
    await idbPut(environment, STORE_NAMES.METADATA, {
      key: migrationKey,
      value: { completed: true, environment, version: STORAGE_SCHEMA_VERSION },
      environment,
      schemaVersion: STORAGE_SCHEMA_VERSION,
      updatedAt: Date.now()
    });

    for (const source of copiedLegacyDatabases) {
      if (source.existed) {
        await deleteLegacyDatabaseBestEffort(source.name);
      }
    }

    try {
      if (queueSourceCopied && queueKey) {
        localStorage.removeItem(queueKey);
      }
      if (reportSourceCopied && reportKey) {
        localStorage.removeItem(reportKey);
      }
    } catch (cleanupErr) {
      console.warn('[Chief Storage Migration] Legacy localStorage cleanup failed; migrated destination data is retained.', cleanupErr);
    }
  } catch (err) {
    // No completion flag is written on Phase-A failure. Genuine source DBs/localStorage remain intact.
    console.error(`[Chief Storage Migration] Migration failed for ${environment}:`, err);
    throw err;
  }
}
