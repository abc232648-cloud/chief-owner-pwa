import { ISystemContract, ApiResponse, ChiefApiError } from '../types';
import { ChiefApiClient } from '../client';
import { wrapIsolatedMock, ISOLATED_SYSTEM_MOCK } from '../mock/isolatedDevMocks';
import { ChiefState, StatusMessageOption, SystemMetrics } from '../../types/chief';

export class SystemApiAdapter implements ISystemContract {
  constructor(private client: ChiefApiClient) {}

  public async getStatus(signal?: AbortSignal): Promise<ApiResponse<{
    platform_state: ChiefState['platform_state'];
    status_message: StatusMessageOption;
    metrics: SystemMetrics;
  }>> {
    try {
      return await this.client.get('/system/status', { signal });
    } catch (err) {
      if (err instanceof ChiefApiError && (err.isNetworkError || err.statusCode === 404)) {
        return wrapIsolatedMock(ISOLATED_SYSTEM_MOCK, '/system/status');
      }
      throw err;
    }
  }

  public async getHealthCheck(signal?: AbortSignal): Promise<ApiResponse<{
    healthy: boolean;
    invariantsPassed: boolean;
    latencyMs: number;
  }>> {
    try {
      return await this.client.get('/system/health', { signal });
    } catch (err) {
      if (err instanceof ChiefApiError && (err.isNetworkError || err.statusCode === 404)) {
        return wrapIsolatedMock({
          healthy: true,
          invariantsPassed: true,
          latencyMs: 14
        }, '/system/health');
      }
      throw err;
    }
  }
}
