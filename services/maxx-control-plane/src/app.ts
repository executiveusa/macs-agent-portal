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
  voice?: { inputProviderName?: string; outputProviderName?: string; isInputReady?: () => boolean; isOutputReady?: () => boolean; stt?: SpeechInputProvider; tts?: SpeechOutputProvider },
  vision?: { adapter?: VisionInputAdapter; isReady?: () => boolean },
) {
  const hermesConfigured = Boolean(
    config.featureFlags.MAXX_HERMES_ENABLED && config.MAXX_HERMES_ENDPOINT && config.MAXX_HERMES_API_KEY,
  );
  const inputReady = voice?.isInputReady ? voice.isInputReady() : voice?.stt?.isReady ? voice.stt.isReady() : Boolean(config.OPENAI_API_KEY || (config.MAXX_STT_ENDPOINT && config.MAXX_STT_API_KEY));
  const outputReady = voice?.isOutputReady ? voice.isOutputReady() : voice?.tts?.isReady ? voice.tts.isReady() : Boolean(config.ELEVENLABS_API_KEY || config.OPENAI_API_KEY || (config.MAXX_TTS_ENDPOINT && config.MAXX_TTS_API_KEY));
  const inputProvider = voice?.inputProviderName ?? voice?.stt?.name ?? config.MAXX_SPEECH_INPUT_PROVIDER ?? "openai";
  const outputProvider = voice?.outputProviderName ?? voice?.tts?.name ?? config.MAXX_SPEECH_OUTPUT_PROVIDER ?? "elevenlabs";

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
      status: !config.featureFlags.MAXX_VISION_ENABLED ? "unavailable" : vision?.isReady ? (vision.isReady() ? "ready" : "degraded") : "unavailable",
      adapter: vision?.adapter?.name ?? config.MAXX_VISION_ADAPTER ?? "phone-camera",
      deviceType: vision?.adapter?.deviceType ?? "phone",
      detail: !config.featureFlags.MAXX_VISION_ENABLED
        ? "MAXX_VISION_ENABLED is false"
        : `Vision adapter ${vision?.adapter?.name ?? "phone-camera"} active`,
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
  const rawVoice =
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
  const voice = {
    stt: rawVoice.stt,
    tts: rawVoice.tts,
    inputProviderName: "inputProviderName" in rawVoice && rawVoice.inputProviderName ? rawVoice.inputProviderName : (rawVoice.stt as any)?.name ?? "unavailable",
    outputProviderName: "outputProviderName" in rawVoice && rawVoice.outputProviderName ? rawVoice.outputProviderName : (rawVoice.tts as any)?.name ?? "unavailable",
    isInputReady: () => ("isInputReady" in rawVoice && rawVoice.isInputReady ? rawVoice.isInputReady() : (rawVoice.stt as any)?.isReady ? (rawVoice.stt as any).isReady() : true),
    isOutputReady: () => ("isOutputReady" in rawVoice && rawVoice.isOutputReady ? rawVoice.isOutputReady() : (rawVoice.tts as any)?.isReady ? (rawVoice.tts as any).isReady() : true),
  };

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
        inputProvider: voice.inputProviderName,
        inputReady: voice.isInputReady(),
        outputProvider: voice.outputProviderName,
        outputReady: voice.isOutputReady(),
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
        inputProvider: voice.inputProviderName,
        inputReady: voice.isInputReady(),
        outputProvider: voice.outputProviderName,
        outputReady: voice.isOutputReady(),
      },
      featureFlags: config.featureFlags,
      emergencyDisabled: config.emergencyDisabled,
    };
  });

  app.post("/v1/chat", async (request, reply) => {
    const limitDecision = rateLimiters.chat.consume(request.operator!.id);
    if (!limitDecision.allowed) {
      reply.header("retry-after", String(limitDecision.retryAfterSeconds));
      return reply.code(429).send({ error: "Too many chat requests", retryAfterSeconds: limitDecision.retryAfterSeconds });
    }

    const input = chatSchema.parse(request.body);
    const routed = routeModel({ message: input.message, manualModel: input.model });
    const decision = applyProviderPreference(routed, ownerStrategies.get(request.operator!.id), {
      groq: Boolean(config.GROQ_API_KEY),
      openrouter: Boolean(config.OPENROUTER_API_KEY),
    });

    let result: {
      text: string;
      usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens?: number;
        estimatedCostUsd: number;
        latencyMs: number;
      };
      degraded?: boolean;
    };
    let effectiveProvider = decision.provider as string;
    let effectiveModel = decision.model;
    let routingReason = decision.reason;
    let degraded = false;

    const hermesPrimary = Boolean(
      config.featureFlags.MAXX_HERMES_ENABLED && (config.MAXX_HERMES_ENDPOINT || (hermes as any).isConfigured?.()),
    );

    if (hermesPrimary) {
      try {
        const hermesResult = await hermes.chat({ message: input.message, sessionId: input.runId });
        result = hermesResult;
        effectiveProvider = "hermes";
        effectiveModel = hermesResult.model;
        routingReason = "Hermes Agent is the primary MAXX orchestrator; installed MAXX skills/tools are available beneath the conversational surface.";
      } catch (error) {
        degraded = true;
        app.log.warn({ error: String(error) }, "Hermes chat failed; falling back to direct model routing");
        result = await runDirectFallback();
      }
    } else {
      result = await runDirectFallback();
    }

    async function runDirectFallback() {
      if (decision.provider === "groq" && config.GROQ_API_KEY && circuitBreakers.groq.canRequest()) {
        try {
          const groqResult = await runGroq({ apiKey: config.GROQ_API_KEY, message: input.message, decision });
          circuitBreakers.groq.recordSuccess();
          effectiveProvider = decision.provider;
          effectiveModel = decision.model;
          return groqResult;
        } catch (error) {
          circuitBreakers.groq.recordFailure();
          app.log.warn({ error: String(error) }, "Groq failed, falling back to OpenRouter");
          effectiveProvider = "openrouter";
          return runOpenRouter({
            apiKey: config.OPENROUTER_API_KEY,
            message: input.message,
            decision: { ...decision, provider: "openrouter" },
          });
        }
      }
      effectiveProvider = "openrouter";
      return runOpenRouter({ apiKey: config.OPENROUTER_API_KEY, message: input.message, decision });
    }

    const usage = {
      id: randomUUID(),
      runId: input.runId,
      model: effectiveModel,
      ...result.usage,
      createdAt: new Date().toISOString(),
    };
    await store.addUsage(usage);
    if (input.runId) {
      await store.addEvent(input.runId, "assistant.message", result.text, {
        model: effectiveModel,
        provider: effectiveProvider,
      });
    }
    return reply.send({
      id: randomUUID(),
      text: result.text,
      model: effectiveModel,
      provider: effectiveProvider,
      taskClass: decision.taskClass,
      routingReason,
      approvalState: decision.taskClass === "high_risk" ? "required" : "not_required",
      skills: effectiveProvider === "hermes"
        ? ["agent-maxx"]
        : decision.taskClass === "research"
          ? ["maxx-skill-router", "maxx-video-dossier"]
          : ["maxx-skill-router"],
      stage: input.runId ? "active" : "conversation",
      usage,
      degraded: degraded || Boolean(result.degraded),
    });
  });

  app.post("/v1/missions", async (request, reply) => {
    const limitDecision = rateLimiters.missions.consume(request.operator!.id);
    if (!limitDecision.allowed) {
      reply.header("retry-after", String(limitDecision.retryAfterSeconds));
      return reply.code(429).send({ error: "Too many mission creations", retryAfterSeconds: limitDecision.retryAfterSeconds });
    }
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
    if (mission && input.status === "completed" && config.featureFlags.MAXX_MEMORY_ENABLED) {
      await memory.indexDocument({
        runId: mission.runId,
        missionId: mission.id,
        source: "mission.completed",
        title: mission.objective.slice(0, 200),
        content: mission.objective,
        tags: ["mission", "completed"],
      });
    }
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
    const limitDecision = rateLimiters.skills.consume(request.operator!.id);
    if (!limitDecision.allowed) {
      reply.header("retry-after", String(limitDecision.retryAfterSeconds));
      return reply.code(429).send({ error: "Too many skill executions", retryAfterSeconds: limitDecision.retryAfterSeconds });
    }
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

  app.post("/v1/hermes/runs", async (request, reply) => {
    const limitDecision = rateLimiters.hermes.consume(request.operator!.id);
    if (!limitDecision.allowed) {
      reply.header("retry-after", String(limitDecision.retryAfterSeconds));
      return reply.code(429).send({ error: "Too many Hermes run requests", retryAfterSeconds: limitDecision.retryAfterSeconds });
    }
    if (!config.featureFlags.MAXX_HERMES_ENABLED) {
      return reply.code(503).send({ status: "unavailable", reason: "MAXX_HERMES_ENABLED is false" });
    }
    const input = hermesRunSchema.parse(request.body);
    const state = await hermes.startRun(input);
    await store.addEvent(input.runId, "hermes.run.started", `Hermes run ${state.status}`, {
      stage: input.stage,
      hermesRunId: state.runId,
    });
    return reply.code(state.status === "failed" ? 502 : 202).send(state);
  });

  app.get("/v1/hermes/runs/:id", async (request, reply) => {
    if (!config.featureFlags.MAXX_HERMES_ENABLED) {
      return reply.code(503).send({ status: "unavailable", reason: "MAXX_HERMES_ENABLED is false" });
    }
    const state = await hermes.getRunState((request.params as { id: string }).id);
    return state ? reply.send(state) : reply.code(404).send({ error: "Hermes run not found" });
  });

  app.post("/v1/hermes/runs/:id/approval", async (request, reply) => {
    if (!config.featureFlags.MAXX_HERMES_ENABLED) {
      return reply.code(503).send({ status: "unavailable", reason: "MAXX_HERMES_ENABLED is false" });
    }
    const { choice } = hermesApprovalSchema.parse(request.body);
    const runId = (request.params as { id: string }).id;
    const state = await hermes.resolveApproval(runId, choice as HermesApprovalChoice);
    if (state) await store.addEvent(state.runId, "hermes.approval.resolved", `Hermes approval resolved: ${choice}`);
    return state ? reply.send(state) : reply.code(404).send({ error: "Hermes run not found" });
  });

  app.post("/v1/hermes/runs/:id/steer", async (request, reply) => {
    if (!config.featureFlags.MAXX_HERMES_ENABLED) {
      return reply.code(503).send({ status: "unavailable", reason: "MAXX_HERMES_ENABLED is false" });
    }
    const { message } = hermesSteerSchema.parse(request.body);
    const runId = (request.params as { id: string }).id;
    const state = await hermes.steerRun(runId, message);
    if (state) await store.addEvent(state.runId, "hermes.run.steered", "Operator steered Hermes run");
    return state ? reply.send(state) : reply.code(404).send({ error: "Hermes run not found" });
  });

  app.post("/v1/hermes/runs/:id/cancel", async (request, reply) => {
    if (!config.featureFlags.MAXX_HERMES_ENABLED) {
      return reply.code(503).send({ status: "unavailable", reason: "MAXX_HERMES_ENABLED is false" });
    }
    const state = await hermes.cancelRun((request.params as { id: string }).id);
    if (state) await store.addEvent(state.runId, "hermes.run.cancelled", "Hermes run cancelled");
    return state ? reply.send(state) : reply.code(404).send({ error: "Hermes run not found" });
  });

  app.get("/v1/scheduler/jobs", async (_request, reply) => {
    if (!config.featureFlags.MAXX_SCHEDULER_ENABLED) {
      return reply.code(503).send({ status: "unavailable", reason: "MAXX_SCHEDULER_ENABLED is false" });
    }
    return reply.send({ jobs: scheduler.list() });
  });

  app.get("/v1/strategy", async (request) => ownerStrategies.get(request.operator!.id));

  app.put("/v1/strategy", async (request, reply) => {
    const limitDecision = rateLimiters.strategy.consume(request.operator!.id);
    if (!limitDecision.allowed) {
      reply.header("retry-after", String(limitDecision.retryAfterSeconds));
      return reply.code(429).send({ error: "Too many strategy updates", retryAfterSeconds: limitDecision.retryAfterSeconds });
    }
    const input: OwnerStrategyInput = strategyInputSchema.parse(request.body);
    return ownerStrategies.set(request.operator!.id, input);
  });

  app.post("/v1/memory/documents", async (request, reply) => {
    const limitDecision = rateLimiters.memory.consume(request.operator!.id);
    if (!limitDecision.allowed) {
      reply.header("retry-after", String(limitDecision.retryAfterSeconds));
      return reply.code(429).send({ error: "Too many memory writes", retryAfterSeconds: limitDecision.retryAfterSeconds });
    }
    if (!config.featureFlags.MAXX_MEMORY_ENABLED) {
      return reply.code(503).send({ status: "unavailable", reason: "MAXX_MEMORY_ENABLED is false" });
    }
    const input = memoryDocumentSchema.parse(request.body);
    const document = await memory.indexDocument(input);
    return reply.code(201).send(document);
  });

  app.get("/v1/memory/search", async (request, reply) => {
    if (!config.featureFlags.MAXX_MEMORY_ENABLED) {
      return reply.code(503).send({ status: "unavailable", reason: "MAXX_MEMORY_ENABLED is false" });
    }
    const input = memorySearchSchema.parse(request.query);
    const results = await memory.search(input.q, input.limit);
    return reply.send({ results });
  });

  app.post("/v1/approvals/:id/approve", async (request, reply) => {
    const approval = await store.decideApproval((request.params as { id: string }).id, "approved", request.operator!.id);
    return approval ? reply.send(approval) : reply.code(409).send({ error: "Approval is missing, expired, or already decided" });
  });
  app.post("/v1/approvals/:id/reject", async (request, reply) => {
    const approval = await store.decideApproval((request.params as { id: string }).id, "rejected", request.operator!.id);
    return approval ? reply.send(approval) : reply.code(409).send({ error: "Approval is missing, expired, or already decided" });
  });

  app.post("/v1/browser/sessions", async (request, reply) => {
    const limitDecision = rateLimiters.browser.consume(request.operator!.id);
    if (!limitDecision.allowed) {
      reply.header("retry-after", String(limitDecision.retryAfterSeconds));
      return reply.code(429).send({ error: "Too many browser session requests", retryAfterSeconds: limitDecision.retryAfterSeconds });
    }
    const input = browserSchema.parse(request.body);
    const strategy = ownerStrategies.get(request.operator!.id);
    if (isActionForbidden(`browser:${input.action}`, strategy)) {
      return reply.code(403).send({ error: "Action is forbidden by operator strategy", action: input.action });
    }
    const policy = classifyBrowserAction(input.action as BrowserAction);
    if (!config.featureFlags.MAXX_BROWSER_ENABLED) {
      return reply.code(503).send({ status: "unavailable", reason: "MAXX_BROWSER_ENABLED is false", policy });
    }
    if (policy === "approval_required" && !config.featureFlags.MAXX_BROWSER_MUTATIONS_ENABLED) {
      return reply.code(503).send({
        status: "unavailable",
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
      inputProvider: voice.inputProviderName,
      inputReady: voice.isInputReady(),
      outputProvider: voice.outputProviderName,
      outputReady: voice.isOutputReady(),
    },
  }));

  app.post("/v1/voice/session", async (request, reply) => {
    if (!config.featureFlags.MAXX_VOICE_ENABLED) {
      return reply.code(503).send({ status: "unavailable", fallback: "browser_speech_recognition", reason: "MAXX_VOICE_ENABLED is false" });
    }
    try {
      if (!voice.stt.createSession) {
        return reply.code(200).send({
          provider: voice.inputProviderName,
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
