import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import type { MaxxConfig } from "./config.js";

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
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MaxxRefinementProposal = {
  id: string;
  operatorId: string;
  source: string;
  observation: string;
  proposedChange: string;
  expectedEvidence: string;
  rollbackPlan: string;
  status: "proposed" | "approved" | "rejected" | "tested" | "adopted" | "rolled_back";
  createdAt: string;
  updatedAt: string;
};

export interface OperationsRepository {
  readonly persistence: "memory" | "supabase";
  listConnections(operatorId: string): Promise<MaxxConnection[]>;
  getConnection(operatorId: string, id: string): Promise<MaxxConnection | undefined>;
  createConnection(input: Omit<MaxxConnection, "id" | "status" | "createdAt" | "updatedAt">): Promise<MaxxConnection>;
  listWorkflows(operatorId: string): Promise<MaxxWorkflow[]>;
  getWorkflow(operatorId: string, id: string): Promise<MaxxWorkflow | undefined>;
  createWorkflow(input: Omit<MaxxWorkflow, "id" | "active" | "nextRunAt" | "lastRunAt" | "lastRunStatus" | "createdAt" | "updatedAt">): Promise<MaxxWorkflow>;
  matchingEventWorkflows(operatorId: string, eventType: string): Promise<MaxxWorkflow[]>;
  claimDueInterval(operatorId: string, now?: Date): Promise<MaxxWorkflow[]>;
  markWorkflowRun(operatorId: string, id: string, status: string, at?: Date): Promise<void>;
  claimEvent(operatorId: string, source: string, eventId: string, eventType: string): Promise<boolean>;
  listRefinements(operatorId: string): Promise<MaxxRefinementProposal[]>;
  createRefinement(input: Omit<MaxxRefinementProposal, "id" | "status" | "createdAt" | "updatedAt">): Promise<MaxxRefinementProposal>;
  setRefinementStatus(operatorId: string, id: string, status: MaxxRefinementProposal["status"]): Promise<MaxxRefinementProposal | undefined>;
}

const connectionSchema = z.object({
  name: z.string().trim().min(2).max(100),
  kind: z.enum(["email", "calendar", "crm", "hosting", "social", "browser", "other"]),
  secretRef: z.string().trim().min(5).max(200).refine(
    (value) => /^(env|vault|session):[A-Za-z0-9._:/-]+$/.test(value),
    "secretRef must be an opaque env:, vault:, or session: reference; never send a credential value",
  ),
}).strict();

const workflowSchema = z.object({
  name: z.string().trim().min(2).max(120),
  pupId: z.string().uuid(),
  objective: z.string().trim().min(3).max(2_000),
  expectedProof: z.string().trim().min(3).max(1_000),
  triggerType: z.enum(["manual", "interval", "event"]).default("manual"),
  triggerValue: z.string().trim().min(1).max(200).nullable().default(null),
}).strict();

const delegationSchema = z.object({
  targetPupId: z.string().uuid(),
  objective: z.string().trim().min(3).max(2_000),
  expectedProof: z.string().trim().min(3).max(1_000),
}).strict();

const freshSpecialistSchema = delegationSchema.extend({
  role: z.string().trim().min(3).max(1_000),
  context: z.string().trim().max(6_000).default(""),
}).strict();

const eventSchema = z.object({
  eventId: z.string().trim().min(1).max(200),
  source: z.string().trim().min(1).max(120),
  type: z.string().trim().min(2).max(120),
  summary: z.string().trim().min(1).max(4_000),
  sourceConnectionId: z.string().uuid().optional(),
}).strict();

const refinementSchema = z.object({
  source: z.string().trim().min(2).max(120),
  observation: z.string().trim().min(3).max(4_000),
  proposedChange: z.string().trim().min(3).max(4_000),
  expectedEvidence: z.string().trim().min(3).max(2_000),
  rollbackPlan: z.string().trim().min(3).max(2_000),
}).strict();

const refinementStatusSchema = z.object({
  status: z.enum(["approved", "rejected", "tested", "adopted", "rolled_back"]),
}).strict();

function now() {
  return new Date().toISOString();
}

function nextWorkflowRun(triggerType: MaxxWorkflow["triggerType"], triggerValue: string | null, from = Date.now()) {
  if (triggerType !== "interval" || !triggerValue) return null;
  const minutes = Number(triggerValue);
  return Number.isInteger(minutes) && minutes > 0 ? new Date(from + minutes * 60_000).toISOString() : null;
}

