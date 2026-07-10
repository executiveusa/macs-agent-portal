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
  STACY_ALLOWED_EMAILS: z.string().default(""),
  MAXX_ICM_ROOT: z.string().default(path.resolve(process.cwd(), "workspaces/maxx")),
  PI_EXECUTABLE: z.string().optional(),
  MAXX_BROWSER_WS_ENDPOINT: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  CONTROL_TOWER_ALLOWED_ORIGINS: z.string().default("http://127.0.0.1:4173,http://localhost:4173"),
  MAXX_DEV_AUTH_BYPASS: z.string().optional(),
  MAXX_HERMES_ENABLED: z.string().optional(),
  MAXX_VOICE_ENABLED: z.string().optional(),
  MAXX_BROWSER_ENABLED: z.string().optional(),
  MAXX_BROWSER_MUTATIONS_ENABLED: z.string().optional(),
  MAXX_MEMORY_ENABLED: z.string().optional(),
  MAXX_SCHEDULER_ENABLED: z.string().optional(),
  MAXX_PRODUCTION_MUTATIONS_ENABLED: z.string().optional(),
  MAXX_EMERGENCY_DISABLE: z.string().optional(),
  MAXX_APPROVAL_TTL_HOURS: z.coerce.number().positive().default(24),
  MAXX_HERMES_ENDPOINT: z.string().url().optional(),
  MAXX_MEMORY_INDEX_PATH: z.string().optional(),
});

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const parsed = schema.parse(env);
  return {
    ...parsed,
    allowedEmails: parseAllowedEmails(parsed.STACY_ALLOWED_EMAILS),
    allowedOrigins: parsed.CONTROL_TOWER_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean),
    devAuthBypass: parsed.NODE_ENV !== "production" && parsed.MAXX_DEV_AUTH_BYPASS === "true",
    featureFlags: loadFeatureFlags(env),
    emergencyDisabled: isEmergencyDisabled(env),
    memoryIndexPath: parsed.MAXX_MEMORY_INDEX_PATH ?? path.join(parsed.MAXX_ICM_ROOT, "memory", "index.jsonl"),
  };
}

export type MaxxConfig = ReturnType<typeof loadConfig>;
