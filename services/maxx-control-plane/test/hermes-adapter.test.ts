import assert from "node:assert/strict";
import test from "node:test";
import { StubHermesAdapter, HttpHermesAdapter, createHermesAdapter } from "../src/hermes-adapter.js";

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

test("HttpHermesAdapter posts to the configured endpoint and parses the response", async () => {
  const calls: Array<{ url: string; method?: string }> = [];
  const fakeFetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url: String(url), method: init?.method });
    return new Response(
      JSON.stringify({
        runId: "run-1",
        status: "running",
        startedAt: "2026-07-10T00:00:00.000Z",
        endedAt: null,
        stage: "01_intake",
        progress: 0.1,
        result: null,
        error: null,
      }),
      { status: 200 },
    );
  }) as typeof fetch;

  const adapter = new HttpHermesAdapter("https://hermes.internal", fakeFetch);
  const state = await adapter.startRun({
    runId: "run-1",
    missionId: "mission-1",
    objective: "Draft donor recap",
    workspacePath: "/workspaces/mission-1",
    stage: "01_intake",
  });

  assert.equal(state.status, "running");
  assert.equal(calls[0].url, "https://hermes.internal/runs");
  assert.equal(calls[0].method, "POST");
});

test("HttpHermesAdapter surfaces a 404 as undefined, not an error", async () => {
  const fakeFetch = (async () => new Response(null, { status: 404 })) as typeof fetch;
  const adapter = new HttpHermesAdapter("https://hermes.internal", fakeFetch);
  assert.equal(await adapter.getRunState("missing"), undefined);
  assert.equal(await adapter.cancelRun("missing"), undefined);
});

test("HttpHermesAdapter throws on a non-ok, non-404 response", async () => {
  const fakeFetch = (async () => new Response(null, { status: 500 })) as typeof fetch;
  const adapter = new HttpHermesAdapter("https://hermes.internal", fakeFetch);
  await assert.rejects(() => adapter.getRunState("run-1"));
});

test("createHermesAdapter picks the HTTP adapter only when both enabled and endpoint are present", () => {
  assert.ok(createHermesAdapter({ hermesEnabled: false }) instanceof StubHermesAdapter);
  assert.ok(createHermesAdapter({ hermesEnabled: true }) instanceof StubHermesAdapter);
  assert.ok(
    createHermesAdapter({ hermesEnabled: true, hermesEndpoint: "https://hermes.internal" }) instanceof
      HttpHermesAdapter,
  );
});
