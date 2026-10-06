import { ChiefState, AttentionItem, AgentState, ActivityEvent, StatusMessageOption } from '../types/chief';

export const INITIAL_ATTENTION_ITEMS: AttentionItem[] = [
  {
    id: "att-stop-01",
    level: "STOP",
    title: "Hydraulic Line Pressure Interlock: Zone B Pump Circuit Halted",
    source: "Farm Agent Hardware Interlock",
    sourceAgent: "Farm Agent",
    timestamp: "06:58 AM",
    description: "Line pressure exceeded safety threshold (142.4 PSI > 120.0 PSI nominal). Chief policy interlock engaged. Pump circuit disconnected at relay level to prevent blowouts.",
    explanation: "Chief blocked the action immediately upon sensor threshold violation to protect physical piping and electrical pumps from catastrophic failure.",
    color: "red",
    currentAuthorityState: "BLOCKED_BY_POLICY_INTERLOCK",
    proposedAction: "Emergency trip engaged: Pump P-201 power cut, manifold diversion valve DV-02 opened.",
    riskImpact: "Critical: Sustained overpressure (>120 PSI) risks PVC manifold blowout, greenhouse flooding, and pump seal destruction.",
    permittedRemediation: "Physical inspection of Zone B relief valve and manual depressurization by on-site technician. No mobile or remote override permitted.",
    supportingEvidence: {
      "Trigger Sensor": "Transducer PT-201 (Zone B)",
      "Recorded Pressure": "142.4 PSI",
      "Nominal Safety Threshold": "120.0 PSI",
      "Interlock Circuit": "Relay Solenoid ISO-2511-TRIP",
      "Hardware Trip Latency": "18ms"
    },
    details: {
      "Trigger Zone": "Zone B - Hydroponics Manifold",
      "Recorded Pressure": "142.4 PSI",
      "Threshold Limit": "120.0 PSI",
      "Policy Rule": "ISO-2511-PRESSURE-TRIP",
      "Interlock Authority": "Hardware Relay Auto-Trip"
    },
    status: "pending",
    canOverrideMobile: false, // Under Global Safety Rules: STOP cannot be overridden from mobile UI
    policyNote: "NON-BYPASSABLE SAFETY INTERLOCK: Remote override prohibited by Chief Safety Invariant #1. Acknowledging dispatches field technician ticket."
  },
  {
    id: "att-ask-01",
    level: "ASK",
    title: "Application Submission: Staff Cloud Architect",
    source: "Job Agent Pipeline",
    sourceAgent: "Job Agent",
    timestamp: "06:55 AM",
    description: "Opportunity match score 94%. Tailored portfolio draft prepared. Chief policy requires explicit operator ASK approval before external transmission.",
    explanation: "Under Chief career governance policy, candidate application materials require explicit human sign-off before transmission to external recruiters or ATS endpoints.",
    color: "orange",
    currentAuthorityState: "AWAITING_OWNER_DECISION",
    proposedAction: "Transmit customized resume package, cover letter, and architecture portfolio to Aurora Distributed Systems via verified ATS API.",
    riskImpact: "External candidate representation: irreversible external record generated once transmitted.",
    supportingEvidence: {
      "Target Role": "Staff Cloud Infrastructure Architect",
      "Target Company": "Aurora Systems",
      "Match Score": "94.2% (Top 1%)",
      "Compensation": "$215,000 - $240,000 USD",
      "Policy Gate": "JOB-04-EXTERNAL-DISPATCH-ASK"
    },
    details: {
      "Target Role": "Staff Cloud Architect",
      "Target Company": "Aurora Systems",
      "Compensation": "$215,000 - $240,000",
      "Submission Medium": "Verified ATS Link",
      "Policy Rule": "JOB-04-EXTERNAL-DISPATCH-ASK"
    },
    status: "pending",
    canOverrideMobile: true
  },
  {
    id: "att-ask-02",
    level: "Approval",
    title: "Nutrient Formulation Adjustment: Greenhouse Bay 2 #412",
    source: "Farm Agent Automation",
    sourceAgent: "Farm Agent",
    timestamp: "07:12 AM",
    description: "Adjust electrical conductivity (EC) target from 1.8 to 2.2 mS/cm for greenhouse bay 2 flowering stage.",
    explanation: "Canopy spectral analysis indicates flowering onset across 85% of sweet pepper plants in Bay 2. Increased potassium/phosphorus dosing proposed.",
    color: "orange",
    currentAuthorityState: "AWAITING_OPERATOR_APPROVAL",
    proposedAction: "Recalibrate nutrient injection dosing pumps to +0.4 mS/cm for next 4-hour irrigation window.",
    riskImpact: "Moderate: Elevated EC increases yield during flowering, but requires monitoring to prevent root tip burn if drainage EC exceeds 2.6 mS/cm.",
    supportingEvidence: {
      "Crop": "Sweet Peppers (Day 42 - Flowering)",
      "Current EC Target": "1.80 mS/cm",
      "Proposed EC Target": "2.20 mS/cm (+0.40 mS/cm)",
      "PAR Light Inflow": "620 µmol/m²/s",
      "Policy Rule": "AGRI-09-CHEMICAL-DISPATCH-ASK"
    },
    details: {
      "Zone": "Greenhouse Bay 2",
      "Parameter": "Nutrient EC",
      "Proposed Shift": "+0.4 mS/cm",
      "Crop": "Sweet Peppers (Day 42)",
      "Policy Rule": "AGRI-09-CHEMICAL-DISPATCH-ASK"
    },
    status: "pending",
    canOverrideMobile: true
  },
  {
    id: "att-warn-01",
    level: "Warning",
    title: "Atmospheric Sensor Drift: Greenhouse Bay 4 Probe Delta",
    source: "Farm Sensor System",
    sourceAgent: "Farm Agent",
    timestamp: "07:05 AM",
    description: "Relative humidity readings in Bay 4 diverge by 14.3% compared to redundant cross-sensor telemetry. Chief flagged sensor for recalibration.",
    explanation: "Chief cross-validation logic detected statistical divergence between primary probe RH-401 and secondary check RH-402 exceeding tolerance limits.",
    color: "amber",
    currentAuthorityState: "REDUNDANCY_FALLBACK_ACTIVE",
    proposedAction: "Chief has shifted microclimate control weighting to secondary probe array. Clean sensor lens on next field walk.",
    riskImpact: "Low: Secondary sensors maintaining nominal climate setpoint; risk increases if secondary sensor also degrades.",
    supportingEvidence: {
      "Primary Probe (RH-401)": "82.4% RH",
      "Cross-Check Probe (RH-402)": "68.1% RH",
      "Divergence Delta": "+14.3% (Threshold ±5.0%)",
      "Fallback State": "Cross-check probe authoritative"
    },
    details: {
      "Primary Probe": "RH-401 (82.4%)",
      "Secondary Probe": "RH-402 (68.1%)",
      "Divergence": "+14.3%",
      "Action Taken": "Switched to secondary probe"
    },
    status: "pending",
    canOverrideMobile: true
  },
  {
    id: "att-info-01",
    level: "Information",
    title: "Telemetry & Storage Ledger Synchronized",
    source: "Chief Core Security & Telemetry",
    sourceAgent: "Chief Engine",
    timestamp: "06:40 AM",
    description: "All 42 atmospheric, soil, and microgrid battery telemetry points synchronized with cloud ledger with cryptographic hash audit.",
    explanation: "Routine scheduled synchronization completed. State hashes verified against Chief central ledger.",
    color: "blue",
    currentAuthorityState: "SYNCHRONIZED_NOMINAL",
    proposedAction: "Continue scheduled telemetry intake at 15-minute intervals.",
    riskImpact: "None. System health nominal.",
    supportingEvidence: {
      "Payload Size": "128 KB",
      "Data Points": "840 readings",
      "Cryptographic Hash": "sha256:4a02dd88b14e...",
      "Sync Latency": "44ms"
    },
    details: {
      "Sync Status": "Confirmed Nominal",
      "Audit Hash": "sha256:4a02dd88b14e...",
      "Latency": "44ms"
    },
    status: "pending",
    canOverrideMobile: true
  }
];

