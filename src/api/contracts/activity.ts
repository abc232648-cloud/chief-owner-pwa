import { IActivityContract, ApiResponse, ChiefApiError } from '../types';
import { ChiefApiClient } from '../client';
import { wrapIsolatedMock, ISOLATED_ACTIVITY_MOCK } from '../mock/isolatedDevMocks';
import { ActivityEvent } from '../../types/chief';
import { isChiefDevMode } from '../../config/devMode';
import { getLiveCache, setLiveCache } from '../cache/readCache';

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
      const res = await this.client.get<ActivityEvent[]>(`/activity${queryString}`, { signal });
      // If unfiltered, save full baseline cache
      if (!filter?.agent && !filter?.query) {
        setLiveCache('activity_log', res.data, res.correlationId);
      }
      return {
        ...res,
        provenance: 'live'
      };
    } catch (err) {
      // 1. DEV mode allows isolated development mocks
      if (isChiefDevMode()) {
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

      // 2. Production mode: Check legitimate cache
      const cached = getLiveCache<ActivityEvent[]>('activity_log');
      if (cached) {
        let results = [...cached.data];
        if (filter?.agent && filter.agent !== 'All') {
          results = results.filter(a => a.agent === filter.agent);
        }
        if (filter?.query) {
          const q = filter.query.toLowerCase();
          results = results.filter(a => a.event.toLowerCase().includes(q) || a.hash.toLowerCase().includes(q));
        }
        return {
          data: results,
          status: 200,
          headers: new Headers({ 'X-Chief-Provenance': 'cached' }),
          correlationId: cached.correlationId,
          isCached: true,
          fetchedAt: cached.cachedAt,
          provenance: 'cached'
        };
      }

      // 3. Production mode: Never silently substitute synthetic mock events
      throw new ChiefApiError({
        code: 'ACTIVITY_UNAVAILABLE',
        message: 'Chief activity logs are currently unavailable from backend.',
        isNetworkError: true
      });
    }
  }
}
