import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createRateLimiters } from "../src/rate-limiter.js";

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