export const INITIAL_AGENTS: AgentState[] = [
  {
    agent_id: "job_agent",
    label: "Job Agent",
    domain: "Career & Pipeline Intelligence",
    status: "ACTIVE",
    lastHeartbeat: "12s ago",
    activeWorkflows: 3,
    description: "Autonomous career intelligence, opportunity discovery, credential tailoring, and submission queue manager.",
    summary: "Active pipeline: 6 strong opportunities identified, 3 applications active, 1 approval queued.",
    attentionItemsCount: 1,
    blockersCount: 0,
    lastActivity: {
      summary: "Drafted tailored application for Staff Cloud Architect; waiting for owner ASK approval",
      timestamp: "06:55 AM",
      level: "notice"
    },
    metrics: [
      { label: "Strong opportunities", value: 6, highlight: true },
      { label: "Active applications", value: 3 },
      { label: "Approvals required", value: 1, highlight: true },
      { label: "Failures / blockers", value: 0 }
    ]
  },
  {
    agent_id: "farm_agent",
    label: "Farm Agent",
    domain: "Agricultural Telemetry & Control",
    status: "ATTENTION",
    operationalMode: "SIMULATION",
    lastHeartbeat: "8s ago",
    activeWorkflows: 4,
    description: "Autonomous agricultural sensor intake, irrigation telemetry, worker workflow dispatch, and safety monitors.",
    summary: "Farm status: Normal with 1 hardware interlock STOP in Zone B pressure manifold.",
    attentionItemsCount: 2,
    blockersCount: 1,
    simulation_warning: "Simulation mode active: Sensor telemetry is synthetic and not connected to live physical hardware.",
    lastActivity: {
      summary: "Zone B pump circuit interlock engaged at 142.4 PSI (threshold 120 PSI)",
      timestamp: "06:58 AM",
      level: "interlock"
    },
    metrics: [
      { label: "Farm state", value: "Normal" },
      { label: "Open tasks", value: 4 },
      { label: "Warnings", value: 1, highlight: true },
      { label: "Reports received", value: "3 today" }
    ]
  },
  {
    agent_id: "energy_agent",
    label: "Energy & Microgrid Agent",
    domain: "Energy & Storage Dispatch",
    status: "IDLE",
    operationalMode: "LIVE",
    lastHeartbeat: "45s ago",
    activeWorkflows: 1,
    description: "Photovoltaic generation forecasting, battery state of charge balancing, and grid tariff arbitrage.",
    summary: "Nominal grid parallel operation. Battery storage at 92%.",
    attentionItemsCount: 0,
    blockersCount: 0,
    lastActivity: {
      summary: "Switched inverter circuit to battery discharge for morning peak tariff shaving",
      timestamp: "06:15 AM",
      level: "nominal"
    },
    metrics: [
      { label: "Battery SoC", value: "92%" },
      { label: "PV generation", value: "4.8 kW" },
      { label: "Grid draw", value: "0.0 kW (Net-zero)" },
      { label: "Tariff mode", value: "Off-peak export" }
    ]
  }
];

