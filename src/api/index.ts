import { ChiefApiClient } from './client';
import { SystemApiAdapter } from './contracts/system';
import { AgentsApiAdapter } from './contracts/agents';
import { AttentionApiAdapter } from './contracts/attention';
import { ActivityApiAdapter } from './contracts/activity';
import { FarmApiAdapter } from './contracts/farm';

export * from './types';
export { ChiefApiClient } from './client';
export { ISOLATED_MOCK_TAG } from './mock/isolatedDevMocks';

// Single controlled instance of Chief API Client
export const chiefApiClient = new ChiefApiClient();

// Resource Adapters adhering to expected backend contracts
export const systemApi = new SystemApiAdapter(chiefApiClient);
export const agentsApi = new AgentsApiAdapter(chiefApiClient);
export const attentionApi = new AttentionApiAdapter(chiefApiClient);
export const activityApi = new ActivityApiAdapter(chiefApiClient);
export const farmApi = new FarmApiAdapter(chiefApiClient);

/**
 * Unified Chief API Interface.
 * Screens and components MUST interact through this facade or ChiefContext,
 * never by scattering ad-hoc fetch() calls.
 */
export const chiefApi = {
  client: chiefApiClient,
  system: systemApi,
  agents: agentsApi,
  attention: attentionApi,
  activity: activityApi,
  farm: farmApi
};

export default chiefApi;
