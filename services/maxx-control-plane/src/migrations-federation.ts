import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { MaxxConfig } from "./config.js";
import { createMaxxMigrationsAdapter } from "./maxx-migrations-adapter.js";

const routeSchema = z.object({ condition: z.string().trim().min(3).max(10_000) });

export async function registerMigrationsFederationRoutes(
  app: FastifyInstance,
  config: MaxxConfig,
) {
  const adapter = createMaxxMigrationsAdapter({
    endpoint: config.MAXX_MIGRATIONS_URL,
    apiKey: config.MAXX_MIGRATIONS_API_KEY,
  });

  app.get("/v1/migrations/health", async (_request, reply) => {
    if (!adapter.isConfigured()) {
      return reply.code(503).send({
        status: "unavailable",
        service: "maxx-migrations",
        reason: "MAXX_MIGRATIONS_URL or MAXX_MIGRATIONS_API_KEY is missing",
      });
    }
    try {
      const upstream = await adapter.health();
      return reply.send({ status: "ready", upstream });
    } catch (error) {
      return reply.code(502).send({
        status: "degraded",
        service: "maxx-migrations",
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get("/v1/migrations/manifest", async (_request, reply) => {
    if (!adapter.isConfigured()) {
      return reply.code(503).send({
        status: "unavailable",
        service: "maxx-migrations",
        reason: "MAXX Migrations backend is not configured",
      });
    }
    try {
      return reply.send(await adapter.manifest());
    } catch (error) {
      return reply.code(502).send({
        status: "degraded",
        service: "maxx-migrations",
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.post("/v1/migrations/route", async (request, reply) => {
    const input = routeSchema.parse(request.body);
    if (!adapter.isConfigured()) {
      return reply.code(503).send({
        status: "unavailable",
        service: "maxx-migrations",
        reason: "MAXX Migrations backend is not configured",
      });
    }
    try {
      return reply.send(await adapter.route(input.condition));
    } catch (error) {
      return reply.code(502).send({
        status: "degraded",
        service: "maxx-migrations",
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
