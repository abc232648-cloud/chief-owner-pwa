export type FarmOperatingMode = 'LIVE' | 'CACHED' | 'UNAVAILABLE' | 'NOT CONFIGURED' | 'SIMULATION' | 'OFFLINE' | 'STALE';

export type PoultryFlockType = 'layer' | 'broiler' | 'breeder';

export interface PoultryEnvironment {
  tempC: number;
  targetTempC: number;
  humidityPct: number;
  ventilationCfm: number;
  ammoniaPpm: number;
  ammoniaThresholdPpm: number;
}

export interface PoultryFlock {
  id: string;
  name: string;
  houseNumber: string;
  breed: string;
  flockType: PoultryFlockType;
  birdCount: number;
  ageWeeks: number;
  dailyMortalityCount: number;
  mortalityRatePct: number;
  feedIntakeKg: number;
  waterIntakeLiters: number;
  waterToFeedRatio: number;
  status: 'Nominal' | 'Attention' | 'Warning';
  environment: PoultryEnvironment;
  lastInspectionTime: string;
}

export interface DailyReport {
  id: string;
  timestamp: string;
  shift: 'Morning' | 'Afternoon' | 'Night';
  author: string;
  authorRole: string;
  flockHouse: string;
  summary: string;
  keyObservations: string[];
  submittedVia: string;
  verificationHash: string;
}

export interface FarmTask {
  id: string;
  title: string;
  category: 'Flock Health' | 'Feed & Water' | 'Biosecurity' | 'Equipment Maintenance' | 'Egg Collection';
  assignedTo: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Pending Approval' | 'In Progress' | 'Completed' | 'Blocked';
  dueTime: string;
  policyRule?: string;
  isInterlockTriggered?: boolean;
}

export interface FarmWorkerSubmission {
  id: string;
  workerName: string;
  role: string;
  checkInTime: string;
  assignedZone: string;
  status: 'Active on Site' | 'Task Submitted' | 'Off Shift';
  notes: string;
}

export interface FarmEquipment {
  id: string;
  name: string;
  equipmentType: string;
  zone: string;
  operatingStatus: 'Normal' | 'Tripped Interlock' | 'Maintenance Required' | 'Standby' | 'Not Configured';
  lastServiceDate: string;
  telemetry?: Record<string, string | number>;
  isConfigured: boolean;
}

export interface FarmAlert {
  id: string;
  severity: 'Critical STOP' | 'Warning' | 'Advisory';
  title: string;
  location: string;
  triggerValue: string;
  thresholdValue: string;
  timestamp: string;
  isHardwareInterlock: boolean;
  remediation: string;
}

export interface FarmSensor {
  id: string;
  sensorName: string;
  sensorType: 'Ammonia' | 'House Temp' | 'Water Meter' | 'Static Pressure' | 'Soil Moisture';
  zone: string;
  currentReading: string;
  status: 'Online' | 'Offline' | 'Drift Warning' | 'Not Configured';
  lastHeartbeat: string;
  isConfigured: boolean;
}

export interface ProductionModuleState {
  isConfigured: boolean;
  configurationNotice: string;
  eggCountToday?: number;
  gradeAPct?: number;
  averageWeightGrams?: number;
  anomalyDetected?: boolean;
  anomalyNotes?: string;
}
