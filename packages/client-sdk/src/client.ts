import type {
  Approval,
  ChatResponse,
  HermesRunState,
  MemorySearchResult,
  Mission,
  OwnerStrategy,
  ScheduledJobState,
  UsageSummary,
} from "./types.js";
import { MaxxApiError } from "./types.js";

export type MaxxClientOptions = {
  baseUrl: string;
  /** Bearer token (Supabase-issued JWT for an allowlisted operator). */
  getToken: () => string | Promise<string>;
  fetchImpl?: typeof fetch;
};

// Thin, typed HTTP client for the MAXX control plane's /v1/* API, intended
// for external systems (not the bundled dashboard, which uses
// src/services/controlTowerApi.ts directly against the Supabase browser
// session). Every method maps 1:1 to a control-plane route - see
// services/maxx-control-plane/src/app.ts for the authoritative route list.
export class MaxxClient {
  private readonly baseUrl: string;
  private readonly getToken: () => string | Promise<string>;
  private readonly fetchImpl: typeof fetch;

  constructor(options: MaxxClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.getToken = options.getToken;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await this.getToken();
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    });

    const text = await response.text();
    const body = text ? JSON.parse(text) : undefined;
    if (!response.ok) {
      const message = (body as { error?: string } | undefined)?.error ?? `Request failed with status ${response.status}`;
      throw new MaxxApiError(message, response.status, body);
    }
    return body as T;
  }

  chat(input: { message: string; model?: string; runId?: string }): Promise<ChatResponse> {
    return this.request("/v1/chat", { method: "POST", body: JSON.stringify(input) });
  }

  createMission(objective: string): Promise<Mission & { stages: Array<{ id: string; purpose: string }> }> {
    return this.request("/v1/missions", { method: "POST", body: JSON.stringify({ objective }) });
  }

  updateMissionStatus(id: string, status: Mission["status"]): Promise<Mission> {
    return this.request(`/v1/missions/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status }) });
  }

  approveAction(id: string): Promise<Approval> {
    return this.request(`/v1/approvals/${encodeURIComponent(id)}/approve`, { method: "POST" });
  }

  rejectAction(id: string): Promise<Approval> {
    return this.request(`/v1/approvals/${encodeURIComponent(id)}/reject`, { method: "POST" });
  }

  runSkill(id: string, input?: { runId?: string; input?: Record<string, unknown> }): Promise<unknown> {
    return this.request(`/v1/skills/${encodeURIComponent(id)}/run`, { method: "POST", body: JSON.stringify(input ?? {}) });
  }

  startBrowserAction(action: string, target?: string): Promise<unknown> {
    return this.request("/v1/browser/sessions", { method: "POST", body: JSON.stringify({ action, target }) });
  }

  startHermesRun(input: {
    runId: string;
    missionId: string;
    objective: string;
    workspacePath: string;
    stage: string;
  }): Promise<HermesRunState> {
    return this.request("/v1/hermes/runs", { method: "POST", body: JSON.stringify(input) });
  }

  getHermesRun(id: string): Promise<HermesRunState> {
    return this.request(`/v1/hermes/runs/${encodeURIComponent(id)}`);
  }

  cancelHermesRun(id: string): Promise<HermesRunState> {
    return this.request(`/v1/hermes/runs/${encodeURIComponent(id)}/cancel`, { method: "POST" });
  }

  getStrategy(): Promise<OwnerStrategy> {
    return this.request("/v1/strategy");
  }

  setStrategy(input: Partial<Omit<OwnerStrategy, "operatorId" | "updatedAt">>): Promise<OwnerStrategy> {
    return this.request("/v1/strategy", { method: "PUT", body: JSON.stringify(input) });
  }

  searchMemory(query: string, limit?: number): Promise<{ results: MemorySearchResult[] }> {
    const params = new URLSearchParams({ q: query, ...(limit ? { limit: String(limit) } : {}) });
    return this.request(`/v1/memory/search?${params.toString()}`);
  }

  listSchedulerJobs(): Promise<{ jobs: ScheduledJobState[] }> {
    return this.request("/v1/scheduler/jobs");
  }

  getUsageSummary(): Promise<UsageSummary> {
    return this.request("/v1/usage/summary");
  }
}
