import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";

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
  createdAt: string;
  updatedAt: string;
};

type OperationsStore = {
  connections: Map<string, MaxxConnection>;
  workflows: Map<string, MaxxWorkflow>;
};

const store: OperationsStore = {
  connections: new Map(),
  workflows: new Map(),
};

const connectionSchema = z.object({
  name: z.string().trim().min(2).max(100),
  kind: z.enum(["email", "calendar", "crm", "hosting", "social", "browser", "other"]),
  secretRef: z.string().trim().min(3).max(200).refine((value) => !value.includes(" "), "secretRef must be an opaque reference, not a credential"),
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

const eventSchema = z.object({
  type: z.string().trim().min(2).max(120),
  summary: z.string().trim().min(1).max(4_000),
  sourceConnectionId: z.string().uuid().optional(),
}).strict();

function forwardedHeaders(request: FastifyRequest) {
  const headers: Record<string, string> = {};
  if (typeof request.headers.authorization === "string") headers.authorization = request.headers.authorization;
  if (typeof request.headers["x-request-id"] === "string") headers["x-request-id"] = request.headers["x-request-id"];
  return headers;
}

function now() {
  return new Date().toISOString();
}

export async function registerOperationsHubRoutes(app: FastifyInstance) {
  app.get("/v1/review-inbox", async (request, reply) => {
    const headers = forwardedHeaders(request);
    const [towerResponse, pupsResponse, handoffsResponse] = await Promise.all([
      app.inject({ method: "GET", url: "/v1/control-tower/bootstrap", headers }),
      app.inject({ method: "GET", url: "/v1/pups", headers }),
      app.inject({ method: "GET", url: "/v1/pup-handoffs?limit=100", headers }),
    ]);
    if (towerResponse.statusCode !== 200 || pupsResponse.statusCode !== 200 || handoffsResponse.statusCode !== 200) {
      return reply.code(502).send({ error: "MAXX could not assemble the review inbox" });
    }

    const tower = towerResponse.json() as { approvals?: Array<Record<string, unknown>> };
    const pups = pupsResponse.json() as { pups?: Array<{ id: string; name: string; status: string; lastRunSummary?: string | null }> };
    const handoffs = handoffsResponse.json() as { handoffs?: Array<{ id: string; threadId: string; sourcePupId: string; targetPupId: string; status: string; instruction: string; updatedAt: string }> };

    const items = [
      ...(tower.approvals ?? []).map((approval) => ({
        kind: "approval" as const,
        priority: "high" as const,
        id: String(approval.id ?? randomUUID()),
        title: "MAXX needs your approval",
        detail: String(approval.reason ?? approval.action ?? "A consequential action is waiting for you."),
        data: approval,
      })),
      ...(handoffs.handoffs ?? []).filter((item) => item.status === "needs_operator").map((handoff) => ({
        kind: "handoff" as const,
        priority: "high" as const,
        id: handoff.id,
        title: "A Pup needs you",
        detail: handoff.instruction,
        data: handoff,
      })),
      ...(pups.pups ?? []).filter((pup) => pup.status === "needs_attention").map((pup) => ({
        kind: "pup" as const,
        priority: "normal" as const,
        id: pup.id,
        title: `${pup.name} needs attention`,
        detail: pup.lastRunSummary ?? "Open the Pup to review what stopped.",
        data: pup,
      })),
    ];

    return { items, count: items.length };
  });

  app.post("/v1/pups/:sourcePupId/delegate", async (request, reply) => {
    const parsed = delegationSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const sourcePupId = (request.params as { sourcePupId: string }).sourcePupId;
    const headers = forwardedHeaders(request);
    const response = await app.inject({
      method: "POST",
      url: "/v1/pup-handoffs",
      headers,
      payload: {
        sourcePupId,
        targetPupId: parsed.data.targetPupId,
        instruction: [
          parsed.data.objective,
          `Expected proof: ${parsed.data.expectedProof}`,
          "Return the proof or stop at the existing MAXX approval boundary.",
        ].join("\n"),
      },
    });
    return reply.code(response.statusCode).send(response.json());
  });

  app.get("/v1/connections", async (request) => ({
    connections: [...store.connections.values()].filter((item) => item.operatorId === request.operator!.id),
  }));

  app.post("/v1/connections", async (request, reply) => {
    const parsed = connectionSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const timestamp = now();
    const connection: MaxxConnection = {
      id: randomUUID(),
      operatorId: request.operator!.id,
      ...parsed.data,
      status: "connected",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.connections.set(connection.id, connection);
    return reply.code(201).send({ connection });
  });

  app.get("/v1/workflows", async (request) => ({
    workflows: [...store.workflows.values()].filter((item) => item.operatorId === request.operator!.id),
  }));

  app.post("/v1/workflows", async (request, reply) => {
    const parsed = workflowSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    if (parsed.data.triggerType !== "manual" && !parsed.data.triggerValue) {
      return reply.code(400).send({ error: "triggerValue is required for interval and event workflows" });
    }
    const timestamp = now();
    const workflow: MaxxWorkflow = {
      id: randomUUID(),
      operatorId: request.operator!.id,
      ...parsed.data,
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.workflows.set(workflow.id, workflow);
    return reply.code(201).send({ workflow });
  });

  app.post("/v1/workflows/:workflowId/run", async (request, reply) => {
    const workflowId = (request.params as { workflowId: string }).workflowId;
    const workflow = store.workflows.get(workflowId);
    if (!workflow || workflow.operatorId !== request.operator!.id) return reply.code(404).send({ error: "Workflow not found" });
    if (!workflow.active) return reply.code(409).send({ error: "Workflow is disabled" });
    const response = await app.inject({
      method: "POST",
      url: `/v1/pups/${encodeURIComponent(workflow.pupId)}/run`,
      headers: forwardedHeaders(request),
      payload: { instruction: `${workflow.objective}\nExpected proof: ${workflow.expectedProof}` },
    });
    return reply.code(response.statusCode).send({ workflow, result: response.json() });
  });

  app.post("/v1/events", async (request, reply) => {
    const parsed = eventSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    if (parsed.data.sourceConnectionId) {
      const connection = store.connections.get(parsed.data.sourceConnectionId);
      if (!connection || connection.operatorId !== request.operator!.id || connection.status !== "connected") {
        return reply.code(409).send({ error: "Event source connection is unavailable" });
      }
    }

    const matching = [...store.workflows.values()].filter((workflow) =>
      workflow.operatorId === request.operator!.id && workflow.active && workflow.triggerType === "event" && workflow.triggerValue === parsed.data.type,
    );
    const results = [];
    for (const workflow of matching) {
      const response = await app.inject({
        method: "POST",
        url: `/v1/pups/${encodeURIComponent(workflow.pupId)}/run`,
        headers: forwardedHeaders(request),
        payload: {
          instruction: `${workflow.objective}\nEvent: ${parsed.data.summary}\nExpected proof: ${workflow.expectedProof}`,
        },
      });
      results.push({ workflowId: workflow.id, statusCode: response.statusCode, result: response.json() });
    }
    return reply.code(202).send({ matched: matching.length, results });
  });
}
