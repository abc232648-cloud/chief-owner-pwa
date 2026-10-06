import { IAgentsContract, ApiResponse, ChiefApiError } from '../types';
import { ChiefApiClient } from '../client';
import { wrapIsolatedMock, ISOLATED_AGENTS_MOCK } from '../mock/isolatedDevMocks';
import { AgentState } from '../../types/chief';

export class AgentsApiAdapter implements IAgentsContract {
  constructor(private client: ChiefApiClient) {}

  public async getAgents(signal?: AbortSignal): Promise<ApiResponse<AgentState[]>> {
    try {
      return await this.client.get('/agents', { signal });
    } catch (err) {
      if (err instanceof ChiefApiError && (err.isNetworkError || err.statusCode === 404)) {
        return wrapIsolatedMock(ISOLATED_AGENTS_MOCK, '/agents');
      }
      throw err;
    }
  }

  public async getAgentDetail(agentId: string, signal?: AbortSignal): Promise<ApiResponse<AgentState>> {
    try {
      return await this.client.get(`/agents/${agentId}`, { signal });
    } catch (err) {
      if (err instanceof ChiefApiError && (err.isNetworkError || err.statusCode === 404)) {
        const found = ISOLATED_AGENTS_MOCK.find(a => a.agent_id === agentId) || ISOLATED_AGENTS_MOCK[0];
        return wrapIsolatedMock(found, `/agents/${agentId}`);
      }
      throw err;
    }
  }
}