export function forwardedHeaders(request: FastifyRequest) {
  const headers: Record<string, string> = {};
  if (typeof request.headers.authorization === "string") headers.authorization = request.headers.authorization;
  if (typeof request.headers["x-request-id"] === "string") headers["x-request-id"] = request.headers["x-request-id"];
  if (typeof request.headers["x-maxx-hermes-tool-key"] === "string") headers["x-maxx-hermes-tool-key"] = request.headers["x-maxx-hermes-tool-key"];
  return headers;
}

export function eventDispatchHeaders(request: FastifyRequest, config: MaxxConfig) {
  const headers = forwardedHeaders(request);
  if (headers.authorization || headers["x-maxx-hermes-tool-key"]) return headers;
  const eventHeader = request.headers["x-maxx-event-key"];
  const hasEventCredential = typeof eventHeader === "string" || Array.isArray(eventHeader);
  if (!hasEventCredential) return headers;
  if (!config.MAXX_HERMES_TOOL_KEY || !config.MAXX_HERMES_TOOL_OPERATOR_ID || config.MAXX_HERMES_TOOL_OPERATOR_ID !== request.operator?.id) return null;
  headers["x-maxx-hermes-tool-key"] = config.MAXX_HERMES_TOOL_KEY;
  return headers;
}

function materializeConnection(input: Omit<MaxxConnection, "id" | "status" | "createdAt" | "updatedAt">): MaxxConnection {
  const timestamp = now();
  return { id: randomUUID(), ...input, status: "connected", createdAt: timestamp, updatedAt: timestamp };
}

