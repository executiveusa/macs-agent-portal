import assert from "node:assert/strict";
import test from "node:test";
import type { FastifyRequest } from "fastify";
import { createAuthenticator } from "../src/auth.js";
import { loadConfig } from "../src/config.js";
import { HttpHermesAdapter, MAXX_MODE_MARKER } from "../src/hermes-adapter.js";

test("machine API key authenticates independently of Supabase and rejects wrong keys", async () => {
  const config = loadConfig({
    NODE_ENV: "production",
    MAXX_API_KEY: "0123456789abcdef0123456789abcdef",
  });
  const authenticate = createAuthenticator(config);

  const accepted = await authenticate({
    headers: { "x-maxx-api-key": "0123456789abcdef0123456789abcdef" },
  } as unknown as FastifyRequest);
  assert.equal(accepted?.id, "maxx-machine-client");

  const rejected = await authenticate({
    headers: { "x-maxx-api-key": "ffffffffffffffffffffffffffffffff" },
  } as unknown as FastifyRequest);
  assert.equal(rejected, null);
});

test("MAXX Mode is translated into Hermes high-reasoning model_options and hidden from the user message", async () => {
  let body: Record<string, unknown> | undefined;
  const fakeFetch = (async (_url: string, init?: RequestInit) => {
    body = JSON.parse(String(init?.body));
    return new Response(
      JSON.stringify({
        model: "configured-hermes-model",
        choices: [{ message: { role: "assistant", content: "Power path complete." } }],
        usage: { prompt_tokens: 4, completion_tokens: 3, total_tokens: 7 },
      }),
      { status: 200 },
    );
  }) as typeof fetch;

  const adapter = new HttpHermesAdapter("https://maxx-hermes.internal", "runtime-key", fakeFetch);
  await adapter.chat({ message: `${MAXX_MODE_MARKER}\nChallenge this architecture.` });

  assert.deepEqual(body?.model_options, { reasoning_effort: "high" });
  const messages = body?.messages as Array<{ role: string; content: string }>;
  assert.equal(messages[1].content, "Challenge this architecture.");
  assert.doesNotMatch(messages[1].content, /MAXX_MODE/);
  assert.match(messages[0].content, /MAXX Mode is ACTIVE/);
});

test("normal MAXX chat leaves Hermes provider/model selection configurable", async () => {
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
  assert.equal(body?.model_options, undefined);
});
