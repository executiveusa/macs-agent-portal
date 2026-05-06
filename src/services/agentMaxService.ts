import { AGENT_MAX_PROFILES } from "@/config/agentMaxConfig";
import type { AgentCommandRequest, AgentCommandResult, AgentId } from "@/types/agentMax";

const chooseAgent = (target: AgentCommandRequest["target"], command: string): AgentId => {
  if (target !== "auto") {
    return target;
  }

  const complexKeywords = ["multi-step", "pipeline", "integrate", "sync", "automation", "strategy"];
  const isComplex = complexKeywords.some((keyword) => command.toLowerCase().includes(keyword));
  return isComplex ? "big-max" : "little-max";
};

export const runAgentMaxCommand = async (
  request: AgentCommandRequest,
): Promise<AgentCommandResult> => {
  const selectedAgent = chooseAgent(request.target, request.command);
  const agentName = AGENT_MAX_PROFILES.find((agent) => agent.id === selectedAgent)?.name ?? "Agent Max";

  await new Promise((resolve) => setTimeout(resolve, 1200));

  return {
    runId: crypto.randomUUID(),
    summary: `${agentName} accepted command in ${request.approvalMode.toUpperCase()} mode: ${request.command}`,
    selectedAgent,
    provider: request.provider,
    createdAt: new Date().toISOString(),
  };
};
