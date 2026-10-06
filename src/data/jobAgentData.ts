import { 
  ApplicantTruthProfile, 
  JobOverviewMetrics, 
  JobOpportunity, 
  JobApplication, 
  JobDecisionRecord, 
  JobFailureEvent 
} from '../types/jobAgent';

export const APPLICANT_TRUTH_STORE: ApplicantTruthProfile = {
  title: "Staff Cloud Infrastructure & Distributed Systems Architect",
  verifiedSeniority: "11 years production systems experience",
  verifiedSkills: [
    "Distributed consensus algorithms (Raft, Paxos)",
    "Kubernetes operator development & controller runtimes",
    "Terraform & policy-as-code infrastructure automation",
    "High-concurrency Go & Rust systems programming",
    "High-throughput event streaming (Kafka, NATS)",
    "Zero-downtime PostgreSQL & distributed SQL migrations",
    "Multi-region disaster recovery & eBPF observability"
  ],
  truthInvariants: [
    "The UI and Job Agent must never claim qualifications unverified by Applicant Truth Store.",
    "Tailored resumes and portfolios must strictly reflect actual production architectural history.",
    "Do not inflate experience levels, claim unverified security certifications, or forge credentials."
  ],
  unverifiedProhibitions: [
    "Professional Security Operations Center (SOC) experience — Not present in truth store",
    "Security Information & Event Management (SIEM) administration (Splunk/QRadar) — Not certified",
    "Incident response / digital forensics (DFIR) credentials — Strictly barred from fabrication",
    "Certified Information Systems Security Professional (CISSP) / CEH — Not held",
    "Fabricated employment titles, unrecorded tenures, or inflated headcounts — Barred by policy"
  ],
  verifiedClearance: "None requested / Civilian commercial infrastructure",
  lastTruthAudit: "Today at 06:30 AM (Authoritative Hash: sha256:truth_891e...a0)"
};

export const JOB_OVERVIEW_METRICS: JobOverviewMetrics = {
  opportunitiesScanned: 18,
  qualified: 12,
  strongMatches: 6,
  applicationsStarted: 4,
  submitted: 1,
  blocked: 1,
  approvalRequests: 1
};

