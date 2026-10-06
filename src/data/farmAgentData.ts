import { 
  PoultryFlock, 
  DailyReport, 
  FarmTask, 
  FarmWorkerSubmission, 
  FarmEquipment, 
  FarmAlert, 
  FarmSensor, 
  ProductionModuleState 
} from '../types/farmAgent';

export const INITIAL_POULTRY_FLOCKS: PoultryFlock[] = [
  {
    id: "flock-h1",
    name: "Layer Flock L-02",
    houseNumber: "House 1 (Commercial Layer Barn)",
    breed: "Lohmann Brown-Classic",
    flockType: "layer",
    birdCount: 12450,
    ageWeeks: 36,
    dailyMortalityCount: 2,
    mortalityRatePct: 0.016,
    feedIntakeKg: 1420,
    waterIntakeLiters: 2780,
    waterToFeedRatio: 1.95,
    status: "Nominal",
    environment: {
      tempC: 21.4,
      targetTempC: 21.0,
      humidityPct: 62.5,
      ventilationCfm: 48000,
      ammoniaPpm: 9.2,
      ammoniaThresholdPpm: 20.0
    },
    lastInspectionTime: "Today at 07:15 AM by Tomas Rivera"
  },
  {
    id: "flock-h2",
    name: "Broiler Batch B-04",
    houseNumber: "House 2 (Environmental Tunnel Barn)",
    breed: "Ross 308",
    flockType: "broiler",
    birdCount: 18200,
    ageWeeks: 4,
    dailyMortalityCount: 5,
    mortalityRatePct: 0.027,
    feedIntakeKg: 2850,
    waterIntakeLiters: 5420,
    waterToFeedRatio: 1.90,
    status: "Nominal",
    environment: {
      tempC: 23.8,
      targetTempC: 24.0,
      humidityPct: 58.0,
      ventilationCfm: 65000,
      ammoniaPpm: 12.1,
      ammoniaThresholdPpm: 20.0
    },
    lastInspectionTime: "Today at 07:18 AM by Tomas Rivera"
  }
];

export const INITIAL_DAILY_REPORTS: DailyReport[] = [
  {
    id: "rep-01",
    timestamp: "Today at 07:18 AM",
    shift: "Morning",
    author: "Tomas Rivera",
    authorRole: "Field Poultry Specialist",
    flockHouse: "House 1 & House 2",
    summary: "Morning flock welfare walkthrough complete. Litter dry throughout House 1. Drinker nipple line pressure verified at 25 cm w.g.",
    keyObservations: [
      "Bird activity uniform across all 4 feeding pans",
      "Feed bin auger operating without blockage",
      "Dead birds removed (2 in House 1, 5 in House 2) within normal daily baseline (<0.05%)"
    ],
    submittedVia: "Worker Link Mobile PWA (Verified GPS Lat/Long)",
    verificationHash: "sha256:rep_flock_0718_99b"
  },
  {
    id: "rep-02",
    timestamp: "Today at 06:30 AM",
    shift: "Morning",
    author: "Telemetry Sensor Loop #4",
    authorRole: "Automated Environment System",
    flockHouse: "All Houses",
    summary: "Overnight atmospheric telemetry sealed. Negative static pressure maintained between 0.05 to 0.07 in. w.g. across tunnel fans.",
    keyObservations: [
      "Tunnel ventilation fans Bank A & B cycled without thermal overloads",
      "Ammonia sensors remained below 15 ppm threshold"
    ],
    submittedVia: "Direct Modbus/RS485 Gateway",
    verificationHash: "sha256:rep_auto_env_0630"
  },
  {
    id: "rep-03",
    timestamp: "Yesterday at 05:45 PM",
    shift: "Afternoon",
    author: "Marcus Brody",
    authorRole: "Operations Manager",
    flockHouse: "Bulk Feed Silo #1 & #2",
    summary: "Feed silo delivery accepted (24 metric tons commercial layer ration). Mill certificate verified; zero aflatoxins detected.",
    keyObservations: [
      "Feed moisture verified at 11.8%",
      "Silo auger intake lubricated"
    ],
    submittedVia: "Manager Terminal",
    verificationHash: "sha256:rep_feed_delivery_yesterday"
  }
];

