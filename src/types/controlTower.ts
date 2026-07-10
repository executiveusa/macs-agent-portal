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

export type FeatureFlags = {
  MAXX_HERMES_ENABLED: boolean;
  MAXX_VOICE_ENABLED: boolean;
  MAXX_BROWSER_ENABLED: boolean;
  MAXX_BROWSER_MUTATIONS_ENABLED: boolean;
  MAXX_MEMORY_ENABLED: boolean;
  MAXX_SCHEDULER_ENABLED: boolean;
  MAXX_PRODUCTION_MUTATIONS_ENABLED: boolean;
};

export type OwnerStrategy = {
  operatorId: string;
  preferredProvider?: "groq" | "openrouter";
  riskTolerance: "conservative" | "standard" | "permissive";
  forbiddenActions: string[];
  maxCostPerRequestUsd?: number;
  updatedAt: string;
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
  featureFlags: FeatureFlags;
  emergencyDisabled: boolean;
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