export const JOB_OPPORTUNITIES: JobOpportunity[] = [
  {
    id: "opp-101",
    role: "Staff Cloud Infrastructure Architect",
    employer: "Aurora Distributed Systems",
    source: "Greenhouse ATS Direct API",
    remoteInfo: "100% Remote (US/EU timezones)",
    location: "San Francisco, CA / Remote",
    compensation: "$220,000 - $245,000 USD + Equity",
    opportunityScore: 94,
    viability: "high",
    scamRisk: "verified_legitimate",
    scamRiskNotes: "Verified enterprise domain; DKIM validated; authentic Greenhouse endpoint.",
    decision: "ASK",
    decisionReason: "Candidate is a 94.2% match against core truth store. Chief policy JOB-04 requires explicit operator ASK approval before external transmission.",
    policyRuleId: "JOB-04-EXTERNAL-DISPATCH-ASK",
    strongestMatches: [
      "Distributed consensus algorithms (Kubernetes operators)",
      "Zero-downtime database cluster migrations",
      "High-throughput multi-region cloud topology"
    ],
    gaps: [
      "Employer mentions optional GraphQL gateway experience; candidate truth profile focuses on gRPC/protobuf."
    ],
    verificationState: {
      employerDomainVerified: true,
      atsEndpointVerified: true,
      piiSafe: true,
      verificationLabel: "Verified Enterprise Entity"
    },
    discoveredAt: "Today at 06:45 AM"
  },
  {
    id: "opp-102",
    role: "Principal Systems Reliability Engineer",
    employer: "HyperScale Core Labs",
    source: "Workday Enterprise Gateway",
    remoteInfo: "Hybrid / Flexible Remote",
    location: "San Francisco, CA",
    compensation: "$210,000 - $230,000 USD",
    opportunityScore: 89,
    viability: "high",
    scamRisk: "verified_legitimate",
    scamRiskNotes: "Verified Workday tenant; SOC-2 compliant applicant endpoint.",
    decision: "APPLY",
    decisionReason: "Strong alignment on chaos engineering and Go internals. Passed automated safety gating.",
    policyRuleId: "JOB-02-AUTO-QUALIFIED-APPLY",
    strongestMatches: [
      "Go/Rust systems programming",
      "Automated chaos engineering pipelines",
      "Incident remediation automation"
    ],
    gaps: [
      "Requires familiarity with proprietary in-house RPC protocol."
    ],
    verificationState: {
      employerDomainVerified: true,
      atsEndpointVerified: true,
      piiSafe: true,
      verificationLabel: "Verified Enterprise Entity"
    },
    discoveredAt: "Today at 06:50 AM"
  },
  {
    id: "opp-103",
    role: "Senior Staff Platform Engineer",
    employer: "Vanguard Tech Infrastructure",
    source: "Lever Verified Partner Link",
    remoteInfo: "100% Remote",
    location: "New York, NY / Remote",
    compensation: "$195,000 - $220,000 USD",
    opportunityScore: 87,
    viability: "high",
    scamRisk: "verified_legitimate",
    scamRiskNotes: "Lever verified webhook integration; established tech firm.",
    decision: "APPLY",
    decisionReason: "Core developer platform enablement role directly matched with Terraform and K8s truth profile.",
    policyRuleId: "JOB-02-AUTO-QUALIFIED-APPLY",
    strongestMatches: [
      "Developer platform tooling & CLI design",
      "Terraform modular infrastructure-as-code",
      "Multi-tenant Kubernetes namespace isolation"
    ],
    gaps: [
      "Prior exposure to AWS CDK desired (candidate has Terraform mastery)."
    ],
    verificationState: {
      employerDomainVerified: true,
      atsEndpointVerified: true,
      piiSafe: true,
      verificationLabel: "Verified Enterprise Entity"
    },
    discoveredAt: "Today at 07:00 AM"
  },
  {
    id: "opp-104",
    role: "Lead SOC Security & Incident Architect",
    employer: "CyberDefense Global Corp",
    source: "External Board Scraper",
    remoteInfo: "Remote",
    location: "Washington, DC / Remote",
    compensation: "$180,000 - $205,000 USD",
    opportunityScore: 41,
    viability: "low",
    scamRisk: "verified_legitimate",
    scamRiskNotes: "Real organization, but job requires specific SOC/SIEM certifications not held by candidate.",
    decision: "REJECT",
    decisionReason: "REJECTED by Chief: Role requires 5+ years SOC/SIEM administration & CISSP certification. Under Applicant Truth Store rules, Chief will never fabricate unverified security experience.",
    policyRuleId: "TRUTH-STORE-PROHIBITION-RULE",
    strongestMatches: [
      "Linux server hardening",
      "Network isolation policies"
    ],
    gaps: [
      "SOC Tier 3 operational experience (UNVERIFIED / PROHIBITED FROM CLAIMING)",
      "SIEM administration (Splunk/QRadar) (UNVERIFIED)",
      "CISSP / CEH certification (UNVERIFIED)"
    ],
    verificationState: {
      employerDomainVerified: true,
      atsEndpointVerified: true,
      piiSafe: true,
      verificationLabel: "Truth Store Mismatch (Auto-Rejected)"
    },
    discoveredAt: "Today at 07:15 AM"
  },
  {
    id: "opp-105",
    role: "Fast-Track Cloud Infrastructure Lead",
    employer: "Crypto Genesis Global Network",
    source: "Unverified Aggregator Link",
    remoteInfo: "100% Remote",
    location: "Global Remote",
    compensation: "$350,000 USD (Suspicious outlier)",
    opportunityScore: 32,
    viability: "low",
    scamRisk: "high",
    scamRiskNotes: "CRITICAL SCAM RISK: Unregistered shell domain created 4 days ago; directs candidates to unencrypted Telegram chat; requests equipment deposit.",
    decision: "STOP",
    decisionReason: "Chief Scam Risk Guard blocked this opportunity. High risk of PII harvesting and fraudulent advance-fee scam.",
    policyRuleId: "SCAM-GUARD-MALICIOUS-DOMAIN-STOP",
    strongestMatches: [],
    gaps: [
      "No verifiable corporate presence or physical registry",
      "Unencrypted communication channel violates Chief PII policies"
    ],
    verificationState: {
      employerDomainVerified: false,
      atsEndpointVerified: false,
      piiSafe: false,
      verificationLabel: "BLOCKED: High Scam Risk"
    },
    discoveredAt: "Today at 07:20 AM"
  },
  {
    id: "opp-106",
    role: "Lead DevOps & Observability Architect",
    employer: "Nexus Grid Cloud",
    source: "Direct Company Portal",
    remoteInfo: "Remote (US)",
    location: "Austin, TX / Remote",
    compensation: "$190,000 - $210,000 USD",
    opportunityScore: 82,
    viability: "moderate",
    scamRisk: "verified_legitimate",
    scamRiskNotes: "Verified Austin tech company; standard ATS portal.",
    decision: "ASK",
    decisionReason: "Compensation sits near lower threshold boundary ($190k). Chief asks owner before proceeding.",
    policyRuleId: "COMPENSATION-FLOOR-ASK-GATE",
    strongestMatches: [
      "Prometheus & OpenTelemetry pipelines",
      "Multi-region failover automation"
    ],
    gaps: [
      "Prefers Google Cloud Platform; candidate primary experience is AWS & Kubernetes bare metal."
    ],
    verificationState: {
      employerDomainVerified: true,
      atsEndpointVerified: true,
      piiSafe: true,
      verificationLabel: "Verified Enterprise Entity"
    },
    discoveredAt: "Today at 07:25 AM"
  }
];

