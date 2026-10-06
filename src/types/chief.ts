export type StatusMessageOption =
  | "System operational"
  | "Attention required"
  | "Limited connectivity"
  | "Backend unavailable"
  | "Synchronization pending"
  | "Maintenance mode";

export type AttentionLevel = "STOP" | "ASK" | "Approval" | "Approval required" | "Warning" | "Information";

export interface AttentionItem {
  id: string;
  level: AttentionLevel;
  title: string;
  source: string;
  sourceAgent?: string;
  timestamp: string;
  description: string;
  explanation?: string;
  color: "red" | "orange" | "amber" | "blue" | "emerald";
  currentAuthorityState?: string;
  supportingEvidence?: Record<string, string | number>;
  proposedAction?: string;
  riskImpact?: string;
  permittedRemediation?: string;
  details?: Record<string, string | number>;
  status: "pending" | "approved" | "rejected" | "acknowledged";
  canOverrideMobile?: boolean;
  policyNote?: string;
  submissionState?: "idle" | "in_flight" | "confirmed" | "failed";
  submissionError?: string;
}

export type AgentStatus =
  | "ACTIVE"
  | "IDLE"
  | "ATTENTION"
  | "PAUSED"
  | "OFFLINE"
  | "DISABLED"
  | "ERROR"
  | "SIMULATION"
  // Legacy case compatibility
  | "Active"
  | "Idle"
  | "Paused"
  | "Degraded";

export type FarmOperationalMode = "LIVE" | "SIMULATION" | "NOT CONFIGURED" | "OFFLINE";

export interface AgentMetric {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
}

export interface AgentLastActivity {
  summary: string;
  timestamp: string;
  level?: "nominal" | "notice" | "warning" | "interlock";
}

export interface AgentState {
  agent_id: string;
  label: string;
  domain?: string;
  status: AgentStatus;
  metrics: AgentMetric[];
  operationalMode?: FarmOperationalMode;
  attentionItemsCount?: number;
  lastActivity?: AgentLastActivity;
  simulation_warning?: string;
  lastHeartbeat: string;
  activeWorkflows: number;
  description: string;
  summary?: string;
  blockersCount?: number;
}

export type ActivityEventType =
  | "agent_run"
  | "decision"
  | "approval"
  | "rejection"
  | "stop_event"
  | "application"
  | "farm_report"
  | "alert"
  | "sync_event"
  | "failure";

export type ActivitySeverity = "nominal" | "notice" | "warning" | "interlock" | "failure";

export interface ActivityEvidenceLink {
  ruleId?: string;
  policyExplanation?: string;
  parameters?: Record<string, string | number | boolean>;
  rawHash?: string;
}

export interface ActivityEvent {
  id: string;
  time: string;
  timestampFull: string;
  isoTimestamp?: string;
  event: string;
  eventType?: ActivityEventType;
  agent: string;
  severity: ActivitySeverity;
  hash: string;
  actor?: string;
  source?: string;
  relatedEntity?: string;
  decisionEvidence?: ActivityEvidenceLink;
}

export type ConnectivityMode = "online" | "offline" | "pending";
export type NetworkConnectivity = "online" | "offline";
export type ChiefBackendReachability = "reachable" | "degraded" | "unreachable" | "simulated";
export type SynchronizationStatus = "current" | "pending" | "stale" | "not_synchronized" | "syncing";

export interface SystemMetrics {
  backend: "Online" | "Degraded" | "Offline";
  policy_engine: "Active" | "Bypassed" | "Validating";
  sync: "Current" | "Pending" | "Stale";
  agents_active: number;
  uptime: string;
  healthScore: number;
  lastSyncTimestamp: string;
}

export interface ChiefState {
  platform_state: "Running" | "Attention" | "Paused" | "Maintenance";
  status_message: StatusMessageOption;
  connectivity: ConnectivityMode;
  pendingSyncCount: number;
  lastSyncLabel: string;
  lastSyncTimestamp: string;
  metrics: SystemMetrics;
  attentionItems: AttentionItem[];
  agents: AgentState[];
  activity: ActivityEvent[];
  unreadNotificationsCount: number;
  reachability?: ChiefBackendReachability;
  networkOnline?: boolean;
  syncStatus?: SynchronizationStatus;
  resourceProvenance?: {
    system: "live" | "cached" | "mock_isolated" | "unavailable";
    agents: "live" | "cached" | "mock_isolated" | "unavailable";
    attention: "live" | "cached" | "mock_isolated" | "unavailable";
    activity: "live" | "cached" | "mock_isolated" | "unavailable";
  };
  compositeProvenance?: "live" | "cached" | "mock_isolated" | "unavailable";
  isFullyLive?: boolean;
}
