import { IAgentsContract, ApiResponse, ChiefApiError } from '../types';
import { ChiefApiClient } from '../client';
import { wrapIsolatedMock, ISOLATED_AGENTS_MOCK } from '../mock/isolatedDevMocks';
import { AgentState } from '../../types/chief';
import { isChiefDevMode } from '../../config/devMode';
import { getLiveCache, setLiveCache } from '../cache/readCache';

interface ChiefOverviewAgent {
  id: string;
  label: string;
  description: string;
  enabled?: number | boolean;
  running?: number | boolean;
  status: string;
  last_activity?: number | null;
  current_task?: string | null;
  working_seconds?: number;
  recent_activity?: Array<{ task?: string; outcome?: string }>;
}

interface ChiefOverview {
  agents: ChiefOverviewAgent[];
}

function ownerAgentId(domain: string): string {
  if (domain === 'jobs') return 'job_agent';
  if (domain === 'farming') return 'farm_agent';
  return domain + '_agent';
}

function ownerStatus(status: string): AgentState['status'] {
  if (status === 'WORKING') return 'ACTIVE';
  if (status === 'WORKER_NOT_CONNECTED') return 'OFFLINE';
  if (status === 'IDLE' || status === 'PAUSED' || status === 'DISABLED') return status;
  return 'ATTENTION';
}

function projectAgent(agent: ChiefOverviewAgent): AgentState {
  const last = agent.recent_activity?.[0];
  const timestamp = typeof agent.last_activity === 'number'
    ? new Date(agent.last_activity * 1000).toISOString()
    : '';
  const summary = agent.current_task
    ? 'Current task: ' + agent.current_task
    : last?.task
      ? 'Last run: ' + last.task + (last.outcome ? ' (' + last.outcome + ')' : '')
      : 'Recorded Chief agent activity';

  return {
    agent_id: ownerAgentId(agent.id),
    label: agent.label,
    domain: agent.id,
    status: ownerStatus(agent.status),
    metrics: [
      { label: 'Enabled', value: Boolean(agent.enabled) ? 'Yes' : 'No' },
      { label: 'Running', value: Boolean(agent.running) ? 'Yes' : 'No' },
      { label: 'Recorded work', value: agent.working_seconds ?? 0, unit: 's' }
    ],
    lastActivity: timestamp ? { summary, timestamp } : undefined,
    lastHeartbeat: 'Not reported',
    activeWorkflows: null,
    description: agent.description,
    summary: agent.description
  };
}

export class AgentsApiAdapter implements IAgentsContract {
  constructor(private client: ChiefApiClient) {}

  public async getAgents(signal?: AbortSignal): Promise<ApiResponse<AgentState[]>> {
    try {
      const res = await this.client.get<ChiefOverview>('/api/ui/overview', { signal });
      const data = res.data.agents.map(projectAgent);
      setLiveCache('agents_list', data, res.correlationId);
      return { ...res, data, provenance: 'live' };
    } catch (err) {
      if (err instanceof ChiefApiError && (err.statusCode === 401 || err.statusCode === 403)) throw err;
      if (isChiefDevMode()) return wrapIsolatedMock(ISOLATED_AGENTS_MOCK, '/api/ui/overview');
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
      throw new ChiefApiError({
        code: 'AGENTS_UNAVAILABLE',
        message: 'Chief agent domain data is currently unavailable from backend.',
        isNetworkError: true
      });
    }
  }

  public async getAgentDetail(agentId: string, signal?: AbortSignal): Promise<ApiResponse<AgentState>> {
    const result = await this.getAgents(signal);
    const found = result.data.find(agent => agent.agent_id === agentId);
    if (!found) {
      throw new ChiefApiError({
        code: 'AGENT_DETAIL_UNAVAILABLE',
        message: 'Requested agent is not present in the authorized Chief overview.'
      });
    }
    setLiveCache('agent_' + agentId, found, result.correlationId);
    return { ...result, data: found };
  }
}
