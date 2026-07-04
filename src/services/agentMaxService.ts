import { AGENT_MAX_PROFILES, AGENT_MAX_SKILL_ROUTES } from "@/config/agentMaxConfig";
import type { AgentCommandRequest, AgentCommandResult, AgentId } from "@/types/agentMax";
import {
  createHermesConversation,
  getHermesApiKey,
  isHermesConfigured,
  sendHermesMessage,
} from "@/services/hermesService";

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
  const agentProfile = AGENT_MAX_PROFILES.find((agent) => agent.id === selectedAgent);
  const agentName = agentProfile?.name ?? "Agent Max";

  // Route to Hermes for big-max or explicit hermes provider selection
  if (request.provider === "hermes" || (selectedAgent === "big-max" && isHermesConfigured())) {
    try {
      const apiKey = getHermesApiKey();
      const conversation = createHermesConversation();
      const { reply } = await sendHermesMessage(conversation, request.command, apiKey);

      return {
        runId: crypto.randomUUID(),
        summary: reply,
        selectedAgent,
        provider: "hermes",
        route: skillRoute?.route,
        skillId: skillRoute?.skillId,
        commandHint: skillRoute?.commandHint,
        safetyNotes: skillRoute ? [...skillRoute.safetyNotes] : undefined,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Hermes connection failed";
      return {
        runId: crypto.randomUUID(),
        summary: `Hermes unavailable: ${message}. Falling back to local execution.`,
        selectedAgent,
        provider: request.provider,
        createdAt: new Date().toISOString(),
      };
    }
  }

  // Fallback: simulated response for other providers (configure their APIs as needed)
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
