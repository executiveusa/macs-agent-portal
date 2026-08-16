import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import type { MaxxConfig } from "./config.js";

export type PupHandoffStatus = "queued" | "working" | "needs_operator" | "ready" | "failed" | "cancelled";

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

export type PupDirectoryEntry = {
  id: string;
  name: string;
  status: "active" | "paused" | "needs_attention";
};

export type PupDispatchResult = {
  statusCode: number;
  missionId?: string;
  runId?: string;
  stateStatus?: string;
  error?: string;
};

export interface PupHandoffRepository {
  readonly persistence: "memory" | "supabase";
  list(operatorId: string, limit?: number): Promise<PupHandoff[]>;
  thread(operatorId: string, threadId: string): Promise<PupHandoff[]>;
  create(input: {
    operatorId: string;
    sourcePupId: string;
    targetPupId: string;
    instruction: string;
  }): Promise<PupHandoff>;
  update(
    operatorId: string,
    id: string,
    input: Partial<Pick<PupHandoff, "status" | "missionId" | "runId" | "error">>,
  ): Promise<PupHandoff | undefined>;
}

const createHandoffSchema = z
  .object({
    sourcePupId: z.string().uuid(),
    targetPupId: z.string().uuid(),
    instruction: z.string().trim().min(3).max(4_000),
  })
  .strict();

const listHandoffsSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
});

function materializeHandoff(input: {
  operatorId: string;
  sourcePupId: string;
  targetPupId: string;
  instruction: string;
}): PupHandoff {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    threadId: randomUUID(),
    operatorId: input.operatorId,
    sourcePupId: input.sourcePupId,
    targetPupId: input.targetPupId,
    instruction: input.instruction,
    depth: 1,
    status: "queued",
    missionId: null,
    runId: null,
    error: null,
    createdAt: now,
    updatedAt: now,
  };
}

export class MemoryPupHandoffRepository implements PupHandoffRepository {
  readonly persistence = "memory" as const;
  private readonly handoffs = new Map<string, PupHandoff>();

