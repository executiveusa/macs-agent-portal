export type AgentId = "big-max" | "little-max";

export type AgentStatus = "active" | "inactive" | "processing";

export type ProviderId = "openai" | "openrouter" | "nvidia";

export interface AgentProfile {
  id: AgentId;
  name: string;
  codename: string;
  role: string;
  upstreamBase: string;
  description: string;
  status: AgentStatus;
}

export interface AgentCommandRequest {
  command: string;
  target: AgentId | "auto";
  provider: ProviderId;
  approvalMode: "approval" | "yolo";
}

export interface AgentCommandResult {
  runId: string;
  summary: string;
  selectedAgent: AgentId;
  provider: ProviderId;
  createdAt: string;
}
