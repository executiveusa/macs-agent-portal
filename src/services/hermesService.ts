import type { HermesChatRequest, HermesChatResponse, HermesMessage } from "@/types/agentMax";

const NOUS_BASE_URL = "https://inference-api.nousresearch.com/v1";
const HERMES_MODEL = "openai/gpt-5.5";

const MAXX_SYSTEM_PROMPT = `You are HERMES, the AI operator for Macs Digital Media — a growth agency run by Maxx.

Mission: Help Maxx and his clients grow their businesses through smart automation, content strategy, and digital marketing.

Personality: Confident, direct, results-oriented. No fluff. Lead with outcomes. Short sentences, clear action items.

Core capabilities: client management, content strategy, workflow triggering, lead qualification, and reporting.

Protocol (Emerald Tablets™): Scan context before acting. Prefer reversible actions. Escalate to human for contracts, payments over $500, destructive ops. Never expose secrets.`;

export interface HermesConversation {
  messages: HermesMessage[];
}

export const createHermesConversation = (): HermesConversation => ({
  messages: [{ role: "system", content: MAXX_SYSTEM_PROMPT }],
});

export const sendHermesMessage = async (
  conversation: HermesConversation,
  userMessage: string,
  apiKey: string,
): Promise<{ reply: string; updatedConversation: HermesConversation }> => {
  const messages: HermesMessage[] = [
    ...conversation.messages,
    { role: "user", content: userMessage },
  ];

  const requestBody: HermesChatRequest = {
    model: HERMES_MODEL,
    messages,
    max_tokens: 1024,
    temperature: 0.7,
  };

  const response = await fetch(`${NOUS_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hermes API error ${response.status}: ${errorText}`);
  }

  const data: HermesChatResponse = await response.json();
  const reply = data.choices[0]?.message?.content ?? "";

  const updatedConversation: HermesConversation = {
    messages: [...messages, { role: "assistant", content: reply }],
  };

  // Enforce max_turns by trimming oldest non-system messages
  const MAX_TURNS = 60;
  const systemMsg = updatedConversation.messages[0];
  const conversationMsgs = updatedConversation.messages.slice(1);
  if (conversationMsgs.length > MAX_TURNS * 2) {
    updatedConversation.messages = [systemMsg, ...conversationMsgs.slice(-MAX_TURNS * 2)];
  }

  return { reply, updatedConversation };
};

export const isHermesConfigured = (): boolean => {
  return Boolean(import.meta.env.VITE_NOUS_API_KEY);
};

export const getHermesApiKey = (): string => {
  return import.meta.env.VITE_NOUS_API_KEY ?? "";
};
