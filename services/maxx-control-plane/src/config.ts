import path from "node:path";
import { z } from "zod";
import { parseAllowedEmails } from "./auth-policy.js";

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
  CONTROL_TOWER_ALLOWED_ORIGINS: z.string().default("http://127.0.0.1:4173,http://localhost:4173"),
  MAXX_DEV_AUTH_BYPASS: z.string().optional(),
});

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const parsed = schema.parse(env);
  return {
    ...parsed,
    allowedEmails: parseAllowedEmails(parsed.STACY_ALLOWED_EMAILS),
    allowedOrigins: parsed.CONTROL_TOWER_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean),
    devAuthBypass: parsed.NODE_ENV !== "production" && parsed.MAXX_DEV_AUTH_BYPASS === "true",
  };
}

export type MaxxConfig = ReturnType<typeof loadConfig>;
