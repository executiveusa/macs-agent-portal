import assert from "node:assert/strict";
import test from "node:test";
import {
  StubHermesAdapter,
  HttpHermesAdapter,
  createHermesAdapter,
  deriveHermesProfileApiKey,
} from "../src/hermes-adapter.js";

test("StubHermesAdapter reports an honest failed state instead of pretending to run", async () => {
  const adapter = new StubHermesAdapter();
  const state = await adapter.startRun({
    runId: "run-1",
    missionId: "mission-1",
    objective: "Draft donor recap",
    workspacePath: "/workspaces/mission-1",
    stage: "01_intake",
  });
  assert.equal(state.status, "failed");
  assert.match(state.error ?? "", /Hermes runtime is not configured/);
});

test("StubHermesAdapter round-trips state through getRunState and cancelRun", async () => {
  const adapter = new StubHermesAdapter();
  await adapter.startRun({
    runId: "run-1",
    missionId: "mission-1",
    objective: "Draft donor recap",
    workspacePath: "/workspaces/mission-1",
    stage: "01_intake",
  });
  const fetched = await adapter.getRunState("run-1");
  assert.equal(fetched?.runId, "run-1");

  const cancelled = await adapter.cancelRun("run-1");
  assert.equal(cancelled?.status, "cancelled");

  assert.equal(await adapter.getRunState("unknown"), undefined);
  assert.equal(await adapter.cancelRun("unknown"), undefined);
});

test("deriveHermesProfileApiKey is stable and isolates profile credentials", () => {
  const master = "deployment-master-key";
  const chief = deriveHermesProfileApiKey(master, "chief-pup");
  assert.equal(chief, deriveHermesProfileApiKey(master, "chief-pup"));
  assert.notEqual(chief, master);
  assert.notEqual(chief, deriveHermesProfileApiKey(master, "superdoer"));
  assert.equal(chief.length, 64);
});

test("HttpHermesAdapter uses Hermes native /v1/runs contract with bearer auth", async () => {
  const calls: Array<{ url: string; method?: string; headers?: Headers; body?: Record<string, unknown> }> = [];
  const fakeFetch = (async (url: string, init?: RequestInit) => {
    calls.push({
      url: String(url),
      method: init?.method,
      headers: new Headers(init?.headers),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    return new Response(JSON.stringify({ run_id: "run_native_123", status: "started" }), { status: 202 });
  }) as typeof fetch;

  const adapter = new HttpHermesAdapter("https://hermes.internal/", "secret-key", fakeFetch);
  const state = await adapter.startRun({
    runId: "maxx-run-1",
    missionId: "mission-1",
    objective: "Draft donor recap",
    workspacePath: "/workspaces/mission-1",
    stage: "01_intake",
    timeoutMs: 120_000,
  });

  assert.equal(state.status, "running");
  assert.equal(state.runId, "run_native_123");
  assert.equal(calls[0].url, "https://hermes.internal/v1/runs");
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].headers?.get("authorization"), "Bearer secret-key");
  assert.equal(calls[0].headers?.get("x-hermes-session-id"), "maxx-run-1");
  assert.equal(calls[0].body?.input, "Draft donor recap");
  assert.equal(calls[0].body?.timeout_ms, 120_000);
  assert.match(String(calls[0].body?.instructions), /Agent MAXX/);
  assert.match(String(calls[0].body?.instructions), /agent-maxx skill/);
});