export const JOB_APPLICATIONS: JobApplication[] = [
  {
    id: "app-201",
    opportunityId: "opp-101",
    role: "Staff Cloud Infrastructure Architect",
    employer: "Aurora Distributed Systems",
    lifecycleState: "needs attention",
    stateExplanation: "Tailored portfolio and resume generated against Applicant Truth Store. Chief policy JOB-04 holds submission pending owner ASK approval in Inbox.",
    startedAt: "Today at 06:55 AM",
    updatedAt: "Today at 06:58 AM",
    submissionMedium: "Greenhouse Direct REST API",
    packageHash: "sha256:pkg_aurora_99182ab7",
    requiresAttention: true,
    attentionReason: "Pending Operator Approval (ASK Gate in Inbox)"
  },
  {
    id: "app-202",
    opportunityId: "opp-102",
    role: "Principal Systems Reliability Engineer",
    employer: "HyperScale Core Labs",
    lifecycleState: "receipt captured",
    stateExplanation: "Submission successfully accepted by HyperScale Workday tenant. Official ATS receipt token issued.",
    startedAt: "Yesterday at 04:30 PM",
    updatedAt: "Yesterday at 04:32 PM",
    submissionMedium: "Workday Enterprise ATS",
    packageHash: "sha256:pkg_hyperscale_00418c",
    receiptId: "RCPT-HS-2026-994201"
  },
  {
    id: "app-203",
    opportunityId: "opp-103",
    role: "Senior Staff Platform Engineer",
    employer: "Vanguard Tech Infrastructure",
    lifecycleState: "preparing",
    stateExplanation: "Drafting tailored cover letter focusing on multi-cluster Kubernetes orchestration without violating truth invariants.",
    startedAt: "Today at 07:10 AM",
    updatedAt: "Today at 07:12 AM",
    submissionMedium: "Lever Direct API",
    packageHash: "sha256:draft_vanguard_88204"
  },
  {
    id: "app-204",
    opportunityId: "opp-105",
    role: "Fast-Track Cloud Infrastructure Lead",
    employer: "Crypto Genesis Global Network",
    lifecycleState: "blocked",
    stateExplanation: "Chief Scam Guard blocked application submission permanently due to high probability phishing domain.",
    startedAt: "Today at 07:20 AM",
    updatedAt: "Today at 07:21 AM",
    submissionMedium: "Blocked Outbound Connector",
    requiresAttention: false,
    attentionReason: "Blocked by Chief Safety Interlock"
  }
];

