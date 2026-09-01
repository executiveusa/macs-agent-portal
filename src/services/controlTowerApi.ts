import { supabase } from "@/integrations/supabase/client";
import type { ChatResponse, ControlTowerBootstrap, Mission, OwnerStrategy } from "@/types/controlTower";

const TEMP_PUBLIC_DASHBOARD = true;
const defaultUrl = "https://api.thepaulieffect.com/maxx";

const baseUrl = (import.meta.env.VITE_CONTROL_TOWER_API_URL ?? import.meta.env.VITE_MAXX_CONTROL_PLANE_URL ?? defaultUrl).replace(/\/$/, "");
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
  const devBypass = TEMP_PUBLIC_DASHBOARD || (import.meta.env.DEV && import.meta.env.VITE_MAXX_DEV_AUTH_BYPASS === "true");
  const token = devBypass ? undefined : (await supabase.auth.getSession()).data.session?.access_token;
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

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
        message,
        model,
        runId,
        mode: mode === "max" ? "max" : "normal",
      }),
    }),
  createMission: (objective: string) =>
    request<Mission>("/v1/control-tower/missions", {
      method: "POST",
      body: JSON.stringify({ objective }),
    }),
  decideApproval: (id: string, decision: "approved" | "rejected") =>
    request<Approval>(`/v1/control-tower/approvals/${id}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision }),
    }),
  runSkill: (skillId: string, runId?: string) =>
    request<{ skillId: string; status: string; result: unknown }>(`/v1/control-tower/skills/${skillId}/run`, {
      method: "POST",
      body: JSON.stringify({ runId }),
    }),
  startBrowserAction: (action: string, target?: string) =>
    request<{ accepted: boolean; action: string; target?: string }>("/v1/control-tower/browser/action", {
      method: "POST",
      body: JSON.stringify({ action, target }),
    }),
  getStrategy: () => request<OwnerStrategy>("/v1/owner-strategy"),
  setStrategy: (strategy: OwnerStrategyInput) =>
    request<OwnerStrategy>("/v1/owner-strategy", {
      method: "PUT",
      body: JSON.stringify(strategy),
    }),
  startVoiceSession: () => request<VoiceSession>("/v1/voice/session", { method: "POST" }),
  synthesizeSpeech: (text: string) =>
    request<VoiceSynthesis>("/v1/voice/synthesize", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  getVoiceHealth: () => request<VoiceHealth>("/v1/voice/health"),
};
