import { supabase } from "@/integrations/supabase/client";
import type { ChatResponse, ControlTowerBootstrap, Mission } from "@/types/controlTower";

const baseUrl = (import.meta.env.VITE_CONTROL_TOWER_API_URL ?? "http://127.0.0.1:8787").replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const devBypass = import.meta.env.DEV && import.meta.env.VITE_MAXX_DEV_AUTH_BYPASS === "true";
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
  chat: (message: string, model?: string, runId?: string) =>
    request<ChatResponse>("/v1/chat", {
      method: "POST",
      body: JSON.stringify({ message, model: model || undefined, runId }),
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
};
