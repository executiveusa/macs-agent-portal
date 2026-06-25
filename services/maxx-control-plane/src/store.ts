import { randomUUID } from "node:crypto";
import type { Approval, Mission, RunEvent, UsageRecord } from "./types.js";
import type { MaxxConfig } from "./config.js";

export interface ControlTowerStore {
  listMissions(): Promise<Mission[]>;
  createMission(input: Omit<Mission, "createdAt" | "updatedAt"> & { workspacePath: string }): Promise<Mission>;
  updateMission(id: string, status: Mission["status"]): Promise<Mission | undefined>;
  addEvent(runId: string, type: string, message: string, data?: Record<string, unknown>): Promise<RunEvent>;
  listEvents(runId: string): Promise<RunEvent[]>;
  listApprovals(): Promise<Approval[]>;
  createApproval(input: Omit<Approval, "id" | "status">): Promise<Approval>;
  decideApproval(
    id: string,
    decision: "approved" | "rejected",
    operatorId: string,
  ): Promise<Approval | undefined>;
  addUsage(input: UsageRecord): Promise<void>;
  listUsage(): Promise<UsageRecord[]>;
}

export class MemoryStore implements ControlTowerStore {
  private missions: Mission[] = [];
  private approvals: Approval[] = [];
  private usage: UsageRecord[] = [];
  private events = new Map<string, RunEvent[]>();

  async listMissions() {
    return [...this.missions];
  }

  async createMission(
    input: Omit<Mission, "createdAt" | "updatedAt"> & { workspacePath: string },
  ): Promise<Mission> {
    const now = new Date().toISOString();
    const { workspacePath: _workspacePath, ...missionInput } = input;
    const mission = { ...missionInput, createdAt: now, updatedAt: now };
    this.missions.unshift(mission);
    return mission;
  }

  async updateMission(id: string, status: Mission["status"]): Promise<Mission | undefined> {
    const mission = this.missions.find((item) => item.id === id);
    if (!mission) return undefined;
    mission.status = status;
    mission.updatedAt = new Date().toISOString();
    return mission;
  }

  async addEvent(runId: string, type: string, message: string, data?: Record<string, unknown>): Promise<RunEvent> {
    const event = { id: randomUUID(), runId, type, message, data, createdAt: new Date().toISOString() };
    this.events.set(runId, [...(this.events.get(runId) ?? []), event]);
    return event;
  }

  async listEvents(runId: string): Promise<RunEvent[]> {
    return this.events.get(runId) ?? [];
  }

  async listApprovals() {
    return [...this.approvals];
  }

  async createApproval(input: Omit<Approval, "id" | "status">): Promise<Approval> {
    const approval = { ...input, id: randomUUID(), status: "pending" as const };
    this.approvals.unshift(approval);
    return approval;
  }

  async decideApproval(
    id: string,
    decision: "approved" | "rejected",
    operatorId: string,
  ): Promise<Approval | undefined> {
    const approval = this.approvals.find((item) => item.id === id);
    if (!approval || approval.status !== "pending") return undefined;
    approval.status = decision;
    approval.decidedAt = new Date().toISOString();
    approval.decidedBy = operatorId;
    return approval;
  }

  async addUsage(input: UsageRecord) {
    this.usage.push(input);
  }

  async listUsage() {
    return [...this.usage];
  }
}

