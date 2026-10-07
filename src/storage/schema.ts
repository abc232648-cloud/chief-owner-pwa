/**
 * CHIEF Client Storage Schema & Namespace Definitions
 * 
 * BATCH 13C.2A.2 IMMUTABLE SPECIFICATION:
 * - Version 3: Stable physical IndexedDB names (chief_storage_prod / chief_storage_dev).
 *   Physical DB name NEVER embeds schema version.
 * - Compound primary keys ['userNamespace', 'id'] on offline_queue and worker_reports.
 * - Single authoritative telemetry read cache remains memory/sessionStorage.
 * - Strict environment (PROD vs DEV) and authenticated user isolation.
 * - Sensitive credentials (tokens, secrets, passwords) are NEVER persisted.
 */

export const STORAGE_SCHEMA_VERSION = 3;

export type StorageEnvironment = 'PROD' | 'DEV';

export const STORE_NAMES = {
  QUEUE: 'offline_queue',
  REPORTS: 'worker_reports',
  METADATA: 'storage_metadata'
} as const;

export interface PersistedRecord<T> {
  userNamespace: string; // Stable authenticated userId, 'unauthenticated', or 'unauthenticated-legacy'
  id: string;            // Record ID
  environment: StorageEnvironment;
  schemaVersion: number;
  data: T;
  createdAt: number;
  updatedAt: number;
}

export interface StorageMetadataRecord {
  key: string;
  value: unknown;
  environment?: StorageEnvironment;
  schemaVersion?: number;
  updatedAt: number;
}

/**
 * Constructs the canonical storage namespace for the given user and environment.
 * Format: CHIEF:{ENV}:{USER_ID}:v{SCHEMA_VERSION}
 */
export function buildStorageNamespace(
  environment: StorageEnvironment,
  userId: string | null,
  schemaVersion: number = STORAGE_SCHEMA_VERSION
): string {
  const safeUserId = userId && userId.trim().length > 0 ? userId.trim() : 'unauthenticated';
  return `CHIEF:${environment}:${safeUserId}:v${schemaVersion}`;
}

/**
 * Stable physical database name per environment.
 * NEVER embed the schema version in the physical database name.
 */
export function getDatabaseName(environment: StorageEnvironment): string {
  return `chief_storage_${environment.toLowerCase()}`;
}
