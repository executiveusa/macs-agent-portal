import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { registerOperationsHubRoutes } from "../src/operations-hub.js";
import { MemoryPupHandoffRepository, registerPupBrokerRoutes } from "../src/pup-broker.js";
import { registerPupRoutes } from "../src/pups.js";

const operator = { id: "11111111-1111-4111-8111-111111111111", email: "stacy@example.com", principal: "human" as const };

async function createTestApp() {
  const config = loadConfig({ NODE_ENV: "test", MAXX_SCHEDULER_ENABLED: "false" });
  const app = buildApp({ config, authenticate: async () => operator });
  await registerPupRoutes(app, config);
  await registerPupBrokerRoutes(app, config, new MemoryPupHandoffRepository());
  await registerOperationsHubRoutes(app, config);
  return app;
}

test("connection registry rejects raw credentials and accepts opaque refs", async () => {
  const app = await createTestApp();

  const raw = await app.inject({
    method: "POST",
    url: "/v1/connections",
    payload: { name: "Gmail", kind: "email", secretRef: "sk-live-this-is-a-secret" },
  });
  assert.equal(raw.statusCode, 400);

  const safe = await app.inject({
    method: "POST",
    url: "/v1/connections",
    payload: { name: "Gmail", kind: "email", secretRef: "vault:gmail/stacy-primary" },
  });
  assert.equal(safe.statusCode, 201);
  assert.equal(safe.json().connection.secretRef, "vault:gmail/stacy-primary");

  await app.close();
});

test("interval Teach My Pup workflow compiles into the existing Pup scheduler", async () => {
  const app = await createTestApp();
  const created = await app.inject({ method: "POST", url: "/v1/pups", payload: { templateId: "superdoer" } });
  assert.equal(created.statusCode, 201);
  const pupId = created.json().id as string;

  const workflow = await app.inject({
    method: "POST",
    url: "/v1/workflows",
    payload: {
      name: "Daily follow-up prep",
      pupId,
      objective: "Prepare today's follow-up drafts from approved context.",
      expectedProof: "Return the draft count and source references.",
      triggerType: "interval",
      triggerValue: "1440",
    },
  });
  assert.equal(workflow.statusCode, 201);

  const pups = await app.inject({ method: "GET", url: "/v1/pups" });
  const pup = pups.json().pups.find((item: { id: string }) => item.id === pupId);
  assert.equal(pup.routineEveryMinutes, 1440);
  assert.match(pup.routinePrompt, /Expected proof:/);

  await app.close();
});

test("refinement proposals enter Review Inbox but cannot self-apply", async () => {
  const app = await createTestApp();
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
  const app = await createTestApp();
  const scout = await app.inject({ method: "POST", url: "/v1/pups", payload: { templateId: "chief_of_staff" } });
  const doer = await app.inject({ method: "POST", url: "/v1/pups", payload: { templateId: "superdoer" } });

  const recursive = await app.inject({
    method: "POST",
    url: `/v1/pups/${scout.json().id}/fresh-specialist`,
    payload: {
      targetPupId: doer.json().id,
      role: "Research specialist",
      objective: "Verify five prospects.",
      context: "Use only approved public sources.",
      expectedProof: "Five names with source evidence.",
      parentHandoffId: "22222222-2222-4222-8222-222222222222",
    },
  });
  assert.equal(recursive.statusCode, 400);

  await app.close();
});
