import { supabase } from "@/integrations/supabase/client";

const defaultUrl = "https://api.thepaulieffect.com/maxx";
const configuredUrl = import.meta.env.VITE_CONTROL_TOWER_API_URL ?? import.meta.env.VITE_MAXX_CONTROL_PLANE_URL ?? defaultUrl;
const baseUrl = configuredUrl.replace(/\/$/, "");

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
  kind: PupKind;
  name: string;
  title: string;
  role: string;
  objective: string;
  status: PupStatus;
  autonomy: PupAutonomy;
  routineEveryMinutes?: number;
  routinePrompt?: string;
  lastRunAt?: string;
  lastRunStatus?: string;
  createdAt: string;
  updatedAt: string;
};

export type PupRunResult = {
  runId: string;
  pupId: string;
  status: "queued" | "in_progress" | "requires_action" | "completed" | "failed" | "cancelled";
  output?: string;
  requiresAction?: boolean;
  actionSummary?: string;
  details?: Record<string, unknown>;
  createdAt: string;
};

export type PupRunState = {
  id: string;
  pupId: string;
  status: "queued" | "in_progress" | "requires_action" | "completed" | "failed" | "cancelled";
  output?: string;
  requiresAction?: boolean;
  actionSummary?: string;
  details?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type PupHandoff = {
  id: string;
  operatorId: string;
  sourcePupId: string;
  targetPupId: string;
  instruction: string;
  status: PupHandoffStatus;
  missionId?: string;
  runId?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

export type PupDispatchResponse = {
  handoff: PupHandoff;
  dispatch: {
    status: "queued" | "in_progress" | "requires_action" | "completed" | "failed" | "cancelled";
    runId?: string;
    output?: string;
    requiresAction?: boolean;
    actionSummary?: string;
    details?: Record<string, unknown>;
  };
};

export type PupChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type PupChatResponse = {
  pupId: string;
  reply: string;
  sessionId?: string;
  model?: string;
  provider?: string;
};

export type ReviewItem = {
  kind: "approval" | "handoff" | "pup" | "refinement";
  priority: "high" | "normal";
  id: string;
  title: string;
  detail: string;
  data: Record<string, unknown>;
};

export type MaxxWorkflow = {
  id: string;
  operatorId: string;
  name: string;
  pupId: string;
  objective: string;
  expectedProof: string;
  triggerType: "manual" | "interval" | "event";
  triggerValue: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MaxxConnection = {
  id: string;
  operatorId: string;
  name: string;
  kind: "email" | "calendar" | "crm" | "hosting" | "social" | "browser" | "other";
  secretRef: string;
  status: "connected" | "needs_attention" | "disabled";
  createdAt: string;
  updatedAt: string;
};

export type PupsPayload = {
  pups: Pup[];
  templates: PupTemplate[];
  persistence: "memory" | "supabase";
  runtime?: "hermes_bot_profiles" | "unconfigured";
  alwaysOn: boolean;
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
    throw new Error(`MAXX Pups connection failed at ${baseUrl}${path}: ${message}`, { cause: error });
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message ?? payload.error ?? `MAXX Pups returned ${response.status}`);
  return payload as T;
}

export const pupsApi = {
  list: () => request<PupsPayload>("/v1/pups"),
  create: (templateId: PupTemplate["id"]) => request<Pup>("/v1/pups", { method: "POST", body: JSON.stringify({ templateId }) }),
  patch: (id: string, input: Partial<Pick<Pup, "name" | "objective" | "status" | "autonomy" | "routineEveryMinutes" | "routinePrompt">>) =>
    request<Pup>(`/v1/pups/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }),
  run: (id: string, instruction?: string) =>
    request<PupRunResult>(
      `/v1/pups/${encodeURIComponent(id)}/run`,
      { method: "POST", body: JSON.stringify({ instruction: instruction || undefined }) },
    ),
  approveRun: (id: string, runId: string, choice: "once" | "session" | "deny") =>
    request<{ state: { runId: string; status: string; error?: string | null }; pup: Pup }>(
      `/v1/pups/${encodeURIComponent(id)}/runs/${encodeURIComponent(runId)}/approval`,
      { method: "POST", body: JSON.stringify({ choice }) },
    ),
  chat: (id: string, message: string) =>
    request<{ text: string; model: string }>(`/v1/pups/${encodeURIComponent(id)}/chat`, { method: "POST", body: JSON.stringify({ message }) }),
  handoffs: {
    list: (limit = 50) => request<{ handoffs: PupHandoff[]; persistence: "memory" | "supabase"; maxDepth: 1 }>(`/v1/pup-handoffs?limit=${encodeURIComponent(String(limit))}`),
    thread: (threadId: string) => request<{ threadId: string; handoffs: PupHandoff[] }>(`/v1/pup-handoffs/${encodeURIComponent(threadId)}`),
    delegate: (sourcePupId: string, targetPupId: string, instruction: string) =>
      request<{ handoff: PupHandoff; dispatch: { statusCode: number; missionId?: string; runId?: string; stateStatus?: string; error?: string } }>("/v1/pup-handoffs", {
        method: "POST",
        body: JSON.stringify({ sourcePupId, targetPupId, instruction }),
      }),
  },
  operations: {
    reviewInbox: () => request<{ items: ReviewItem[]; count: number; persistence: "memory" | "supabase" }>("/v1/review-inbox"),
    workflows: () => request<{ workflows: MaxxWorkflow[]; persistence: "memory" | "supabase" }>("/v1/workflows"),
    connections: () => request<{ connections: MaxxConnection[]; persistence: "memory" | "supabase" }>("/v1/connections"),
    teach: (input: Omit<MaxxWorkflow, "id" | "operatorId" | "active" | "createdAt" | "updatedAt">) =>
      request<{ workflow: MaxxWorkflow }>("/v1/workflows", { method: "POST", body: JSON.stringify(input) }),
    delegate: (sourcePupId: string, targetPupId: string, objective: string, expectedProof: string) =>
      request<{ handoff: PupHandoff }>(`/v1/pups/${encodeURIComponent(sourcePupId)}/delegate`, {
        method: "POST",
        body: JSON.stringify({ targetPupId, objective, expectedProof }),
      }),
    freshSpecialist: (sourcePupId: string, input: { targetPupId: string; role: string; objective: string; context?: string; expectedProof: string }) =>
      request<{ handoff: PupHandoff }>(`/v1/pups/${encodeURIComponent(sourcePupId)}/fresh-specialist`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },
};
