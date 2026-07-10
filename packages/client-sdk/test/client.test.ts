import assert from "node:assert/strict";
import test from "node:test";
import { MaxxClient, MaxxApiError } from "../src/index.js";

function fakeFetch(responses: Array<{ status: number; body: unknown }>) {
  const calls: Array<{ url: string; method?: string; headers?: HeadersInit; body?: string }> = [];
  let index = 0;
  const impl = (async (url: string, init?: RequestInit) => {
    calls.push({ url: String(url), method: init?.method, headers: init?.headers, body: init?.body as string | undefined });
    const next = responses[Math.min(index, responses.length - 1)];
    index += 1;
    return new Response(JSON.stringify(next.body), { status: next.status });
  }) as typeof fetch;
  return { impl, calls };
}

test("chat() posts to /v1/chat with a bearer token and returns the parsed response", async () => {
  const { impl, calls } = fakeFetch([
    {
      status: 200,
      body: {
        id: "1",
        text: "hello",
        model: "llama-3.3-70b-versatile",
        provider: "groq",
        taskClass: "conversation",
        routingReason: "fast lane",
        approvalState: "not_required",
        skills: [],
        stage: "conversation",
        degraded: false,
        usage: { promptTokens: 1, completionTokens: 1, estimatedCostUsd: 0, latencyMs: 10 },
      },
    },
  ]);
  const client = new MaxxClient({ baseUrl: "https://maxx.internal", getToken: () => "token-123", fetchImpl: impl });

  const result = await client.chat({ message: "hi" });

  assert.equal(result.text, "hello");
  assert.equal(calls[0].url, "https://maxx.internal/v1/chat");
  assert.equal(calls[0].method, "POST");
  assert.equal((calls[0].headers as Record<string, string>).Authorization, "Bearer token-123");
});

test("getToken can be async", async () => {
  const { impl } = fakeFetch([{ status: 200, body: { jobs: [] } }]);
  const client = new MaxxClient({
    baseUrl: "https://maxx.internal",
    getToken: async () => "async-token",
    fetchImpl: impl,
  });
  const result = await client.listSchedulerJobs();
  assert.deepEqual(result.jobs, []);
});

test("throws MaxxApiError with the parsed error body on a non-ok response", async () => {
  const { impl } = fakeFetch([{ status: 429, body: { error: "Too many chat requests", retryAfterSeconds: 42 } }]);
  const client = new MaxxClient({ baseUrl: "https://maxx.internal", getToken: () => "token", fetchImpl: impl });

  await assert.rejects(
    () => client.chat({ message: "hi" }),
    (error: unknown) => {
      assert.ok(error instanceof MaxxApiError);
      assert.equal(error.status, 429);
      assert.equal(error.message, "Too many chat requests");
      assert.equal((error.body as { retryAfterSeconds: number }).retryAfterSeconds, 42);
      return true;
    },
  );
});

test("searchMemory encodes the query and optional limit into the query string", async () => {
  const { impl, calls } = fakeFetch([{ status: 200, body: { results: [] } }]);
  const client = new MaxxClient({ baseUrl: "https://maxx.internal", getToken: () => "token", fetchImpl: impl });
  await client.searchMemory("donor churn", 5);
  assert.equal(calls[0].url, "https://maxx.internal/v1/memory/search?q=donor+churn&limit=5");
});

test("strips a trailing slash from baseUrl", async () => {
  const { impl, calls } = fakeFetch([{ status: 200, body: { jobs: [] } }]);
  const client = new MaxxClient({ baseUrl: "https://maxx.internal/", getToken: () => "token", fetchImpl: impl });
  await client.listSchedulerJobs();
  assert.equal(calls[0].url, "https://maxx.internal/v1/scheduler/jobs");
});

test("approve/reject hit the correct action-specific URLs", async () => {
  const { impl, calls } = fakeFetch([
    { status: 200, body: { id: "a1", status: "approved" } },
    { status: 200, body: { id: "a1", status: "rejected" } },
  ]);
  const client = new MaxxClient({ baseUrl: "https://maxx.internal", getToken: () => "token", fetchImpl: impl });
  await client.approveAction("a1");
  await client.rejectAction("a1");
  assert.equal(calls[0].url, "https://maxx.internal/v1/approvals/a1/approve");
  assert.equal(calls[1].url, "https://maxx.internal/v1/approvals/a1/reject");
});
