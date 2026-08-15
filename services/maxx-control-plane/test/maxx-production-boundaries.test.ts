import assert from "node:assert/strict";
import test from "node:test";
import type { FastifyRequest } from "fastify";
import { createAuthenticator } from "../src/auth.js";
import { loadConfig } from "../src/config.js";
import { HttpHermesAdapter, MAXX_MODE_MARKER } from "../src/hermes-adapter.js";

const routeKeys = [
  "MAXX_HERMES_FAST_PROVIDER",
  "MAXX_HERMES_FAST_MODEL",
  "MAXX_HERMES_STANDARD_PROVIDER",
  "MAXX_HERMES_STANDARD_MODEL",
  "MAXX_HERMES_POWER_PROVIDER",
  "MAXX_HERMES_POWER_MODEL",
] as const;

function withCleanRoutes<T>(fn: () => Promise<T>) {
  const before = Object.fromEntries(routeKeys.map((key) => [key, process.env[key]]));
  for (const key of routeKeys) delete process.env[key];
  return fn().finally(() => {
    for (const key of routeKeys) {
      const value = before[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

function machineRequest(url: string, method = "POST", key = "0123456789abcdef0123456789abcdef") {
  return {
    url,
    method,
    headers: { "x-maxx-api-key": key },
  } as unknown as FastifyRequest;
}

test("machine API key authenticates only on advertised MAXX machine routes", async () => {
  const config = loadConfig({
    NODE_ENV: "production",
    MAXX_API_KEY: "0123456789abcdef0123456789abcdef",
  });
  const authenticate = createAuthenticator(config);

  const chat = await authenticate(machineRequest("/v1/chat"));
  assert.equal(chat?.id, "maxx-machine-client");
  assert.equal(chat?.principal, "machine");

  const mission = await authenticate(machineRequest("/v1/missions"));
  assert.equal(mission?.principal, "machine");

  const approval = await authenticate(machineRequest("/v1/approvals/approval-1/approve"));
  assert.equal(approval, null);

  const strategy = await authenticate(machineRequest("/v1/strategy", "PUT"));
  assert.equal(strategy, null);

  const browserMutation = await authenticate(machineRequest("/v1/browser/sessions"));
  assert.equal(browserMutation, null);

  const hermesApproval = await authenticate(machineRequest("/v1/hermes/runs/run-1/approval"));
  assert.equal(hermesApproval, null);

  const wrongKey = await authenticate(machineRequest("/v1/chat", "POST", "ffffffffffffffffffffffffffffffff"));
  assert.equal(wrongKey, null);
});

test("MAXX Mode is translated into high reasoning, uses configured power model, and hides the marker", async () => withCleanRoutes(async () => {
  process.env.MAXX_HERMES_POWER_PROVIDER = "provider-power";
  process.env.MAXX_HERMES_POWER_MODEL = "model-power";
  let body: Record<string, unknown> | undefined;
  const fakeFetch = (async (_url: string, init?: RequestInit) => {
    body = JSON.parse(String(init?.body));
    return new Response(
      JSON.stringify({
        model: "model-power",
        choices: [{ message: { role: "assistant", content: "Power path complete." } }],
        usage: { prompt_tokens: 4, completion_tokens: 3, total_tokens: 7 },
      }),
      { status: 200 },
    );
  }) as typeof fetch;

  const adapter = new HttpHermesAdapter("https://maxx-hermes.internal", "runtime-key", fakeFetch);
  await adapter.chat({ message: `${MAXX_MODE_MARKER}\nChallenge this architecture.` });

  assert.equal(body?.provider, "provider-power");
  assert.equal(body?.model, "model-power");
  assert.deepEqual(body?.model_options, { reasoning_effort: "high" });
  const messages = body?.messages as Array<{ role: string; content: string }>;
  assert.equal(messages[1].content, "Challenge this architecture.");
  assert.doesNotMatch(messages[1].content, /MAXX_MODE/);
  assert.match(messages[0].content, /MAXX Mode is ACTIVE/);
}));

test("short ordinary work routes to a configured cheap model without exposing a model picker", async () => withCleanRoutes(async () => {
  process.env.MAXX_HERMES_FAST_PROVIDER = "cheap-provider";
  process.env.MAXX_HERMES_FAST_MODEL = "cheap-model";
  let body: Record<string, unknown> | undefined;
  const fakeFetch = (async (_url: string, init?: RequestInit) => {
    body = JSON.parse(String(init?.body));
    return new Response(
      JSON.stringify({ model: "cheap-model", choices: [{ message: { role: "assistant", content: "Done." } }], usage: {} }),
      { status: 200 },
    );
  }) as typeof fetch;

  const adapter = new HttpHermesAdapter("https://maxx-hermes.internal", "runtime-key", fakeFetch);
  await adapter.chat({ message: "What needs doing today?" });
  assert.equal(body?.provider, "cheap-provider");
  assert.equal(body?.model, "cheap-model");
  assert.equal(body?.model_options, undefined);
}));

test("normal MAXX chat falls back to Hermes runtime model selection when no route is configured", async () => withCleanRoutes(async () => {
  let body: Record<string, unknown> | undefined;
  const fakeFetch = (async (_url: string, init?: RequestInit) => {
    body = JSON.parse(String(init?.body));
    return new Response(
      JSON.stringify({
        model: "configured-hermes-model",
        choices: [{ message: { role: "assistant", content: "Done." } }],
        usage: {},
      }),
      { status: 200 },
    );
  }) as typeof fetch;

  const adapter = new HttpHermesAdapter("https://maxx-hermes.internal", "runtime-key", fakeFetch);
  await adapter.chat({ message: "What needs doing today?" });
  assert.equal(body?.model, "hermes-agent");
  assert.equal(body?.provider, undefined);
  assert.equal(body?.model_options, undefined);
}));
