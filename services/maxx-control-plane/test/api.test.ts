import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";

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
