import type { ModelDecision } from "./model-router.js";

/**
 * Groq provider — OpenAI-compatible, low-latency inference for MAXX.
 *
 * Groq is the primary engine for conversation, summarization, and draft
 * follow-up because of its speed. OpenRouter remains the fallback for
 * heavier task classes (planning, coding, vision, high-risk).
 */
export async function runGroq(input: {
  apiKey?: string;
  message: string;
  decision: ModelDecision;
}) {
  if (!input.apiKey) {
    return {
      text: "MAXX is wired for Groq, but GROQ_API_KEY is not configured on the control plane.",
      usage: { promptTokens: 0, completionTokens: 0, estimatedCostUsd: 0, latencyMs: 0 },
      degraded: true,
    };
  }

  const startedAt = Date.now();
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.decision.model,
      messages: [
        {
          role: "system",
          content:
            "You are Agent MAXX, a follow-up recovery operator for nonprofits and social-purpose teams. Be concise, specific, and never claim an action happened unless a tool event proves it. Default to drafting the next approved follow-up step.",
        },
        { role: "user", content: input.message },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) throw new Error(`Groq request failed with status ${response.status}`);
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
