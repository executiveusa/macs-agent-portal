import { timingSafeEqual } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { FastifyRequest } from "fastify";
import { isAllowedOperator } from "./auth-policy.js";
import type { MaxxConfig } from "./config.js";
import type { Operator } from "./types.js";

function safeMatches(candidate: string | undefined, expected: string | undefined) {
  if (!candidate || !expected) return false;
  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createAuthenticator(config: MaxxConfig) {
  const jwks = config.SUPABASE_URL
    ? createRemoteJWKSet(new URL(`${config.SUPABASE_URL}/auth/v1/.well-known/jwks.json`))
    : null;

  return async (request: FastifyRequest): Promise<Operator | null> => {
    if (config.devAuthBypass) {
      return { id: "local-stacy", email: config.allowedEmails[0] ?? "stacy@local", principal: "human" };
    }

    const machineKey = request.headers["x-maxx-api-key"];
    const machineValue = Array.isArray(machineKey) ? machineKey[0] : machineKey;
    if (safeMatches(machineValue, config.MAXX_API_KEY)) {
      return { id: "maxx-machine-client", email: "machine@maxx.local", principal: "machine" };
    }

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
      return { id: String(payload.sub), email: email!, principal: "human" };
    } catch {
      return null;
    }
  };
}
