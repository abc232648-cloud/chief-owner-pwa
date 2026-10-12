import { IAttentionContract, ApiResponse, ChiefApiError } from '../types';
import { ChiefApiClient } from '../client';
import { wrapIsolatedMock, ISOLATED_ATTENTION_MOCK } from '../mock/isolatedDevMocks';
import { AttentionItem } from '../../types/chief';
import { isChiefDevMode } from '../../config/devMode';
import { getLiveCache, setLiveCache } from '../cache/readCache';

interface NotificationFeedItem {
  event_id: string;
  source_agent: string;
  event_type: string;
  severity: string;
  title: string;
  body: string;
  created_at: string;
  authority: string;
}

interface NotificationFeed {
  items: NotificationFeedItem[];
  availability: string;
  notice: string;
}

function projectLevel(item: NotificationFeedItem): AttentionItem['level'] {
  if (item.event_type.toLowerCase().includes('stop')) return 'STOP';
  if (item.severity === 'ACTION_REQUIRED') return 'ASK';
  if (item.severity === 'URGENT') return 'Warning';
  return 'Information';
}

function projectItem(item: NotificationFeedItem): AttentionItem {
  const level = projectLevel(item);
  const color: AttentionItem['color'] =
    level === 'STOP' ? 'red' :
    level === 'ASK' ? 'orange' :
    level === 'Warning' ? 'amber' : 'blue';

  return {
    id: item.event_id,
    level,
    title: item.title,
    source: item.source_agent,
    sourceAgent: item.source_agent,
    timestamp: item.created_at,
    description: item.body,
    explanation: item.body,
    color,
    currentAuthorityState: item.authority || 'PRESENTATION_ONLY',
    status: 'pending',
    actionable: false,
    policyNote: 'Presentation-only notification. Use the linked domain workspace for any authorized action.'
  };
}

export class AttentionApiAdapter implements IAttentionContract {
  constructor(private client: ChiefApiClient) {}

  public async getItems(signal?: AbortSignal): Promise<ApiResponse<AttentionItem[]>> {
    try {
      const res = await this.client.get<NotificationFeed>('/api/device-notifications/owner/feed', { signal });
      const data = res.data.items.map(projectItem);
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
        message: 'Chief attention feed is currently unavailable from backend.',
        isNetworkError: true
      });
    }
  }

  public async approve(id: string, _signal?: AbortSignal): Promise<ApiResponse<{ approved: boolean; recordId: string }>> {
    throw new ChiefApiError({
      code: 'ATTENTION_ACTION_UNAVAILABLE',
      message: `Notification ${id} is presentation-only; approval must use its domain-owned action surface.`,
      origin: 'client'
    });
  }

  public async reject(id: string, _signal?: AbortSignal): Promise<ApiResponse<{ rejected: boolean; recordId: string }>> {
    throw new ChiefApiError({
      code: 'ATTENTION_ACTION_UNAVAILABLE',
      message: `Notification ${id} is presentation-only; rejection must use its domain-owned action surface.`,
      origin: 'client'
    });
  }

  public async acknowledgeStop(id: string, _signal?: AbortSignal): Promise<ApiResponse<{ ticketId: string; acknowledged: boolean }>> {
    throw new ChiefApiError({
      code: 'ATTENTION_ACTION_UNAVAILABLE',
      message: `Notification ${id} is presentation-only; STOP handling must use its domain-owned action surface.`,
      origin: 'client'
    });
  }
}
