import path from "node:path";
import { z } from "zod";
import { parseAllowedEmails } from "./auth-policy.js";
import { loadFeatureFlags, isEmergencyDisabled } from "./feature-flags.js";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8787),
  HOST: z.string().default("0.0.0.0"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
  STACY_ALLOWED_EMAILS: z.string().default(""),
  MAXX_API_KEY: z.string().min(16).optional(),
  MAXX_EVENT_INGEST_KEY: z.string().min(16).optional(),
  MAXX_EVENT_OPERATOR_ID: z.string().uuid().optional(),
  MAXX_HERMES_TOOL_KEY: z.string().min(16).optional(),
  MAXX_HERMES_TOOL_OPERATOR_ID: z.string().uuid().optional(),
  MAXX_ICM_ROOT: z.string().default(path.resolve(process.cwd(), "workspaces/maxx")),
  PI_EXECUTABLE: z.string().optional(),
  MAXX_BROWSER_WS_ENDPOINT: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_REALTIME_MODEL: z.string().default("gpt-realtime-2.1-mini"),
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVEN_LABS_API: z.string().optional(),
  ELEVENLABS_VOICE_ID: z.string().default("21m00Tcm4TlvDq8ikWAM"),
  ELEVENLABS_MODEL_ID: z.string().default("eleven_flash_v2_5"),
  MAXX_SPEECH_INPUT_PROVIDER: z.enum(["openai", "http"]).default("openai"),
  MAXX_SPEECH_OUTPUT_PROVIDER: z.enum(["elevenlabs", "openai", "http"]).default("elevenlabs"),
  CONTROL_TOWER_ALLOWED_ORIGINS: z.string().default("https://macs-agent-portal-main.vercel.app,https://macs-agent-portal-pi.vercel.app"),
  MAXX_DEV_AUTH_BYPASS: z.string().optional(),
  MAXX_HERMES_ENABLED: z.string().optional(),
  MAXX_HERMES_ENDPOINT: z.string().url().optional(),
  MAXX_HERMES_API_KEY: z.string().optional(),
  MAXX_SANDBOX_URL: z.string().url().optional(),
  MAXX_SANDBOX_KEY: z.string().min(16).optional(),
  MAXX_VOICE_ENABLED: z.string().optional(),
  MAXX_VISION_ENABLED: z.string().optional(),
  MAXX_VISION_ADAPTER: z.enum(["meta-dat", "vision-claw", "phone-camera", "generic-webrtc-glasses", "unavailable"]).default("phone-camera"),
  MAXX_BROWSER_ENABLED: z.string().optional(),
  MAXX_BROWSER_MUTATIONS_ENABLED: z.string().optional(),
  MAXX_MEMORY_ENABLED: z.string().optional(),
  MAXX_SCHEDULER_ENABLED: z.string().optional(),
  MAXX_PRODUCTION_MUTATIONS_ENABLED: z.string().optional(),
  MAXX_EMERGENCY_DISABLE: z.string().optional(),
  MAXX_APPROVAL_TTL_HOURS: z.coerce.number().positive().default(24),
  MAXX_MEMORY_INDEX_PATH: z.string().optional(),
  MAXX_STT_ENDPOINT: z.string().url().optional(),
  MAXX_STT_API_KEY: z.string().optional(),
  MAXX_TTS_ENDPOINT: z.string().url().optional(),
  MAXX_TTS_API_KEY: z.string().optional(),
  MAXX_BROWSER_EXECUTABLE_PATH: z.string().optional(),
});

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const parsed = schema.parse(env);
  const effectiveElevenLabsKey = parsed.ELEVENLABS_API_KEY || parsed.ELEVEN_LABS_API;
  return {
    ...parsed,
    ELEVENLABS_API_KEY: effectiveElevenLabsKey,
    allowedEmails: parseAllowedEmails(parsed.STACY_ALLOWED_EMAILS),
    allowedOrigins: parsed.CONTROL_TOWER_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean),
    devAuthBypass: parsed.NODE_ENV !== "production" && parsed.MAXX_DEV_AUTH_BYPASS === "true",
    featureFlags: loadFeatureFlags(env),
    emergencyDisabled: isEmergencyDisabled(env),
    memoryIndexPath: parsed.MAXX_MEMORY_INDEX_PATH ?? path.join(parsed.MAXX_ICM_ROOT, "memory", "index.jsonl"),
  };
}

export type MaxxConfig = ReturnType<typeof loadConfig>;
