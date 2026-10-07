import { IAttentionContract, ApiResponse, ChiefApiError } from '../types';
import { ChiefApiClient } from '../client';
import { wrapIsolatedMock, ISOLATED_ATTENTION_MOCK } from '../mock/isolatedDevMocks';
import { AttentionItem } from '../../types/chief';
import { isChiefDevMode } from '../../config/devMode';
import { getLiveCache, setLiveCache } from '../cache/readCache';

export class AttentionApiAdapter implements IAttentionContract {
  constructor(private client: ChiefApiClient) {}

  public async getItems(signal?: AbortSignal): Promise<ApiResponse<AttentionItem[]>> {
    try {
      const res = await this.client.get<AttentionItem[]>('/attention', { signal });
      setLiveCache('attention_items', res.data, res.correlationId);
      return {
        ...res,
        provenance: 'live'
      };
    } catch (err) {
      // 1. Auth failures (401, 403) must NEVER serve previous-session cache (fail closed)
      if (err instanceof ChiefApiError && (err.statusCode === 401 || err.statusCode === 403)) {
        throw err;
      }

      // 2. DEV mode allows isolated development mocks
      if (isChiefDevMode()) {
        return wrapIsolatedMock(ISOLATED_ATTENTION_MOCK, '/attention');
      }

      // 3. Production mode: Check legitimate cache
      const cached = getLiveCache<AttentionItem[]>('attention_items');
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

      // 4. Production mode: Never silently substitute synthetic mock items
      throw new ChiefApiError({
        code: 'ATTENTION_UNAVAILABLE',
        message: 'Chief attention inbox is currently unavailable from backend.',
        isNetworkError: true
      });
    }
  }

  public async approve(id: string, signal?: AbortSignal): Promise<ApiResponse<{ approved: boolean; recordId: string }>> {
    // Fail-closed: Must NEVER fall back to fabricated successful mock response
    return await this.client.post(`/attention/${id}/approve`, {}, { signal });
  }

  public async reject(id: string, signal?: AbortSignal): Promise<ApiResponse<{ rejected: boolean; recordId: string }>> {
    // Fail-closed: Must NEVER fall back to fabricated successful mock response
    return await this.client.post(`/attention/${id}/reject`, {}, { signal });
  }

  public async acknowledgeStop(id: string, signal?: AbortSignal): Promise<ApiResponse<{ ticketId: string; acknowledged: boolean }>> {
    // Fail-closed: Must NEVER fall back to fabricated successful mock response
    return await this.client.post(`/attention/${id}/acknowledge-stop`, {}, { signal });
  }
}
