import assert from "node:assert/strict";
import test from "node:test";
import { createMaxxMigrationsAdapter } from "../src/maxx-migrations-adapter.js";

const endpoint = "https://migrations.example.test";
const apiKey = "backend-machine-secret-0123456789";

test("MAXX Migrations adapter sends the backend key server-side and preserves one API", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fakeFetch: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    return new Response(JSON.stringify({ bucket: "scale", reason: "working" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const adapter = createMaxxMigrationsAdapter({ endpoint, apiKey, fetchImpl: fakeFetch });
  assert.equal(adapter.isConfigured(), true);
  const result = await adapter.route("The idea is working and capacity is the constraint");
  assert.deepEqual(result, { bucket: "scale", reason: "working" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.url, `${endpoint}/api/system/route`);
  const headers = calls[0]?.init?.headers as Record<string, string>;
  assert.equal(headers["x-maxx-migrations-api-key"], apiKey);
  assert.equal(JSON.parse(String(calls[0]?.init?.body)).condition, "The idea is working and capacity is the constraint");
});

test("MAXX Migrations adapter fails closed when backend config is missing", async () => {
  const adapter = createMaxxMigrationsAdapter({});
  assert.equal(adapter.isConfigured(), false);
  await assert.rejects(() => adapter.health(), /not configured/i);
});

test("MAXX Migrations adapter propagates truthful upstream failures", async () => {
  const fakeFetch: typeof fetch = async () =>
    new Response(JSON.stringify({ error: "machine authentication required" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  const adapter = createMaxxMigrationsAdapter({ endpoint, apiKey, fetchImpl: fakeFetch });
  await assert.rejects(() => adapter.manifest(), /machine authentication required/i);
});
