import type { ModelDecision } from "./model-router.js";

export async function runOpenRouter(input: {
  apiKey?: string;
  message: string;
  decision: ModelDecision;
}) {
  if (!input.apiKey) {
    return {
      text: "MAXX model routing is ready, but OpenRouter is not configured on the private control plane.",
      usage: { promptTokens: 0, completionTokens: 0, estimatedCostUsd: 0, latencyMs: 0 },
      degraded: true,
    };
  }

  const startedAt = Date.now();
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "Agent MAXX Control Tower",
    },
    body: JSON.stringify({
      model: input.decision.model,
      messages: [
        {
          role: "system",
          content:
            "You are Agent MAXX, Stacy's private company operator. Be concise, disclose uncertainty, and never claim an external action happened unless a tool event proves it.",
        },
        { role: "user", content: input.message },
      ],
    }),
  });

  if (!response.ok) throw new Error(`OpenRouter request failed with status ${response.status}`);
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  return {
    text: payload.choices?.[0]?.message?.content ?? "MAXX returned no message.",
    usage: {
      promptTokens: payload.usage?.prompt_tokens ?? 0,
      completionTokens: payload.usage?.completion_tokens ?? 0,
      estimatedCostUsd: 0,
      latencyMs: Date.now() - startedAt,
    },
    degraded: false,
  };
}