export class SupabaseStore implements ControlTowerStore {
  constructor(
    private readonly url: string,
    private readonly serviceRoleKey: string,
  ) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.url}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: this.serviceRoleKey,
        Authorization: `Bearer ${this.serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...init?.headers,
      },
    });
    if (!response.ok) throw new Error(`Supabase store request failed with status ${response.status}`);
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  async listMissions(): Promise<Mission[]> {
    const rows = await this.request<Array<Record<string, unknown>>>(
      "maxx_missions?select=id,objective,status,run_id,created_at,updated_at&order=updated_at.desc",
    );
    return rows.map(mapMission);
  }

  async createMission(
    input: Omit<Mission, "createdAt" | "updatedAt"> & { workspacePath: string },
  ): Promise<Mission> {
    await this.request("maxx_missions", {
      method: "POST",
      body: JSON.stringify({
        id: input.id,
        operator_id: input.operatorId,
        objective: input.objective,
        status: input.status,
      }),
    });
    await this.request("maxx_runs", {
      method: "POST",
      body: JSON.stringify({
        id: input.runId,
        mission_id: input.id,
        status: input.status,
        workspace_path: input.workspacePath,
      }),
    });
    const rows = await this.request<Array<Record<string, unknown>>>(`maxx_missions?id=eq.${input.id}`, {
      method: "PATCH",
      body: JSON.stringify({ run_id: input.runId, current_stage: "01_intake" }),
    });
    return mapMission(rows[0]);
  }

  async updateMission(id: string, status: Mission["status"]): Promise<Mission | undefined> {
    const rows = await this.request<Array<Record<string, unknown>>>(`maxx_missions?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return rows[0] ? mapMission(rows[0]) : undefined;
  }

  async addEvent(runId: string, type: string, message: string, data?: Record<string, unknown>): Promise<RunEvent> {
    const rows = await this.request<Array<Record<string, unknown>>>("maxx_events", {
      method: "POST",
      body: JSON.stringify({ run_id: runId, event_type: type, message, data: data ?? {} }),
    });
    return mapEvent(rows[0]);
  }

  async listEvents(runId: string): Promise<RunEvent[]> {
    const rows = await this.request<Array<Record<string, unknown>>>(
      `maxx_events?run_id=eq.${encodeURIComponent(runId)}&order=sequence.asc`,
    );
    return rows.map(mapEvent);
  }

  async listApprovals(): Promise<Approval[]> {
    const rows = await this.request<Array<Record<string, unknown>>>(
      "maxx_approvals?select=*&order=created_at.desc",
    );
    return rows.map(mapApproval);
  }

  async createApproval(input: Omit<Approval, "id" | "status">): Promise<Approval> {
    const rows = await this.request<Array<Record<string, unknown>>>("maxx_approvals", {
      method: "POST",
      body: JSON.stringify({
        run_id: input.runId,
        action: input.action,
        summary: input.summary,
        evidence: {},
      }),
    });
    return mapApproval(rows[0]);
  }

  async decideApproval(
    id: string,
    decision: "approved" | "rejected",
    operatorId: string,
  ): Promise<Approval | undefined> {
    const rows = await this.request<Array<Record<string, unknown>>>(
      `maxx_approvals?id=eq.${id}&status=eq.pending`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status: decision,
          decided_by: operatorId,
          decided_at: new Date().toISOString(),
        }),
      },
    );
    return rows[0] ? mapApproval(rows[0]) : undefined;
  }

  async addUsage(input: UsageRecord): Promise<void> {
    await this.request("maxx_usage", {
      method: "POST",
      body: JSON.stringify({
        id: input.id,
        run_id: input.runId,
        model: input.model,
        prompt_tokens: input.promptTokens,
        completion_tokens: input.completionTokens,
        estimated_cost_usd: input.estimatedCostUsd,
        latency_ms: input.latencyMs,
        created_at: input.createdAt,
      }),
    });
  }

  async listUsage(): Promise<UsageRecord[]> {
    const rows = await this.request<Array<Record<string, unknown>>>("maxx_usage?select=*&order=created_at.desc");
    return rows.map((row) => ({
      id: String(row.id),
      runId: row.run_id ? String(row.run_id) : undefined,
      model: String(row.model),
      promptTokens: Number(row.prompt_tokens),
      completionTokens: Number(row.completion_tokens),
      estimatedCostUsd: Number(row.estimated_cost_usd),
      latencyMs: Number(row.latency_ms),
      createdAt: String(row.created_at),
    }));
  }
}

export function createStore(config: MaxxConfig): ControlTowerStore {
  if (config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY) {
    return new SupabaseStore(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
  }
  return new MemoryStore();
}

function mapMission(row: Record<string, unknown>): Mission {
  return {
    id: String(row.id),
    objective: String(row.objective),
    status: row.status as Mission["status"],
    runId: String(row.run_id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapEvent(row: Record<string, unknown>): RunEvent {
  return {
    id: String(row.id),
    runId: String(row.run_id),
    type: String(row.event_type),
    message: String(row.message),
    data: (row.data ?? {}) as Record<string, unknown>,
    createdAt: String(row.created_at),
  };
}

function mapApproval(row: Record<string, unknown>): Approval {
  return {
    id: String(row.id),
    runId: String(row.run_id),
    action: String(row.action),
    summary: String(row.summary),
    status: row.status as Approval["status"],
    decidedAt: row.decided_at ? String(row.decided_at) : undefined,
    decidedBy: row.decided_by ? String(row.decided_by) : undefined,
  };
}
