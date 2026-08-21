import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import type { MaxxConfig } from "./config.js";
import { createHermesAdapter } from "./hermes-adapter.js";
import { hermesProfileForPup, type Pup } from "./pups.js";

const approvalSchema = z.object({
  choice: z.enum(["once", "session", "deny"]),
});

function forwardedHeaders(request: FastifyRequest) {
  const headers: Record<string, string> = {};
  if (typeof request.headers.authorization === "string") headers.authorization = request.headers.authorization;
  if (typeof request.headers["x-request-id"] === "string") headers["x-request-id"] = request.headers["x-request-id"];
  if (typeof request.headers["x-maxx-hermes-tool-key"] === "string") headers["x-maxx-hermes-tool-key"] = request.headers["x-maxx-hermes-tool-key"];
  return headers;
}

async function loadOwnedPup(app: FastifyInstance, request: FastifyRequest, pupId: string) {
  const response = await app.inject({
    method: "GET",
    url: "/v1/pups",
    headers: forwardedHeaders(request),
  });
  if (response.statusCode !== 200) return undefined;
  const body = response.json() as { pups?: Pup[] };
  return body.pups?.find((pup) => pup.id === pupId);
}

/**
 * Profile-aware controls for runs started by a MAXX Pup.
 *
 * The generic Hermes run routes target MAXX's default profile. A Pup run lives
 * behind /p/<profile>/ on the multiplex gateway and must be approved/stopped
 * with that profile's credential. Keep this mapping inside MAXX so Stacy never
 * has to know a profile name or Hermes URL.
 */
export async function registerPupRuntimeControlRoutes(app: FastifyInstance, config: MaxxConfig) {
  const hermes = createHermesAdapter({
    hermesEnabled: config.featureFlags.MAXX_HERMES_ENABLED,
    hermesEndpoint: config.MAXX_HERMES_ENDPOINT,
    hermesApiKey: config.MAXX_HERMES_API_KEY,
  });

  app.post("/v1/pups/:id/runs/:runId/approval", async (request, reply) => {
    if (!config.featureFlags.MAXX_HERMES_ENABLED) {
      return reply.code(503).send({ status: "unavailable", reason: "MAXX_HERMES_ENABLED is false" });
    }
    const parsed = approvalSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const params = request.params as { id: string; runId: string };
    const pup = await loadOwnedPup(app, request, params.id);
    if (!pup) return reply.code(404).send({ error: "Pup not found" });
    const profile = hermesProfileForPup(pup);
    if (!profile) {
      return reply.code(409).send({ error: "This custom Pup does not have an isolated Hermes profile yet" });
    }

    const state = await hermes.resolveApproval(params.runId, parsed.data.choice, profile);
    if (!state) return reply.code(404).send({ error: "Pup run not found" });
    return reply.send({ state, pup, runtimeProfile: profile });
  });

  app.get("/v1/pups/:id/runs/:runId", async (request, reply) => {
    if (!config.featureFlags.MAXX_HERMES_ENABLED) {
      return reply.code(503).send({ status: "unavailable", reason: "MAXX_HERMES_ENABLED is false" });
    }
    const params = request.params as { id: string; runId: string };
    const pup = await loadOwnedPup(app, request, params.id);
    if (!pup) return reply.code(404).send({ error: "Pup not found" });
    const profile = hermesProfileForPup(pup);
    if (!profile) return reply.code(409).send({ error: "This custom Pup does not have an isolated Hermes profile yet" });
    const state = await hermes.getRunState(params.runId, profile);
    return state ? reply.send({ state, pup, runtimeProfile: profile }) : reply.code(404).send({ error: "Pup run not found" });
  });

  app.post("/v1/pups/:id/runs/:runId/cancel", async (request, reply) => {
    if (!config.featureFlags.MAXX_HERMES_ENABLED) {
      return reply.code(503).send({ status: "unavailable", reason: "MAXX_HERMES_ENABLED is false" });
    }
    const params = request.params as { id: string; runId: string };
    const pup = await loadOwnedPup(app, request, params.id);
    if (!pup) return reply.code(404).send({ error: "Pup not found" });
    const profile = hermesProfileForPup(pup);
    if (!profile) return reply.code(409).send({ error: "This custom Pup does not have an isolated Hermes profile yet" });
    const state = await hermes.cancelRun(params.runId, profile);
    return state ? reply.send({ state, pup, runtimeProfile: profile }) : reply.code(404).send({ error: "Pup run not found" });
  });
}
