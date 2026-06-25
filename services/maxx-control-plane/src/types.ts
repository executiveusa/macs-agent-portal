export type Operator = {
  id: string;
  email: string;
};

export type DependencyState = {
  configured: boolean;
  status: "ready" | "degraded" | "unavailable";
  detail: string;
};

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

export type RunEvent = {
  id: string;
  runId: string;
  type: string;
  message: string;
  createdAt: string;
  data?: Record<string, unknown>;
};

export type Approval = {
  id: string;
  runId: string;
  action: string;
  summary: string;
  status: "pending" | "approved" | "rejected";
  decidedAt?: string;
  decidedBy?: string;
};

export type UsageRecord = {
  id: string;
  runId?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  createdAt: string;
};

export type SkillRecord = {
  id: string;
  version: string;
  purpose: string;
  source: string;
  health: "ready" | "degraded" | "disabled";
  mutation: "read_only" | "mutating";
  approvalPolicy: "automatic" | "approval_required";
  requiredEnvironment: string[];
  filesystemPermissions: string[];
  browserPermissions: string[];
  command?: string[];
};
