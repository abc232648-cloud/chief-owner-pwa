import { IActivityContract, ApiResponse, ChiefApiError } from '../types';
import { ChiefApiClient } from '../client';
import { wrapIsolatedMock, ISOLATED_ACTIVITY_MOCK } from '../mock/isolatedDevMocks';
import { ActivityEvent } from '../../types/chief';

export class ActivityApiAdapter implements IActivityContract {
  constructor(private client: ChiefApiClient) {}

  public async getActivityLog(
    filter?: { agent?: string; query?: string },
    signal?: AbortSignal
  ): Promise<ApiResponse<ActivityEvent[]>> {
    const params = new URLSearchParams();
    if (filter?.agent && filter.agent !== 'All') params.set('agent', filter.agent);
    if (filter?.query) params.set('q', filter.query);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    try {
      return await this.client.get(`/activity${queryString}`, { signal });
    } catch (err) {
      if (err instanceof ChiefApiError && (err.isNetworkError || err.statusCode === 404)) {
        let results = [...ISOLATED_ACTIVITY_MOCK];
        if (filter?.agent && filter.agent !== 'All') {
          results = results.filter(a => a.agent === filter.agent);
        }
        if (filter?.query) {
          const q = filter.query.toLowerCase();
          results = results.filter(a => a.event.toLowerCase().includes(q) || a.hash.toLowerCase().includes(q));
        }
        return wrapIsolatedMock(results, `/activity${queryString}`);
      }
      throw err;
    }
  }
}
