import { ApiResponse, ChiefApiError } from '../types';
import { ChiefApiClient } from '../client';
import { WorkerReportItem } from '../../types/workerReport';

export type FarmTaskStatus = 'ASSIGNED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'AWAITING_VERIFICATION' | 'NEEDS_CORRECTION' | 'ESCALATED' | 'VERIFIED' | 'CANCELLED';
export interface FarmTask {
  task_id: string;
  title: string;
  instructions: string;
  location: string;
  assigned_to: string;
  supervisor_id: string | null;
  due_at: string;
  priority: 'ROUTINE' | 'HIGH' | 'URGENT';
  evidence_required: string[];
  status: FarmTaskStatus;
  revision: string;
  updated_at: string;
  submission_note: string | null;
  verification_note: string | null;
  correction_note: string | null;
  escalation_reason: string | null;
}
export interface FarmTaskOverview { tasks: FarmTask[]; total: number; next_offset: number | null; farm_role: string; can_create: boolean; notice: string; }

export interface FarmIncident {
  incident_id: string;
  kind: 'INCIDENT' | 'EMERGENCY';
  category: string;
  location: string;
  observed_at: string;
  summary: string;
  severity: 'IMPORTANT' | 'URGENT' | 'CRITICAL';
  immediate_risk: boolean;
  status: 'OPEN' | 'ESCALATED';
  revision: string;
  actor_id: string;
  received_at: string;
  escalation_reason: string | null;
  escalated_by: string | null;
  escalated_at: string | null;
  can_escalate: boolean;
}
export interface FarmIncidentOverview { incidents: FarmIncident[]; total: number; next_offset: number | null; notice: string; }

export interface ChiefWorkerReportPayload {
  event_id: string;
  category: 'OBSERVATION' | 'MORTALITY' | 'FEED' | 'WATER' | 'EQUIPMENT' | 'INVENTORY' | 'TASK_EVIDENCE';
  task_id: string | null;
  entity_id: string | null;
  location: string;
  observed_at: string;
  summary: string;
  quantity: string | null;
  unit: string | null;
  basis: 'MEASURED' | 'ESTIMATED' | 'COUNTED' | null;
  severity: 'ROUTINE' | 'IMPORTANT' | 'URGENT';
}
export interface ChiefWorkerReportRecord { version: 1; payload: ChiefWorkerReportPayload; actor_id: string; session_id: string; received_at: string; evidence_status: 'HUMAN_REPORTED'; }
export interface FarmWorkerReportOverview { reports: ChiefWorkerReportRecord[]; total: number; next_offset: number | null; notice: string; }

export interface IFarmContract {
  getTasks(signal?: AbortSignal): Promise<ApiResponse<FarmTaskOverview>>;
  getIncidents(signal?: AbortSignal): Promise<ApiResponse<FarmIncidentOverview>>;
  getWorkerReports(signal?: AbortSignal): Promise<ApiResponse<FarmWorkerReportOverview>>;
  submitWorkerReport(report: WorkerReportItem, signal?: AbortSignal): Promise<never>;
}

export class FarmApiAdapter implements IFarmContract {
  constructor(private client: ChiefApiClient) {}

  public getTasks(signal?: AbortSignal) {
    return this.client.get<FarmTaskOverview>('/api/farm/tasks', { signal });
  }

  public getIncidents(signal?: AbortSignal) {
    return this.client.get<FarmIncidentOverview>('/api/farm/incidents', { signal });
  }

  public getWorkerReports(signal?: AbortSignal) {
    return this.client.get<FarmWorkerReportOverview>('/api/farm/worker-reports', { signal });
  }

  public async submitWorkerReport(_report: WorkerReportItem, _signal?: AbortSignal): Promise<never> {
    // Owner Mobile's legacy report form does not implement Chief's immutable field-report
    // contract and must never translate or invent evidence fields. Staff PWA is the field
    // evidence surface. Owner Mobile consumes the authoritative Chief report ledger.
    throw new ChiefApiError({
      message: 'Owner Mobile does not submit worker evidence. Use Staff PWA for field reporting; Owner reads Chief-received reports here.',
      code: 'OWNER_FIELD_REPORT_BLOCKED',
      origin: 'client',
      statusCode: 409
    });
  }
}
