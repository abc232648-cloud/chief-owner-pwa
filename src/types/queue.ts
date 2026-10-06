export type QueueItemActionType = 
  | 'SUBMIT_WORKER_REPORT'
  | 'LOG_FLOCK_OBSERVATION'
  | 'LOG_EQUIPMENT_NOTE'
  | 'SIGN_OFF_FIELD_TASK'
  | 'ACKNOWLEDGE_INFO_NOTICE';

export type QueueItemStatus = 
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'failed_transient'
  | 'failed_permanent'
  | 'rejected_permanent'
  | 'conflict'
  | 'unsupported';

export interface ConflictDetails {
  serverRecordId: string;
  serverStateDescription: string;
  localStateDescription: string;
  detectedAt: string;
  resolutionOptions: ('use_local' | 'accept_server' | 'merge_review')[];
}

export interface QueueItem {
  id: string;
  actionType: QueueItemActionType;
  title: string;
  domain: 'Farm Agent' | 'Job Agent' | 'Chief Central';
  createdAt: string; // ISO string
  timestampFormatted: string;
  status: QueueItemStatus;
  retryCount: number;
  maxRetries: number;
  lastFailure?: string;
  requiresUserIntervention: boolean;
  policyPermitted: boolean;
  payload: Record<string, any>;
  conflictDetails?: ConflictDetails;
  confirmedAt?: string;
  confirmationHash?: string;
  workerAttribution?: {
    userId: string;
    userName: string;
    role: string;
  };
}

export interface CachedDataSource {
  key: string;
  label: string;
  domain: string;
  cachedAtTimestamp: number;
  lastSyncFormatted: string;
  isStale: boolean;
  staleAfterMs: number;
}
