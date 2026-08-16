import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { MemoryOperationsRepository, registerOperationsHubRoutes } from "../src/operations-hub.js";
import { MemoryPupHandoffRepository, registerPupBrokerRoutes } from "../src/pup-broker.js";
import { registerPupRoutes } from "../src/pups.js";

const operator = { id: "11111111-1111-4111-8111-111111111111", email: "stacy@example.com", principal: "human" as const };

async function createTestApp(repository = new MemoryOperationsRepository()) {
  const config = loadConfig({ NODE_ENV: "test", MAXX_SCHEDULER_ENABLED: "false" });
  const app = buildApp({ config, authenticate: async () => operator });
  await registerPupRoutes(app, config);
  await registerPupBrokerRoutes(app, config, new MemoryPupHandoffRepository());
  await registerOperationsHubRoutes(app, config, repository);
  return { app, repository };
}

test("connection registry rejects raw credentials and accepts opaque refs", async () => {
  const { app } = await createTestApp();
  const raw = await app.inject({ method: "POST", url: "/v1/connections", payload: { name: "Gmail", kind: "email", secretRef: "sk-live-this-is-a-secret" } });
  assert.equal(raw.statusCode, 400);
  const safe = await app.inject({ method: "POST", url: "/v1/connections", payload: { name: "Gmail", kind: "email", secretRef: "vault:gmail/stacy-primary" } });
  assert.equal(safe.statusCode, 201);
  assert.equal(safe.json().connection.secretRef, "vault:gmail/stacy-primary");
  await app.close();
});

test("multiple interval workflows remain independent and do not overwrite the Pup routine slot", async () => {
  const { app, repository } = await createTestApp();
  const created = await app.inject({ method: "POST", url: "/v1/pups", payload: { templateId: "superdoer" } });
  assert.equal(created.statusCode, 201);
  const pupId = created.json().id as string;

  for (const [name, minutes] of [["Follow-up prep", "30"], ["Pipeline review", "60"]] as const) {
    const response = await app.inject({
      method: "POST",
      url: "/v1/workflows",
      payload: { name, pupId, objective: `${name} objective`, expectedProof: `${name} proof`, triggerType: "interval", triggerValue: minutes },
    });
    assert.equal(response.statusCode, 201);
    assert.ok(response.json().workflow.nextRunAt);
  }

  const workflows = await repository.listWorkflows(operator.id);
  assert.equal(workflows.length, 2);
  assert.notEqual(workflows[0].id, workflows[1].id);
  assert.ok(workflows.every((workflow) => workflow.nextRunAt));

  const pups = await app.inject({ method: "GET", url: "/v1/pups" });
  const pup = pups.json().pups.find((item: { id: string }) => item.id === pupId);
  assert.equal(pup.routineEveryMinutes, null);
  assert.equal(pup.routinePrompt, null);

  const due = await repository.claimDueInterval(operator.id, new Date(Date.now() + 61 * 60_000));
  assert.equal(due.length, 2);
  assert.notEqual(due[0].id, due[1].id);
  await app.close();
});

test("workflow run stores the exact run objective in the durable mission record", async () => {
  const { app } = await createTestApp();
  const created = await app.inject({ method: "POST", url: "/v1/pups", payload: { templateId: "superdoer" } });
  const pupId = created.json().id as string;
  const workflow = await app.inject({
    method: "POST",
    url: "/v1/workflows",
    payload: { name: "Prospect proof", pupId, objective: "Verify the five highest-value prospects.", expectedProof: "Return five names with source evidence.", triggerType: "manual" },
  });
  assert.equal(workflow.statusCode, 201);

  const run = await app.inject({ method: "POST", url: `/v1/workflows/${workflow.json().workflow.id}/run` });
  // The test Hermes adapter intentionally reports an honest runtime failure, but the mission is durably created first.
  assert.equal(run.statusCode, 502);
  assert.match(run.json().result.mission.objective, /Run objective: Verify the five highest-value prospects\./);
  assert.doesNotMatch(run.json().result.mission.objective, /Proactively prepare useful work for MACS Digital Media/);
  await app.close();
});

test("event ingestion is idempotent for the same source and event id", async () => {
  const { app } = await createTestApp();
  const created = await app.inject({ method: "POST", url: "/v1/pups", payload: { templateId: "superdoer" } });
  const pupId = created.json().id as string;
  const workflow = await app.inject({
    method: "POST",
    url: "/v1/workflows",
    payload: { name: "Calendar change", pupId, objective: "Prepare the calendar-change response.", expectedProof: "Return the proposed update.", triggerType: "event", triggerValue: "calendar.changed" },
  });
  assert.equal(workflow.statusCode, 201);

  const payload = { eventId: "calendar-event-123", source: "google-calendar", type: "calendar.changed", summary: "A meeting moved to 3 PM." };
  const first = await app.inject({ method: "POST", url: "/v1/events", payload });
  assert.equal(first.statusCode, 202);
  assert.equal(first.json().duplicate, false);
  assert.equal(first.json().matched, 1);

  const replay = await app.inject({ method: "POST", url: "/v1/events", payload });
  assert.equal(replay.statusCode, 200);
  assert.equal(replay.json().duplicate, true);
  assert.equal(replay.json().matched, 0);
  await app.close();
});

test("refinement proposals enter Review Inbox but cannot self-apply", async () => {
  const { app } = await createTestApp();
  const proposal = await app.inject({
    method: "POST",
    url: "/v1/refinements",
    payload: {
      source: "Doer",
      observation: "Lead research repeatedly spends time reopening the same source list.",
      proposedChange: "Cache the approved source list for future lead-research runs.",
      expectedEvidence: "Three runs complete with the same or better source coverage and lower runtime.",
      rollbackPlan: "Disable the cache and return to live source discovery.",
    },
  });
  assert.equal(proposal.statusCode, 201);
  assert.equal(proposal.json().proposal.status, "proposed");
  assert.match(proposal.json().note, /cannot apply themselves/i);
  const inbox = await app.inject({ method: "GET", url: "/v1/review-inbox" });
  assert.equal(inbox.statusCode, 200);
  assert.equal(inbox.json().items.some((item: { kind: string }) => item.kind === "refinement"), true);
  await app.close();
});

test("fresh specialist rejects recursive fields and routes through the one-hop broker", async () => {
  const { app } = await createTestApp();
  const scout = await app.inject({ method: "POST", url: "/v1/pups", payload: { templateId: "chief_of_staff" } });
  const doer = await app.inject({ method: "POST", url: "/v1/pups", payload: { templateId: "superdoer" } });
  const recursive = await app.inject({
    method: "POST",
    url: `/v1/pups/${scout.json().id}/fresh-specialist`,
    payload: { targetPupId: doer.json().id, role: "Research specialist", objective: "Verify five prospects.", context: "Use only approved public sources.", expectedProof: "Five names with source evidence.", parentHandoffId: "22222222-2222-4222-8222-222222222222" },
  });
  assert.equal(recursive.statusCode, 400);
  await app.close();
});
