import { 
  ChiefState, 
  AttentionItem, 
  AgentState, 
  ActivityEvent, 
  SystemMetrics, 
  StatusMessageOption 
} from '../types/chief';

export type DataProvenance = 'live' | 'cached' | 'mock_isolated' | 'unavailable';

export interface ApiClientConfig {
  baseUrl: string;
  timeoutMs: number;
  getAuthTokenRef?: () => string | null;
  defaultHeaders?: Record<string, string>;
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  correlationId?: string;
  signal?: AbortSignal;
  skipAuth?: boolean;
  isIdempotent?: boolean; // Only idempotent requests (e.g. GET) may be safely retried
  maxRetries?: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
  correlationId: string;
  isCached: boolean;
  fetchedAt: number; // Unix timestamp
  provenance: DataProvenance;
}

export class ChiefApiError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly correlationId?: string;
  public readonly isNetworkError: boolean;
  public readonly isTimeout: boolean;
  public readonly isAborted: boolean;
  public readonly details?: unknown;

  constructor(params: {
    message: string;
    code: string;
    statusCode?: number;
    correlationId?: string;
    isNetworkError?: boolean;
    isTimeout?: boolean;
    isAborted?: boolean;
    details?: unknown;
  }) {
    super(params.message);
    this.name = 'ChiefApiError';
    this.code = params.code;
    this.statusCode = params.statusCode;
    this.correlationId = params.correlationId;
    this.isNetworkError = Boolean(params.isNetworkError);
    this.isTimeout = Boolean(params.isTimeout);
    this.isAborted = Boolean(params.isAborted);
    this.details = params.details;
  }
}

// ==========================================
// API Resource Contracts (Expected Backend Endpoints)
// ==========================================

export interface ISystemContract {
  getStatus(signal?: AbortSignal): Promise<ApiResponse<{
    platform_state: ChiefState['platform_state'];
    status_message: StatusMessageOption;
    metrics: SystemMetrics;
  }>>;
  getHealthCheck(signal?: AbortSignal): Promise<ApiResponse<{
    healthy: boolean;
    invariantsPassed: boolean;
    latencyMs: number;
  }>>;
}

export interface IAgentsContract {
  getAgents(signal?: AbortSignal): Promise<ApiResponse<AgentState[]>>;
  getAgentDetail(agentId: string, signal?: AbortSignal): Promise<ApiResponse<AgentState>>;
}

export interface IAttentionContract {
  getItems(signal?: AbortSignal): Promise<ApiResponse<AttentionItem[]>>;
  approve(id: string, signal?: AbortSignal): Promise<ApiResponse<{ approved: boolean; recordId: string }>>;
  reject(id: string, signal?: AbortSignal): Promise<ApiResponse<{ rejected: boolean; recordId: string }>>;
  acknowledgeStop(id: string, signal?: AbortSignal): Promise<ApiResponse<{ ticketId: string; acknowledged: boolean }>>;
}

export interface IActivityContract {
  getActivityLog(filter?: { agent?: string; query?: string }, signal?: AbortSignal): Promise<ApiResponse<ActivityEvent[]>>;
}
