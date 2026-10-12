import { IActivityContract, ApiResponse, ChiefApiError } from '../types';
import { ChiefApiClient } from '../client';
import { wrapIsolatedMock, ISOLATED_ACTIVITY_MOCK } from '../mock/isolatedDevMocks';
import { ActivityEvent } from '../../types/chief';
import { isChiefDevMode } from '../../config/devMode';
import { getLiveCache, setLiveCache } from '../cache/readCache';

interface AuditProjection {
  id: string;
  event_time: string;
  category: string;
  actor: string;
  action: string;
  status: string;
}

interface AuditFeed {
  items: AuditProjection[];
  availability: string;
  notice: string;
}

function projectEvent(item: AuditProjection): ActivityEvent {
  const normalized = item.status.toUpperCase();
  const severity: ActivityEvent['severity'] =
    normalized.includes('FAIL') || normalized.includes('ERROR')
      ? 'failure'
      : normalized.includes('DENIED') || normalized.includes('REJECT')
        ? 'warning'
        : 'nominal';
  const eventType: ActivityEvent['eventType'] =
    severity === 'failure'
      ? 'failure'
      : item.category.toLowerCase().includes('application')
        ? 'application'
        : undefined;

  return {
    id: 'audit-' + item.id,
    time: item.event_time,
    timestampFull: item.event_time,
    isoTimestamp: item.event_time,
    event: item.action,
    eventType,
    agent: item.category,
    severity,
    actor: item.actor || undefined,
    source: item.category
  };
}

function matchesQuery(item: ActivityEvent, query: string): boolean {
  const q = query.toLowerCase();
  return item.event.toLowerCase().includes(q) ||
    Boolean(item.hash?.toLowerCase().includes(q)) ||
    Boolean(item.actor?.toLowerCase().includes(q)) ||
    Boolean(item.source?.toLowerCase().includes(q));
}

export class ActivityApiAdapter implements IActivityContract {
  constructor(private client: ChiefApiClient) {}

  public async getActivityLog(
    filter?: { agent?: string; query?: string },
    signal?: AbortSignal
  ): Promise<ApiResponse<ActivityEvent[]>> {
    try {
      const res = await this.client.get<AuditFeed>('/api/ui/activity', { signal });
      let results = res.data.items.map(projectEvent);

      if (filter?.agent && filter.agent !== 'All') {
        results = results.filter(item => item.agent === filter.agent);
      }
      if (filter?.query) {
        results = results.filter(item => matchesQuery(item, filter.query!));
      }

      if (!filter?.agent && !filter?.query) {
        setLiveCache('activity_log', results, res.correlationId);
      }
      return { ...res, data: results, provenance: 'live' };
    } catch (err) {
      if (err instanceof ChiefApiError && (err.statusCode === 401 || err.statusCode === 403)) throw err;

      if (isChiefDevMode()) {
        let results = [...ISOLATED_ACTIVITY_MOCK];
        if (filter?.agent && filter.agent !== 'All') {
          results = results.filter(a => a.agent === filter.agent);
        }
        if (filter?.query) {
          results = results.filter(a => matchesQuery(a, filter.query!));
        }
        return wrapIsolatedMock(results, '/api/ui/activity');
      }

      const cached = getLiveCache<ActivityEvent[]>('activity_log');
      if (cached) {
        let results = [...cached.data];
        if (filter?.agent && filter.agent !== 'All') {
          results = results.filter(a => a.agent === filter.agent);
        }
        if (filter?.query) {
          results = results.filter(a => matchesQuery(a, filter.query!));
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

      throw new ChiefApiError({
        code: 'ACTIVITY_UNAVAILABLE',
        message: 'Chief activity logs are currently unavailable from backend.',
        isNetworkError: true
      });
    }
  }
}
