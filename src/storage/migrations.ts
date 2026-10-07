/**
 * CHIEF Client Storage Migrations
 * 
 * BATCH 13C.2A.1 IMMUTABLE SPECIFICATION:
 * - Deterministic, non-destructive migration to Schema Version 2.
 * - Legacy records with established attribution keep their authentic owner namespace.
 * - Legacy records WITHOUT established attribution are migrated to isolated 'unauthenticated-legacy' namespace.
 *   THEY ARE NEVER ATTACHED TO THE CURRENTLY LOGGED-IN USER.
 * - Unsafe legacy queued records are quarantined as 'failed_permanent' with:
 *   "Legacy queued payload cannot be replayed safely. No Chief decision was made."
 * - Local reports are never escalated to accepted_by_chief without backend proof.
 * - Migration bookkeeping is environment and schema-version bound (not user-bound).
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

    // 2. Migrate Legacy LocalStorage Queue Items
    const queueKey = environment === 'PROD' 
      ? 'chief_offline_queue_prod_v2' 
      : 'chief_offline_queue_dev_v2';
    
    const rawQueue = localStorage.getItem(queueKey);
    if (rawQueue) {
      try {
        const parsed = JSON.parse(rawQueue) as QueueItem[];
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            let sanitizedItem: QueueItem = { ...item };

            // STRICT OWNERSHIP RULE:
            // Only preserve identity if authentic worker attribution exists with a non-empty userId.
            // NEVER assign to whoever happens to be currently logged in.
            const ownerNamespace = (
              sanitizedItem.workerAttribution?.userId && 
              typeof sanitizedItem.workerAttribution.userId === 'string' &&
              sanitizedItem.workerAttribution.userId.trim().length > 0
            )
              ? sanitizedItem.workerAttribution.userId.trim()
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
      } catch {
        // Leave unparsed data intact
      }
    }

    // 3. Migrate Legacy LocalStorage Worker Reports
    const reportKey = environment === 'PROD'
      ? 'chief_worker_reports_prod_v1'
      : 'chief_worker_reports_dev_v1';

    const rawReports = localStorage.getItem(reportKey);
    if (rawReports) {
      try {
        const parsedReports = JSON.parse(rawReports) as WorkerReportItem[];
        if (Array.isArray(parsedReports)) {
          for (const report of parsedReports) {
            const sanitizedReport: WorkerReportItem = { ...report };

            // STRICT OWNERSHIP RULE:
            const ownerNamespace = (
              sanitizedReport.workerId &&
              typeof sanitizedReport.workerId === 'string' &&
              sanitizedReport.workerId.trim().length > 0
            )
              ? sanitizedReport.workerId.trim()
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
      } catch {
        // Leave unparsed data intact
      }
    }

    // 4. Record migration completion in metadata
    await idbPut(environment, STORE_NAMES.METADATA, {
      key: migrationKey,
      value: { completed: true, environment, version: STORAGE_SCHEMA_VERSION },
      environment,
      schemaVersion: STORAGE_SCHEMA_VERSION,
      updatedAt: Date.now()
    });
  } catch (err) {
    console.warn('[Chief Storage Migration] Non-fatal migration error:', err);
  }
}
