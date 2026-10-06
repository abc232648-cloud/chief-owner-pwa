import { CategoryMetadata, WorkerReportCategory, WorkerReportItem } from '../types/workerReport';

export const WORKER_REPORT_CATEGORIES: CategoryMetadata[] = [
  {
    id: 'mortality',
    title: 'Flock Mortality Tally',
    shortLabel: 'Mortality',
    description: 'Log daily bird mortality count, house, suspected cause, and disposal compliance.',
    availability: 'live',
    iconName: 'AlertOctagon',
    badgeColor: 'rose'
  },
  {
    id: 'feed',
    title: 'Feed Silo & Feeder Run',
    shortLabel: 'Feed',
    description: 'Verify silo bin levels, feed condition, bridging, and automatic auger run status.',
    availability: 'live',
    iconName: 'Wheat',
    badgeColor: 'amber'
  },
  {
    id: 'water',
    title: 'Water Meter & Drinker Lines',
    shortLabel: 'Water',
    description: 'Record header meter consumption, line column pressure, and check for nipple leaks.',
    availability: 'live',
    iconName: 'Droplets',
    badgeColor: 'sky'
  },
  {
    id: 'egg_production',
    title: 'Egg Production Collection',
    shortLabel: 'Egg/Production',
    description: 'Log trays collected per shift, floor eggs, cracked/dirty counts, and packing status.',
    availability: 'live',
    iconName: 'Egg',
    badgeColor: 'emerald'
  },
  {
    id: 'flock_observation',
    title: 'Flock Health & Welfare',
    shortLabel: 'Flock Observation',
    description: 'Assess bird activity, distribution, droppings state, vocalization, and bedding moisture.',
    availability: 'live',
    iconName: 'Eye',
    badgeColor: 'teal'
  },
  {
    id: 'equipment_fault',
    title: 'Equipment Fault & Maintenance',
    shortLabel: 'Equipment Fault',
    description: 'Flag mechanical breakdowns, tripped breakers, fan motor trips, and interlocks.',
    availability: 'live',
    iconName: 'Wrench',
    badgeColor: 'amber'
  },
  {
    id: 'task_completion',
    title: 'Task Completion Sign-off',
    shortLabel: 'Task Sign-off',
    description: 'Mark assigned field duties complete with worker attribution and checklist validation.',
    availability: 'live',
    iconName: 'CheckSquare',
    badgeColor: 'emerald'
  },
  {
    id: 'environmental_issue',
    title: 'Environmental & Air Quality',
    shortLabel: 'Environmental',
    description: 'Spot check house ambient temperature, relative humidity, and ammonia (NH3) levels.',
    availability: 'live',
    iconName: 'Wind',
    badgeColor: 'cyan'
  },
  {
    id: 'emergency',
    title: 'Farm Emergency Broadcast',
    shortLabel: 'Emergency',
    description: 'Immediate critical alert for ventilation failure, water outage, smoke, or structural breach.',
    availability: 'live',
    iconName: 'AlertTriangle',
    badgeColor: 'rose'
  },
  {
    id: 'photo_evidence',
    title: 'Photo & Document Evidence',
    shortLabel: 'Photo/Evidence',
    description: 'Capture inspection photo proof, veterinary tags, delivery slips, and timestamped records.',
    availability: 'live',
    iconName: 'Camera',
    badgeColor: 'indigo'
  }
];

export const INITIAL_SAMPLE_WORKER_REPORTS: WorkerReportItem[] = [
  {
    id: 'rep-init-01',
    reportNumber: 'RPT-2026-0412',
    category: 'mortality',
    status: 'accepted_by_chief',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    timestampFormatted: 'Today at 07:15 AM',
    workerId: 'usr-wrk-03',
    workerName: 'Tomas Rivera',
    workerRole: 'Field Poultry Specialist',
    categoryLabel: 'Flock Mortality Tally',
    summary: 'House 1: 2 birds mortality (Normal baseline). Certified Incinerator logged.',
    data: {
      houseNumber: 'House 1 (Commercial Layer Barn)',
      flockId: 'flock-h1',
      mortalityCount: 2,
      suspectedCause: 'Sudden Death Syndrome',
      disposalMethod: 'Certified Incinerator',
      immediateInterlockNeeded: false
    },
    evidenceAttachments: [
      {
        id: 'att-01',
        name: 'house1_tally_morning.jpg',
        type: 'image/jpeg',
        sizeBytes: 245000,
        capturedAt: '07:14 AM',
        watermarkText: 'H1 — T. RIVERA — 07:14 AM — SHA-256'
      }
    ],
    correlationId: 'cid_worker_mort_h1_0715',
    backendConfirmationHash: 'sha256:4a8f9c2d1b8e7344f6a29d01e5c832ba9710f43818e6cd',
    backendConfirmedAt: 'Today at 07:15:04 AM'
  },
  {
    id: 'rep-init-02',
    reportNumber: 'RPT-2026-0413',
    category: 'water',
    status: 'accepted_by_chief',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    timestampFormatted: 'Today at 08:20 AM',
    workerId: 'usr-wrk-03',
    workerName: 'Tomas Rivera',
    workerRole: 'Field Poultry Specialist',
    categoryLabel: 'Water Meter & Drinker Lines',
    summary: 'House 2 Header Meter: 5,420 L — Pressure nominal at 28 cm w.g. — Sanitizer 1.2 ppm.',
    data: {
      houseNumber: 'House 2 (Environmental Tunnel Barn)',
      meterReadingLiters: 5420,
      pressureGaugeReadingPsi: 28,
      nippleLinesFunctional: true,
      drinkerStatus: 'All Clear',
      sanitizerCheckPpm: 1.2
    },
    evidenceAttachments: [],
    correlationId: 'cid_worker_water_h2_0820',
    backendConfirmationHash: 'sha256:7b1e84a29c0f5d41e2b69a8432ce91d082fa46e290f1ac',
    backendConfirmedAt: 'Today at 08:20:06 AM'
  }
];
