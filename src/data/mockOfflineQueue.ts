import { QueueItem } from '../types/queue';

export const INITIAL_OFFLINE_QUEUE: QueueItem[] = [
  {
    id: 'qid-01',
    actionType: 'SUBMIT_WORKER_REPORT',
    title: 'House 2 Broiler Litter & Water Check',
    domain: 'Farm Agent',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    timestampFormatted: '18m ago',
    status: 'pending',
    retryCount: 1,
    maxRetries: 3,
    requiresUserIntervention: false,
    policyPermitted: true,
    lastFailure: 'Uplink timeout: Server unreachable at 10.40.2.14',
    payload: {
      houseNumber: 'House 2 (Environmental Tunnel Barn)',
      category: 'water',
      meterReadingLiters: 5420,
      drinkerStatus: 'All Clear'
    },
    workerAttribution: {
      userId: 'usr-wrk-03',
      userName: 'Tomas Rivera',
      role: 'Field Poultry Specialist'
    }
  },
  {
    id: 'qid-02',
    actionType: 'SUBMIT_WORKER_REPORT',
    title: 'House 1 Mortality Morning Tally (Duplicate Conflict)',
    domain: 'Farm Agent',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    timestampFormatted: '45m ago',
    status: 'conflict',
    retryCount: 1,
    maxRetries: 3,
    requiresUserIntervention: true,
    policyPermitted: true,
    lastFailure: 'HTTP 409 Conflict: House 1 morning mortality already committed by sensor link',
    payload: {
      houseNumber: 'House 1 (Commercial Layer Barn)',
      mortalityCount: 3,
      cause: 'Sudden Death'
    },
    conflictDetails: {
      serverRecordId: 'REC-H1-MORT-0715',
      serverStateDescription: 'Chief Server has 2 birds logged at 07:15 AM by Tomas Rivera with verified camera receipt',
      localStateDescription: 'Offline Queue has 3 birds recorded at 07:30 AM by mobile app',
      detectedAt: 'Today at 07:32 AM',
      resolutionOptions: ['use_local', 'accept_server', 'merge_review']
    },
    workerAttribution: {
      userId: 'usr-wrk-03',
      userName: 'Tomas Rivera',
      role: 'Field Poultry Specialist'
    }
  },
  {
    id: 'qid-03',
    actionType: 'SIGN_OFF_FIELD_TASK',
    title: 'Biosecurity Gate 3 Chemical Dip Verification',
    domain: 'Farm Agent',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    timestampFormatted: '1h 30m ago',
    status: 'rejected_permanent',
    retryCount: 3,
    maxRetries: 3,
    requiresUserIntervention: true,
    policyPermitted: true,
    lastFailure: 'HTTP 422 Unprocessable: Chemical dip lot number expired. Retries halted by policy.',
    payload: {
      taskId: 'tsk-biosec-03',
      chemicalLot: 'LOT-EXP-2026-01',
      dipPpm: 250
    },
    workerAttribution: {
      userId: 'usr-wrk-03',
      userName: 'Tomas Rivera',
      role: 'Field Poultry Specialist'
    }
  }
];
