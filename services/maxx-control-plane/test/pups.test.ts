import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { MemoryPupRepository, PUP_TEMPLATES, registerPupRoutes } from "../src/pups.js";

test("ships the three bounded Stacy-ready Pup templates", () => {
  assert.deepEqual(
    PUP_TEMPLATES.map((template) => template.id),
    ["chief_of_staff", "superdoer", "business_in_a_box"],
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
