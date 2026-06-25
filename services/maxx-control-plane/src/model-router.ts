export type TaskClass =
  | "conversation"
  | "research"
  | "planning"
  | "coding"
  | "vision_browser"
  | "high_risk";

export type ModelDecision = {
  model: string;
  taskClass: TaskClass;
  costTier: "low" | "standard" | "high";
  reason: string;
};

const ROUTES: Record<TaskClass, Omit<ModelDecision, "taskClass">> = {
  conversation: {
    model: "openai/gpt-4.1-mini",
    costTier: "low",
    reason: "Low-latency model selected for conversation and summarization",
  },
  research: {
    model: "perplexity/sonar-pro",
    costTier: "standard",
    reason: "Research model selected for retrieval-heavy work",
  },
  planning: {
    model: "anthropic/claude-sonnet-4",
    costTier: "standard",
    reason: "Reasoning model selected for planning and synthesis",
  },
  coding: {
    model: "openai/gpt-4.1",
    costTier: "standard",
    reason: "Tool-capable coding model selected for repository work",
  },
  vision_browser: {
    model: "google/gemini-2.5-pro",
    costTier: "standard",
    reason: "Multimodal model selected for browser and visual work",
  },
  high_risk: {
    model: "anthropic/claude-sonnet-4",
    costTier: "high",
    reason: "High-reliability model selected for an approval-gated action",
  },
};

function classify(message: string): TaskClass {
  const value = message.toLowerCase();
  if (/(purchase|delete|publish|send|payment|permission)/.test(value)) return "high_risk";
  if (/(browser|website|screenshot|image|vision)/.test(value)) return "vision_browser";
  if (/(code|typescript|repository|refactor|test|build|debug)/.test(value)) return "coding";
  if (/(research|sources|find leads|investigate|market)/.test(value)) return "research";
  if (/(plan|strategy|workflow|architecture)/.test(value)) return "planning";
  return "conversation";
}

export function routeModel(input: { message: string; manualModel?: string }): ModelDecision {
  const taskClass = classify(input.message);
  if (input.manualModel) {
    return {
      model: input.manualModel,
      taskClass,
      costTier: "standard",
      reason: "Manual operator override",
    };
  }

  return { taskClass, ...ROUTES[taskClass] };
}
