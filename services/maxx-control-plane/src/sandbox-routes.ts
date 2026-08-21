import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { MaxxConfig } from "./config.js";
import { createSandboxClient } from "./sandbox-adapter.js";

const pupId = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/);
const execSchema = z.object({
  pupId,
  command: z.string().trim().min(1).max(8_000),
  cwd: z.string().max(1_000).optional(),
}).strict();
const writeSchema = z.object({
  pupId,
  path: z.string().min(1).max(1_000),
  content: z.string().max(1_000_000),
}).strict();
const fileQuerySchema = z.object({
  pupId,
  path: z.string().max(1_000).default("."),
});

/**
 * MAXX-owned replacement for Orgo's shared-computer API.
 *
 * These routes do not touch the VPS host filesystem or Docker socket. They
 * proxy only to the dedicated maxx-sandbox container, whose persistent volume
 * is split into per-Pup workspaces. Production/customer credentials are never
 * mounted into that container.
 */
export async function registerSandboxRoutes(app: FastifyInstance, config: MaxxConfig) {
  const sandbox = createSandboxClient({ url: config.MAXX_SANDBOX_URL, key: config.MAXX_SANDBOX_KEY });

  app.get("/v1/sandbox/capabilities", async (_request, reply) => {
    if (!sandbox) return reply.code(503).send({ status: "unavailable", reason: "MAXX sandbox is not configured" });
    return reply.send(await sandbox.capabilities());
  });

  app.post("/v1/sandbox/exec", async (request, reply) => {
    if (!sandbox) return reply.code(503).send({ status: "unavailable", reason: "MAXX sandbox is not configured" });
    const parsed = execSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    return reply.send(await sandbox.exec(parsed.data));
  });

  app.post("/v1/sandbox/files/write", async (request, reply) => {
    if (!sandbox) return reply.code(503).send({ status: "unavailable", reason: "MAXX sandbox is not configured" });
    const parsed = writeSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    return reply.send(await sandbox.writeFile(parsed.data));
  });

  app.get("/v1/sandbox/files/read", async (request, reply) => {
    if (!sandbox) return reply.code(503).send({ status: "unavailable", reason: "MAXX sandbox is not configured" });
    const parsed = fileQuerySchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    return reply.send(await sandbox.readFile(parsed.data));
  });

  app.get("/v1/sandbox/files/list", async (request, reply) => {
    if (!sandbox) return reply.code(503).send({ status: "unavailable", reason: "MAXX sandbox is not configured" });
    const parsed = fileQuerySchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    return reply.send(await sandbox.listFiles(parsed.data));
  });
}
