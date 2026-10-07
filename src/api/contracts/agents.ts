import { IAgentsContract, ApiResponse, ChiefApiError } from '../types';
import { ChiefApiClient } from '../client';
import { wrapIsolatedMock, ISOLATED_AGENTS_MOCK } from '../mock/isolatedDevMocks';
import { AgentState } from '../../types/chief';
import { isChiefDevMode } from '../../config/devMode';
import { getLiveCache, setLiveCache } from '../cache/readCache';

export class AgentsApiAdapter implements IAgentsContract {
  constructor(private client: ChiefApiClient) {}

  public async getAgents(signal?: AbortSignal): Promise<ApiResponse<AgentState[]>> {
    try {
      const res = await this.client.get<AgentState[]>('/agents', { signal });
      setLiveCache('agents_list', res.data, res.correlationId);
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
        return wrapIsolatedMock(ISOLATED_AGENTS_MOCK, '/agents');
      }

      // 3. Production mode: Check legitimate cache
      const cached = getLiveCache<AgentState[]>('agents_list');
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

      // 4. Production mode: Never silently substitute synthetic records
      throw new ChiefApiError({
        code: 'AGENTS_UNAVAILABLE',
        message: 'Chief agent domain data is currently unavailable from backend.',
        isNetworkError: true
      });
    }
  }

  public async getAgentDetail(agentId: string, signal?: AbortSignal): Promise<ApiResponse<AgentState>> {
    try {
      const res = await this.client.get<AgentState>(`/agents/${agentId}`, { signal });
      setLiveCache(`agent_${agentId}`, res.data, res.correlationId);
      return {
        ...res,
        provenance: 'live'
      };
    } catch (err) {
      if (err instanceof ChiefApiError && (err.statusCode === 401 || err.statusCode === 403)) {
        throw err;
      }

      if (isChiefDevMode()) {
        const found = ISOLATED_AGENTS_MOCK.find(a => a.agent_id === agentId) || ISOLATED_AGENTS_MOCK[0];
        return wrapIsolatedMock(found, `/agents/${agentId}`);
      }

      const cached = getLiveCache<AgentState>(`agent_${agentId}`);
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
        code: 'AGENT_DETAIL_UNAVAILABLE',
        message: `Agent ${agentId} is currently unavailable from backend.`,
        isNetworkError: true
      });
    }
  }
}
