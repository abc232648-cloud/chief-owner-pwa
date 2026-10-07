/**
 * CHIEF Client Storage Schema & Namespace Definitions
 * 
 * BATCH 13C.2A IMMUTABLE SPECIFICATION:
 * - Versioned, client-authoritative schema definitions.
 * - Strict environment (PROD vs DEV) and authenticated user isolation.
 * - Sensitive credentials (tokens, secrets, passwords) are NEVER persisted.
 */

export const STORAGE_SCHEMA_VERSION = 1;

export type StorageEnvironment = 'PROD' | 'DEV';

export const STORE_NAMES = {
  QUEUE: 'offline_queue',
  REPORTS: 'worker_reports',
  TELEMETRY_CACHE: 'telemetry_cache',
  METADATA: 'storage_metadata'
} as const;

export interface PersistedRecord<T> {
  id: string;
  userNamespace: string; // Stable authenticated userId or 'anonymous'
  environment: StorageEnvironment;
  schemaVersion: number;
  data: T;
  createdAt: number;
  updatedAt: number;
}

export interface TelemetryCacheRecord<T = unknown> {
  resourceKey: string;
  userNamespace: string;
  environment: StorageEnvironment;
  cachedAt: number;
  originalFetchAt: number;
  provenance: 'CHIEF_API_LIVE' | 'SESSION_CACHE';
  stalenessThresholdMs: number;
  correlationId: string;
  schemaVersion: number;
  data: T;
}

export interface StorageMetadataRecord {
  key: string;
  value: unknown;
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

export function getDatabaseName(environment: StorageEnvironment): string {
  return `chief_storage_${environment.toLowerCase()}_v${STORAGE_SCHEMA_VERSION}`;
}
