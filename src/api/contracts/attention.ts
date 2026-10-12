import { IAttentionContract, ApiResponse, ChiefApiError } from '../types';
import { ChiefApiClient } from '../client';
import { wrapIsolatedMock, ISOLATED_ATTENTION_MOCK } from '../mock/isolatedDevMocks';
import { AttentionItem } from '../../types/chief';
import { isChiefDevMode } from '../../config/devMode';
import { getLiveCache, setLiveCache } from '../cache/readCache';

interface NotificationFeed {
  items: unknown[];
  availability: string;
  notice: string;
}

export class AttentionApiAdapter implements IAttentionContract {
  constructor(private client: ChiefApiClient) {}

  public async getItems(signal?: AbortSignal): Promise<ApiResponse<AttentionItem[]>> {
    try {
      const res = await this.client.get<NotificationFeed>('/api/device-notifications/owner/feed', { signal });
      // Device notifications are presentation-only. Do not convert them into
      // generic approval/STOP objects: those actions remain domain-owned.
      const data: AttentionItem[] = [];
      setLiveCache('attention_items', data, res.correlationId);
      return {
        ...res,
        data,
        provenance: 'live'
      };
    } catch (err) {
      if (err instanceof ChiefApiError && (err.statusCode === 401 || err.statusCode === 403)) {
        throw err;
      }

      if (isChiefDevMode()) {
        return wrapIsolatedMock(ISOLATED_ATTENTION_MOCK, '/api/device-notifications/owner/feed');
      }

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

      throw new ChiefApiError({
        code: 'ATTENTION_UNAVAILABLE',
        message: 'No generic actionable attention contract is available from Chief.',
        isNetworkError: true
      });
    }
  }

  public async approve(id: string, _signal?: AbortSignal): Promise<ApiResponse<{ approved: boolean; recordId: string }>> {
    throw new ChiefApiError({
      code: 'ATTENTION_ACTION_UNAVAILABLE',
      message: `Attention record ${id} has no generic approval authority; use its domain-owned action surface.`,
      origin: 'client'
    });
  }

  public async reject(id: string, _signal?: AbortSignal): Promise<ApiResponse<{ rejected: boolean; recordId: string }>> {
    throw new ChiefApiError({
      code: 'ATTENTION_ACTION_UNAVAILABLE',
      message: `Attention record ${id} has no generic rejection authority; use its domain-owned action surface.`,
      origin: 'client'
    });
  }

  public async acknowledgeStop(id: string, _signal?: AbortSignal): Promise<ApiResponse<{ ticketId: string; acknowledged: boolean }>> {
    throw new ChiefApiError({
      code: 'ATTENTION_ACTION_UNAVAILABLE',
      message: `Attention record ${id} has no generic STOP authority; use its domain-owned action surface.`,
      origin: 'client'
    });
  }
}
