/**
 * CHIEF Client Storage Migrations
 * 
 * Safely migrates legacy localStorage payloads into the versioned IndexedDB store.
 * 
 * IMMUTABLE RULES:
 * - Deterministic, non-destructive migration.
 * - If a legacy record lacks sufficient metadata for safe exact replay:
 *   fail safely as 'failed_permanent' with explicit message:
 *   "Legacy queued payload cannot be replayed safely. No Chief decision was made."
 * - Do NOT coerce, heuristically guess categories, or manufacture Chief acceptances.
 */

import { QueueItem } from '../types/queue';
import { WorkerReportItem } from '../types/workerReport';
import { StorageEnvironment, STORE_NAMES, STORAGE_SCHEMA_VERSION, PersistedRecord } from './schema';
import { idbPut, idbGet } from './idb';

const MIGRATION_FLAG_KEY = 'chief_migration_status_v1';

export async function runClientMigrations(environment: StorageEnvironment, currentUserId: string | null): Promise<void> {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    // Check if migration has already been executed for this environment
    const migrationMeta = await idbGet<{ key: string; executedAt: number }>(
      environment,
      STORE_NAMES.METADATA,
      MIGRATION_FLAG_KEY
    );

    if (migrationMeta) {
      return; // Already migrated
    }

    // 1. Migrate Queue Items
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

            // Requirement 5: Legacy validation
            const actionTypeStr = String(sanitizedItem.actionType).toUpperCase();
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
              id: sanitizedItem.id,
              userNamespace: currentUserId || 'unauthenticated',
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
        // Leave unparsed legacy data alone
      }
    }

    // 2. Migrate Worker Reports
    const reportKey = environment === 'PROD'
      ? 'chief_worker_reports_prod_v1'
      : 'chief_worker_reports_dev_v1';

    const rawReports = localStorage.getItem(reportKey);
    if (rawReports) {
      try {
        const parsedReports = JSON.parse(rawReports) as WorkerReportItem[];
        if (Array.isArray(parsedReports)) {
          for (const report of parsedReports) {
            // Guarantee local status is never escalated to accepted_by_chief
            const sanitizedReport: WorkerReportItem = { ...report };
            if (sanitizedReport.status === 'accepted_by_chief' && !sanitizedReport.backendConfirmationHash) {
              sanitizedReport.status = 'saved_locally';
            }

            const record: PersistedRecord<WorkerReportItem> = {
              id: sanitizedReport.id,
              userNamespace: sanitizedReport.workerId || currentUserId || 'unauthenticated',
              environment,
              schemaVersion: STORAGE_SCHEMA_VERSION,
              data: sanitizedReport,
              createdAt: new Date(sanitizedReport.createdAt).getTime() || Date.now(),
              updatedAt: Date.now()
            };

            await idbPut(environment, STORE_NAMES.REPORTS, record);
          }
        }
        localStorage.removeItem(reportKey);
      } catch {
        // Leave unparsed legacy data alone
      }
    }

    // Record migration completion
    await idbPut(environment, STORE_NAMES.METADATA, {
      key: MIGRATION_FLAG_KEY,
      executedAt: Date.now(),
      schemaVersion: STORAGE_SCHEMA_VERSION
    });
  } catch (err) {
    console.warn('[Chief Storage Migration] Non-fatal migration error:', err);
  }
}
