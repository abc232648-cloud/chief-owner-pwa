import { ISystemContract, ApiResponse, ChiefApiError } from '../types';
import { ChiefApiClient } from '../client';
import { wrapIsolatedMock, ISOLATED_SYSTEM_MOCK } from '../mock/isolatedDevMocks';
import { ChiefState, StatusMessageOption, SystemMetrics } from '../../types/chief';
import { isChiefDevMode } from '../../config/devMode';
import { getLiveCache, setLiveCache } from '../cache/readCache';

interface ChiefOverview {
  agents: Array<{ enabled?: number | boolean; running?: number | boolean }>;
  counts: { actions: number; notifications: number };
  worker_connected: boolean;
  service_started_at: number | null;
}

function projectStatus(data: ChiefOverview): {
  platform_state: ChiefState['platform_state'];
  status_message: StatusMessageOption;
  metrics: SystemMetrics;
} {
  return {
    platform_state: 'Unknown',
    status_message: data.worker_connected ? 'System state observed' : 'Attention required',
    metrics: {
      backend: 'Online',
      policy_engine: 'Unknown',
      sync: 'Current',
      agents_active: data.agents.filter(agent => Boolean(agent.enabled) && Boolean(agent.running)).length,
      uptime: 'Not reported',
      healthScore: null,
      lastSyncTimestamp: 'Not reported'
    }
  };
}

export class SystemApiAdapter implements ISystemContract {
  constructor(private client: ChiefApiClient) {}

  public async getStatus(signal?: AbortSignal): Promise<ApiResponse<{
    platform_state: ChiefState['platform_state'];
    status_message: StatusMessageOption;
    metrics: SystemMetrics;
  }>> {
    try {
      const res = await this.client.get<ChiefOverview>('/api/ui/overview', { signal });
      const data = projectStatus(res.data);
      setLiveCache('system_status', data, res.correlationId);
      return { ...res, data, provenance: 'live' };
    } catch (err) {
      if (err instanceof ChiefApiError && (err.statusCode === 401 || err.statusCode === 403)) throw err;
      if (isChiefDevMode()) return wrapIsolatedMock(ISOLATED_SYSTEM_MOCK, '/api/ui/overview');
      const cached = getLiveCache<{
        platform_state: ChiefState['platform_state'];
        status_message: StatusMessageOption;
        metrics: SystemMetrics;
      }>('system_status');
      if (cached) {
        return {
          data: cached.data,
          status: 200,
          headers: new Headers({ 'X-Chief-Provenance': 'cached' }),
          correlationId: cached.correlationId,
          isCached: true,
          fetchedAt: cached.cachedAt,
          provenance: 'cached'
        };
      }
      throw new ChiefApiError({
        code: 'SYSTEM_UNAVAILABLE',
        message: 'Chief system status is currently unavailable from backend.',
        isNetworkError: true
      });
    }
  }

  public async getHealthCheck(signal?: AbortSignal): Promise<ApiResponse<{
    healthy: boolean;
    invariantsPassed: boolean;
    latencyMs: number;
    status: 'healthy' | 'degraded' | 'unavailable';
    label: string;
  }>> {
    try {
      const res = await this.client.get<ChiefOverview>('/api/ui/overview', { signal });
      return {
        ...res,
        data: {
          healthy: false,
          invariantsPassed: false,
          latencyMs: -1,
          status: 'unavailable',
          label: res.data.worker_connected
            ? 'Worker connected; full Chief health is not exposed by this presentation contract'
            : 'Worker connection not observed; full Chief health is unavailable'
        },
        provenance: 'live'
      };
    } catch (err) {
      if (err instanceof ChiefApiError && (err.statusCode === 401 || err.statusCode === 403)) throw err;
      if (isChiefDevMode()) {
        return wrapIsolatedMock({
          healthy: true,
          invariantsPassed: true,
          latencyMs: 14,
          status: 'healthy',
          label: 'SIMULATED HEALTH — NOT CHIEF HEALTH'
        }, '/api/ui/overview');
      }
      return {
        data: {
          healthy: false,
          invariantsPassed: false,
          latencyMs: -1,
          status: 'unavailable',
          label: 'Chief Health Unavailable'
        },
        status: 503,
        headers: new Headers(),
        correlationId: 'err_health_unavailable',
        isCached: false,
        fetchedAt: Date.now(),
        provenance: 'unavailable'
      };
    }
  }
}
