import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import type { HermesAdapter, HermesApprovalChoice, HermesRunInput, HermesRunState } from "../src/hermes-adapter.js";

class FakeHermes implements HermesAdapter {
  chatCalls: Array<{ message: string; sessionId?: string }> = [];
  approvalCalls: Array<{ runId: string; choice: HermesApprovalChoice }> = [];

  async chat(input: { message: string; sessionId?: string }) {
    this.chatCalls.push(input);
    return {
      text: "MAXX completed the Hermes turn",
      model: "hermes-agent",
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15, estimatedCostUsd: 0, latencyMs: 1 },
    };
  }

  async startRun(_input: HermesRunInput): Promise<HermesRunState> {
    return {
      runId: "run_native_1",
      status: "running",
      startedAt: new Date().toISOString(),
      endedAt: null,
      stage: "hermes",
      progress: 0.5,
      result: null,
      error: null,
    };
  }

  async getRunState(runId: string): Promise<HermesRunState | undefined> {
    return {
      runId,
      status: "running",
      startedAt: new Date().toISOString(),
      endedAt: null,
      stage: "hermes",
      progress: 0.5,
      result: null,
      error: null,
    };
  }

  async resolveApproval(runId: string, choice: HermesApprovalChoice) {
    this.approvalCalls.push({ runId, choice });
    return this.getRunState(runId);
  }

  async steerRun(runId: string) {
    return this.getRunState(runId);
  }

  async cancelRun(runId: string) {
    const state = await this.getRunState(runId);
    return state ? { ...state, status: "cancelled" as const } : undefined;
  }
}

test("/v1/chat uses Hermes as the primary MAXX runtime when configured", async () => {
  const hermes = new FakeHermes();
  const config = loadConfig({
    NODE_ENV: "test",
    MAXX_HERMES_ENABLED: "true",
    MAXX_HERMES_ENDPOINT: "https://hermes.internal",
    MAXX_HERMES_API_KEY: "test-key",
  });
  const app = buildApp({
    config,
    hermes,
    authenticate: async () => ({ id: "operator-1", email: "operator@example.com" }),
  });

  const response = await app.inject({
    method: "POST",
    url: "/v1/chat",
    payload: { message: "Take care of the website migration", runId: "maxx-run-1" },
  });

  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.provider, "hermes");
  assert.equal(body.model, "hermes-agent");
  assert.equal(body.text, "MAXX completed the Hermes turn");
  assert.deepEqual(body.skills, ["agent-maxx"]);
  assert.equal(hermes.chatCalls[0].sessionId, "maxx-run-1");
  await app.close();
});

test("MAXX exposes Hermes approval resolution without bypassing the run gate", async () => {
  const hermes = new FakeHermes();
  const config = loadConfig({
    NODE_ENV: "test",
    MAXX_HERMES_ENABLED: "true",
    MAXX_HERMES_ENDPOINT: "https://hermes.internal",
    MAXX_HERMES_API_KEY: "test-key",
  });
  const app = buildApp({
    config,
    hermes,
    authenticate: async () => ({ id: "operator-1", email: "operator@example.com" }),
  });

  const response = await app.inject({
    method: "POST",
    url: "/v1/hermes/runs/run_native_1/approval",
    payload: { choice: "once" },
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(hermes.approvalCalls, [{ runId: "run_native_1", choice: "once" }]);
  await app.close();
});
