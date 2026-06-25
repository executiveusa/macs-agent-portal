import type { DependencyMap } from "@/lib/controlTower";

export type MissionStatus = "needs_operator" | "working" | "ready" | "completed" | "failed" | "cancelled";

export type Mission = {
  id: string;
  objective: string;
  status: MissionStatus;
  runId: string;
  createdAt: string;
  updatedAt: string;
};

export type Approval = {
  id: string;
  runId: string;
  action: string;
  summary: string;
  status: "pending" | "approved" | "rejected";
};

export type Skill = {
  id: string;
  version: string;
  purpose: string;
  source: string;
  health: "ready" | "degraded" | "disabled";
  mutation: "read_only" | "mutating";
  approvalPolicy: "automatic" | "approval_required";
  requiredEnvironment: string[];
};

export type UsageSummary = {
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
  requests: number;
};

export type ControlTowerBootstrap = {
  agent: {
    name: string;
    status: "online" | "degraded" | "offline";
    currentIntent: string;
  };
  dependencies: DependencyMap;
  missions: Mission[];
  approvals: Approval[];
  skills: Skill[];
  usage: UsageSummary;
  browser: {
    state: "idle" | "active" | "approval" | "unavailable";
    currentUrl: string | null;
    recentActions: Array<{ label: string; createdAt: string }>;
  };
};

export type ChatResponse = {
  id: string;
  text: string;
  model: string;
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
