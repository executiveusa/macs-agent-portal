import { supabase } from "@/integrations/supabase/client";

const baseUrl = (import.meta.env.VITE_CONTROL_TOWER_API_URL ?? "http://127.0.0.1:8787").replace(/\/$/, "");

export type PupKind = "chief_of_staff" | "superdoer" | "business_in_a_box" | "custom";
export type PupStatus = "active" | "paused" | "needs_attention";
export type PupAutonomy = "draft_only" | "safe_actions";
export type PupHandoffStatus = "queued" | "working" | "needs_operator" | "ready" | "failed" | "cancelled";

export type PupTemplate = {
  id: Exclude<PupKind, "custom">;
  name: string;
  title: string;
  description: string;
  defaultObjective: string;
  role: string;
  autonomy: PupAutonomy;
};

export type Pup = {
  id: string;
  operatorId: string;
  name: string;
  kind: PupKind;
  role: string;
  objective: string;
  status: PupStatus;
  autonomy: PupAutonomy;
  sessionId: string;
  routineEveryMinutes: number | null;
  routinePrompt: string | null;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  lastRunSummary: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PupHandoff = {
  id: string;
  threadId: string;
  operatorId: string;
  sourcePupId: string;
  targetPupId: string;
  instruction: string;
  depth: 1;
  status: PupHandoffStatus;
  missionId: string | null;
  runId: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PupsPayload = {
  pups: Pup[];
  templates: PupTemplate[];
  persistence: "memory" | "supabase";
  alwaysOn: boolean;
};

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
  if (!response.ok) throw new Error(payload.error?.message ?? payload.error ?? `MAXX Pups returned ${response.status}`);
  return payload as T;
}

export const pupsApi = {
  list: () => request<PupsPayload>("/v1/pups"),
  create: (templateId: PupTemplate["id"]) =>
    request<Pup>("/v1/pups", { method: "POST", body: JSON.stringify({ templateId }) }),
  patch: (id: string, input: Partial<Pick<Pup, "name" | "objective" | "status" | "autonomy" | "routineEveryMinutes" | "routinePrompt">>) =>
    request<Pup>(`/v1/pups/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }),
  run: (id: string, instruction?: string) =>
    request<{ mission: { id: string; runId: string; objective: string }; state: { status: string }; trigger: string }>(
      `/v1/pups/${encodeURIComponent(id)}/run`,
      { method: "POST", body: JSON.stringify({ instruction: instruction || undefined }) },
    ),
  chat: (id: string, message: string) =>
    request<{ text: string; model: string }>(`/v1/pups/${encodeURIComponent(id)}/chat`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  handoffs: {
    list: (limit = 50) =>
      request<{ handoffs: PupHandoff[]; persistence: "memory" | "supabase"; maxDepth: 1 }>(
        `/v1/pup-handoffs?limit=${encodeURIComponent(String(limit))}`,
      ),
    thread: (threadId: string) =>
      request<{ threadId: string; handoffs: PupHandoff[] }>(`/v1/pup-handoffs/${encodeURIComponent(threadId)}`),
    delegate: (sourcePupId: string, targetPupId: string, instruction: string) =>
      request<{
        handoff: PupHandoff;
        dispatch: { statusCode: number; missionId?: string; runId?: string; stateStatus?: string; error?: string };
      }>("/v1/pup-handoffs", {
        method: "POST",
        body: JSON.stringify({ sourcePupId, targetPupId, instruction }),
      }),
  },
};