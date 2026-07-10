import assert from "node:assert/strict";
import test from "node:test";
import { Scheduler } from "../src/scheduler.js";

test("does not run a job before its interval has elapsed", async () => {
  const scheduler = new Scheduler();
  let runs = 0;
  const start = Date.now();
  scheduler.register({ id: "job-1", name: "Test job", intervalMs: 60_000, handler: async () => { runs += 1; } });

  await scheduler.tick(start + 30_000);
  assert.equal(runs, 0);
});

test("runs a job once its interval has elapsed and reschedules it", async () => {
  const scheduler = new Scheduler();
  let runs = 0;
  const start = Date.now();
  scheduler.register({ id: "job-1", name: "Test job", intervalMs: 1_000, handler: async () => { runs += 1; } });

  await scheduler.tick(start + 1_000);
  assert.equal(runs, 1);

  const [job] = scheduler.list();
  assert.equal(job.lastStatus, "succeeded");
  assert.equal(job.nextRunAt, start + 1_000 + 1_000);

  await scheduler.tick(start + 1_500);
  assert.equal(runs, 1); // not due again yet

  await scheduler.tick(start + 2_000);
  assert.equal(runs, 2);
});

test("records a failed job without throwing and keeps rescheduling it", async () => {
  const scheduler = new Scheduler();
  const start = Date.now();
  scheduler.register({
    id: "job-1",
    name: "Failing job",
    intervalMs: 1_000,
    handler: async () => {
      throw new Error("boom");
    },
  });

  await scheduler.tick(start + 1_000);
  const [job] = scheduler.list();
  assert.equal(job.lastStatus, "failed");
  assert.equal(job.lastError, "boom");
  assert.equal(job.nextRunAt, start + 2_000);
});

test("unregister removes a job so it no longer runs", async () => {
  const scheduler = new Scheduler();
  let runs = 0;
  const start = Date.now();
  scheduler.register({ id: "job-1", name: "Test job", intervalMs: 1_000, handler: async () => { runs += 1; } });
  scheduler.unregister("job-1");

  await scheduler.tick(start + 1_000);
  assert.equal(runs, 0);
  assert.equal(scheduler.list().length, 0);
});

test("list() never exposes the handler function", async () => {
  const scheduler = new Scheduler();
  scheduler.register({ id: "job-1", name: "Test job", intervalMs: 1_000, handler: async () => {} });
  const [job] = scheduler.list();
  assert.equal("handler" in job, false);
});
