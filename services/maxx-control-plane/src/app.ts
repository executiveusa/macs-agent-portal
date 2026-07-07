import Fastify, { type FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { loadConfig, type MaxxConfig } from "./config.js";
import { createAuthenticator } from "./auth.js";
import { classifyBrowserAction, type BrowserAction } from "./approval-policy.js";
import { createIcmRun } from "./icm-runtime.js";
import { routeModel } from "./model-router.js";
import { runOpenRouter } from "./openrouter.js";
import { runGroq } from "./groq.js";
import { runPiSkill } from "./pi-runner.js";
import { TRUSTED_SKILLS } from "./skills.js";
import { createStore, type ControlTowerStore } from "./store.js";
import type { Operator, UsageRecord } from "./types.js";

declare module "fastify" {
  interface FastifyRequest {
    operator?: Operator;
  }
}

type AppOptions = {
  config?: MaxxConfig;
  authenticate?: (request: FastifyRequest) => Promise<Operator | null>;
  store?: ControlTowerStore;
};

const chatSchema = z.object({
  message: z.string().trim().min(1).max(20_000),
  model: z.string().trim().min(1).optional(),
  runId: z.string().optional(),
});

const missionSchema = z.object({ objective: z.string().trim().min(3).max(2_000) });
const missionPatchSchema = z.object({
  status: z.enum(["needs_operator", "working", "ready", "completed", "failed", "cancelled"]),
});
const browserSchema = z.object({
  action: z.enum([
    "navigate",
    "search",
    "extract",
    "screenshot",
    "submit_form",
    "send_message",
    "post",
    "purchase",
    "upload",
    "delete",
    "change_permissions",
    "enter_sensitive_data",
  ]),
  target: z.string().optional(),
});
const runSkillSchema = z.object({
  runId: z.string().optional(),
  input: z.record(z.unknown()).default({}),
});

function dependencies(config: MaxxConfig) {
  return {
    supabase: {
      configured: Boolean(config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY),
      status: config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY ? "ready" : "degraded",
      detail: config.SUPABASE_URL ? "Auth endpoint configured" : "Supabase server credentials are missing",
    },
    openrouter: {
      configured: Boolean(config.OPENROUTER_API_KEY),
      status: config.OPENROUTER_API_KEY ? "ready" : "degraded",
      detail: config.OPENROUTER_API_KEY ? "Smart model router ready" : "OPENROUTER_API_KEY is missing",
    },
    groq: {
      configured: Boolean(config.GROQ_API_KEY),
      status: config.GROQ_API_KEY ? "ready" : "degraded",
      detail: config.GROQ_API_KEY ? "Fast inference engine ready" : "GROQ_API_KEY is missing",
    },
    pi: {
      configured: Boolean(config.PI_EXECUTABLE),
      status: config.PI_EXECUTABLE ? "ready" : "degraded",
      detail: config.PI_EXECUTABLE ? "Pi executable configured" : "PI_EXECUTABLE is missing",
    },
    browser: {
      configured: Boolean(config.MAXX_BROWSER_WS_ENDPOINT),
      status: config.MAXX_BROWSER_WS_ENDPOINT ? "ready" : "degraded",
      detail: config.MAXX_BROWSER_WS_ENDPOINT ? "Remote browser configured" : "MAXX_BROWSER_WS_ENDPOINT is missing",
    },
    voice: {
      configured: false,
      status: "unavailable",
      detail: "No server STT/TTS provider configured; browser fallback remains available",
    },
  } as const;
}

export function buildApp(options: AppOptions = {}) {
  const config = options.config ?? loadConfig({ NODE_ENV: "test" });
  const authenticate = options.authenticate ?? createAuthenticator(config);
  const store = options.store ?? createStore(config);
  const app = Fastify({
    logger: config.NODE_ENV !== "test" ? { redact: ["req.headers.authorization", "body.audio", "*.apiKey"] } : false,
  });

  app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || config.allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Origin is not allowed"), false);
    },
    credentials: true,
  });

  app.get("/health/live", async () => ({ status: "alive", service: "maxx-control-plane" }));
  app.get("/health/ready", async (_request, reply) => {
    const state = dependencies(config);
    const ready = state.supabase.configured && (state.groq.configured || state.openrouter.configured);
    return reply.code(ready ? 200 : 503).send({ status: ready ? "ready" : "degraded", dependencies: state });
  });

  app.addHook("preHandler", async (request, reply) => {
    if (request.url.startsWith("/health/")) return;
    const operator = await authenticate(request);
    if (!operator) return reply.code(401).send({ error: "Stacy operator authentication required" });
    request.operator = operator;
  });

  app.get("/v1/control-tower/bootstrap", async () => {
    const state = dependencies(config);
    const degraded = Object.values(state).some((item) => item.status !== "ready");
    const [missions, approvals, usageRecords] = await Promise.all([
      store.listMissions(),
      store.listApprovals(),
      store.listUsage(),
    ]);
    return {
      agent: {
        name: "MAXX",
        status: degraded ? "degraded" : "online",
        currentIntent: missions[0]?.objective ?? "Waiting for Stacy",
      },
      dependencies: state,
      missions,
      approvals,
      skills: TRUSTED_SKILLS.map((skill) => ({
        ...skill,
        health: skill.requiredEnvironment.some((key) => !process.env[key]) ? "degraded" : skill.health,
      })),
      usage: summarizeUsage(usageRecords),
      browser: {
        state: state.browser.configured ? "idle" : "unavailable",
        currentUrl: null,
        recentActions: [],
      },
    };
  });

  app.post("/v1/chat", async (request, reply) => {
    const input = chatSchema.parse(request.body);
    const decision = routeModel({ message: input.message, manualModel: input.model });

    // Primary engine + graceful fallback. Groq handles fast task classes;
    // if it errors, fall back to OpenRouter so the operator still gets a reply.
    let result;
    if (decision.provider === "groq" && config.GROQ_API_KEY) {
      try {
        result = await runGroq({ apiKey: config.GROQ_API_KEY, message: input.message, decision });
      } catch (error) {
        app.log.warn({ error: String(error) }, "Groq failed, falling back to OpenRouter");
        result = await runOpenRouter({
          apiKey: config.OPENROUTER_API_KEY,
          message: input.message,
          decision: { ...decision, provider: "openrouter" },
        });
      }
    } else {
      result = await runOpenRouter({ apiKey: config.OPENROUTER_API_KEY, message: input.message, decision });
    }

    const usage = {
      id: randomUUID(),
      runId: input.runId,
      model: decision.model,
      ...result.usage,
      createdAt: new Date().toISOString(),
    };
    await store.addUsage(usage);
    if (input.runId) await store.addEvent(input.runId, "assistant.message", result.text, { model: decision.model });
    return reply.send({
      id: randomUUID(),
      text: result.text,
      model: decision.model,
      provider: decision.provider,
      taskClass: decision.taskClass,
      routingReason: decision.reason,
      approvalState: decision.taskClass === "high_risk" ? "required" : "not_required",
      skills: decision.taskClass === "research" ? ["maxx-skill-router", "maxx-video-dossier"] : ["maxx-skill-router"],
      stage: input.runId ? "active" : "conversation",
      usage,
      degraded: result.degraded,
    });
  });

  app.post("/v1/missions", async (request, reply) => {
    const input = missionSchema.parse(request.body);
    const missionId = randomUUID();
    const run = await createIcmRun({
      root: config.MAXX_ICM_ROOT,
      missionId,
      objective: input.objective,
      operatorId: request.operator!.id,
    });
    const mission = await store.createMission({
      id: missionId,
      operatorId: request.operator!.id,
      objective: input.objective,
      status: "working",
      runId: run.runId,
      workspacePath: run.runPath,
    });
    await store.addEvent(run.runId, "mission.created", "MAXX created an isolated ICM workspace", {
      missionId: mission.id,
      stages: run.stages.map((stage) => stage.id),
    });
    return reply.code(201).send({ ...mission, stages: run.stages });
  });

  app.patch("/v1/missions/:id", async (request, reply) => {
    const input = missionPatchSchema.parse(request.body);
    const mission = await store.updateMission((request.params as { id: string }).id, input.status);
    return mission ? reply.send(mission) : reply.code(404).send({ error: "Mission not found" });
  });

  app.get("/v1/runs/:id/events", async (request, reply) => {
    const runId = (request.params as { id: string }).id;
    const accept = request.headers.accept ?? "";
    const events = await store.listEvents(runId);
    if (!accept.includes("text/event-stream")) return reply.send({ events });
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    for (const event of events) reply.raw.write(`id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    reply.raw.end();
  });

  app.post("/v1/runs/:id/cancel", async (request) => {
    const runId = (request.params as { id: string }).id;
    const mission = (await store.listMissions()).find((item) => item.runId === runId);
    if (mission) await store.updateMission(mission.id, "cancelled");
    return store.addEvent(runId, "run.cancelled", "Stacy cancelled the MAXX run");
  });

  app.get("/v1/skills", async () => ({ skills: TRUSTED_SKILLS }));
  app.post("/v1/skills/:id/run", async (request, reply) => {
    const skill = TRUSTED_SKILLS.find((item) => item.id === (request.params as { id: string }).id);
    if (!skill) return reply.code(404).send({ error: "Unregistered skill" });
    const input = runSkillSchema.parse(request.body ?? {});
    if (skill.approvalPolicy === "approval_required") {
      const approval = await store.createApproval({
        runId: input.runId ?? "standalone",
        action: `run_skill:${skill.id}`,
        summary: `Run ${skill.id}`,
      });
      return reply.code(202).send({ status: "approval_required", approval });
    }
    if (!config.PI_EXECUTABLE) {
      return reply.code(503).send({
        status: "unavailable",
        skillId: skill.id,
        reason: "PI_EXECUTABLE is not configured",
      });
    }
    const result = await runPiSkill({
      executable: config.PI_EXECUTABLE,
      skillId: skill.id,
      payload: { ...input.input, runId: input.runId, operatorId: request.operator!.id },
    });
    if (input.runId) {
      await store.addEvent(input.runId, "skill.completed", `${skill.id} exited with code ${result.exitCode}`, {
        skillId: skill.id,
        exitCode: result.exitCode,
      });
    }
    return reply.code(result.exitCode === 0 ? 200 : 502).send({
      status: result.exitCode === 0 ? "completed" : "failed",
      skillId: skill.id,
      exitCode: result.exitCode,
      output: result.stdout,
      error: result.stderr,
    });
  });

  app.post("/v1/approvals/:id/approve", async (request, reply) => {
    const approval = await store.decideApproval((request.params as { id: string }).id, "approved", request.operator!.id);
    return approval ? reply.send(approval) : reply.code(409).send({ error: "Approval is missing or already decided" });
  });
  app.post("/v1/approvals/:id/reject", async (request, reply) => {
    const approval = await store.decideApproval((request.params as { id: string }).id, "rejected", request.operator!.id);
    return approval ? reply.send(approval) : reply.code(409).send({ error: "Approval is missing or already decided" });
  });

  app.post("/v1/browser/sessions", async (request, reply) => {
    const input = browserSchema.parse(request.body);
    const policy = classifyBrowserAction(input.action as BrowserAction);
    if (!config.MAXX_BROWSER_WS_ENDPOINT) {
      return reply.code(503).send({ status: "unavailable", reason: "Remote browser is not configured", policy });
    }
    if (policy === "approval_required") {
      const approval = await store.createApproval({
        runId: "browser-session",
        action: `browser:${input.action}`,
        summary: `${input.action}${input.target ? ` at ${input.target}` : ""}`,
      });
      return reply.code(202).send({ status: "approval_required", approval });
    }
    return reply.send({ status: "accepted", policy, target: input.target ?? null });
  });

  app.post("/v1/voice/transcribe", async (_request, reply) =>
    reply.code(503).send({ status: "unavailable", fallback: "browser_speech_recognition" }),
  );
  app.post("/v1/voice/synthesize", async (_request, reply) =>
    reply.code(503).send({ status: "unavailable", fallback: "browser_speech_synthesis" }),
  );
  app.get("/v1/usage/summary", async () => summarizeUsage(await store.listUsage()));

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof z.ZodError) return reply.code(400).send({ error: "Invalid request", issues: error.issues });
    app.log.error(error);
    return reply.code(500).send({ error: "MAXX control plane request failed" });
  });

  return app;
}

function summarizeUsage(records: UsageRecord[]) {
  return records.reduce(
    (total, item) => ({
      promptTokens: total.promptTokens + item.promptTokens,
      completionTokens: total.completionTokens + item.completionTokens,
      estimatedCostUsd: total.estimatedCostUsd + item.estimatedCostUsd,
      requests: total.requests + 1,
    }),
    { promptTokens: 0, completionTokens: 0, estimatedCostUsd: 0, requests: 0 },
  );
}
