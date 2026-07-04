export type AgentId = "big-max" | "little-max";

export type AgentStatus = "active" | "inactive" | "processing";

export type ProviderId = "openai" | "openrouter" | "nvidia" | "hermes";

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
  route?: string;
  skillId?: string;
  commandHint?: string;
  safetyNotes?: string[];
  createdAt: string;
}

export interface HermesMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface HermesChatRequest {
  model: string;
  messages: HermesMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface HermesChatResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
