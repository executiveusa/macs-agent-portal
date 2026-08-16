import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { MaxxConfig } from "./config.js";
import { createHermesAdapter, type HermesAdapter } from "./hermes-adapter.js";
import { createIcmRun } from "./icm-runtime.js";
import { createStore, type ControlTowerStore } from "./store.js";

export type PupKind = "chief_of_staff" | "superdoer" | "business_in_a_box" | "custom";
export type PupStatus = "active" | "paused" | "needs_attention";
export type PupAutonomy = "draft_only" | "safe_actions";
export type PupRunTrigger = "manual" | "routine";

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

export const PUP_TEMPLATES: readonly PupTemplate[] = [
  {
    id: "chief_of_staff",
    name: "Scout",
    title: "Chief Pup",
    description: "Coordinates work, keeps priorities small, and hands specialist work to the right Pup.",
    defaultObjective:
      "Coordinate MACS Digital Media work for Stacy. Keep the active work small, surface the single highest-value next action, and prepare delegation without creating unnecessary projects.",
    role: [
      "You are the Chief Pup for Agent MAXX.",
      "Coordinate; do not create busywork.",
      "Prefer revenue, customer outcomes, reliability, and owner control over more software.",
      "You may inspect, organize, draft, and prepare internal work. Consequential external actions remain approval-gated by MAXX.",
      "When specialist work is needed, recommend the smallest specialist Pup rather than pretending to be every specialist at once.",
    ].join(" "),
    autonomy: "safe_actions",
  },
  {
    id: "superdoer",
    name: "Doer",
    title: "Superdoer Pup",
    description: "Looks for useful work it can prepare now instead of producing another briefing.",
    defaultObjective:
      "Proactively prepare useful work for MACS Digital Media from approved context: drafts, research, follow-up preparation, meeting preparation, and verifiable internal deliverables. Do not send or publish without approval.",
    role: [
      "You are the Superdoer Pup for Agent MAXX.",
      "Your job is to create concrete useful output, not status theater.",
      "Infer safe preparatory work from the objective and available approved context.",
      "Draft replies, plans, assets, research, and internal artifacts when useful, but never send, publish, purchase, delete, change permissions, or expose secrets without the existing MAXX approval path.",
      "End work with evidence of what changed and the next decision needed from Stacy, if any.",
    ].join(" "),
    autonomy: "safe_actions",
  },
  {
    id: "business_in_a_box",
    name: "Biz Pup",
    title: "Business-in-a-Box Pup",
    description: "Turns one supplied business into the smallest repeatable path to revenue and operations.",
    defaultObjective:
      "Treat MACS Digital Media as the supplied business idea. Build the simplest repeatable path from offer to customer to delivery to retention, with cash before more code and explicit proof for every claim.",
    role: [
      "You are the Business-in-a-Box Pup for Agent MAXX.",
      "The business idea must come from the owner; never fabricate demand and call it validation.",
      "Work in this order unless evidence requires otherwise: offer, target customer, outreach or distribution, payment path, delivery system, retention, then automation.",
      "Reuse MAXX capabilities and existing assets before proposing new software.",
      "You may prepare internal work automatically. External communication, spending, publishing, account changes, and irreversible actions remain approval-gated.",
    ].join(" "),
    autonomy: "safe_actions",
  },
] as const;

const createPupSchema = z.object({
  templateId: z.enum(["chief_of_staff", "superdoer", "business_in_a_box", "custom"]),
  name: z.string().trim().min(1).max(60).optional(),
  objective: z.string().trim().min(3).max(4_000).optional(),
  role: z.string().trim().min(3).max(8_000).optional(),
  autonomy: z.enum(["draft_only", "safe_actions"]).optional(),
  routineEveryMinutes: z.number().int().min(15).max(10_080).nullable().optional(),
  routinePrompt: z.string().trim().min(3).max(4_000).nullable().optional(),
});

const patchPupSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  objective: z.string().trim().min(3).max(4_000).optional(),
  status: z.enum(["active", "paused"]).optional(),
  autonomy: z.enum(["draft_only", "safe_actions"]).optional(),
  routineEveryMinutes: z.number().int().min(15).max(10_080).nullable().optional(),
  routinePrompt: z.string().trim().min(3).max(4_000).nullable().optional(),
});

