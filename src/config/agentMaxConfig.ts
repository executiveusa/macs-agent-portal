import type { AgentProfile, ProviderId } from "@/types/agentMax";

export const AGENT_MAX_BRAND = {
  platformName: "Agent Max",
  productCode: "Agent 006",
  workspaceAgents: {
    primary: "Big Max",
    secondary: "Little Max",
  },
} as const;

export const AGENT_MAX_PROVIDERS: Record<ProviderId, { label: string; purpose: string }> = {
  openai: {
    label: "ChatGPT API",
    purpose: "Primary for reliable tool calling and long workflows",
  },
  openrouter: {
    label: "OpenRouter",
    purpose: "Fallback routing and model experimentation",
  },
  nvidia: {
    label: "NVIDIA APIs",
    purpose: "Low-cost/free-tier experimentation and overflow",
  },
};

export const AGENT_MAX_PROFILES: AgentProfile[] = [
  {
    id: "big-max",
    name: "Big Max",
    codename: "Agent 006",
    role: "Complex orchestration and multi-step automations",
    upstreamBase: "Hermes agent",
    description: "Coordinates complex workflows, tool calls, and external integrations.",
    status: "active",
  },
  {
    id: "little-max",
    name: "Little Max",
    codename: "Agent 006",
    role: "Fast frontline task execution and responsive support actions",
    upstreamBase: "Space agent",
    description: "Optimized for lightweight tasks and quick response workflows.",
    status: "active",
  },
];
