import { createRemoteJWKSet, jwtVerify } from "jose";
import type { FastifyRequest } from "fastify";
import { isAllowedOperator } from "./auth-policy.js";
import type { MaxxConfig } from "./config.js";
import type { Operator } from "./types.js";

export function createAuthenticator(config: MaxxConfig) {
  const jwks = config.SUPABASE_URL
    ? createRemoteJWKSet(new URL(`${config.SUPABASE_URL}/auth/v1/.well-known/jwks.json`))
    : null;

  return async (request: FastifyRequest): Promise<Operator | null> => {
    if (config.devAuthBypass) return { id: "local-stacy", email: config.allowedEmails[0] ?? "stacy@local" };
    if (!jwks || !config.SUPABASE_URL) return null;

    const value = request.headers.authorization;
    const token = value?.startsWith("Bearer ") ? value.slice(7) : undefined;
    if (!token) return null;

    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: `${config.SUPABASE_URL}/auth/v1`,
        audience: "authenticated",
      });
      const email = typeof payload.email === "string" ? payload.email : undefined;
      if (!isAllowedOperator(email, config.allowedEmails)) return null;
      return { id: String(payload.sub), email: email! };
    } catch {
      return null;
    }
  };
}
