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
import { createRateLimiters, type RateLimiters } from "./rate-limiter.js";
import { createProviderCircuitBreakers, type ProviderCircuitBreakers } from "./circuit-breaker.js";
import { createHermesAdapter, type HermesAdapter, type HermesApprovalChoice } from "./hermes-adapter.js";
import { createMemoryIndexer, type MemoryIndexer } from "./memory-indexer.js";
import {
  OwnerStrategyStore,
  applyProviderPreference,
  isActionForbidden,
  type OwnerStrategyInput,
} from "./owner-strategy.js";
import { Scheduler } from "./scheduler.js";
import {
  createVoiceGateway,
  type VoiceGateway,
  type SpeechInputProvider,
  type SpeechOutputProvider,
} from "./voice-gateway.js";
import { createVisionGateway, type VisionInputAdapter } from "./vision-gateway.js";
import { createBrowserWorker, type BrowserWorker } from "./browser-worker.js";

declare module "fastify" {
  interface FastifyRequest {
    operator?: Operator;
  }
}

type AppOptions = {
  config?: MaxxConfig;
  authenticate?: (request: FastifyRequest) => Promise<Operator | null>;
  store?: ControlTowerStore;
  rateLimiters?: RateLimiters;
  circuitBreakers?: ProviderCircuitBreakers;
  hermes?: HermesAdapter;
  memory?: MemoryIndexer;
  ownerStrategies?: OwnerStrategyStore;
  scheduler?: Scheduler;
  voice?: VoiceGateway | { stt: SpeechInputProvider; tts: SpeechOutputProvider; inputProviderName?: string; outputProviderName?: string; isInputReady?: () => boolean; isOutputReady?: () => boolean };
  vision?: { adapter: VisionInputAdapter; isReady: () => boolean };
  browser?: BrowserWorker;
};

const riskToleranceEnum = z.enum(["conservative", "standard", "permissive"]);
const strategyInputSchema = z.object({
  preferredProvider: z.enum(["groq", "openrouter"]).optional(),
  riskTolerance: riskToleranceEnum.optional(),
  forbiddenActions: z.array(z.string()).optional(),
  maxCostPerRequestUsd: z.number().positive().optional(),
});