export const INITIAL_ACTIVITY: ActivityEvent[] = [
  {
    id: "act-101",
    time: "07:31 AM",
    timestampFull: "Today at 07:31 AM",
    isoTimestamp: "2026-10-05T07:31:00Z",
    event: "Job Agent completed career index scan: 18 opportunities evaluated",
    eventType: "agent_run",
    agent: "Job Agent",
    severity: "nominal",
    hash: "sha256:7f9a2b8e31a89c41e88a01",
    actor: "Job Agent (Autonomous)",
    source: "ATS & Job Board Indexer",
    relatedEntity: "Pipeline Batch #8812",
    decisionEvidence: {
      ruleId: "JOB-01-SCHEDULED-INDEX",
      policyExplanation: "Routine scan of remote distributed systems architect roles.",
      parameters: { "Scanned": 18, "Matched": 6, "Min Score": "80%" }
    }
  },
  {
    id: "act-102",
    time: "07:22 AM",
    timestampFull: "Today at 07:22 AM",
    isoTimestamp: "2026-10-05T07:22:00Z",
    event: "Farm worker schedule reallocation proposed for North Acre",
    eventType: "decision",
    agent: "Farm Agent",
    severity: "notice",
    hash: "sha256:88a10b4412ef9012a934bb",
    actor: "Farm Agent Optimization",
    source: "Scheduler Engine",
    relatedEntity: "Crew Alpha (2 personnel)",
    decisionEvidence: {
      ruleId: "FARM-04-CREW-SHIFT",
      policyExplanation: "Pre-noon moisture window requires prompt weeding in Bed 8-12.",
      parameters: { "From": "Orchard Sector 4", "To": "North Acre Bed 8-12" }
    }
  },
  {
    id: "act-103",
    time: "07:18 AM",
    timestampFull: "Today at 07:18 AM",
    isoTimestamp: "2026-10-05T07:18:00Z",
    event: "Worker Link: Morning field inspection report logged for Orchard Sector",
    eventType: "farm_report",
    agent: "Worker Link",
    severity: "nominal",
    hash: "sha256:c34b11902a77df4899da02",
    actor: "Tomas Rivera (Worker)",
    source: "Worker Mobile Link PWA",
    relatedEntity: "Orchard Sector 4 - Drip Line",
    decisionEvidence: {
      ruleId: "WORKER-LOG-01",
      policyExplanation: "Field operator visual check signed off.",
      parameters: { "Soil Moisture": "Adequate", "Pest Pressure": "None detected" }
    }
  },
  {
    id: "act-104",
    time: "07:12 AM",
    timestampFull: "Today at 07:12 AM",
    isoTimestamp: "2026-10-05T07:12:00Z",
    event: "Nutrient Injection Batch Formulation #412 escalated for owner approval",
    eventType: "application",
    agent: "Farm Agent",
    severity: "notice",
    hash: "sha256:91ef201ba88921dc9034aa",
    actor: "Farm Agent Dosing Loop",
    source: "Dosing Controller Bay 2",
    relatedEntity: "Greenhouse Bay 2 (Sweet Peppers)",
    decisionEvidence: {
      ruleId: "AGRI-09-CHEMICAL-DISPATCH-ASK",
      policyExplanation: "Target EC shift (+0.4 mS/cm) requires owner approval.",
      parameters: { "Target EC": "2.2 mS/cm", "Current EC": "1.8 mS/cm" }
    }
  },
  {
    id: "act-105",
    time: "07:05 AM",
    timestampFull: "Today at 07:05 AM",
    isoTimestamp: "2026-10-05T07:05:00Z",
    event: "Atmospheric Sensor Drift: Greenhouse Bay 4 Probe Delta +14.3%",
    eventType: "alert",
    agent: "Farm Agent",
    severity: "warning",
    hash: "sha256:55f012cc889104aab89012",
    actor: "Cross-Sensor Validation Filter",
    source: "Probe RH-401 vs RH-402",
    relatedEntity: "Greenhouse Bay 4 Microclimate",
    decisionEvidence: {
      ruleId: "SENSOR-DRIFT-GATE-03",
      policyExplanation: "Secondary sensor cross-check divergence exceeded 5.0% threshold.",
      parameters: { "RH-401": "82.4%", "RH-402": "68.1%", "Delta": "+14.3%" }
    }
  },
  {
    id: "act-106",
    time: "06:58 AM",
    timestampFull: "Today at 06:58 AM",
    isoTimestamp: "2026-10-05T06:58:00Z",
    event: "Hardware STOP Interlock: Zone B Pump Circuit Halted (142.4 PSI > 120.0 PSI)",
    eventType: "stop_event",
    agent: "Farm Agent",
    severity: "interlock",
    hash: "sha256:e10a2948bb9910cf82410a",
    actor: "Relay Solenoid ISO-2511 (Auto-Trip)",
    source: "Transducer PT-201",
    relatedEntity: "Pump P-201 Manifold",
    decisionEvidence: {
      ruleId: "ISO-2511-PRESSURE-TRIP",
      policyExplanation: "Non-bypassable hardware interlock engaged to prevent pipeline blowout.",
      parameters: { "Recorded": "142.4 PSI", "Threshold": "120.0 PSI", "Latency": "18ms" }
    }
  },
  {
    id: "act-107",
    time: "06:55 AM",
    timestampFull: "Today at 06:55 AM",
    isoTimestamp: "2026-10-05T06:55:00Z",
    event: "Application paused — ASK required for Staff Cloud Architect submission",
    eventType: "decision",
    agent: "Chief Engine",
    severity: "notice",
    hash: "sha256:e89a0244199aa51c880199",
    actor: "Chief Policy Engine",
    source: "Pipeline Evaluation Gateway",
    relatedEntity: "Aurora Systems Application Package",
    decisionEvidence: {
      ruleId: "JOB-04-EXTERNAL-DISPATCH-ASK",
      policyExplanation: "External dispatch of candidate credentials strictly gated on owner ASK approval.",
      parameters: { "Match Score": "94%", "Role": "Staff Cloud Architect" }
    }
  },
  {
    id: "act-108",
    time: "06:40 AM",
    timestampFull: "Today at 06:40 AM",
    isoTimestamp: "2026-10-05T06:40:00Z",
    event: "Scheduled farm telemetry and microgrid ledger synchronized",
    eventType: "sync_event",
    agent: "Chief Engine",
    severity: "nominal",
    hash: "sha256:4a02dd88b14e9910ac88b1",
    actor: "Chief Central Sync Worker",
    source: "Telemetry Ingress Relay",
    relatedEntity: "Authoritative Cloud Ledger",
    decisionEvidence: {
      ruleId: "SYNC-INTERVAL-CHIEF-01",
      policyExplanation: "Routine periodic state capture verified and sealed.",
      parameters: { "Data Points": 840, "Payload": "128 KB", "Latency": "44ms" }
    }
  },
  {
    id: "act-109",
    time: "06:15 AM",
    timestampFull: "Today at 06:15 AM",
    isoTimestamp: "2026-10-05T06:15:00Z",
    event: "Energy Agent switched inverter to battery discharge for peak tariff shaving",
    eventType: "agent_run",
    agent: "Energy Agent",
    severity: "nominal",
    hash: "sha256:1198aa774b01cd82710344",
    actor: "Energy & Microgrid Agent",
    source: "Hybrid Inverter Controller #1",
    relatedEntity: "Battery Storage Bank Alpha",
    decisionEvidence: {
      ruleId: "GRID-TARIFF-OPTIMIZE-02",
      policyExplanation: "Grid utility tariff switched to peak morning rate; local battery dispatched.",
      parameters: { "Battery SoC": "92%", "Discharge Rate": "3.2 kW", "Grid Draw": "0.0 kW" }
    }
  },
  {
    id: "act-110",
    time: "05:50 AM",
    timestampFull: "Today at 05:50 AM",
    isoTimestamp: "2026-10-05T05:50:00Z",
    event: "ATS Transmission Retry: Rate limit (HTTP 429) backoff delay engaged",
    eventType: "failure",
    agent: "Job Agent",
    severity: "failure",
    hash: "sha256:3381ab99812cc1829013aa",
    actor: "Job Agent Outbound Queue",
    source: "Remote Greenhouse ATS Connector",
    relatedEntity: "Webhook Dispatch #418",
    decisionEvidence: {
      ruleId: "TRANSPORT-EXPONENTIAL-BACKOFF",
      policyExplanation: "Remote endpoint returned 429 Too Many Requests; backoff scheduled for +300s.",
      parameters: { "Status": 429, "Backoff": "300s", "Retry Count": 1 }
    }
  }
];

