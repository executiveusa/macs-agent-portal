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
  hermes: {
    label: "Hermes (NousResearch)",
    purpose: "Primary — Emerald Tablets™ operator, 60-turn context, Maxx agency persona",
  },
  openai: {
    label: "ChatGPT API",
    purpose: "Reliable tool calling and long workflows",
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
    upstreamBase: "NousResearch Hermes (openai/gpt-5.5)",
    description: "Coordinates complex workflows, tool calls, and external integrations. Runs on Hermes with Emerald Tablets™ protocol.",
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

export const AGENT_MAX_SKILL_ROUTES = {
  opusclip: {
    route: "media_execution",
    skillId: "maxx-opusclip",
    commandHint: "npm run maxx:opusclip -- --help",
    triggerKeywords: [
      "opusclip",
      "clip",
      "shorts",
      "transcript",
      "social copy",
      "publish video",
      "schedule video",
    ],
    safetyNotes: [
      "Browser UI does not call OpusClip directly.",
      "OPUSCLIP_API_KEY must stay in runtime env.",
      "Submit, publish, schedule, thumbnail, and edit jobs require explicit confirmation flags.",
    ],
  },
} as const;