function materializeWorkflow(input: Omit<MaxxWorkflow, "id" | "active" | "nextRunAt" | "lastRunAt" | "lastRunStatus" | "createdAt" | "updatedAt">): MaxxWorkflow {
  const timestamp = now();
  return {
    id: randomUUID(),
    ...input,
    active: true,
    nextRunAt: nextWorkflowRun(input.triggerType, input.triggerValue),
    lastRunAt: null,
    lastRunStatus: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function materializeRefinement(input: Omit<MaxxRefinementProposal, "id" | "status" | "createdAt" | "updatedAt">): MaxxRefinementProposal {
  const timestamp = now();
  return { id: randomUUID(), ...input, status: "proposed", createdAt: timestamp, updatedAt: timestamp };
}

export class MemoryOperationsRepository implements OperationsRepository {
  readonly persistence = "memory" as const;
  private readonly connections = new Map<string, MaxxConnection>();
  private readonly workflows = new Map<string, MaxxWorkflow>();
  private readonly refinements = new Map<string, MaxxRefinementProposal>();
  private readonly processedEvents = new Set<string>();

  async listConnections(operatorId: string) { return [...this.connections.values()].filter((x) => x.operatorId === operatorId); }
  async getConnection(operatorId: string, id: string) { const x = this.connections.get(id); return x?.operatorId === operatorId ? { ...x } : undefined; }
  async createConnection(input: Omit<MaxxConnection, "id" | "status" | "createdAt" | "updatedAt">) { const x = materializeConnection(input); this.connections.set(x.id, x); return { ...x }; }
  async listWorkflows(operatorId: string) { return [...this.workflows.values()].filter((x) => x.operatorId === operatorId); }
  async getWorkflow(operatorId: string, id: string) { const x = this.workflows.get(id); return x?.operatorId === operatorId ? { ...x } : undefined; }
  async createWorkflow(input: Omit<MaxxWorkflow, "id" | "active" | "nextRunAt" | "lastRunAt" | "lastRunStatus" | "createdAt" | "updatedAt">) { const x = materializeWorkflow(input); this.workflows.set(x.id, x); return { ...x }; }
  async matchingEventWorkflows(operatorId: string, eventType: string) { return [...this.workflows.values()].filter((x) => x.operatorId === operatorId && x.active && x.triggerType === "event" && x.triggerValue === eventType); }
  async claimDueInterval(operatorId: string, at = new Date()) {
    const claimed: MaxxWorkflow[] = [];
    for (const workflow of this.workflows.values()) {
      if (workflow.operatorId !== operatorId || !workflow.active || workflow.triggerType !== "interval" || !workflow.nextRunAt) continue;
      if (new Date(workflow.nextRunAt).getTime() > at.getTime()) continue;
      workflow.nextRunAt = nextWorkflowRun(workflow.triggerType, workflow.triggerValue, at.getTime());
      workflow.updatedAt = at.toISOString();
      claimed.push({ ...workflow });
    }
    return claimed;
  }
  async markWorkflowRun(operatorId: string, id: string, status: string, at = new Date()) {
    const workflow = this.workflows.get(id);
    if (!workflow || workflow.operatorId !== operatorId) return;
    workflow.lastRunAt = at.toISOString();
    workflow.lastRunStatus = status;
    workflow.updatedAt = at.toISOString();
  }
  async claimEvent(operatorId: string, source: string, eventId: string) {
    const key = `${operatorId}:${source}:${eventId}`;
    if (this.processedEvents.has(key)) return false;
    this.processedEvents.add(key);
    return true;
  }
  async listRefinements(operatorId: string) { return [...this.refinements.values()].filter((x) => x.operatorId === operatorId); }
  async createRefinement(input: Omit<MaxxRefinementProposal, "id" | "status" | "createdAt" | "updatedAt">) { const x = materializeRefinement(input); this.refinements.set(x.id, x); return { ...x }; }
  async setRefinementStatus(operatorId: string, id: string, status: MaxxRefinementProposal["status"]) { const x = this.refinements.get(id); if (!x || x.operatorId !== operatorId) return undefined; x.status = status; x.updatedAt = now(); return { ...x }; }
}

class SupabaseOperationsRepository implements OperationsRepository {
  readonly persistence = "supabase" as const;
  constructor(private readonly url: string, private readonly serviceRoleKey: string) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.url}/rest/v1/${path}`, {
      ...init,
      headers: { apikey: this.serviceRoleKey, Authorization: `Bearer ${this.serviceRoleKey}`, "Content-Type": "application/json", Prefer: "return=representation", ...init?.headers },
    });
    if (!response.ok) throw new Error(`Operations Hub store request failed with status ${response.status}`);
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  async listConnections(operatorId: string) { return (await this.request<Array<Record<string, unknown>>>(`maxx_connections?operator_id=eq.${encodeURIComponent(operatorId)}&order=updated_at.desc`)).map(mapConnection); }
  async getConnection(operatorId: string, id: string) { const rows = await this.request<Array<Record<string, unknown>>>(`maxx_connections?id=eq.${encodeURIComponent(id)}&operator_id=eq.${encodeURIComponent(operatorId)}&limit=1`); return rows[0] ? mapConnection(rows[0]) : undefined; }
  async createConnection(input: Omit<MaxxConnection, "id" | "status" | "createdAt" | "updatedAt">) { const x = materializeConnection(input); const rows = await this.request<Array<Record<string, unknown>>>("maxx_connections", { method: "POST", body: JSON.stringify(toConnectionRow(x)) }); return mapConnection(rows[0]); }
  async listWorkflows(operatorId: string) { return (await this.request<Array<Record<string, unknown>>>(`maxx_workflows?operator_id=eq.${encodeURIComponent(operatorId)}&order=updated_at.desc`)).map(mapWorkflow); }
  async getWorkflow(operatorId: string, id: string) { const rows = await this.request<Array<Record<string, unknown>>>(`maxx_workflows?id=eq.${encodeURIComponent(id)}&operator_id=eq.${encodeURIComponent(operatorId)}&limit=1`); return rows[0] ? mapWorkflow(rows[0]) : undefined; }
  async createWorkflow(input: Omit<MaxxWorkflow, "id" | "active" | "nextRunAt" | "lastRunAt" | "lastRunStatus" | "createdAt" | "updatedAt">) { const x = materializeWorkflow(input); const rows = await this.request<Array<Record<string, unknown>>>("maxx_workflows", { method: "POST", body: JSON.stringify(toWorkflowRow(x)) }); return mapWorkflow(rows[0]); }
  async matchingEventWorkflows(operatorId: string, eventType: string) { return (await this.request<Array<Record<string, unknown>>>(`maxx_workflows?operator_id=eq.${encodeURIComponent(operatorId)}&active=eq.true&trigger_type=eq.event&trigger_value=eq.${encodeURIComponent(eventType)}&order=updated_at.desc`)).map(mapWorkflow); }
  async claimDueInterval(operatorId: string, at = new Date()) {
    const atIso = at.toISOString();
    const due = await this.request<Array<Record<string, unknown>>>(`maxx_workflows?operator_id=eq.${encodeURIComponent(operatorId)}&active=eq.true&trigger_type=eq.interval&next_run_at=lte.${encodeURIComponent(atIso)}&order=next_run_at.asc&limit=20`);
    const claimed: MaxxWorkflow[] = [];
    for (const row of due) {
      const workflow = mapWorkflow(row);
      const nextRunAt = nextWorkflowRun(workflow.triggerType, workflow.triggerValue, at.getTime());
      if (!nextRunAt) continue;
      const updated = await this.request<Array<Record<string, unknown>>>(`maxx_workflows?id=eq.${encodeURIComponent(workflow.id)}&operator_id=eq.${encodeURIComponent(operatorId)}&active=eq.true&next_run_at=lte.${encodeURIComponent(atIso)}`, { method: "PATCH", body: JSON.stringify({ next_run_at: nextRunAt, updated_at: atIso }) });
      if (updated[0]) claimed.push(mapWorkflow(updated[0]));
    }
    return claimed;
  }
  async markWorkflowRun(operatorId: string, id: string, status: string, at = new Date()) { await this.request(`maxx_workflows?id=eq.${encodeURIComponent(id)}&operator_id=eq.${encodeURIComponent(operatorId)}`, { method: "PATCH", body: JSON.stringify({ last_run_at: at.toISOString(), last_run_status: status.slice(0, 120), updated_at: at.toISOString() }) }); }
  async claimEvent(operatorId: string, source: string, eventId: string, eventType: string) {
    try {
      const response = await fetch(`${this.url}/rest/v1/maxx_processed_events`, {
        method: "POST",
        headers: { apikey: this.serviceRoleKey, Authorization: `Bearer ${this.serviceRoleKey}`, "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=representation" },
        body: JSON.stringify({ id: randomUUID(), operator_id: operatorId, source, event_id: eventId, event_type: eventType }),
      });
      if (response.status === 409) return false;
      if (!response.ok) throw new Error(`Event idempotency store request failed with status ${response.status}`);
      const rows = (await response.json()) as Array<Record<string, unknown>>;
      return rows.length > 0;
    } catch {
      return false;
    }
  }
  async listRefinements(operatorId: string) { return (await this.request<Array<Record<string, unknown>>>(`maxx_refinement_proposals?operator_id=eq.${encodeURIComponent(operatorId)}&order=updated_at.desc`)).map(mapRefinement); }
  async createRefinement(input: Omit<MaxxRefinementProposal, "id" | "status" | "createdAt" | "updatedAt">) { const x = materializeRefinement(input); const rows = await this.request<Array<Record<string, unknown>>>("maxx_refinement_proposals", { method: "POST", body: JSON.stringify(toRefinementRow(x)) }); return mapRefinement(rows[0]); }
  async setRefinementStatus(operatorId: string, id: string, status: MaxxRefinementProposal["status"]) { const rows = await this.request<Array<Record<string, unknown>>>(`maxx_refinement_proposals?id=eq.${encodeURIComponent(id)}&operator_id=eq.${encodeURIComponent(operatorId)}`, { method: "PATCH", body: JSON.stringify({ status, updated_at: now() }) }); return rows[0] ? mapRefinement(rows[0]) : undefined; }
}

function mapConnection(row: Record<string, unknown>): MaxxConnection { return { id: String(row.id), operatorId: String(row.operator_id), name: String(row.name), kind: row.kind as MaxxConnection["kind"], secretRef: String(row.secret_ref), status: row.status as MaxxConnection["status"], createdAt: String(row.created_at), updatedAt: String(row.updated_at) }; }
function toConnectionRow(x: MaxxConnection) { return { id: x.id, operator_id: x.operatorId, name: x.name, kind: x.kind, secret_ref: x.secretRef, status: x.status, created_at: x.createdAt, updated_at: x.updatedAt }; }
function mapWorkflow(row: Record<string, unknown>): MaxxWorkflow { return { id: String(row.id), operatorId: String(row.operator_id), name: String(row.name), pupId: String(row.pup_id), objective: String(row.objective), expectedProof: String(row.expected_proof), triggerType: row.trigger_type as MaxxWorkflow["triggerType"], triggerValue: row.trigger_value == null ? null : String(row.trigger_value), active: Boolean(row.active), nextRunAt: row.next_run_at == null ? null : String(row.next_run_at), lastRunAt: row.last_run_at == null ? null : String(row.last_run_at), lastRunStatus: row.last_run_status == null ? null : String(row.last_run_status), createdAt: String(row.created_at), updatedAt: String(row.updated_at) }; }
function toWorkflowRow(x: MaxxWorkflow) { return { id: x.id, operator_id: x.operatorId, name: x.name, pup_id: x.pupId, objective: x.objective, expected_proof: x.expectedProof, trigger_type: x.triggerType, trigger_value: x.triggerValue, active: x.active, next_run_at: x.nextRunAt, last_run_at: x.lastRunAt, last_run_status: x.lastRunStatus, created_at: x.createdAt, updated_at: x.updatedAt }; }
function mapRefinement(row: Record<string, unknown>): MaxxRefinementProposal { return { id: String(row.id), operatorId: String(row.operator_id), source: String(row.source), observation: String(row.observation), proposedChange: String(row.proposed_change), expectedEvidence: String(row.expected_evidence), rollbackPlan: String(row.rollback_plan), status: row.status as MaxxRefinementProposal["status"], createdAt: String(row.created_at), updatedAt: String(row.updated_at) }; }
function toRefinementRow(x: MaxxRefinementProposal) { return { id: x.id, operator_id: x.operatorId, source: x.source, observation: x.observation, proposed_change: x.proposedChange, expected_evidence: x.expectedEvidence, rollback_plan: x.rollbackPlan, status: x.status, created_at: x.createdAt, updated_at: x.updatedAt }; }

function createOperationsRepository(config: MaxxConfig): OperationsRepository {
  if (config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY) return new SupabaseOperationsRepository(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
  return new MemoryOperationsRepository();
}

function workflowInstruction(workflow: MaxxWorkflow, extra?: string) {
  return [`Run objective: ${workflow.objective}`, extra, `Expected proof: ${workflow.expectedProof}`, `Workflow ID: ${workflow.id}`].filter(Boolean).join("\n");
}

export class WorkflowSupervisor {
  private timer: ReturnType<typeof setInterval> | null = null;
  private ticking = false;
  constructor(private readonly repository: OperationsRepository, private readonly app: FastifyInstance, private readonly config: MaxxConfig) {}

  async tick(at = new Date()) {
    if (this.ticking || !this.config.MAXX_HERMES_TOOL_KEY || !this.config.MAXX_HERMES_TOOL_OPERATOR_ID) return;
    this.ticking = true;
    try {
      const operatorId = this.config.MAXX_HERMES_TOOL_OPERATOR_ID;
      const due = await this.repository.claimDueInterval(operatorId, at);
      for (const workflow of due) {
        try {
          const response = await this.app.inject({ method: "POST", url: `/v1/pups/${encodeURIComponent(workflow.pupId)}/run`, headers: { "x-maxx-hermes-tool-key": this.config.MAXX_HERMES_TOOL_KEY }, payload: { instruction: workflowInstruction(workflow) } });
          await this.repository.markWorkflowRun(operatorId, workflow.id, response.statusCode >= 200 && response.statusCode < 300 ? "dispatched" : `http_${response.statusCode}`, at);
        } catch (error) {
          await this.repository.markWorkflowRun(operatorId, workflow.id, `failed:${error instanceof Error ? error.message.slice(0, 80) : "unknown"}`, at);
        }
      }
    } finally {
      this.ticking = false;
    }
  }

  start(pollMs = 60_000) { if (!this.timer) { this.timer = setInterval(() => void this.tick(), pollMs); this.timer.unref?.(); } }
  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; }
}

export async function registerOperationsHubRoutes(app: FastifyInstance, config: MaxxConfig, repository: OperationsRepository = createOperationsRepository(config)) {
  const workflowSupervisor = new WorkflowSupervisor(repository, app, config);

  app.get("/v1/review-inbox", async (request, reply) => {
    const headers = forwardedHeaders(request);
    const [towerResponse, pupsResponse, handoffsResponse, refinements] = await Promise.all([
      app.inject({ method: "GET", url: "/v1/control-tower/bootstrap", headers }),
      app.inject({ method: "GET", url: "/v1/pups", headers }),
      app.inject({ method: "GET", url: "/v1/pup-handoffs?limit=100", headers }),
      repository.listRefinements(request.operator!.id),
    ]);
    if (towerResponse.statusCode !== 200 || pupsResponse.statusCode !== 200 || handoffsResponse.statusCode !== 200) return reply.code(502).send({ error: "MAXX could not assemble the review inbox" });
    const tower = towerResponse.json() as { approvals?: Array<Record<string, unknown>> };
    const pups = pupsResponse.json() as { pups?: Array<{ id: string; name: string; status: string; lastRunSummary?: string | null }> };
    const handoffs = handoffsResponse.json() as { handoffs?: Array<{ id: string; threadId: string; status: string; instruction: string }> };
    const items = [
      ...(tower.approvals ?? []).map((approval) => ({ kind: "approval" as const, priority: "high" as const, id: String(approval.id ?? randomUUID()), title: "MAXX needs your approval", detail: String(approval.reason ?? approval.action ?? "A consequential action is waiting for you."), data: approval })),
      ...(handoffs.handoffs ?? []).filter((x) => x.status === "needs_operator").map((x) => ({ kind: "handoff" as const, priority: "high" as const, id: x.id, title: "A Pup needs you", detail: x.instruction, data: x })),
      ...(pups.pups ?? []).filter((x) => x.status === "needs_attention").map((x) => ({ kind: "pup" as const, priority: "normal" as const, id: x.id, title: `${x.name} needs attention`, detail: x.lastRunSummary ?? "Open the Pup to review what stopped.", data: x })),
      ...refinements.filter((x) => x.status === "proposed").map((x) => ({ kind: "refinement" as const, priority: "normal" as const, id: x.id, title: "MAXX found a possible improvement", detail: x.proposedChange, data: x })),
    ];
    return { items, count: items.length, persistence: repository.persistence };
  });

  app.post("/v1/pups/:sourcePupId/delegate", async (request, reply) => {
    const parsed = delegationSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const sourcePupId = (request.params as { sourcePupId: string }).sourcePupId;
    const response = await app.inject({ method: "POST", url: "/v1/pup-handoffs", headers: forwardedHeaders(request), payload: { sourcePupId, targetPupId: parsed.data.targetPupId, instruction: `Run objective: ${parsed.data.objective}\nExpected proof: ${parsed.data.expectedProof}\nReturn the proof or stop at the existing MAXX approval boundary.` } });
    return reply.code(response.statusCode).send(response.json());
  });

  app.post("/v1/pups/:sourcePupId/fresh-specialist", async (request, reply) => {
    const parsed = freshSpecialistSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const sourcePupId = (request.params as { sourcePupId: string }).sourcePupId;
    const instruction = ["ONE-SHOT FRESH SPECIALIST TASK.", `Temporary role: ${parsed.data.role}`, `Run objective: ${parsed.data.objective}`, parsed.data.context ? `Task packet:\n${parsed.data.context}` : "Task packet: no extra context supplied.", `Expected proof: ${parsed.data.expectedProof}`, "Treat this packet as the complete task context. Do not rely on prior chat context, do not delegate again, and do not expand permissions.", "Complete the bounded task or stop for the existing MAXX approval boundary. Return evidence to the source Pup."].join("\n");
    const response = await app.inject({ method: "POST", url: "/v1/pup-handoffs", headers: forwardedHeaders(request), payload: { sourcePupId, targetPupId: parsed.data.targetPupId, instruction } });
    return reply.code(response.statusCode).send(response.json());
  });

  app.get("/v1/connections", async (request) => ({ connections: await repository.listConnections(request.operator!.id), persistence: repository.persistence }));
  app.post("/v1/connections", async (request, reply) => {
    const parsed = connectionSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    return reply.code(201).send({ connection: await repository.createConnection({ operatorId: request.operator!.id, ...parsed.data }) });
  });

  app.get("/v1/workflows", async (request) => ({ workflows: await repository.listWorkflows(request.operator!.id), persistence: repository.persistence }));
  app.post("/v1/workflows", async (request, reply) => {
    const parsed = workflowSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    if (parsed.data.triggerType !== "manual" && !parsed.data.triggerValue) return reply.code(400).send({ error: "triggerValue is required for interval and event workflows" });
    if (parsed.data.triggerType === "interval") {
      const minutes = Number(parsed.data.triggerValue);
      if (!Number.isInteger(minutes) || minutes < 15 || minutes > 10_080) return reply.code(400).send({ error: "Interval workflows require triggerValue minutes from 15 to 10080" });
      if (config.featureFlags.MAXX_SCHEDULER_ENABLED && (!config.MAXX_HERMES_TOOL_KEY || config.MAXX_HERMES_TOOL_OPERATOR_ID !== request.operator!.id)) return reply.code(503).send({ error: "Interval workflow scheduler is not safely bound to this operator" });
    }
    const workflow = await repository.createWorkflow({ operatorId: request.operator!.id, ...parsed.data });
    return reply.code(201).send({ workflow });
  });

  app.post("/v1/workflows/:workflowId/run", async (request, reply) => {
    const workflow = await repository.getWorkflow(request.operator!.id, (request.params as { workflowId: string }).workflowId);
    if (!workflow) return reply.code(404).send({ error: "Workflow not found" });
    if (!workflow.active) return reply.code(409).send({ error: "Workflow is disabled" });
    const response = await app.inject({ method: "POST", url: `/v1/pups/${encodeURIComponent(workflow.pupId)}/run`, headers: forwardedHeaders(request), payload: { instruction: workflowInstruction(workflow) } });
    await repository.markWorkflowRun(request.operator!.id, workflow.id, response.statusCode >= 200 && response.statusCode < 300 ? "manual" : `http_${response.statusCode}`);
    return reply.code(response.statusCode).send({ workflow, result: response.json() });
  });

  app.post("/v1/events", async (request, reply) => {
    const parsed = eventSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    if (parsed.data.sourceConnectionId) {
      const connection = await repository.getConnection(request.operator!.id, parsed.data.sourceConnectionId);
      if (!connection || connection.status !== "connected") return reply.code(409).send({ error: "Event source connection is unavailable" });
    }
    const dispatchHeaders = eventDispatchHeaders(request, config);
    if (!dispatchHeaders) return reply.code(503).send({ error: "Event dispatch is not safely configured", detail: "MAXX_HERMES_TOOL_KEY must be configured for the same operator as MAXX_EVENT_OPERATOR_ID." });
    const accepted = await repository.claimEvent(request.operator!.id, parsed.data.source, parsed.data.eventId, parsed.data.type);
    if (!accepted) return reply.code(200).send({ duplicate: true, eventId: parsed.data.eventId, matched: 0, results: [] });
    const matching = await repository.matchingEventWorkflows(request.operator!.id, parsed.data.type);
    const results = [];
    for (const workflow of matching) {
      const response = await app.inject({ method: "POST", url: `/v1/pups/${encodeURIComponent(workflow.pupId)}/run`, headers: dispatchHeaders, payload: { instruction: workflowInstruction(workflow, `Event ${parsed.data.source}/${parsed.data.eventId}: ${parsed.data.summary}`) } });
      await repository.markWorkflowRun(request.operator!.id, workflow.id, response.statusCode >= 200 && response.statusCode < 300 ? "event" : `http_${response.statusCode}`);
      results.push({ workflowId: workflow.id, statusCode: response.statusCode, result: response.json() });
    }
    return reply.code(202).send({ duplicate: false, eventId: parsed.data.eventId, matched: matching.length, results });
  });

  app.get("/v1/refinements", async (request) => ({ proposals: await repository.listRefinements(request.operator!.id), persistence: repository.persistence }));
  app.post("/v1/refinements", async (request, reply) => {
    const parsed = refinementSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const proposal = await repository.createRefinement({ operatorId: request.operator!.id, ...parsed.data });
    return reply.code(201).send({ proposal, note: "Proposals cannot apply themselves. Approval, evidence, and rollback remain separate steps." });
  });
  app.patch("/v1/refinements/:proposalId", async (request, reply) => {
    const parsed = refinementStatusSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const proposal = await repository.setRefinementStatus(request.operator!.id, (request.params as { proposalId: string }).proposalId, parsed.data.status);
    return proposal ? reply.send({ proposal }) : reply.code(404).send({ error: "Refinement proposal not found" });
  });

  if (config.featureFlags.MAXX_SCHEDULER_ENABLED) workflowSupervisor.start();
  app.addHook("onClose", async () => workflowSupervisor.stop());
}
