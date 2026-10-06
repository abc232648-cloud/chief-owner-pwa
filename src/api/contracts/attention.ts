import { IAttentionContract, ApiResponse, ChiefApiError } from '../types';
import { ChiefApiClient } from '../client';
import { wrapIsolatedMock, ISOLATED_ATTENTION_MOCK } from '../mock/isolatedDevMocks';
import { AttentionItem } from '../../types/chief';

export class AttentionApiAdapter implements IAttentionContract {
  constructor(private client: ChiefApiClient) {}

  public async getItems(signal?: AbortSignal): Promise<ApiResponse<AttentionItem[]>> {
    try {
      return await this.client.get('/attention', { signal });
    } catch (err) {
      if (err instanceof ChiefApiError && (err.isNetworkError || err.statusCode === 404)) {
        return wrapIsolatedMock(ISOLATED_ATTENTION_MOCK, '/attention');
      }
      throw err;
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
