import { AGENT_MAX_PROFILES, AGENT_MAX_SKILL_ROUTES } from "@/config/agentMaxConfig";
import type { AgentCommandRequest, AgentCommandResult, AgentId } from "@/types/agentMax";

const chooseAgent = (target: AgentCommandRequest["target"], command: string): AgentId => {
  if (target !== "auto") {
    return target;
  }

  const complexKeywords = ["multi-step", "pipeline", "integrate", "sync", "automation", "strategy"];
  const isComplex = complexKeywords.some((keyword) => command.toLowerCase().includes(keyword));
  return isComplex ? "big-max" : "little-max";
};

const chooseSkillRoute = (command: string) => {
  const normalized = command.toLowerCase();
  const opusRoute = AGENT_MAX_SKILL_ROUTES.opusclip;
  const isOpusClip = opusRoute.triggerKeywords.some((keyword) => normalized.includes(keyword));
  return isOpusClip ? opusRoute : null;
};

export const runAgentMaxCommand = async (
  request: AgentCommandRequest,
): Promise<AgentCommandResult> => {
  const selectedAgent = chooseAgent(request.target, request.command);
  const skillRoute = chooseSkillRoute(request.command);
  const agentName = AGENT_MAX_PROFILES.find((agent) => agent.id === selectedAgent)?.name ?? "Agent Max";

  await new Promise((resolve) => setTimeout(resolve, 1200));

  return {
    runId: crypto.randomUUID(),
    summary: `${agentName} accepted command in ${request.approvalMode.toUpperCase()} mode: ${request.command}`,
    selectedAgent,
    provider: request.provider,
    route: skillRoute?.route,
    skillId: skillRoute?.skillId,
    commandHint: skillRoute?.commandHint,
    safetyNotes: skillRoute ? [...skillRoute.safetyNotes] : undefined,
    createdAt: new Date().toISOString(),
  };
};
