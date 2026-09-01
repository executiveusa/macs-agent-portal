import { supabase } from "@/integrations/supabase/client";
import type { ChatResponse, ControlTowerBootstrap, Mission, OwnerStrategy } from "@/types/controlTower";

const defaultUrl = "https://api.thepaulieffect.com/maxx";
const configuredUrl = import.meta.env.VITE_CONTROL_TOWER_API_URL ?? import.meta.env.VITE_MAXX_CONTROL_PLANE_URL ?? defaultUrl;
const baseUrl = configuredUrl.replace(/\/$/, "");
const MAXX_MODE_MARKER = "[[MAXX_MODE:POWER]]";

export type MaxxChatMode = "normal" | "max";

export type VoiceSession = {
  clientSecret?: string;
  expiresAt?: number;
  model?: string;
  provider: string;
};

export type VoiceSynthesis = {
  audioBase64: string;
  durationMs: number;
  format: string;
};

export type VoiceHealth = {
  voice: {
    enabled: boolean;
    inputProvider: string;
    inputReady: boolean;
    outputProvider: string;
    outputReady: boolean;
  };
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const devBypass = import.meta.env.DEV && import.meta.env.VITE_MAXX_DEV_AUTH_BYPASS === "true";
  const token = devBypass ? undefined : (await supabase.auth.getSession()).data.session?.access_token;
  const url = `${baseUrl}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "network request failed";
    throw new Error(`MAXX connection failed at ${baseUrl}${path}: ${message}`, { cause: error });
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error ?? `MAXX control plane returned ${response.status}`);
  }
  return payload as T;
}

export const controlTowerApi = {
  bootstrap: () => request<ControlTowerBootstrap>("/v1/control-tower/bootstrap"),
  chat: (message: string, model?: string, runId?: string, mode: MaxxChatMode = "normal") =>
    request<ChatResponse>("/v1/chat", {
      method: "POST",
      body: JSON.stringify({
        message: mode === "max" ? `${MAXX_MODE_MARKER}\n${message}` : message,
        model: model || undefined,
        runId,
      }),
    }),
  createMission: (objective: string) =>
    request<Mission & { stages: Array<{ id: string; purpose: string }> }>("/v1/missions", {
      method: "POST",
      body: JSON.stringify({ objective }),
    }),
  decideApproval: (id: string, decision: "approve" | "reject") =>
    request(`/v1/approvals/${id}/${decision}`, { method: "POST" }),
  runSkill: (id: string, runId?: string) =>
    request(`/v1/skills/${id}/run`, { method: "POST", body: JSON.stringify({ runId }) }),
  startBrowserAction: (action: string, target?: string) =>
    request("/v1/browser/sessions", {
      method: "POST",
      body: JSON.stringify({ action, target }),
    }),
  getStrategy: () => request<OwnerStrategy>("/v1/strategy"),
  setStrategy: (input: Partial<Omit<OwnerStrategy, "operatorId" | "updatedAt">>) =>
    request<OwnerStrategy>("/v1/strategy", { method: "PUT", body: JSON.stringify(input) }),
  searchMemory: (query: string) =>
    request<{ results: Array<{ document: { id: string; title: string; content: string; createdAt: string }; score: number }>; score?: number }>(
      `/v1/memory/search?q=${encodeURIComponent(query)}`,
    ),
  createVoiceSession: () => request<VoiceSession>("/v1/voice/session", { method: "POST" }),
  transcribeVoice: (audioBase64: string, mimeType = "audio/wav") =>
    request<{ text: string; confidence: number }>("/v1/voice/transcribe", {
      method: "POST",
      body: JSON.stringify({ audioBase64, mimeType }),
    }),
  synthesizeVoice: (text: string, voiceId?: string) =>
    request<VoiceSynthesis>("/v1/voice/synthesize", {
      method: "POST",
      body: JSON.stringify({ text, voiceId }),
    }),
  getVoiceHealth: () => request<VoiceHealth>("/v1/voice/health"),
};
