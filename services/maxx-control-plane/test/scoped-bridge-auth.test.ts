import assert from "node:assert/strict";
import test from "node:test";
import type { FastifyRequest } from "fastify";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { eventDispatchHeaders, forwardedHeaders, registerOperationsHubRoutes } from "../src/operations-hub.js";
import { MemoryPupHandoffRepository, registerPupBrokerRoutes } from "../src/pup-broker.js";
import { registerPupRoutes } from "../src/pups.js";

const operatorId = "11111111-1111-4111-8111-111111111111";
const eventKey = "event-bridge-secret-0123456789";
const hermesKey = "hermes-tool-secret-0123456789";
const machineKey = "machine-secret-0123456789";

function bridgeConfig(overrides: NodeJS.ProcessEnv = {}) {
  return loadConfig({
    NODE_ENV: "test",
    MAXX_API_KEY: machineKey,
    MAXX_EVENT_INGEST_KEY: eventKey,
    MAXX_EVENT_OPERATOR_ID: operatorId,
    MAXX_HERMES_TOOL_KEY: hermesKey,
    MAXX_HERMES_TOOL_OPERATOR_ID: operatorId,
    MAXX_SCHEDULER_ENABLED: "false",
    ...overrides,
  });
}

async function createApp() {
  const config = bridgeConfig();
  const app = buildApp({ config });
  await registerPupRoutes(app, config);
  await registerPupBrokerRoutes(app, config, new MemoryPupHandoffRepository());
  await registerOperationsHubRoutes(app, config);
  return app;
}

test("Hermes tool key can see the team but cannot access unrelated control-tower routes", async () => {
  const app = await createApp();
  const allowed = await app.inject({ method: "GET", url: "/v1/pups", headers: { "x-maxx-hermes-tool-key": hermesKey } });
  assert.equal(allowed.statusCode, 200);

  const blocked = await app.inject({ method: "GET", url: "/v1/control-tower/bootstrap", headers: { "x-maxx-hermes-tool-key": hermesKey } });
  assert.equal(blocked.statusCode, 401);
  await app.close();
});

test("event key is valid only on event ingestion", async () => {
  const app = await createApp();
  const event = await app.inject({
    method: "POST",
    url: "/v1/events",
    headers: { "x-maxx-event-key": eventKey },
    payload: { type: "calendar.changed", summary: "A meeting moved to 3 PM." },
  });
  assert.equal(event.statusCode, 202);

  const blocked = await app.inject({ method: "GET", url: "/v1/pups", headers: { "x-maxx-event-key": eventKey } });
  assert.equal(blocked.statusCode, 401);
  await app.close();
});

test("operations hub preserves Hermes scope across internal subrequests", () => {
  const request = {
    headers: {
      authorization: undefined,
      "x-request-id": "req-123",
      "x-maxx-hermes-tool-key": hermesKey,
    },
  } as unknown as FastifyRequest;

  assert.deepEqual(forwardedHeaders(request), {
    "x-request-id": "req-123",
    "x-maxx-hermes-tool-key": hermesKey,
  });
});

test("event dispatch translates event scope to the same operator's Hermes tool scope", () => {
  const config = bridgeConfig();
  const request = {
    headers: { "x-maxx-event-key": eventKey, "x-request-id": "req-event" },
    operator: { id: operatorId, email: "event-bridge@maxx.local", principal: "machine" },
  } as unknown as FastifyRequest;

  assert.deepEqual(eventDispatchHeaders(request, config), {
    "x-request-id": "req-event",
    "x-maxx-hermes-tool-key": hermesKey,
  });
});

test("event dispatch refuses cross-operator credential translation", () => {
  const config = bridgeConfig({ MAXX_HERMES_TOOL_OPERATOR_ID: "22222222-2222-4222-8222-222222222222" });
  const request = {
    headers: { "x-maxx-event-key": eventKey },
    operator: { id: operatorId, email: "event-bridge@maxx.local", principal: "machine" },
  } as unknown as FastifyRequest;

  assert.equal(eventDispatchHeaders(request, config), null);
});

test("legacy MAXX machine key remains unable to access Pup handoffs", async () => {
  const app = await createApp();
  const response = await app.inject({
    method: "POST",
    url: "/v1/pup-handoffs",
    headers: { "x-maxx-api-key": machineKey },
    payload: {
      sourcePupId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      targetPupId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      instruction: "This must be rejected before broker execution.",
    },
  });
  assert.equal(response.statusCode, 401);
  await app.close();
});