const PRODUCTION_LOCKED_METHODS = new Set(["POST", "PATCH", "DELETE", "PUT"]);

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
const voiceTranscribeSchema = z.object({
  audioBase64: z.string().min(1),
  mimeType: z.string().min(1),
});
const voiceSynthesizeSchema = z.object({
  text: z.string().trim().min(1).max(5_000),
  voiceId: z.string().optional(),
});
const memoryDocumentSchema = z.object({
  runId: z.string().trim().min(1),
  missionId: z.string().trim().min(1),
  source: z.string().trim().min(1),
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(20_000),
  tags: z.array(z.string()).default([]),
});
const memorySearchSchema = z.object({
  q: z.string().trim().min(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});
const hermesRunSchema = z.object({
  runId: z.string().trim().min(1),
  missionId: z.string().trim().min(1),
  objective: z.string().trim().min(3),
  workspacePath: z.string().trim().min(1),
  stage: z.string().trim().min(1).default("hermes"),
  timeoutMs: z.number().positive().optional(),
});
const hermesApprovalSchema = z.object({
  choice: z.enum(["once", "session", "always", "deny"]),
});
const hermesSteerSchema = z.object({
  message: z.string().trim().min(1).max(20_000),
});

function dependencies(
  config: MaxxConfig,
  voice: { inputProviderName?: string; outputProviderName?: string; isInputReady?: () => boolean; isOutputReady?: () => boolean; stt: SpeechInputProvider; tts: SpeechOutputProvider },
  vision: { adapter: VisionInputAdapter; isReady: () => boolean },
) {
  const hermesConfigured = Boolean(
    config.featureFlags.MAXX_HERMES_ENABLED && config.MAXX_HERMES_ENDPOINT && config.MAXX_HERMES_API_KEY,
  );
  const inputReady = voice.isInputReady ? voice.isInputReady() : voice.stt.isReady();
  const outputReady = voice.isOutputReady ? voice.isOutputReady() : voice.tts.isReady();
  const inputProvider = voice.inputProviderName ?? voice.stt.name;
  const outputProvider = voice.outputProviderName ?? voice.tts.name;

  return {
    supabase: {
      configured: Boolean(config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY),
      status: config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY ? "ready" : "degraded",
      detail: config.SUPABASE_URL ? "Auth endpoint configured" : "Supabase server credentials are missing",
    },
    openrouter: {
      configured: Boolean(config.OPENROUTER_API_KEY),
      status: config.OPENROUTER_API_KEY ? "ready" : "degraded",
      detail: config.OPENROUTER_API_KEY ? "Direct fallback model router ready" : "OPENROUTER_API_KEY is missing",
    },
    groq: {
      configured: Boolean(config.GROQ_API_KEY),
      status: config.GROQ_API_KEY ? "ready" : "degraded",
      detail: config.GROQ_API_KEY ? "Direct fallback fast inference ready" : "GROQ_API_KEY is missing",
    },
    pi: {
      configured: Boolean(config.PI_EXECUTABLE),
      status: config.PI_EXECUTABLE ? "ready" : "degraded",
      detail: config.PI_EXECUTABLE ? "Legacy Pi executable configured" : "PI_EXECUTABLE is missing",
    },
    browser: {
      configured: config.featureFlags.MAXX_BROWSER_ENABLED,
      status: config.featureFlags.MAXX_BROWSER_ENABLED ? "ready" : "unavailable",
      detail: !config.featureFlags.MAXX_BROWSER_ENABLED
        ? "MAXX_BROWSER_ENABLED is false"
        : config.MAXX_BROWSER_WS_ENDPOINT
          ? "Remote browser (CDP) configured"
          : "Local Playwright Chromium (no MAXX_BROWSER_WS_ENDPOINT set)",
    },
    voice: {
      configured: Boolean(config.featureFlags.MAXX_VOICE_ENABLED),
      status: !config.featureFlags.MAXX_VOICE_ENABLED
        ? "unavailable"
        : inputReady && outputReady
          ? "ready"
          : "degraded",
      inputProvider,
      inputReady,
      outputProvider,
      outputReady,
      detail: !config.featureFlags.MAXX_VOICE_ENABLED
        ? "MAXX_VOICE_ENABLED is false; browser fallback remains available"
        : inputReady && outputReady
          ? `Voice active (input: ${inputProvider}, output: ${outputProvider})`
          : `Voice enabled but missing provider credentials (input: ${inputProvider}, output: ${outputProvider}); browser fallback remains available`,
    },
    vision: {
      configured: Boolean(config.featureFlags.MAXX_VISION_ENABLED),
      status: !config.featureFlags.MAXX_VISION_ENABLED ? "unavailable" : vision.isReady() ? "ready" : "degraded",
      adapter: vision.adapter.name,
      deviceType: vision.adapter.deviceType,
      detail: !config.featureFlags.MAXX_VISION_ENABLED
        ? "MAXX_VISION_ENABLED is false"
        : `Vision adapter ${vision.adapter.name} (${vision.adapter.deviceType}) active`,
    },
    hermes: {
      configured: hermesConfigured,
      status: !config.featureFlags.MAXX_HERMES_ENABLED
        ? "unavailable"
        : hermesConfigured
          ? "ready"
          : "degraded",
      detail: !config.featureFlags.MAXX_HERMES_ENABLED
        ? "MAXX_HERMES_ENABLED is false"
        : !config.MAXX_HERMES_ENDPOINT
          ? "MAXX_HERMES_ENABLED is set but MAXX_HERMES_ENDPOINT is missing"
          : !config.MAXX_HERMES_API_KEY
            ? "Hermes endpoint is set but MAXX_HERMES_API_KEY is missing"
            : "Hermes Agent API configured as MAXX primary orchestrator",
    },
    memory: {
      configured: config.featureFlags.MAXX_MEMORY_ENABLED,
      status: config.featureFlags.MAXX_MEMORY_ENABLED ? "ready" : "unavailable",
      detail: config.featureFlags.MAXX_MEMORY_ENABLED
        ? `Keyword-indexed mission memory at ${config.memoryIndexPath}`
        : "MAXX_MEMORY_ENABLED is false; memory is in-process only and not persisted",
    },
    scheduler: {
      configured: config.featureFlags.MAXX_SCHEDULER_ENABLED,
      status: config.featureFlags.MAXX_SCHEDULER_ENABLED ? "ready" : "unavailable",
      detail: config.featureFlags.MAXX_SCHEDULER_ENABLED
        ? "In-process interval scheduler running (approval expiry sweep)"
        : "MAXX_SCHEDULER_ENABLED is false",
    },
  } as const;
}

export function buildApp(options: AppOptions = {}) {
  const config = options.config ?? loadConfig({ NODE_ENV: "test" });
  const authenticate = options.authenticate ?? createAuthenticator(config);
  const store = options.store ?? createStore(config);
  const rateLimiters = options.rateLimiters ?? createRateLimiters();
  const circuitBreakers = options.circuitBreakers ?? createProviderCircuitBreakers();
  const hermes =
    options.hermes ??
    createHermesAdapter({
      hermesEnabled: config.featureFlags.MAXX_HERMES_ENABLED,
      hermesEndpoint: config.MAXX_HERMES_ENDPOINT,
      hermesApiKey: config.MAXX_HERMES_API_KEY,
    });
  const memory =
    options.memory ??
    createMemoryIndexer({
      memoryEnabled: config.featureFlags.MAXX_MEMORY_ENABLED,
      indexPath: config.memoryIndexPath,
    });
  const ownerStrategies = options.ownerStrategies ?? new OwnerStrategyStore();
  const scheduler = options.scheduler ?? new Scheduler();
  const voice =
    options.voice ??
    createVoiceGateway({
      voiceEnabled: Boolean(config.featureFlags.MAXX_VOICE_ENABLED),
      inputProvider: config.MAXX_SPEECH_INPUT_PROVIDER,
      outputProvider: config.MAXX_SPEECH_OUTPUT_PROVIDER,
      openaiApiKey: config.OPENAI_API_KEY,
      openaiRealtimeModel: config.OPENAI_REALTIME_MODEL,
      elevenlabsApiKey: config.ELEVENLABS_API_KEY,
      elevenlabsVoiceId: config.ELEVENLABS_VOICE_ID,
      elevenlabsModelId: config.ELEVENLABS_MODEL_ID,
      sttEndpoint: config.MAXX_STT_ENDPOINT,
      sttApiKey: config.MAXX_STT_API_KEY,
      ttsEndpoint: config.MAXX_TTS_ENDPOINT,
      ttsApiKey: config.MAXX_TTS_API_KEY,
    });
  const vision =
    options.vision ??
    createVisionGateway({
      visionEnabled: Boolean(config.featureFlags.MAXX_VISION_ENABLED),
      adapterName: config.MAXX_VISION_ADAPTER,
    });
  const browser =
    options.browser ??
    createBrowserWorker({
      browserEnabled: config.featureFlags.MAXX_BROWSER_ENABLED,
      wsEndpoint: config.MAXX_BROWSER_WS_ENDPOINT,
      executablePath: config.MAXX_BROWSER_EXECUTABLE_PATH,
    });
  const app = Fastify({
    logger: config.NODE_ENV !== "test" ? { redact: ["req.headers.authorization", "body.audio", "*.apiKey"] } : false,
  });
  app.addHook("onClose", async () => browser.close());

  if (config.featureFlags.MAXX_SCHEDULER_ENABLED) {
    scheduler.register({
      id: "approval-expiry-sweep",
      name: "Expire stale pending approvals",
      intervalMs: 60_000,
      handler: async () => {
        await store.listApprovals();
      },
    });
    scheduler.start();
    app.addHook("onClose", async () => scheduler.stop());
  }

  app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || config.allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Origin is not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  });

  app.addHook("onRequest", async (request, reply) => {
    const correlationId = (request.headers["x-request-id"] as string | undefined) ?? randomUUID();
    request.headers["x-request-id"] = correlationId;
    reply.header("x-request-id", correlationId);
  });

  app.get("/health/live", async () => ({ status: "alive", service: "maxx-control-plane" }));
  app.get("/health/ready", async (_request, reply) => {
    const state = dependencies(config, voice, vision);
    const ready = state.supabase.configured && (state.hermes.configured || state.groq.configured || state.openrouter.configured);
    return reply.code(ready ? 200 : 503).send({
      status: ready ? "ready" : "degraded",
      dependencies: state,
      featureFlags: config.featureFlags,
      emergencyDisabled: config.emergencyDisabled,
      voice: {
        enabled: Boolean(config.featureFlags.MAXX_VOICE_ENABLED),
        inputProvider: voice.inputProviderName ?? voice.stt.name,
        inputReady: voice.isInputReady ? voice.isInputReady() : voice.stt.isReady(),
        outputProvider: voice.outputProviderName ?? voice.tts.name,
        outputReady: voice.isOutputReady ? voice.isOutputReady() : voice.tts.isReady(),
      },
    });
  });

  app.addHook("preHandler", async (request, reply) => {
    if (request.url.startsWith("/health/")) return;
    const operator = await authenticate(request);
    if (!operator) return reply.code(401).send({ error: "Stacy operator authentication required" });
    request.operator = operator;

    if (config.emergencyDisabled && PRODUCTION_LOCKED_METHODS.has(request.method)) {
      return reply.code(503).send({
        status: "locked",
        message: "MAXX_EMERGENCY_DISABLE is active. All agent work is paused system-wide.",
      });
    }

    if (
      config.NODE_ENV === "production" &&
      !config.featureFlags.MAXX_PRODUCTION_MUTATIONS_ENABLED &&
      PRODUCTION_LOCKED_METHODS.has(request.method)
    ) {
      return reply.code(503).send({
        status: "locked",
        message: "Production mutations disabled. Set MAXX_PRODUCTION_MUTATIONS_ENABLED=true to proceed.",
      });
    }
  });

  app.get("/v1/control-tower/bootstrap", async () => {
    const state = dependencies(config, voice, vision);
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
      voice: {
        enabled: Boolean(config.featureFlags.MAXX_VOICE_ENABLED),
        inputProvider: voice.inputProviderName ?? voice.stt.name,
        inputReady: voice.isInputReady ? voice.isInputReady() : voice.stt.isReady(),
        outputProvider: voice.outputProviderName ?? voice.tts.name,
        outputReady: voice.isOutputReady ? voice.isOutputReady() : voice.tts.isReady(),
      },
      featureFlags: config.featureFlags,
      emergencyDisabled: config.emergencyDisabled,
    };
  });

  app.post("/v1/chat", async (request, reply) => {
    const rateLimit = rateLimiters.chat.check(request.operator!.id);
    if (!rateLimit.allowed) {
      return reply.code(429).send({ error: "Too many chat requests", retryAfterMs: rateLimit.retryAfterMs });
    }

    const input = chatSchema.parse(request.body);
    const strategy = await ownerStrategies.get(request.operator!.id);

    const hermesAvailable = circuitBreakers.hermes.isAvailable();
    if (config.featureFlags.MAXX_HERMES_ENABLED && hermes.isConfigured() && hermesAvailable) {
      try {
        const response = await hermes.chat({
          message: input.message,
          operatorId: request.operator!.id,
          runId: input.runId,
        });
        circuitBreakers.hermes.recordSuccess();
        return reply.send({
          id: response.id,
          text: response.text,
          provider: "hermes",
          model: "hermes-agent-maxx",
          routingReason: response.routingReason ?? "Hermes MAXX primary orchestrator",
          degraded: false,
          usage: response.usage,
        });
      } catch (error) {
        circuitBreakers.hermes.recordFailure();
        app.log.warn({ err: error }, "Hermes primary orchestrator failed; falling back to direct model routing");
      }
    }

    const decision = applyProviderPreference(
      routeModel({
        message: input.message,
        requestedModel: input.model,
        groqAvailable: circuitBreakers.groq.isAvailable() && Boolean(config.GROQ_API_KEY),
        openRouterAvailable: circuitBreakers.openrouter.isAvailable() && Boolean(config.OPENROUTER_API_KEY),
      }),
      strategy,
      {
        groqAvailable: circuitBreakers.groq.isAvailable() && Boolean(config.GROQ_API_KEY),
        openRouterAvailable: circuitBreakers.openrouter.isAvailable() && Boolean(config.OPENROUTER_API_KEY),
      },
    );

    const startedAt = Date.now();
    try {
      let responseText = "";
      let usage: UsageRecord = {
        promptTokens: 0,
        completionTokens: 0,
        estimatedCostUsd: 0,
        latencyMs: 0,
        operatorId: request.operator!.id,
        provider: decision.provider,
        model: decision.model,
      };

      if (decision.provider === "groq") {
        const result = await runGroq({
          apiKey: config.GROQ_API_KEY!,
          model: decision.model,
          message: input.message,
        });
        circuitBreakers.groq.recordSuccess();
        responseText = result.text;
        usage = {
          ...result.usage,
          latencyMs: Date.now() - startedAt,
          operatorId: request.operator!.id,
          provider: "groq",
          model: decision.model,
        };
      } else if (decision.provider === "openrouter") {
        const result = await runOpenRouter({
          apiKey: config.OPENROUTER_API_KEY!,
          model: decision.model,
          message: input.message,
        });
        circuitBreakers.openrouter.recordSuccess();
        responseText = result.text;
        usage = {
          ...result.usage,
          latencyMs: Date.now() - startedAt,
          operatorId: request.operator!.id,
          provider: "openrouter",
          model: decision.model,
        };
      } else {
        responseText =
          "MAXX direct inference is not configured with working provider keys. Hermes and direct fallback routes are unavailable.";
        usage.latencyMs = Date.now() - startedAt;
      }

      await store.recordUsage(usage);
      return reply.send({
        id: randomUUID(),
        text: responseText,
        provider: decision.provider,
        model: decision.model,
        routingReason: decision.reason,
        degraded: true,
        usage,
      });
    } catch (error) {
      if (decision.provider === "groq") circuitBreakers.groq.recordFailure();
      if (decision.provider === "openrouter") circuitBreakers.openrouter.recordFailure();
      throw error;
    }
  });

  app.get("/v1/missions", async () => store.listMissions());
  app.post("/v1/missions", async (request, reply) => {
    const input = missionSchema.parse(request.body);
    const mission = await store.createMission({
      objective: input.objective,
      operatorId: request.operator!.id,
    });
    const run = await createIcmRun({
      icmRoot: config.MAXX_ICM_ROOT,
      missionId: mission.id,
      objective: input.objective,
    });
    return reply.code(201).send({ ...mission, runId: run.runId, stages: run.stages });
  });
  app.patch("/v1/missions/:id", async (request) => {
    const params = z.object({ id: z.string().uuid() }).parse(request.params);
    const input = missionPatchSchema.parse(request.body);
    return store.updateMissionStatus(params.id, input.status);
  });

  app.get("/v1/approvals", async () => store.listApprovals());
  app.post("/v1/approvals/:id/approve", async (request, reply) => {
    const params = z.object({ id: z.string().uuid() }).parse(request.params);
    const approval = await store.decideApproval(params.id, "approved");
    if (!approval) return reply.code(404).send({ error: "Approval not found" });
    return reply.send(approval);
  });
  app.post("/v1/approvals/:id/reject", async (request, reply) => {
    const params = z.object({ id: z.string().uuid() }).parse(request.params);
    const approval = await store.decideApproval(params.id, "rejected");
    if (!approval) return reply.code(404).send({ error: "Approval not found" });
    return reply.send(approval);
  });

  app.get("/v1/strategy", async (request) => ownerStrategies.get(request.operator!.id));
  app.put("/v1/strategy", async (request, reply) => {
    const rateLimit = rateLimiters.ownerStrategy.check(request.operator!.id);
    if (!rateLimit.allowed) {
      return reply.code(429).send({ error: "Too many strategy updates", retryAfterMs: rateLimit.retryAfterMs });
    }
    const input = strategyInputSchema.parse(request.body) as OwnerStrategyInput;
    const strategy = await ownerStrategies.set(request.operator!.id, input);
    return reply.send(strategy);
  });

  app.get("/v1/skills", async () => TRUSTED_SKILLS);
  app.post("/v1/skills/:id/run", async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const body = runSkillSchema.parse(request.body);
    const strategy = await ownerStrategies.get(request.operator!.id);

    if (isActionForbidden(`skill:${params.id}`, strategy)) {
      return reply.code(403).send({ error: `Skill ${params.id} is forbidden by owner strategy` });
    }

    if (!config.PI_EXECUTABLE) {
      return reply.code(503).send({
        error: "PI_EXECUTABLE is not configured. Pi skill runtime is unavailable on this host.",
      });
    }

    const result = await runPiSkill({
      piExecutable: config.PI_EXECUTABLE,
      skillId: params.id,
      runId: body.runId ?? randomUUID(),
      input: body.input,
    });
    return reply.send(result);
  });

  app.post("/v1/hermes/runs", async (request, reply) => {
    const rateLimit = rateLimiters.hermesRuns.check(request.operator!.id);
    if (!rateLimit.allowed) {
      return reply.code(429).send({ error: "Too many hermes run requests", retryAfterMs: rateLimit.retryAfterMs });
    }
    if (!config.featureFlags.MAXX_HERMES_ENABLED) {
      return reply.code(503).send({ error: "MAXX_HERMES_ENABLED is false; Hermes Agent runtime is disabled" });
    }
    if (!hermes.isConfigured()) {
      return reply.code(503).send({
        error: "MAXX_HERMES_ENDPOINT or MAXX_HERMES_API_KEY is not configured",
      });
    }
    const input = hermesRunSchema.parse(request.body);
    const result = await hermes.startRun({ ...input, operatorId: request.operator!.id });
    return reply.code(202).send(result);
  });
  app.get("/v1/hermes/runs/:id", async (request, reply) => {
    if (!config.featureFlags.MAXX_HERMES_ENABLED) {
      return reply.code(503).send({ error: "MAXX_HERMES_ENABLED is false" });
    }
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const status = await hermes.getRun(params.id);
    if (!status) return reply.code(404).send({ error: "Hermes run not found" });
    return reply.send(status);
  });
  app.post("/v1/hermes/runs/:id/approvals/:approvalId", async (request, reply) => {
    if (!config.featureFlags.MAXX_HERMES_ENABLED) {
      return reply.code(503).send({ error: "MAXX_HERMES_ENABLED is false" });
    }
    const params = z.object({ id: z.string().min(1), approvalId: z.string().min(1) }).parse(request.params);
    const input = hermesApprovalSchema.parse(request.body);
    const result = await hermes.resolveApproval(params.id, params.approvalId, input.choice as HermesApprovalChoice);
    return reply.send(result);
  });
  app.post("/v1/hermes/runs/:id/steer", async (request, reply) => {
    if (!config.featureFlags.MAXX_HERMES_ENABLED) {
      return reply.code(503).send({ error: "MAXX_HERMES_ENABLED is false" });
    }
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const input = hermesSteerSchema.parse(request.body);
    const result = await hermes.steer(params.id, input.message);
    return reply.send(result);
  });

  app.post("/v1/memory/documents", async (request, reply) => {
    const rateLimit = rateLimiters.memoryDocuments.check(request.operator!.id);
    if (!rateLimit.allowed) {
      return reply.code(429).send({ error: "Too many memory document writes", retryAfterMs: rateLimit.retryAfterMs });
    }
    if (!config.featureFlags.MAXX_MEMORY_ENABLED) {
      return reply.code(503).send({ error: "MAXX_MEMORY_ENABLED is false" });
    }
    const input = memoryDocumentSchema.parse(request.body);
    const doc = await memory.indexDocument(input);
    return reply.code(201).send(doc);
  });
  app.get("/v1/memory/search", async (request, reply) => {
    if (!config.featureFlags.MAXX_MEMORY_ENABLED) {
      return reply.code(503).send({ error: "MAXX_MEMORY_ENABLED is false" });
    }
    const input = memorySearchSchema.parse(request.query);
    const results = await memory.search(input.q, input.limit);
    return reply.send({ query: input.q, results });
  });

  app.get("/v1/scheduler/jobs", async (_request, reply) => {
    if (!config.featureFlags.MAXX_SCHEDULER_ENABLED) {
      return reply.code(503).send({ error: "MAXX_SCHEDULER_ENABLED is false" });
    }
    return reply.send(scheduler.list());
  });

  app.post("/v1/browser/sessions", async (request, reply) => {
    const rateLimit = rateLimiters.browserSessions.check(request.operator!.id);
    if (!rateLimit.allowed) {
      return reply.code(429).send({ error: "Too many browser session requests", retryAfterMs: rateLimit.retryAfterMs });
    }
    if (!config.featureFlags.MAXX_BROWSER_ENABLED) {
      return reply.code(503).send({ error: "MAXX_BROWSER_ENABLED is false; browser automation is disabled" });
    }
    const input = browserSchema.parse(request.body);
    const strategy = await ownerStrategies.get(request.operator!.id);

    if (isActionForbidden(`browser:${input.action}`, strategy)) {
      return reply.code(403).send({ error: `Browser action ${input.action} is forbidden by owner strategy` });
    }

    const policy = classifyBrowserAction(input.action as BrowserAction);
    const isMutation = policy === "approval_required" || ["submit_form", "post", "purchase", "upload", "delete", "change_permissions", "enter_sensitive_data"].includes(input.action);

    if (isMutation && !config.featureFlags.MAXX_BROWSER_MUTATIONS_ENABLED) {
      return reply.code(403).send({
        status: "disabled",
        reason: "Browser mutations disabled. Set MAXX_BROWSER_MUTATIONS_ENABLED=true to proceed.",
        policy,
      });
    }
    if (policy === "approval_required") {
      const approval = await store.createApproval({
        runId: "browser-session",
        action: `browser:${input.action}`,
        summary: `${input.action}${input.target ? ` at ${input.target}` : ""}`,
      });
      return reply.code(202).send({ status: "approval_required", approval });
    }
    const result = await browser.execute(input.action as BrowserAction, input.target);
    return reply.code(result.success ? 200 : 502).send({ status: result.success ? "completed" : "failed", policy, ...result });
  });

  // Voice Endpoints
  app.get("/v1/voice/health", async () => ({
    voice: {
      enabled: Boolean(config.featureFlags.MAXX_VOICE_ENABLED),
      inputProvider: voice.inputProviderName ?? voice.stt.name,
      inputReady: voice.isInputReady ? voice.isInputReady() : voice.stt.isReady(),
      outputProvider: voice.outputProviderName ?? voice.tts.name,
      outputReady: voice.isOutputReady ? voice.isOutputReady() : voice.tts.isReady(),
    },
  }));

  app.post("/v1/voice/session", async (request, reply) => {
    if (!config.featureFlags.MAXX_VOICE_ENABLED) {
      return reply.code(503).send({ status: "unavailable", fallback: "browser_speech_recognition", reason: "MAXX_VOICE_ENABLED is false" });
    }
    try {
      if (!voice.stt.createSession) {
        return reply.code(200).send({
          provider: voice.inputProviderName ?? voice.stt.name,
          model: config.OPENAI_REALTIME_MODEL,
          fallback: "direct_audio_transcription",
        });
      }
      const session = await voice.stt.createSession({ operatorId: request.operator!.id });
      return reply.send(session);
    } catch (error) {
      return reply.code(503).send({
        status: "unavailable",
        fallback: "browser_speech_recognition",
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.post("/v1/voice/transcribe", async (request, reply) => {
    if (!config.featureFlags.MAXX_VOICE_ENABLED) {
      return reply.code(503).send({ status: "unavailable", fallback: "browser_speech_recognition" });
    }
    const input = voiceTranscribeSchema.parse(request.body);
    try {
      const result = await voice.stt.transcribe(input);
      return reply.send(result);
    } catch (error) {
      return reply.code(503).send({
        status: "unavailable",
        fallback: "browser_speech_recognition",
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.post("/v1/voice/synthesize", async (request, reply) => {
    if (!config.featureFlags.MAXX_VOICE_ENABLED) {
      return reply.code(503).send({ status: "unavailable", fallback: "browser_speech_synthesis" });
    }
    const input = voiceSynthesizeSchema.parse(request.body);
    try {
      const result = await voice.tts.synthesize(input);
      return reply.send(result);
    } catch (error) {
      return reply.code(503).send({
        status: "unavailable",
        fallback: "browser_speech_synthesis",
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  });

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