export const INITIAL_FARM_TASKS: FarmTask[] = [
  {
    id: "tsk-01",
    title: "Inspect Zone B Manifold Relief Line (Hardware Interlock)",
    category: "Equipment Maintenance",
    assignedTo: "On-call Field Technician",
    priority: "Critical",
    status: "Blocked",
    dueTime: "Immediate",
    policyRule: "ISO-2511-PRESSURE-TRIP",
    isInterlockTriggered: true
  },
  {
    id: "tsk-02",
    title: "House 2 Litter Moisture & Drinker Line Check",
    category: "Flock Health",
    assignedTo: "Tomas Rivera (Worker)",
    priority: "High",
    status: "In Progress",
    dueTime: "11:00 AM",
    policyRule: "POULTRY-WELFARE-DAILY-01"
  },
  {
    id: "tsk-03",
    title: "House 1 Egg Conveyor Belt Speed Calibration",
    category: "Egg Collection",
    assignedTo: "Packing Station Operator",
    priority: "Medium",
    status: "In Progress",
    dueTime: "01:30 PM"
  },
  {
    id: "tsk-04",
    title: "Greenhouse Bay 2 Nutrient Formulation Adjustment",
    category: "Biosecurity",
    assignedTo: "Chief Automated Loop",
    priority: "High",
    status: "Pending Approval",
    dueTime: "12:00 PM",
    policyRule: "AGRI-09-CHEMICAL-DISPATCH-ASK"
  }
];

export const INITIAL_WORKER_SUBMISSIONS: FarmWorkerSubmission[] = [
  {
    id: "wrk-01",
    workerName: "Tomas Rivera",
    role: "Field Poultry Specialist",
    checkInTime: "06:15 AM",
    assignedZone: "House 1 & House 2 Poultry Complex",
    status: "Active on Site",
    notes: "Completed initial morning mortality tally and water meter checks. Next: House 2 litter raking."
  },
  {
    id: "wrk-02",
    workerName: "Marcus Brody",
    role: "Operations Manager",
    checkInTime: "06:00 AM",
    assignedZone: "Control Office & Silos",
    status: "Active on Site",
    notes: "Reviewing Zone B pressure interlock diagnostic log. Coordinating technician dispatch."
  }
];

export const INITIAL_FARM_EQUIPMENT: FarmEquipment[] = [
  {
    id: "eq-01",
    name: "Zone B Water Manifold Booster Pump (P-201)",
    equipmentType: "Irrigation & Pressure Pump",
    zone: "Zone B Manifold",
    operatingStatus: "Tripped Interlock",
    lastServiceDate: "2026-08-14",
    telemetry: {
      "Measured Pressure": "142.4 PSI",
      "Safety Trip Level": "120.0 PSI",
      "Relay Solenoid": "Open / Cut-off",
      "Motor Current": "0.0 A (Tripped)"
    },
    isConfigured: true
  },
  {
    id: "eq-02",
    name: "House 1 Tunnel Exhaust Fan Bank (8x 54-inch Fans)",
    equipmentType: "Ventilation Exhaust Fans",
    zone: "House 1 Endwall",
    operatingStatus: "Normal",
    lastServiceDate: "2026-09-20",
    telemetry: {
      "Active Fans": "6 of 8",
      "Static Pressure": "0.06 in. w.g.",
      "Total CFM": "48,000 CFM",
      "Drive Belt Tension": "Nominal"
    },
    isConfigured: true
  },
  {
    id: "eq-03",
    name: "House 1 Nipple Drinker Pressure Regulator",
    equipmentType: "Water Distribution Line",
    zone: "House 1 Poultry Complex",
    operatingStatus: "Normal",
    lastServiceDate: "2026-09-01",
    telemetry: {
      "Column Height": "25 cm w.g.",
      "Flow Rate": "3.8 L/min",
      "Flush Valve": "Sealed"
    },
    isConfigured: true
  },
  {
    id: "eq-04",
    name: "Automated Feed Silo Weight Load Cells (Telemetry Kit)",
    equipmentType: "Continuous Silo Load Sensor",
    zone: "Feed Silo Compound",
    operatingStatus: "Not Configured",
    lastServiceDate: "Unconfigured",
    isConfigured: false
  }
];

