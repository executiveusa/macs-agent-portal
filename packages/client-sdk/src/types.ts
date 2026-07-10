export type MissionStatus = "needs_operator" | "working" | "ready" | "completed" | "failed" | "cancelled";

export type Mission = {
  id: string;
  operatorId?: string;
  objective: string;
  status: MissionStatus;
  runId: string;
  createdAt: string;
  updatedAt: string;
};

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";

export type Approval = {
  id: string;
  runId: string;
  action: string;
  summary: string;
  status: ApprovalStatus;
  createdAt: string;
  expiresAt: string;
  decidedAt?: string;
  decidedBy?: string;
};

export type ChatResponse = {
  id: string;
  text: string;
  model: string;
  provider: "groq" | "openrouter";
  taskClass: string;
  routingReason: string;
  approvalState: "required" | "not_required";
  skills: string[];
  stage: string;
  degraded: boolean;
  usage: {
    promptTokens: number;
    completionTokens: number;
    estimatedCostUsd: number;
    latencyMs: number;
  };
};

export type HermesRunState = {
  runId: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  startedAt: string | null;
  endedAt: string | null;
  stage: string;
  progress: number;
  result: Record<string, unknown> | null;
  error: string | null;
};

export type MemorySearchResult = {
  document: {
    id: string;
    runId: string;
    missionId: string;
    source: string;
    title: string;
    content: string;
    tags: string[];
    createdAt: string;
  };
  score: number;
};

export type OwnerStrategy = {
  operatorId: string;
  preferredProvider?: "groq" | "openrouter";
  riskTolerance: "conservative" | "standard" | "permissive";
  forbiddenActions: string[];
  maxCostPerRequestUsd?: number;
  updatedAt: string;
};

export type ScheduledJobState = {
  id: string;
  name: string;
  intervalMs: number;
  nextRunAt: number;
  lastRunAt: number | null;
  lastStatus: "idle" | "running" | "succeeded" | "failed";
  lastError: string | null;
};

export type UsageSummary = {
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
  requests: number;
};

export class MaxxApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "MaxxApiError";
  }
}
