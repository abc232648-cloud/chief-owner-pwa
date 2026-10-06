export type WorkerReportCategory = 
  | 'mortality'
  | 'feed'
  | 'water'
  | 'egg_production'
  | 'flock_observation'
  | 'equipment_fault'
  | 'task_completion'
  | 'environmental_issue'
  | 'emergency'
  | 'photo_evidence';

export type WorkerReportStatus = 
  | 'saved_locally'
  | 'queued'
  | 'syncing'
  | 'accepted_by_chief'
  | 'rejected_needs_correction';

export type CategoryAvailability = 'live' | 'sensor_link_required' | 'coming_soon';

export interface CategoryMetadata {
  id: WorkerReportCategory;
  title: string;
  shortLabel: string;
  description: string;
  availability: CategoryAvailability;
  availabilityNotice?: string;
  iconName: string;
  badgeColor: string;
}

export interface WorkerReportAttachment {
  id: string;
  name: string;
  type: 'image/jpeg' | 'image/png' | 'application/pdf';
  sizeBytes: number;
  dataUrl?: string;
  capturedAt: string;
  watermarkText: string;
}

export interface MortalityReportData {
  houseNumber: string;
  flockId: string;
  mortalityCount: number;
  suspectedCause: 'Sudden Death Syndrome' | 'Dehydration / Gout' | 'Smothering / Piling' | 'Cull / Welfare' | 'Unexplained';
  disposalMethod: 'Certified Incinerator' | 'Deep Pit Composting' | 'Biosecure Cold Storage';
  immediateInterlockNeeded: boolean;
}

export interface FeedReportData {
  houseNumber: string;
  siloId: string;
  feedCondition: 'Normal / Dry' | 'Caked / Bridging' | 'High Dust' | 'Off-odor / Mold Suspicion';
  binLevelPct: number;
  feederLinesOperational: boolean;
  notes?: string;
}

export interface WaterReportData {
  houseNumber: string;
  meterReadingLiters: number;
  pressureGaugeReadingPsi: number;
  nippleLinesFunctional: boolean;
  drinkerStatus: 'All Clear' | 'Drip / Leak in Bay 3' | 'Low Flow Alert' | 'Air Lock in Line';
  sanitizerCheckPpm: number;
}

export interface EggProductionReportData {
  houseNumber: string;
  flockId: string;
  shift: 'Morning (07:00)' | 'Afternoon (13:00)' | 'Late Collection (17:00)';
  traysCollected: number; // 30 eggs per tray standard
  looseEggsCollected: number;
  crackedDefectiveCount: number;
  dirtyFloorEggsCount: number;
}

export interface FlockObservationReportData {
  houseNumber: string;
  flockId: string;
  activityLevel: 'Active & Dispersed' | 'Slightly Lethargic' | 'Agitated / Flighty' | 'Huddling under heat lamps';
  droppingsCondition: 'Firm / Normal' | 'Watery / Wet Litter' | 'Mucoid / Enteritis' | 'Blood-tinged (Urgent)';
  vocalizationState: 'Normal Barn Clucking' | 'Abnormally Quiet' | 'Respiratory Snicking / Coughing';
  litterMoistureCondition: 'Dry & Friable (Optimal)' | 'Damp in Drinking Zone' | 'Caked / High Risk';
}

export interface EquipmentFaultReportData {
  equipmentId: string;
  equipmentName: string;
  zone: string;
  urgency: 'Immediate STOP Required' | 'Service Within 4h' | 'Routine Non-Critical';
  faultType: 'Belt / Drive Failure' | 'Motor Overheating' | 'Leak / Pressure Loss' | 'Electrical / Tripped Breaker' | 'Controller Error Code';
  isHardwareInterlockEngaged: boolean;
  description: string;
}

export interface TaskCompletionReportData {
  taskId: string;
  taskTitle: string;
  category: string;
  completionMinutes: number;
  checklistConfirmed: boolean;
  workerSignOff: string;
  outcomeNotes: string;
}

export interface EnvironmentalIssueReportData {
  houseNumber: string;
  zone: string;
  temperatureC: number;
  relativeHumidityPct: number;
  ammoniaRating: 'None (<5 ppm)' | 'Mild (5-15 ppm)' | 'Irritating (15-25 ppm)' | 'Dangerous (>25 ppm)';
  ventilationFanCountActive: number;
  inletBaffleOperational: boolean;
}

export interface EmergencyReportData {
  emergencyType: 'Ventilation Failure' | 'Main Water Cutoff' | 'Barn Fire / Smoke' | 'Backup Generator Failure' | 'Extreme Heat Surge' | 'Predator / Biosecurity Breach';
  immediateActionTaken: string;
  requiresSupervisorDispatch: boolean;
  physicalInterlockTripped: boolean;
  flockEvacuationRisk: boolean;
}

export interface WorkerReportItem {
  id: string;
  reportNumber: string; // e.g. RPT-2026-0842
  category: WorkerReportCategory;
  status: WorkerReportStatus;
  createdAt: string; // ISO string
  timestampFormatted: string;
  workerId: string;
  workerName: string;
  workerRole: string;
  categoryLabel: string;
  summary: string;
  data: Record<string, any>;
  evidenceAttachments: WorkerReportAttachment[];
  correlationId?: string;
  backendConfirmationHash?: string;
  backendConfirmedAt?: string;
  rejectionReason?: string;
  isQueuedOffline?: boolean;
  syncAttempts?: number;
}