export const INITIAL_FARM_ALERTS: FarmAlert[] = [
  {
    id: "alt-01",
    severity: "Critical STOP",
    title: "Zone B Pressure Line Interlock: Pump Cutoff Engaged",
    location: "Zone B - Hydroponics Manifold",
    triggerValue: "142.4 PSI",
    thresholdValue: "120.0 PSI",
    timestamp: "Today at 06:58 AM",
    isHardwareInterlock: true,
    remediation: "Physical pressure relief valve bleed and technician inspection required. No mobile override permitted."
  },
  {
    id: "alt-02",
    severity: "Warning",
    title: "Atmospheric Sensor Drift: Greenhouse Bay 4 Probe Delta",
    location: "Greenhouse Bay 4",
    triggerValue: "82.4% RH (+14.3% divergence)",
    thresholdValue: "±5.0% tolerance",
    timestamp: "Today at 07:05 AM",
    isHardwareInterlock: false,
    remediation: "Clean sensor lens and recalibrate against secondary cross-check probe."
  }
];

export const INITIAL_FARM_SENSORS: FarmSensor[] = [
  {
    id: "sns-01",
    sensorName: "House 1 Negative Static Pressure Transducer",
    sensorType: "Static Pressure",
    zone: "House 1 Tunnel Ingress",
    currentReading: "0.06 in. w.g.",
    status: "Online",
    lastHeartbeat: "4s ago",
    isConfigured: true
  },
  {
    id: "sns-02",
    sensorName: "House 1 Ammonia (NH3) Electrochemical Sensor",
    sensorType: "Ammonia",
    zone: "House 1 Bird Height (30cm)",
    currentReading: "9.2 ppm (Threshold 20 ppm)",
    status: "Online",
    lastHeartbeat: "6s ago",
    isConfigured: true
  },
  {
    id: "sns-03",
    sensorName: "House 2 Ambient Temp & Humidity Sensor Pair",
    sensorType: "House Temp",
    zone: "House 2 Broiler Floor",
    currentReading: "23.8°C / 58% RH",
    status: "Online",
    lastHeartbeat: "8s ago",
    isConfigured: true
  },
  {
    id: "sns-04",
    sensorName: "Main Poultry Water Meter (Pulse Flow Transducer)",
    sensorType: "Water Meter",
    zone: "Central Header Room",
    currentReading: "8,200 L Total Today",
    status: "Online",
    lastHeartbeat: "2s ago",
    isConfigured: true
  },
  {
    id: "sns-05",
    sensorName: "Automated Egg Candling Optical Spectrometer",
    sensorType: "Ammonia",
    zone: "Packing Facility Bay 1",
    currentReading: "Unprovisioned hardware",
    status: "Not Configured",
    lastHeartbeat: "Never",
    isConfigured: false
  }
];

export const INITIAL_PRODUCTION_STATE: ProductionModuleState = {
  isConfigured: true,
  configurationNotice: "Authoritative Layer Egg Collection Telemetry Active",
  eggCountToday: 11840,
  gradeAPct: 98.4,
  averageWeightGrams: 62.4,
  anomalyDetected: false,
  anomalyNotes: "Egg production and shell thickness within expected normal flock curve (Week 36: 95.1% lay rate)."
};
