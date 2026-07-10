import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createRateLimiters } from "../src/rate-limiter.js";
import { StubHermesAdapter } from "../src/hermes-adapter.js";
import { InMemoryMemoryIndexer } from "../src/memory-indexer.js";

test("exposes liveness without authentication", async () => {
  const app = buildApp({ authenticate: async () => null });
  const response = await app.inject({ method: "GET", url: "/health/live" });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().status, "alive");
  await app.close();
});

test("rejects protected control-tower requests without an operator", async () => {
  const app = buildApp({ authenticate: async () => null });
  const response = await app.inject({ method: "GET", url: "/v1/control-tower/bootstrap" });

  assert.equal(response.statusCode, 401);
  await app.close();
});

test("returns an honest degraded bootstrap payload", async () => {
  const app = buildApp({
    authenticate: async () => ({ id: "stacy", email: "stacy@example.com" }),
  });
  const response = await app.inject({ method: "GET", url: "/v1/control-tower/bootstrap" });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().agent.status, "degraded");
  assert.equal(response.json().dependencies.openrouter.configured, false);
  await app.close();
});

test("rate limits chat requests per operator", async () => {
  const rateLimiters = createRateLimiters();
  const app = buildApp({
    authenticate: async () => ({ id: "stacy", email: "stacy@example.com" }),
    rateLimiters,
  });
  let lastStatus = 200;
  for (let i = 0; i < 11; i += 1) {
    const response = await app.inject({
      method: "POST",
      url: "/v1/chat",
      payload: { message: "hello" },
    });
    lastStatus = response.statusCode;
  }
  assert.equal(lastStatus, 429);
  await app.close();
});

test("blocks mutations system-wide when MAXX_EMERGENCY_DISABLE is active", async () => {
  const config = loadConfig({ NODE_ENV: "test", MAXX_EMERGENCY_DISABLE: "true" });
  const app = buildApp({
    config,
    authenticate: async () => ({ id: "stacy", email: "stacy@example.com" }),
  });
  const response = await app.inject({
    method: "POST",
    url: "/v1/missions",
    payload: { objective: "Investigate donor churn for Q3" },
  });
  assert.equal(response.statusCode, 503);
  assert.equal(response.json().status, "locked");
  await app.close();
});

test("locks production mutations unless MAXX_PRODUCTION_MUTATIONS_ENABLED is true", async () => {
  const config = loadConfig({ NODE_ENV: "production", MAXX_PRODUCTION_MUTATIONS_ENABLED: "false" });
  const app = buildApp({
    config,
    authenticate: async () => ({ id: "stacy", email: "stacy@example.com" }),
  });
  const response = await app.inject({
    method: "POST",
    url: "/v1/missions",
    payload: { objective: "Investigate donor churn for Q3" },
  });
  assert.equal(response.statusCode, 503);
  assert.equal(response.json().status, "locked");
  await app.close();
});

test("hermes routes return 503 when MAXX_HERMES_ENABLED is false", async () => {
  const config = loadConfig({ NODE_ENV: "test" });
  const app = buildApp({
    config,
    authenticate: async () => ({ id: "stacy", email: "stacy@example.com" }),
    hermes: new StubHermesAdapter(),
  });
  const response = await app.inject({
    method: "POST",
    url: "/v1/hermes/runs",
    payload: {
      runId: "run-1",
      missionId: "mission-1",
      objective: "Draft donor recap",
      workspacePath: "/workspaces/mission-1",
      stage: "01_intake",
    },
  });
  assert.equal(response.statusCode, 503);
  await app.close();
});

test("hermes routes report an honest failure when enabled but no runtime is reachable", async () => {
  const config = loadConfig({ NODE_ENV: "test", MAXX_HERMES_ENABLED: "true" });
  const app = buildApp({
    config,
    authenticate: async () => ({ id: "stacy", email: "stacy@example.com" }),
    hermes: new StubHermesAdapter(),
  });
  const response = await app.inject({
    method: "POST",
    url: "/v1/hermes/runs",
    payload: {
      runId: "run-1",
      missionId: "mission-1",
      objective: "Draft donor recap",
      workspacePath: "/workspaces/mission-1",
      stage: "01_intake",
    },
  });
  assert.equal(response.statusCode, 502);
  assert.equal(response.json().status, "failed");
  await app.close();
});

test("memory routes return 503 when MAXX_MEMORY_ENABLED is false", async () => {
  const config = loadConfig({ NODE_ENV: "test" });
  const app = buildApp({
    config,
    authenticate: async () => ({ id: "stacy", email: "stacy@example.com" }),
    memory: new InMemoryMemoryIndexer(),
  });
  const response = await app.inject({ method: "GET", url: "/v1/memory/search?q=donor" });
  assert.equal(response.statusCode, 503);
  await app.close();
});

test("memory routes index and search documents when MAXX_MEMORY_ENABLED is true", async () => {
  const config = loadConfig({ NODE_ENV: "test", MAXX_MEMORY_ENABLED: "true" });
  const app = buildApp({
    config,
    authenticate: async () => ({ id: "stacy", email: "stacy@example.com" }),
    memory: new InMemoryMemoryIndexer(),
  });

  const indexResponse = await app.inject({
    method: "POST",
    url: "/v1/memory/documents",
    payload: {
      runId: "run-1",
      missionId: "mission-1",
      source: "test",
      title: "Donor churn analysis",
      content: "Donor churn increased in Q3",
      tags: ["donor"],
    },
  });
  assert.equal(indexResponse.statusCode, 201);

  const searchResponse = await app.inject({ method: "GET", url: "/v1/memory/search?q=donor+churn" });
  assert.equal(searchResponse.statusCode, 200);
  assert.equal(searchResponse.json().results.length, 1);
  await app.close();
});

test("owner strategy blocks a forbidden browser action with 403", async () => {
  const config = loadConfig({ NODE_ENV: "test", MAXX_BROWSER_ENABLED: "true", MAXX_BROWSER_WS_ENDPOINT: "wss://browser.internal" });
  const app = buildApp({
    config,
    authenticate: async () => ({ id: "stacy", email: "stacy@example.com" }),
  });

  const setStrategy = await app.inject({
    method: "PUT",
    url: "/v1/strategy",
    payload: { forbiddenActions: ["browser:navigate"] },
  });
  assert.equal(setStrategy.statusCode, 200);

  const response = await app.inject({
    method: "POST",
    url: "/v1/browser/sessions",
    payload: { action: "navigate", target: "https://example.com" },
  });
  assert.equal(response.statusCode, 403);
  await app.close();
});

test("scheduler jobs route returns 503 when MAXX_SCHEDULER_ENABLED is false", async () => {
  const config = loadConfig({ NODE_ENV: "test" });
  const app = buildApp({ config, authenticate: async () => ({ id: "stacy", email: "stacy@example.com" }) });
  const response = await app.inject({ method: "GET", url: "/v1/scheduler/jobs" });
  assert.equal(response.statusCode, 503);
  await app.close();
});

test("scheduler jobs route lists the approval-expiry sweep when enabled", async () => {
  const config = loadConfig({ NODE_ENV: "test", MAXX_SCHEDULER_ENABLED: "true" });
  const app = buildApp({ config, authenticate: async () => ({ id: "stacy", email: "stacy@example.com" }) });
  const response = await app.inject({ method: "GET", url: "/v1/scheduler/jobs" });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().jobs[0].id, "approval-expiry-sweep");
  await app.close();
});
