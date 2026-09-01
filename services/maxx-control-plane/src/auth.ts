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

function pathOf(request: FastifyRequest) {
  return request.url.split("?", 1)[0];
}

function machineRouteAllowed(request: FastifyRequest) {
  const path = pathOf(request);
  return request.method === "POST" && (path === "/v1/chat" || path === "/v1/missions");
}

function eventRouteAllowed(request: FastifyRequest) {
  return request.method === "POST" && pathOf(request) === "/v1/events";
}

function hermesToolRouteAllowed(request: FastifyRequest) {
  const path = pathOf(request);
  if (request.method === "GET" && (path === "/v1/pups" || path === "/v1/workflows")) return true;
  if (request.method === "GET" && (path === "/v1/sandbox/capabilities" || path === "/v1/sandbox/files/read" || path === "/v1/sandbox/files/list")) return true;
  if (request.method !== "POST") return false;
  if (path === "/v1/pup-handoffs" || path === "/v1/workflows" || path === "/v1/refinements") return true;
  if (path === "/v1/sandbox/exec" || path === "/v1/sandbox/files/write") return true;
  return /^\/v1\/pups\/[^/]+\/(run|delegate|fresh-specialist)$/.test(path);
}

export function createAuthenticator(config: MaxxConfig) {
  const jwks = config.SUPABASE_URL
    ? createRemoteJWKSet(new URL(`${config.SUPABASE_URL}/auth/v1/.well-known/jwks.json`))
    : null;

  return async (request: FastifyRequest): Promise<Operator | null> => {
    if (config.devAuthBypass) {
      return { id: "local-stacy", email: config.allowedEmails[0] ?? "stacy@local", principal: "human" };
    }

    const eventKey = request.headers["x-maxx-event-key"];
    const eventValue = Array.isArray(eventKey) ? eventKey[0] : eventKey;
    if (safeMatches(eventValue, config.MAXX_EVENT_INGEST_KEY)) {
      if (!eventRouteAllowed(request) || !config.MAXX_EVENT_OPERATOR_ID) return null;
      return { id: config.MAXX_EVENT_OPERATOR_ID, email: "event-bridge@maxx.local", principal: "machine" };
    }

    const hermesToolKey = request.headers["x-maxx-hermes-tool-key"];
    const hermesToolValue = Array.isArray(hermesToolKey) ? hermesToolKey[0] : hermesToolKey;
    if (safeMatches(hermesToolValue, config.MAXX_HERMES_TOOL_KEY)) {
      if (!hermesToolRouteAllowed(request) || !config.MAXX_HERMES_TOOL_OPERATOR_ID) return null;
      return { id: config.MAXX_HERMES_TOOL_OPERATOR_ID, email: "hermes-tools@maxx.local", principal: "machine" };
    }

    const machineKey = request.headers["x-maxx-api-key"];
    const machineValue = Array.isArray(machineKey) ? machineKey[0] : machineKey;
    if (safeMatches(machineValue, config.MAXX_API_KEY)) {
      if (!machineRouteAllowed(request)) return null;
      return { id: "maxx-machine-client", email: "machine@maxx.local", principal: "machine" };
    }

    const value = request.headers.authorization;
    const token = value?.startsWith("Bearer ") ? value.slice(7) : undefined;
    if (!token) return null;

    if (config.SUPABASE_JWT_SECRET) {
      try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(config.SUPABASE_JWT_SECRET), {
          audience: "authenticated",
        });
        const email = typeof payload.email === "string" ? payload.email : undefined;
        if (!isAllowedOperator(email, config.allowedEmails)) return null;
        return { id: String(payload.sub), email: email!, principal: "human" };
      } catch {
        // continue to jwks
      }
    }

    if (!jwks || !config.SUPABASE_URL) return null;

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