  async list(operatorId: string, limit = 50) {
    return [...this.handoffs.values()]
      .filter((handoff) => handoff.operatorId === operatorId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((handoff) => ({ ...handoff }));
  }

  async thread(operatorId: string, threadId: string) {
    return [...this.handoffs.values()]
      .filter((handoff) => handoff.operatorId === operatorId && handoff.threadId === threadId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((handoff) => ({ ...handoff }));
  }

  async create(input: { operatorId: string; sourcePupId: string; targetPupId: string; instruction: string }) {
    const handoff = materializeHandoff(input);
    this.handoffs.set(handoff.id, handoff);
    return { ...handoff };
  }

  async update(
    operatorId: string,
    id: string,
    input: Partial<Pick<PupHandoff, "status" | "missionId" | "runId" | "error">>,
  ) {
    const handoff = this.handoffs.get(id);
    if (!handoff || handoff.operatorId !== operatorId) return undefined;
    Object.assign(handoff, input, { updatedAt: new Date().toISOString() });
    this.handoffs.set(id, handoff);
    return { ...handoff };
  }
}

class SupabasePupHandoffRepository implements PupHandoffRepository {
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
    if (!response.ok) throw new Error(`Pup handoff store request failed with status ${response.status}`);
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  async list(operatorId: string, limit = 50) {
    const rows = await this.request<Array<Record<string, unknown>>>(
      `maxx_pup_handoffs?operator_id=eq.${encodeURIComponent(operatorId)}&order=created_at.desc&limit=${limit}`,
    );
    return rows.map(mapHandoff);
  }

  async thread(operatorId: string, threadId: string) {
    const rows = await this.request<Array<Record<string, unknown>>>(
      `maxx_pup_handoffs?operator_id=eq.${encodeURIComponent(operatorId)}&thread_id=eq.${encodeURIComponent(threadId)}&order=created_at.asc`,
    );
    return rows.map(mapHandoff);
  }

  async create(input: { operatorId: string; sourcePupId: string; targetPupId: string; instruction: string }) {
    const handoff = materializeHandoff(input);
    const rows = await this.request<Array<Record<string, unknown>>>("maxx_pup_handoffs", {
      method: "POST",
      body: JSON.stringify(toHandoffRow(handoff)),
    });
    return mapHandoff(rows[0]);
  }

  async update(
    operatorId: string,
    id: string,
    input: Partial<Pick<PupHandoff, "status" | "missionId" | "runId" | "error">>,
  ) {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.status !== undefined) patch.status = input.status;
    if (input.missionId !== undefined) patch.mission_id = input.missionId;
    if (input.runId !== undefined) patch.run_id = input.runId;
    if (input.error !== undefined) patch.error = input.error?.slice(0, 2_000) ?? null;
    const rows = await this.request<Array<Record<string, unknown>>>(
      `maxx_pup_handoffs?id=eq.${encodeURIComponent(id)}&operator_id=eq.${encodeURIComponent(operatorId)}`,
      { method: "PATCH", body: JSON.stringify(patch) },
    );
    return rows[0] ? mapHandoff(rows[0]) : undefined;
  }
}

export function createPupHandoffRepository(config: MaxxConfig): PupHandoffRepository {
  if (config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY) {
    return new SupabasePupHandoffRepository(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
  }
  return new MemoryPupHandoffRepository();
}

function mapHandoff(row: Record<string, unknown>): PupHandoff {
  return {
    id: String(row.id),
    threadId: String(row.thread_id),
    operatorId: String(row.operator_id),
    sourcePupId: String(row.source_pup_id),
    targetPupId: String(row.target_pup_id),
    instruction: String(row.instruction),
    depth: 1,
    status: row.status as PupHandoffStatus,
    missionId: row.mission_id == null ? null : String(row.mission_id),
    runId: row.run_id == null ? null : String(row.run_id),
    error: row.error == null ? null : String(row.error),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toHandoffRow(handoff: PupHandoff) {
  return {
    id: handoff.id,
    thread_id: handoff.threadId,
    operator_id: handoff.operatorId,
    source_pup_id: handoff.sourcePupId,
    target_pup_id: handoff.targetPupId,
    instruction: handoff.instruction,
    depth: handoff.depth,
    status: handoff.status,
    mission_id: handoff.missionId,
    run_id: handoff.runId,
    error: handoff.error,
    created_at: handoff.createdAt,
    updated_at: handoff.updatedAt,
  };
}

function handoffStatus(dispatch: PupDispatchResult): PupHandoffStatus {
  if (dispatch.statusCode >= 400) return "failed";
  if (dispatch.stateStatus === "waiting_for_approval") return "needs_operator";
  if (dispatch.stateStatus === "completed") return "ready";
  if (dispatch.stateStatus === "failed" || dispatch.stateStatus === "cancelled") return "failed";
  return "working";
}

export async function delegatePupWork(input: {
  operatorId: string;
  sourcePupId: string;
  targetPupId: string;
  instruction: string;
  repository: PupHandoffRepository;
  listPups: () => Promise<PupDirectoryEntry[]>;
  dispatch: (targetPupId: string, instruction: string) => Promise<PupDispatchResult>;
}) {
  if (input.sourcePupId === input.targetPupId) throw new Error("A Pup cannot hand work to itself");

  const pups = await input.listPups();
  const source = pups.find((pup) => pup.id === input.sourcePupId);
  const target = pups.find((pup) => pup.id === input.targetPupId);
  if (!source || !target) throw new Error("Both Pups must belong to Stacy before work can be handed off");
  if (source.status !== "active") throw new Error(`${source.name} is not active`);
  if (target.status !== "active") throw new Error(`${target.name} is not active`);

  const handoff = await input.repository.create({
    operatorId: input.operatorId,
    sourcePupId: source.id,
    targetPupId: target.id,
    instruction: input.instruction,
  });

  const delegatedInstruction = [
    `Pup-to-Pup handoff from ${source.name} to ${target.name}.`,
    `Transparent thread: ${handoff.threadId}.`,
    `Delegated objective: ${input.instruction}`,
    "This is one-hop delegation. Complete the delegated work yourself or stop for Stacy/approval.",
    "Do not hand this work to another Pup, do not spawn a recursive Pup chain, and do not expand permissions.",
    "Return evidence and a concise result to the originating MAXX thread.",
  ].join("\n");

  let dispatch: PupDispatchResult;
  try {
    dispatch = await input.dispatch(target.id, delegatedInstruction);
  } catch (error) {
    dispatch = { statusCode: 502, error: error instanceof Error ? error.message : String(error) };
  }

  const updated = await input.repository.update(input.operatorId, handoff.id, {
    status: handoffStatus(dispatch),
    missionId: dispatch.missionId ?? null,
    runId: dispatch.runId ?? null,
    error: dispatch.error ?? null,
  });

  return { handoff: updated ?? handoff, dispatch, source, target };
}

function forwardedHeaders(request: FastifyRequest) {
  const headers: Record<string, string> = {};
  if (typeof request.headers.authorization === "string") headers.authorization = request.headers.authorization;
  if (typeof request.headers["x-request-id"] === "string") headers["x-request-id"] = request.headers["x-request-id"];
  return headers;
}

export async function registerPupBrokerRoutes(
  app: FastifyInstance,
  config: MaxxConfig,
  repository: PupHandoffRepository = createPupHandoffRepository(config),
) {
  app.get("/v1/pup-handoffs", async (request, reply) => {
    const parsed = listHandoffsSchema.safeParse(request.query ?? {});
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    return {
      handoffs: await repository.list(request.operator!.id, parsed.data.limit),
      persistence: repository.persistence,
      maxDepth: 1,
    };
  });

  app.get("/v1/pup-handoffs/:threadId", async (request, reply) => {
    const threadId = (request.params as { threadId: string }).threadId;
    const handoffs = await repository.thread(request.operator!.id, threadId);
    return handoffs.length > 0 ? reply.send({ threadId, handoffs }) : reply.code(404).send({ error: "Pup handoff thread not found" });
  });

  app.post("/v1/pup-handoffs", async (request, reply) => {
    const parsed = createHandoffSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const headers = forwardedHeaders(request);
    const directoryResponse = await app.inject({ method: "GET", url: "/v1/pups", headers });
    if (directoryResponse.statusCode !== 200) {
      return reply.code(502).send({ error: "MAXX could not load the current Pup team for this handoff" });
    }
    const payload = directoryResponse.json() as { pups?: PupDirectoryEntry[] };

    try {
      const result = await delegatePupWork({
        operatorId: request.operator!.id,
        sourcePupId: parsed.data.sourcePupId,
        targetPupId: parsed.data.targetPupId,
        instruction: parsed.data.instruction,
        repository,
        listPups: async () => payload.pups ?? [],
        dispatch: async (targetPupId, instruction) => {
          const response = await app.inject({
            method: "POST",
            url: `/v1/pups/${encodeURIComponent(targetPupId)}/run`,
            headers,
            payload: { instruction },
          });
          const body = response.json() as {
            mission?: { id?: string; runId?: string };
            state?: { status?: string };
            error?: string;
          };
          return {
            statusCode: response.statusCode,
            missionId: body.mission?.id,
            runId: body.mission?.runId,
            stateStatus: body.state?.status,
            error: body.error,
          };
        },
      });
      const code = result.dispatch.statusCode >= 400 ? 502 : 202;
      return reply.code(code).send(result);
    } catch (error) {
      return reply.code(409).send({ error: error instanceof Error ? error.message : String(error) });
    }
  });
}