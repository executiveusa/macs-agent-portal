import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import {
  MemoryPupHandoffRepository,
  delegatePupWork,
  registerPupBrokerRoutes,
} from "../src/pup-broker.js";

test("broker records a transparent one-hop handoff and dispatches only the target Pup", async () => {
  const repository = new MemoryPupHandoffRepository();
  let dispatchedTarget = "";
  let dispatchedInstruction = "";

  const result = await delegatePupWork({
    operatorId: "11111111-1111-1111-1111-111111111111",
    sourcePupId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    targetPupId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    instruction: "Prepare a verified list of five warm prospects for the current MACS offer.",
    repository,
    listPups: async () => [
      { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "Scout", status: "active" },
      { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", name: "Doer", status: "active" },
    ],
    dispatch: async (targetPupId, instruction) => {
      dispatchedTarget = targetPupId;
      dispatchedInstruction = instruction;
      return { statusCode: 202, missionId: "mission-1", runId: "run-1", stateStatus: "running" };
    },
  });

  assert.equal(dispatchedTarget, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
  assert.match(dispatchedInstruction, /one-hop delegation/i);
  assert.match(dispatchedInstruction, /do not hand this work to another Pup/i);
  assert.equal(result.handoff.depth, 1);
  assert.equal(result.handoff.status, "working");
  assert.equal(result.handoff.missionId, "mission-1");
  assert.equal(result.handoff.runId, "run-1");

  const thread = await repository.thread(result.handoff.operatorId, result.handoff.threadId);
  assert.equal(thread.length, 1);
  assert.equal(thread[0].sourcePupId, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  assert.equal(thread[0].targetPupId, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
});

test("broker refuses self-delegation before any dispatch occurs", async () => {
  const repository = new MemoryPupHandoffRepository();
  let dispatched = false;

  await assert.rejects(
    delegatePupWork({
      operatorId: "11111111-1111-1111-1111-111111111111",
      sourcePupId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      targetPupId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      instruction: "Do the same task again.",
      repository,
      listPups: async () => [{ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "Scout", status: "active" }],
      dispatch: async () => {
        dispatched = true;
        return { statusCode: 202 };
      },
    }),
    /cannot hand work to itself/i,
  );

  assert.equal(dispatched, false);
  assert.equal((await repository.list("11111111-1111-1111-1111-111111111111")).length, 0);
});

test("broker refuses handoffs involving paused Pups", async () => {
  const repository = new MemoryPupHandoffRepository();

  await assert.rejects(
    delegatePupWork({
      operatorId: "11111111-1111-1111-1111-111111111111",
      sourcePupId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      targetPupId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      instruction: "Prepare the draft.",
      repository,
      listPups: async () => [
        { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "Scout", status: "active" },
        { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", name: "Doer", status: "paused" },
      ],
      dispatch: async () => ({ statusCode: 202 }),
    }),
    /Doer is not active/,
  );
});

test("handoff API rejects recursive parent fields and keeps machine credentials out", async () => {
  const machineKey = "machine-secret-0123456789";
  const config = loadConfig({ NODE_ENV: "test", MAXX_API_KEY: machineKey });
  const app = buildApp({
    config,
    authenticate: async (request) => {
      if (request.headers["x-maxx-api-key"] === machineKey) return null;
      return { id: "11111111-1111-1111-1111-111111111111", email: "stacy@example.com", principal: "human" };
    },
  });
  await registerPupBrokerRoutes(app, config, new MemoryPupHandoffRepository());

  const recursive = await app.inject({
    method: "POST",
    url: "/v1/pup-handoffs",
    payload: {
      sourcePupId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      targetPupId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      instruction: "Delegate this task.",
      parentHandoffId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    },
  });
  assert.equal(recursive.statusCode, 400);

  const machine = await app.inject({
    method: "POST",
    url: "/v1/pup-handoffs",
    headers: { "x-maxx-api-key": machineKey },
    payload: {
      sourcePupId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      targetPupId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      instruction: "Delegate this task.",
    },
  });
  assert.equal(machine.statusCode, 401);

  await app.close();
});