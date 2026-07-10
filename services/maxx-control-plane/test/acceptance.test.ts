import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";

// Phase 17: acceptance test for the full mission lifecycle, exercising
// missions, chat, events, approvals, skills, and memory indexing together
// in one flow - every other test file in this suite is scoped to a single
// route or module. This is the test that would have caught a regression
// where, say, mission completion stopped triggering memory indexing, or
// chat stopped recording usage against the right run.
test("full mission lifecycle: create -> chat -> approval -> skill -> complete -> memory search", async (t) => {
  const icmRoot = await mkdtemp(path.join(tmpdir(), "maxx-acceptance-"));
  t.after(() => rm(icmRoot, { recursive: true, force: true }));

  const config = loadConfig({
    NODE_ENV: "test",
    MAXX_ICM_ROOT: icmRoot,
    MAXX_MEMORY_ENABLED: "true",
  });
  const app = buildApp({
    config,
    authenticate: async () => ({ id: "stacy", email: "stacy@example.com" }),
  });
  t.after(() => app.close());

  // 1. Create a mission - this creates an isolated ICM workspace on disk.
  const createResponse = await app.inject({
    method: "POST",
    url: "/v1/missions",
    payload: { objective: "Draft a Q3 donor recap for the board" },
  });
  assert.equal(createResponse.statusCode, 201);
  const mission = createResponse.json();
  assert.equal(mission.status, "working");
  assert.equal(mission.stages.length, 8);
  const runId: string = mission.runId;

  // 2. Chat against that run - should record usage and an assistant.message event.
  const chatResponse = await app.inject({
    method: "POST",
    url: "/v1/chat",
    payload: { message: "Summarize this week's donor activity", runId },
  });
  assert.equal(chatResponse.statusCode, 200);
  const chat = chatResponse.json();
  assert.equal(typeof chat.text, "string");
  assert.equal(chat.usage.runId, runId);

  // 3. A mutating skill should require an approval, not execute directly.
  const skillResponse = await app.inject({
    method: "POST",
    url: "/v1/skills/maxx-onboarding/run",
    payload: { runId },
  });
  assert.equal(skillResponse.statusCode, 202);
  const { approval } = skillResponse.json();
  assert.equal(approval.status, "pending");
  assert.equal(approval.runId, runId);

  // 4. Approve it - anti-replay means this can only succeed once.
  const approveResponse = await app.inject({ method: "POST", url: `/v1/approvals/${approval.id}/approve` });
  assert.equal(approveResponse.statusCode, 200);
  assert.equal(approveResponse.json().status, "approved");

  const replayResponse = await app.inject({ method: "POST", url: `/v1/approvals/${approval.id}/approve` });
  assert.equal(replayResponse.statusCode, 409);

  // 5. Events for this run should include everything that just happened.
  const eventsResponse = await app.inject({ method: "GET", url: `/v1/runs/${runId}/events` });
  assert.equal(eventsResponse.statusCode, 200);
  const eventTypes = eventsResponse.json().events.map((event: { type: string }) => event.type);
  assert.ok(eventTypes.includes("mission.created"));
  assert.ok(eventTypes.includes("assistant.message"));

  // 6. Complete the mission - this should auto-index it into memory.
  const completeResponse = await app.inject({
    method: "PATCH",
    url: `/v1/missions/${mission.id}`,
    payload: { status: "completed" },
  });
  assert.equal(completeResponse.statusCode, 200);
  assert.equal(completeResponse.json().status, "completed");

  // 7. The completed mission's objective should now be findable in memory.
  const searchResponse = await app.inject({ method: "GET", url: "/v1/memory/search?q=donor+recap" });
  assert.equal(searchResponse.statusCode, 200);
  const { results } = searchResponse.json();
  assert.ok(results.length >= 1);
  assert.equal(results[0].document.missionId, mission.id);

  // 8. Bootstrap should reflect the finished mission and cleared approval queue.
  const bootstrapResponse = await app.inject({ method: "GET", url: "/v1/control-tower/bootstrap" });
  const bootstrap = bootstrapResponse.json();
  const bootstrapMission = bootstrap.missions.find((item: { id: string }) => item.id === mission.id);
  assert.equal(bootstrapMission.status, "completed");
  assert.equal(
    bootstrap.approvals.filter((item: { status: string }) => item.status === "pending").length,
    0,
  );
});

test("rejecting an approval prevents a second decision either way (anti-replay)", async (t) => {
  const icmRoot = await mkdtemp(path.join(tmpdir(), "maxx-acceptance-"));
  t.after(() => rm(icmRoot, { recursive: true, force: true }));

  const config = loadConfig({ NODE_ENV: "test", MAXX_ICM_ROOT: icmRoot });
  const app = buildApp({ config, authenticate: async () => ({ id: "stacy", email: "stacy@example.com" }) });
  t.after(() => app.close());

  const mission = (
    await app.inject({ method: "POST", url: "/v1/missions", payload: { objective: "Investigate donor churn" } })
  ).json();

  const skillResponse = await app.inject({
    method: "POST",
    url: "/v1/skills/maxx-onboarding/run",
    payload: { runId: mission.runId },
  });
  const { approval } = skillResponse.json();

  const rejectResponse = await app.inject({ method: "POST", url: `/v1/approvals/${approval.id}/reject` });
  assert.equal(rejectResponse.statusCode, 200);
  assert.equal(rejectResponse.json().status, "rejected");

  const approveAfterRejectResponse = await app.inject({ method: "POST", url: `/v1/approvals/${approval.id}/approve` });
  assert.equal(approveAfterRejectResponse.statusCode, 409);
});
