import { ApiResponse, ChiefApiError } from '../types';
import { ChiefApiClient } from '../client';
import { WorkerReportItem } from '../../types/workerReport';

export interface IFarmContract {
  submitWorkerReport(
    report: WorkerReportItem,
    signal?: AbortSignal
  ): Promise<ApiResponse<{
    reportId: string;
    status: 'accepted';
    verificationHash: string;
    timestamp: string;
    transactionId: string;
  }>>;
}

export class FarmApiAdapter implements IFarmContract {
  constructor(private client: ChiefApiClient) {}

  public async submitWorkerReport(
    report: WorkerReportItem,
    signal?: AbortSignal
  ): Promise<ApiResponse<{
    reportId: string;
    status: 'accepted';
    verificationHash: string;
    timestamp: string;
    transactionId: string;
  }>> {
    // Structural client-side validation only. These checks never create Chief decisions.
    if (report.category === 'mortality') {
      const count = Number(report.data.mortalityCount || 0);
      if (count < 0) {
        throw new ChiefApiError({
          message: 'Mortality count cannot be negative.',
          code: 'CLIENT_VALIDATION_ERROR',
          origin: 'client',
          statusCode: 422
        });
      }
      if (count > 5000) {
        throw new ChiefApiError({
          message: 'Mortality count exceeds the client sanity threshold and requires live Chief/supervisor review. No STOP decision was made by this client.',
          code: 'CLIENT_VALIDATION_ERROR',
          origin: 'client',
          statusCode: 422
        });
      }
    }

    if (report.category === 'emergency') {
      if (!report.data.immediateActionTaken || String(report.data.immediateActionTaken).trim().length < 5) {
        throw new ChiefApiError({
          message: 'Emergency report requires documented immediate action taken.',
          code: 'CLIENT_VALIDATION_ERROR',
          origin: 'client',
          statusCode: 422
        });
      }
    }

    // Fail closed: only a genuine successful Chief backend response may represent acceptance.
    return await this.client.post('/farm/worker-reports', report, { signal });
  }
}
