export type JobDecisionType = 'APPLY' | 'REJECT' | 'STOP' | 'ASK';

export type JobApplicationLifecycleState =
  | 'discovered'
  | 'evaluated'
  | 'approved'
  | 'preparing'
  | 'submission attempted'
  | 'submitted'
  | 'receipt captured'
  | 'failed'
  | 'blocked'
  | 'needs attention';

export type ScamRiskLevel = 'verified_legitimate' | 'low' | 'moderate' | 'high';

export type JobViability = 'high' | 'moderate' | 'low';

export interface ApplicantTruthProfile {
  title: string;
  verifiedSeniority: string;
  verifiedSkills: string[];
  truthInvariants: string[];
  unverifiedProhibitions: string[]; // Explicit prohibitions: no SOC, SIEM, incident response fabrication
  verifiedClearance: string;
  lastTruthAudit: string;
}

export interface JobOpportunity {
  id: string;
  role: string;
  employer: string;
  source: string;
  remoteInfo: string;
  location: string;
  compensation?: string;
  opportunityScore: number;
  viability: JobViability;
  scamRisk: ScamRiskLevel;
  scamRiskNotes: string;
  decision: JobDecisionType;
  decisionReason: string;
  policyRuleId: string;
  strongestMatches: string[];
  gaps: string[];
  verificationState: {
    employerDomainVerified: boolean;
    atsEndpointVerified: boolean;
    piiSafe: boolean;
    verificationLabel: string;
  };
  discoveredAt: string;
}

export interface JobApplication {
  id: string;
  opportunityId: string;
  role: string;
  employer: string;
  lifecycleState: JobApplicationLifecycleState;
  stateExplanation: string;
  startedAt: string;
  updatedAt: string;
  packageHash?: string;
  receiptId?: string;
  submissionMedium: string;
  requiresAttention?: boolean;
  attentionReason?: string;
}

export interface JobDecisionRecord {
  id: string;
  opportunityId: string;
  role: string;
  employer: string;
  decision: JobDecisionType;
  decidedAt: string;
  authoritativeReason: string;
  policyRule: string;
  matchScore: number;
  truthValidationChecked: boolean;
}

export interface JobFailureEvent {
  id: string;
  timestamp: string;
  category: 'Rate Limit' | 'Policy Interlock' | 'Truth Store Mismatch' | 'Scam Risk Block';
  title: string;
  details: string;
  relatedEntity: string;
  retryState: 'Auto-retrying' | 'Permanently Blocked' | 'Awaiting Human Intervention';
  errorSignature: string;
}

export interface JobOverviewMetrics {
  opportunitiesScanned: number;
  qualified: number;
  strongMatches: number;
  applicationsStarted: number;
  submitted: number;
  blocked: number;
  approvalRequests: number;
}
