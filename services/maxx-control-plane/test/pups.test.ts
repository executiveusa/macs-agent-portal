import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import type { HermesAdapter, HermesRunInput, HermesRunState } from "../src/hermes-adapter.js";
import {
  MemoryPupRepository,
  PUP_TEMPLATES,
  PupExecutor,
  hermesProfileForPup,
  registerPupRoutes,
} from "../src/pups.js";

test("ships the three bounded Stacy-ready Pup templates with isolated Hermes profiles", () => {
  assert.deepEqual(
    PUP_TEMPLATES.map((template) => template.id),
    ["chief_of_staff", "superdoer", "business_in_a_box"],
  );
  assert.deepEqual(
    PUP_TEMPLATES.map((template) => template.hermesProfile),
    ["chief-pup", "superdoer", "business-pup"],
  );
  for (const template of PUP_TEMPLATES) {
    assert.match(template.role, /approval/i);
    assert.equal(template.autonomy, "safe_actions");
  }
});

test("a routine Pup is claimed once and rescheduled before work", async () => {
  const repository = new MemoryPupRepository();
  const pup = await repository.create({
    operatorId: "stacy",
    templateId: "superdoer",
    routineEveryMinutes: 15,
    routinePrompt: "Prepare the next useful piece of work",
  });
  const dueAt = new Date(new Date(pup.nextRunAt!).getTime() + 1);
  const first = await repository.claimDue(dueAt);
  const second = await repository.claimDue(dueAt);

  assert.equal(first.length, 1);
  assert.equal(first[0].id, pup.id);
  assert.equal(second.length, 0);
  assert.ok(new Date(first[0].nextRunAt!).getTime() > dueAt.getTime());
});

test("Pup routes are human-authenticated and keep machine credentials out", async () => {
  const machineKey = "machine-secret-0123456789";
  const config = loadConfig({ NODE_ENV: "test", MAXX_API_KEY: machineKey });
  const app = buildApp({
    config,
    authenticate: async (request) => {
      if (request.headers["x-maxx-api-key"] === machineKey) return null;
      return { id: "11111111-1111-1111-1111-111111111111", email: "stacy@example.com", principal: "human" };
    },
  });
  await registerPupRoutes(app, config);

  const create = await app.inject({
    method: "POST",
    url: "/v1/pups",
    payload: { templateId: "business_in_a_box" },
  });
  assert.equal(create.statusCode, 201);
  assert.equal(create.json().kind, "business_in_a_box");

  const list = await app.inject({ method: "GET", url: "/v1/pups" });
  assert.equal(list.statusCode, 200);
  assert.equal(list.json().pups.length, 1);
  assert.equal(list.json().persistence, "memory");
  assert.equal(list.json().runtime, "unconfigured");

  const duplicate = await app.inject({
    method: "POST",
    url: "/v1/pups",
    payload: { templateId: "business_in_a_box" },
  });
  assert.equal(duplicate.statusCode, 409);
  assert.match(duplicate.json().error, /already exists/i);

  const machine = await app.inject({
    method: "POST",
    url: "/v1/pups",
    headers: { "x-maxx-api-key": machineKey },
    payload: { templateId: "superdoer" },
  });
  assert.equal(machine.statusCode, 401);

  await app.close();
});

test("custom Pups cannot be created without an explicit role and objective", async () => {
  const repository = new MemoryPupRepository();
  await assert.rejects(
    repository.create({ operatorId: "stacy", templateId: "custom" }),
    /require both an objective and a role/,
  );
});

test("built-in Pup chat and runs are routed to that Pup's Hermes profile", async () => {
  const repository = new MemoryPupRepository();
  const pup = await repository.create({ operatorId: "stacy", templateId: "superdoer" });
  assert.equal(hermesProfileForPup(pup), "superdoer");

  const calls: Array<{ kind: "chat" | "run"; profile?: string; sessionId?: string }> = [];
  const runningState: HermesRunState = {
    runId: "hermes-pup-run",
    status: "running",
    startedAt: new Date().toISOString(),
    endedAt: null,
    stage: "pup",
    progress: 0.5,
    result: null,
    error: null,
  };
  const hermes: HermesAdapter = {
    async chat(input) {
      calls.push({ kind: "chat", profile: input.profile, sessionId: input.sessionId });
      return {
        text: "Follow-ups prepared.",
        model: "test-model",
        usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2, estimatedCostUsd: 0, latencyMs: 1 },
      };
    },
    async startRun(input: HermesRunInput) {
      calls.push({ kind: "run", profile: input.profile });
      return runningState;
    },
    async getRunState() { return runningState; },
    async resolveApproval() { return runningState; },
    async steerRun() { return runningState; },
    async cancelRun() { return runningState; },
  };

  const config = loadConfig({ NODE_ENV: "test" });
  const executor = new PupExecutor(config, repository, hermes);
  const chat = await executor.chat(pup, "Prepare follow-ups");
  assert.equal(chat.text, "Follow-ups prepared.");
  assert.deepEqual(calls[0], { kind: "chat", profile: "superdoer", sessionId: "Bot Chat" });

  const run = await executor.run(pup, "manual", "Prepare today's follow-ups");
  assert.equal(run.runtimeProfile, "superdoer");
  assert.deepEqual(calls[1], { kind: "run", profile: "superdoer" });
});

test("custom Pups intentionally remain on the default Hermes profile until dynamic profile provisioning ships", async () => {
  const repository = new MemoryPupRepository();
  const pup = await repository.create({
    operatorId: "stacy",
    templateId: "custom",
    name: "One-off Specialist",
    role: "Research one bounded topic.",
    objective: "Prepare a bounded research memo.",
  });
  assert.equal(hermesProfileForPup(pup), undefined);
});