export const STATUS_OPTIONS: StatusMessageOption[] = [
  "System operational",
  "Attention required",
  "Limited connectivity",
  "Backend unavailable",
  "Synchronization pending",
  "Maintenance mode"
];

export const INITIAL_CHIEF_STATE: ChiefState = {
  platform_state: "Running",
  status_message: "System operational",
  connectivity: "online",
  pendingSyncCount: 0,
  lastSyncLabel: "Synced just now",
  lastSyncTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  metrics: {
    backend: "Online",
    policy_engine: "Active",
    sync: "Current",
    agents_active: 2,
    uptime: "99.98%",
    healthScore: 99,
    lastSyncTimestamp: "Just now"
  },
  attentionItems: INITIAL_ATTENTION_ITEMS,
  agents: INITIAL_AGENTS,
  activity: INITIAL_ACTIVITY,
  unreadNotificationsCount: 2,
  reachability: 'simulated',
  networkOnline: true,
  syncStatus: 'current',
  resourceProvenance: {
    system: 'mock_isolated',
    agents: 'mock_isolated',
    attention: 'mock_isolated',
    activity: 'mock_isolated'
  },
  compositeProvenance: 'mock_isolated',
  isFullyLive: false
};

export const PRODUCTION_UNSYNCHRONIZED_CHIEF_STATE: ChiefState = {
  platform_state: "Maintenance",
  status_message: "Backend unavailable",
  connectivity: "offline",
  pendingSyncCount: 0,
  lastSyncLabel: "Not synchronized",
  lastSyncTimestamp: "Never",
  metrics: {
    backend: "Offline",
    policy_engine: "Bypassed",
    sync: "Stale",
    agents_active: 0,
    uptime: "N/A",
    healthScore: 0,
    lastSyncTimestamp: "Never"
  },
  attentionItems: [],
  agents: [],
  activity: [],
  unreadNotificationsCount: 0,
  reachability: 'unreachable',
  networkOnline: typeof navigator !== 'undefined' ? navigator.onLine : false,
  syncStatus: 'not_synchronized',
  resourceProvenance: {
    system: 'unavailable',
    agents: 'unavailable',
    attention: 'unavailable',
    activity: 'unavailable'
  },
  compositeProvenance: 'unavailable',
  isFullyLive: false
};

export const SECURITY_POLICY = {
  forbidden_data: [
    "api_keys",
    "credentials",
    "secrets",
    "passwords",
    "raw_tokens",
    "pii",
    "internal_debug"
  ],
  authority_rules: {
    mobile_capabilities: [
      "display",
      "request",
      "approve",
      "reject",
      "acknowledge",
      "submit_permitted_input"
    ],
    mobile_restrictions: [
      "reinterpret_policy",
      "override_stop",
      "promote_ask_to_auto",
      "fabricate_evidence",
      "parallel_source_of_truth"
    ]
  }
};