const pupChatSchema = z.object({ message: z.string().trim().min(1).max(20_000) });
const pupRunSchema = z.object({ instruction: z.string().trim().min(1).max(4_000).optional() });

export type CreatePupInput = z.infer<typeof createPupSchema> & { operatorId: string };
export type PatchPupInput = z.infer<typeof patchPupSchema>;

export interface PupRepository {
  readonly persistence: "memory" | "supabase";
  list(operatorId: string): Promise<Pup[]>;
  get(operatorId: string, id: string): Promise<Pup | undefined>;
  create(input: CreatePupInput): Promise<Pup>;
  patch(operatorId: string, id: string, input: PatchPupInput): Promise<Pup | undefined>;
  claimDue(now?: Date): Promise<Pup[]>;
  markRun(id: string, status: string, summary?: string): Promise<void>;
}

function templateFor(kind: PupKind): PupTemplate | undefined {
  return PUP_TEMPLATES.find((template) => template.id === kind);
}

function nextRunIso(minutes: number | null | undefined, from = Date.now()) {
  return minutes ? new Date(from + minutes * 60_000).toISOString() : null;
}

function materializePup(input: CreatePupInput, now = new Date()): Pup {
  const template = templateFor(input.templateId);
  if (input.templateId === "custom" && (!input.objective || !input.role)) {
    throw new Error("Custom Pups require both an objective and a role");
  }
  const id = randomUUID();
  const routineEveryMinutes = input.routineEveryMinutes ?? null;
  return {
    id,
    operatorId: input.operatorId,
    name: input.name ?? template?.name ?? "Pup",
    kind: input.templateId,
    role: input.role ?? template?.role ?? "You are a bounded specialist Pup working for Agent MAXX.",
    objective: input.objective ?? template?.defaultObjective ?? "Help Stacy complete the stated objective safely.",
    status: "active",
    autonomy: input.autonomy ?? template?.autonomy ?? "draft_only",
    sessionId: `pup-${id}`,
    routineEveryMinutes,
    routinePrompt: input.routinePrompt ?? null,
    nextRunAt: nextRunIso(routineEveryMinutes, now.getTime()),
    lastRunAt: null,
    lastRunStatus: null,
    lastRunSummary: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export class MemoryPupRepository implements PupRepository {
  readonly persistence = "memory" as const;
  private readonly pups = new Map<string, Pup>();

  async list(operatorId: string) {
    return [...this.pups.values()].filter((pup) => pup.operatorId === operatorId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(operatorId: string, id: string) {
    const pup = this.pups.get(id);
    return pup?.operatorId === operatorId ? { ...pup } : undefined;
  }

  async create(input: CreatePupInput) {
    const pup = materializePup(input);
    this.pups.set(pup.id, pup);
    return { ...pup };
  }

  async patch(operatorId: string, id: string, input: PatchPupInput) {
    const pup = this.pups.get(id);
    if (!pup || pup.operatorId !== operatorId) return undefined;
    Object.assign(pup, input, {
      updatedAt: new Date().toISOString(),
      nextRunAt:
        input.routineEveryMinutes !== undefined
          ? nextRunIso(input.routineEveryMinutes)
          : input.status === "active" && pup.routineEveryMinutes && !pup.nextRunAt
            ? nextRunIso(pup.routineEveryMinutes)
            : pup.nextRunAt,
    });
    if (input.routineEveryMinutes === null || input.status === "paused") pup.nextRunAt = null;
    this.pups.set(id, pup);
    return { ...pup };
  }

  async claimDue(now = new Date()) {
    const claimed: Pup[] = [];
    for (const pup of this.pups.values()) {
      if (pup.status !== "active" || !pup.routineEveryMinutes || !pup.nextRunAt) continue;
      if (new Date(pup.nextRunAt).getTime() > now.getTime()) continue;
      pup.nextRunAt = nextRunIso(pup.routineEveryMinutes, now.getTime());
      pup.updatedAt = now.toISOString();
      claimed.push({ ...pup });
    }
    return claimed;
  }

  async markRun(id: string, status: string, summary?: string) {
    const pup = this.pups.get(id);
    if (!pup) return;
    pup.lastRunAt = new Date().toISOString();
    pup.lastRunStatus = status;
    pup.lastRunSummary = summary?.slice(0, 1_000) ?? null;
    pup.updatedAt = new Date().toISOString();
  }
}

class SupabasePupRepository implements PupRepository {
  readonly persistence = "supabase" as const;

  constructor(private readonly url: string, private readonly serviceRoleKey: string) {}

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
    if (!response.ok) throw new Error(`Pup store request failed with status ${response.status}`);
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  async list(operatorId: string) {
    const rows = await this.request<Array<Record<string, unknown>>>(
      `maxx_pups?operator_id=eq.${encodeURIComponent(operatorId)}&order=updated_at.desc`,
    );
    return rows.map(mapPup);
  }

  async get(operatorId: string, id: string) {
    const rows = await this.request<Array<Record<string, unknown>>>(
      `maxx_pups?id=eq.${encodeURIComponent(id)}&operator_id=eq.${encodeURIComponent(operatorId)}&limit=1`,
    );
    return rows[0] ? mapPup(rows[0]) : undefined;
  }

  async create(input: CreatePupInput) {
    const pup = materializePup(input);
    const rows = await this.request<Array<Record<string, unknown>>>("maxx_pups", {
      method: "POST",
      body: JSON.stringify(toPupRow(pup)),
    });
    return mapPup(rows[0]);
  }

  async patch(operatorId: string, id: string, input: PatchPupInput) {
    const current = await this.get(operatorId, id);
    if (!current) return undefined;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.name !== undefined) patch.name = input.name;
    if (input.objective !== undefined) patch.objective = input.objective;
    if (input.status !== undefined) patch.status = input.status;
    if (input.autonomy !== undefined) patch.autonomy = input.autonomy;
    if (input.routinePrompt !== undefined) patch.routine_prompt = input.routinePrompt;
    if (input.routineEveryMinutes !== undefined) {
      patch.routine_every_minutes = input.routineEveryMinutes;
      patch.next_run_at = nextRunIso(input.routineEveryMinutes);
    }
    if (input.status === "paused") patch.next_run_at = null;
    if (input.status === "active" && current.routineEveryMinutes && !current.nextRunAt && input.routineEveryMinutes === undefined) {
      patch.next_run_at = nextRunIso(current.routineEveryMinutes);
    }
    const rows = await this.request<Array<Record<string, unknown>>>(
      `maxx_pups?id=eq.${encodeURIComponent(id)}&operator_id=eq.${encodeURIComponent(operatorId)}`,
      { method: "PATCH", body: JSON.stringify(patch) },
    );
    return rows[0] ? mapPup(rows[0]) : undefined;
  }

  async claimDue(now = new Date()) {
    const nowIso = now.toISOString();
    const rows = await this.request<Array<Record<string, unknown>>>(
      `maxx_pups?status=eq.active&routine_every_minutes=not.is.null&next_run_at=lte.${encodeURIComponent(nowIso)}&order=next_run_at.asc&limit=20`,
    );
    const claimed: Pup[] = [];
    for (const row of rows) {
      const pup = mapPup(row);
      if (!pup.routineEveryMinutes) continue;
      const updated = await this.request<Array<Record<string, unknown>>>(
        `maxx_pups?id=eq.${encodeURIComponent(pup.id)}&status=eq.active&next_run_at=lte.${encodeURIComponent(nowIso)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            next_run_at: nextRunIso(pup.routineEveryMinutes, now.getTime()),
            updated_at: nowIso,
          }),
        },
      );
      if (updated[0]) claimed.push(mapPup(updated[0]));
    }
    return claimed;
  }

  async markRun(id: string, status: string, summary?: string) {
    await this.request(`maxx_pups?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        last_run_at: new Date().toISOString(),
        last_run_status: status,
        last_run_summary: summary?.slice(0, 1_000) ?? null,
        updated_at: new Date().toISOString(),
      }),
    });
  }
}

export function createPupRepository(config: MaxxConfig): PupRepository {
  if (config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY) {
    return new SupabasePupRepository(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
  }
  return new MemoryPupRepository();
}

function mapPup(row: Record<string, unknown>): Pup {
  return {
    id: String(row.id),
    operatorId: String(row.operator_id),
    name: String(row.name),
    kind: row.kind as PupKind,
    role: String(row.role),
    objective: String(row.objective),
    status: row.status as PupStatus,
    autonomy: row.autonomy as PupAutonomy,
    sessionId: String(row.session_id),
    routineEveryMinutes: row.routine_every_minutes == null ? null : Number(row.routine_every_minutes),
    routinePrompt: row.routine_prompt == null ? null : String(row.routine_prompt),
    nextRunAt: row.next_run_at == null ? null : String(row.next_run_at),
    lastRunAt: row.last_run_at == null ? null : String(row.last_run_at),
    lastRunStatus: row.last_run_status == null ? null : String(row.last_run_status),
    lastRunSummary: row.last_run_summary == null ? null : String(row.last_run_summary),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toPupRow(pup: Pup) {
  return {
    id: pup.id,
    operator_id: pup.operatorId,
    name: pup.name,
    kind: pup.kind,
    role: pup.role,
    objective: pup.objective,
    status: pup.status,
    autonomy: pup.autonomy,
    session_id: pup.sessionId,
    routine_every_minutes: pup.routineEveryMinutes,
    routine_prompt: pup.routinePrompt,
    next_run_at: pup.nextRunAt,
    last_run_at: pup.lastRunAt,
    last_run_status: pup.lastRunStatus,
    last_run_summary: pup.lastRunSummary,
    created_at: pup.createdAt,
    updated_at: pup.updatedAt,
  };
}

function pupContext(pup: Pup) {
  return [
    `You are ${pup.name}, a persistent Pup working under Agent MAXX 006.`,
    `Pup type: ${pup.kind}.`,
    `Role: ${pup.role}`,
    `Standing objective: ${pup.objective}`,
    `Autonomy: ${pup.autonomy}.`,
    "Never expand your own permissions. Never treat drafting as sending. Never claim completion without evidence.",
    "Sending, publishing, purchasing, deleting, changing permissions, handling secrets, and irreversible external actions remain subject to MAXX approval policy.",
    "Keep the operator experience non-technical: outcome first, short state, one concrete next action when a human decision is needed.",
  ].join("\n");
}

export class PupExecutor {
  constructor(
    private readonly config: MaxxConfig,
    private readonly repository: PupRepository,
    private readonly hermes: HermesAdapter = createHermesAdapter({
      hermesEnabled: config.featureFlags.MAXX_HERMES_ENABLED,
      hermesEndpoint: config.MAXX_HERMES_ENDPOINT,
      hermesApiKey: config.MAXX_HERMES_API_KEY,
    }),
    private readonly store: ControlTowerStore = createStore(config),
  ) {}

  async chat(pup: Pup, message: string) {
    const result = await this.hermes.chat({
      sessionId: pup.sessionId,
      message: `${pupContext(pup)}\n\nStacy says:\n${message}`,
    });
    await this.repository.markRun(pup.id, "chat", result.text);
    return result;
  }

  async run(pup: Pup, trigger: PupRunTrigger, instruction?: string) {
    const missionId = randomUUID();
    const runObjective = instruction?.trim() || pup.routinePrompt || pup.objective;
    const auditObjective = `${pup.name}: ${runObjective}`.slice(0, 4_000);
    const objective = [
      pupContext(pup),
      "",
      trigger === "routine" ? "This is a proactive routine wake-up." : "This is a manual wake-up from Stacy.",
      runObjective,
      "Produce useful internal work now. If an external consequential action is needed, stop at the existing approval boundary and prepare the action for approval.",
    ].join("\n");
    const icm = await createIcmRun({
      root: this.config.MAXX_ICM_ROOT,
      missionId,
      objective: auditObjective,
      operatorId: pup.operatorId,
    });
    const mission = await this.store.createMission({
      id: missionId,
      operatorId: pup.operatorId,
      objective: auditObjective,
      status: "working",
      runId: icm.runId,
      workspacePath: icm.runPath,
    });
    await this.store.addEvent(icm.runId, "pup.run.created", `${pup.name} woke up`, {
      pupId: pup.id,
      pupKind: pup.kind,
      trigger,
      runObjective,
      standingObjective: pup.objective,
    });

    try {
      const state = await this.hermes.startRun({
        runId: icm.runId,
        missionId: mission.id,
        objective,
        workspacePath: icm.runPath,
        stage: "pup",
      });
      const missionStatus =
        state.status === "failed"
          ? "failed"
          : state.status === "waiting_for_approval"
            ? "needs_operator"
            : state.status === "completed"
              ? "ready"
              : "working";
      await this.store.updateMission(mission.id, missionStatus);
      await this.store.addEvent(icm.runId, "pup.run.started", `${pup.name} runtime state: ${state.status}`, {
        pupId: pup.id,
        trigger,
        hermesStatus: state.status,
      });
      await this.repository.markRun(pup.id, state.status, state.error ?? undefined);
      return { mission, state, trigger };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.store.updateMission(mission.id, "failed");
      await this.store.addEvent(icm.runId, "pup.run.failed", `${pup.name} failed to start`, { pupId: pup.id, error: message });
      await this.repository.markRun(pup.id, "failed", message);
      throw error;
    }
  }
}

export class PupSupervisor {
  private timer: ReturnType<typeof setInterval> | null = null;
  private ticking = false;

  constructor(private readonly repository: PupRepository, private readonly executor: PupExecutor) {}

  async tick(now = new Date()) {
    if (this.ticking) return;
    this.ticking = true;
    try {
      const due = await this.repository.claimDue(now);
      for (const pup of due) {
        try {
          await this.executor.run(pup, "routine");
        } catch {
          // The executor records failure. One Pup failing must not block the others.
        }
      }
    } finally {
      this.ticking = false;
    }
  }

  start(pollMs = 60_000) {
    if (this.timer) return;
    this.timer = setInterval(() => void this.tick(), pollMs);
    this.timer.unref?.();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}

export async function registerPupRoutes(app: FastifyInstance, config: MaxxConfig) {
  const repository = createPupRepository(config);
  const executor = new PupExecutor(config, repository);
  const supervisor = new PupSupervisor(repository, executor);

  app.get("/v1/pups/templates", async () => ({ templates: PUP_TEMPLATES }));

  app.get("/v1/pups", async (request) => ({
    pups: await repository.list(request.operator!.id),
    templates: PUP_TEMPLATES,
    persistence: repository.persistence,
    alwaysOn: repository.persistence === "supabase" && config.featureFlags.MAXX_SCHEDULER_ENABLED,
  }));

  app.post("/v1/pups", async (request, reply) => {
    const parsed = createPupSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    try {
      const pup = await repository.create({ ...parsed.data, operatorId: request.operator!.id });
      return reply.code(201).send(pup);
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/v1/pups/:id", async (request, reply) => {
    const parsed = patchPupSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const pup = await repository.patch(request.operator!.id, (request.params as { id: string }).id, parsed.data);
    return pup ? reply.send(pup) : reply.code(404).send({ error: "Pup not found" });
  });

  app.post("/v1/pups/:id/chat", async (request, reply) => {
    const parsed = pupChatSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const pup = await repository.get(request.operator!.id, (request.params as { id: string }).id);
    if (!pup) return reply.code(404).send({ error: "Pup not found" });
    if (pup.status === "paused") return reply.code(409).send({ error: "Pup is paused" });
    try {
      return reply.send(await executor.chat(pup, parsed.data.message));
    } catch (error) {
      return reply.code(502).send({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/v1/pups/:id/run", async (request, reply) => {
    const parsed = pupRunSchema.safeParse(request.body ?? {});
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const pup = await repository.get(request.operator!.id, (request.params as { id: string }).id);
    if (!pup) return reply.code(404).send({ error: "Pup not found" });
    if (pup.status === "paused") return reply.code(409).send({ error: "Pup is paused" });
    try {
      const result = await executor.run(pup, "manual", parsed.data.instruction);
      return reply.code(result.state.status === "failed" ? 502 : 202).send(result);
    } catch (error) {
      return reply.code(502).send({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  if (config.featureFlags.MAXX_SCHEDULER_ENABLED) supervisor.start();
  app.addHook("onClose", async () => supervisor.stop());
}