export const JOB_DECISION_RECORDS: JobDecisionRecord[] = [
  {
    id: "dec-01",
    opportunityId: "opp-101",
    role: "Staff Cloud Infrastructure Architect",
    employer: "Aurora Distributed Systems",
    decision: "ASK",
    decidedAt: "Today at 06:55 AM",
    authoritativeReason: "Match score 94% exceeds quality threshold. External dispatch requires explicit owner authorization.",
    policyRule: "JOB-04-EXTERNAL-DISPATCH-ASK",
    matchScore: 94,
    truthValidationChecked: true
  },
  {
    id: "dec-02",
    opportunityId: "opp-102",
    role: "Principal Systems Reliability Engineer",
    employer: "HyperScale Core Labs",
    decision: "APPLY",
    decidedAt: "Yesterday at 04:30 PM",
    authoritativeReason: "Full alignment on distributed reliability engineering. Passed automated policy criteria.",
    policyRule: "JOB-02-AUTO-QUALIFIED-APPLY",
    matchScore: 89,
    truthValidationChecked: true
  },
  {
    id: "dec-03",
    opportunityId: "opp-104",
    role: "Lead SOC Security & Incident Architect",
    employer: "CyberDefense Global Corp",
    decision: "REJECT",
    decidedAt: "Today at 07:15 AM",
    authoritativeReason: "Requires 5+ years SOC Tier 3 and incident forensics. Applicant Truth Store strictly bars fabricating unverified experience.",
    policyRule: "TRUTH-STORE-PROHIBITION-RULE",
    matchScore: 41,
    truthValidationChecked: true
  },
  {
    id: "dec-04",
    opportunityId: "opp-105",
    role: "Fast-Track Cloud Infrastructure Lead",
    employer: "Crypto Genesis Global Network",
    decision: "STOP",
    decidedAt: "Today at 07:20 AM",
    authoritativeReason: "Flagged by Scam Risk Guard: Unverified domain, suspicious compensation outlier, and unencrypted Telegram channel.",
    policyRule: "SCAM-GUARD-MALICIOUS-DOMAIN-STOP",
    matchScore: 32,
    truthValidationChecked: true
  }
];

export const JOB_FAILURES: JobFailureEvent[] = [
  {
    id: "fail-01",
    timestamp: "Today at 05:50 AM",
    category: "Rate Limit",
    title: "ATS Transmission Rate Limit (HTTP 429)",
    details: "Remote Greenhouse endpoint returned HTTP 429 Too Many Requests. Chief backoff policy engaged (+300s). No data lost.",
    relatedEntity: "Webhook Dispatch #418",
    retryState: "Auto-retrying",
    errorSignature: "ERR_HTTP_429_RATE_LIMIT_BACKOFF"
  },
  {
    id: "fail-02",
    timestamp: "Today at 07:20 AM",
    category: "Scam Risk Block",
    title: "Phishing Domain Blocked: Crypto Genesis Global",
    details: "Domain flagged by heuristic reputation engine. Outbound applicant submission halted by Chief policy guard.",
    relatedEntity: "opp-105",
    retryState: "Permanently Blocked",
    errorSignature: "POLICY_SCAM_GUARD_BLOCKED"
  },
  {
    id: "fail-03",
    timestamp: "Today at 07:15 AM",
    category: "Truth Store Mismatch",
    title: "Unverified SOC Credential Mismatch",
    details: "Job required 5+ years SOC/SIEM administration. Chief blocked application to preserve candidate truth invariance.",
    relatedEntity: "opp-104",
    retryState: "Permanently Blocked",
    errorSignature: "TRUTH_STORE_UNVERIFIED_GAP_REJECT"
  }
];
