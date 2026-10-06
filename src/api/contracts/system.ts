import { ISystemContract, ApiResponse, ChiefApiError } from '../types';
import { ChiefApiClient } from '../client';
import { wrapIsolatedMock, ISOLATED_SYSTEM_MOCK } from '../mock/isolatedDevMocks';
import { ChiefState, StatusMessageOption, SystemMetrics } from '../../types/chief';
import { isChiefDevMode } from '../../config/devMode';
import { getLiveCache, setLiveCache } from '../cache/readCache';

export class SystemApiAdapter implements ISystemContract {
  constructor(private client: ChiefApiClient) {}

  public async getStatus(signal?: AbortSignal): Promise<ApiResponse<{
    platform_state: ChiefState['platform_state'];
    status_message: StatusMessageOption;
    metrics: SystemMetrics;
  }>> {
    try {
      const res = await this.client.get<{
        platform_state: ChiefState['platform_state'];
        status_message: StatusMessageOption;
        metrics: SystemMetrics;
      }>('/system/status', { signal });

      // Cache genuine live response
      setLiveCache('system_status', res.data, res.correlationId);

      return {
        ...res,
        provenance: 'live'
      };
    } catch (err) {
      // 1. DEV mode allows isolated development mocks clearly tagged
      if (isChiefDevMode()) {
        return wrapIsolatedMock(ISOLATED_SYSTEM_MOCK, '/system/status');
      }

      // 2. Production mode: Check legitimate cache
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

      // 3. Production mode: Never silently substitute synthetic mock data
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
      const res = await this.client.get<{
        healthy: boolean;
        invariantsPassed: boolean;
        latencyMs: number;
        status?: 'healthy' | 'degraded' | 'unavailable';
      }>('/system/health', { signal });

      const isHealthy = res.data?.healthy === true;
      const invariants = res.data?.invariantsPassed === true;

      return {
        ...res,
        data: {
          healthy: isHealthy,
          invariantsPassed: invariants,
          latencyMs: res.data?.latencyMs ?? 0,
          status: isHealthy && invariants ? 'healthy' : 'degraded',
          label: isHealthy ? 'Chief Health Verified' : 'Chief Health Degraded'
        },
        provenance: 'live'
      };
    } catch (err) {
      // DEV mode only: Simulated health clearly labeled
      if (isChiefDevMode()) {
        return wrapIsolatedMock({
          healthy: true,
          invariantsPassed: true,
          latencyMs: 14,
          status: 'healthy',
          label: 'SIMULATED HEALTH — NOT CHIEF HEALTH'
        }, '/system/health');
      }

      // Production mode: Failed health check MUST NEVER become healthy or invariantsPassed: true
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