test("HttpHermesAdapter routes a Pup run through the profile-prefixed API with a derived key", async () => {
  const calls: Array<{ url: string; headers: Headers; body: Record<string, unknown> }> = [];
  const fakeFetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url: String(url), headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) });
    return new Response(JSON.stringify({ run_id: "pup-run-1", status: "started" }), { status: 202 });
  }) as typeof fetch;
  const adapter = new HttpHermesAdapter("https://hermes.internal", "master-key", fakeFetch);
  await adapter.startRun({
    runId: "maxx-run-2",
    missionId: "mission-2",
    objective: "Prepare follow-ups",
    workspacePath: "/workspaces/mission-2",
    stage: "pup",
    profile: "superdoer",
  });

  assert.equal(calls[0].url, "https://hermes.internal/p/superdoer/v1/runs");
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${deriveHermesProfileApiKey("master-key", "superdoer")}`);
  assert.match(String(calls[0].body.instructions), /Hermes Pup profile: superdoer/);
  assert.match(String(calls[0].body.instructions), /persistent MAXX Pup/);
});

test("HttpHermesAdapter maps native run status and output", async () => {
  const fakeFetch = (async () =>
    new Response(
      JSON.stringify({
        run_id: "run_native_123",
        status: "completed",
        created_at: 1_786_000_000,
        output: "Completed with evidence",
        usage: { input_tokens: 10, output_tokens: 20, total_tokens: 30 },
      }),
      { status: 200 },
    )) as typeof fetch;
  const adapter = new HttpHermesAdapter("https://hermes.internal", "key", fakeFetch);
  const state = await adapter.getRunState("run_native_123");
  assert.equal(state?.status, "completed");
  assert.equal(state?.progress, 1);
  assert.equal(state?.result?.output, "Completed with evidence");
});

test("HttpHermesAdapter treats upstream timeout and error states as terminal", async () => {
  const payloads = [
    { run_id: "run-timeout", status: "timeout" },
    { run_id: "run-error", status: "error", error: "provider disconnected" },
    { run_id: "run-orphaned", status: "orphaned" },
  ];
  let index = 0;
  const fakeFetch = (async () => new Response(JSON.stringify(payloads[index++]), { status: 200 })) as typeof fetch;
  const adapter = new HttpHermesAdapter("https://hermes.internal", "key", fakeFetch);

  const timedOut = await adapter.getRunState("run-timeout");
  assert.equal(timedOut?.status, "timeout");
  assert.equal(timedOut?.progress, 1);
  assert.ok(timedOut?.endedAt);
  assert.match(timedOut?.error ?? "", /timed out/i);

  const errored = await adapter.getRunState("run-error");
  assert.equal(errored?.status, "error");
  assert.equal(errored?.progress, 1);
  assert.ok(errored?.endedAt);
  assert.equal(errored?.error, "provider disconnected");

  const orphaned = await adapter.getRunState("run-orphaned");
  assert.equal(orphaned?.status, "cancelled");
  assert.equal(orphaned?.progress, 1);
  assert.ok(orphaned?.endedAt);
});

test("HttpHermesAdapter sends approval to Hermes and refreshes state", async () => {
  const calls: string[] = [];
  const fakeFetch = (async (url: string, init?: RequestInit) => {
    calls.push(`${init?.method ?? "GET"} ${String(url)}`);
    if (String(url).endsWith("/approval")) return new Response(JSON.stringify({ resolved: 1 }), { status: 200 });
    return new Response(JSON.stringify({ run_id: "run-1", status: "running" }), { status: 200 });
  }) as typeof fetch;
  const adapter = new HttpHermesAdapter("https://hermes.internal", "key", fakeFetch);
  const state = await adapter.resolveApproval("run-1", "once");
  assert.equal(state?.status, "running");
  assert.deepEqual(calls, [
    "POST https://hermes.internal/v1/runs/run-1/approval",
    "GET https://hermes.internal/v1/runs/run-1",
  ]);
});

test("HttpHermesAdapter keeps Pup approval and status traffic inside the Pup profile", async () => {
  const calls: Array<{ url: string; auth: string | null }> = [];
  const fakeFetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url: String(url), auth: new Headers(init?.headers).get("authorization") });
    if (String(url).endsWith("/approval")) return new Response(JSON.stringify({ resolved: 1 }), { status: 200 });
    return new Response(JSON.stringify({ run_id: "pup-run", status: "running" }), { status: 200 });
  }) as typeof fetch;
  const adapter = new HttpHermesAdapter("https://hermes.internal", "master", fakeFetch);
  const state = await adapter.resolveApproval("pup-run", "once", "chief-pup");
  assert.equal(state?.status, "running");
  assert.deepEqual(calls.map((call) => call.url), [
    "https://hermes.internal/p/chief-pup/v1/runs/pup-run/approval",
    "https://hermes.internal/p/chief-pup/v1/runs/pup-run",
  ]);
  for (const call of calls) {
    assert.equal(call.auth, `Bearer ${deriveHermesProfileApiKey("master", "chief-pup")}`);
  }
});

test("HttpHermesAdapter uses OpenAI-compatible Hermes chat for the conversational surface", async () => {
  const calls: Array<{ url: string; headers: Headers; body: Record<string, unknown> }> = [];
  const fakeFetch = (async (url: string, init?: RequestInit) => {
    calls.push({
      url: String(url),
      headers: new Headers(init?.headers),
      body: JSON.parse(String(init?.body)),
    });
    return new Response(
      JSON.stringify({
        model: "hermes-agent",
        choices: [{ message: { role: "assistant", content: "I handled it." } }],
        usage: { prompt_tokens: 12, completion_tokens: 4, total_tokens: 16 },
      }),
      { status: 200 },
    );
  }) as typeof fetch;
  const adapter = new HttpHermesAdapter("https://hermes.internal", "key", fakeFetch);
  const result = await adapter.chat({ message: "Handle this", sessionId: "maxx-session-1" });
  assert.equal(result.text, "I handled it.");
  assert.equal(result.usage.totalTokens, 16);
  assert.equal(calls[0].url, "https://hermes.internal/v1/chat/completions");
  assert.equal(calls[0].headers.get("x-hermes-session-id"), "maxx-session-1");
  const messages = calls[0].body.messages as Array<{ role: string; content: string }>;
  assert.equal(messages[0].role, "system");
  assert.match(messages[0].content, /Agent MAXX/);
});

test("HttpHermesAdapter gives each Pup a persistent Responses API conversation", async () => {
  const calls: Array<{ url: string; headers: Headers; body: Record<string, unknown> }> = [];
  const fakeFetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url: String(url), headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) });
    return new Response(
      JSON.stringify({
        id: "resp_1",
        model: "superdoer",
        output: [{ type: "message", content: [{ type: "output_text", text: "Drafts prepared." }] }],
        usage: { input_tokens: 8, output_tokens: 3, total_tokens: 11 },
      }),
      { status: 200 },
    );
  }) as typeof fetch;
  const adapter = new HttpHermesAdapter("https://hermes.internal", "master-key", fakeFetch);
  const result = await adapter.chat({ message: "Prepare today's follow-ups", sessionId: "Bot Chat", profile: "superdoer" });

  assert.equal(result.text, "Drafts prepared.");
  assert.equal(result.usage.totalTokens, 11);
  assert.equal(calls[0].url, "https://hermes.internal/p/superdoer/v1/responses");
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${deriveHermesProfileApiKey("master-key", "superdoer")}`);
  assert.equal(calls[0].body.conversation, "Bot Chat");
  assert.equal(calls[0].body.store, true);
  assert.match(String(calls[0].body.instructions), /persistent MAXX Pup/);
});

test("HttpHermesAdapter surfaces a 404 as undefined, not an error", async () => {
  const fakeFetch = (async () => new Response(null, { status: 404 })) as typeof fetch;
  const adapter = new HttpHermesAdapter("https://hermes.internal", "key", fakeFetch);
  assert.equal(await adapter.getRunState("missing"), undefined);
  assert.equal(await adapter.cancelRun("missing"), undefined);
});

test("HttpHermesAdapter throws on a non-ok, non-404 response", async () => {
  const fakeFetch = (async () => new Response(null, { status: 500 })) as typeof fetch;
  const adapter = new HttpHermesAdapter("https://hermes.internal", "key", fakeFetch);
  await assert.rejects(() => adapter.getRunState("run-1"));
});

test("createHermesAdapter picks the HTTP adapter only when both enabled and endpoint are present", () => {
  assert.ok(createHermesAdapter({ hermesEnabled: false }) instanceof StubHermesAdapter);
  assert.ok(createHermesAdapter({ hermesEnabled: true }) instanceof StubHermesAdapter);
  assert.ok(
    createHermesAdapter({ hermesEnabled: true, hermesEndpoint: "https://hermes.internal", hermesApiKey: "key" }) instanceof
      HttpHermesAdapter,
  );
});
