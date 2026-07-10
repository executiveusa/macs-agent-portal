import assert from "node:assert/strict";
import test from "node:test";
import { runHealthChecks } from "../src/health-checker.js";

test("reports ready when the check resolves true", async () => {
  const results = await runHealthChecks([{ name: "svc-a", check: async () => true }]);
  assert.equal(results[0].status, "ready");
});

test("reports unavailable when the check resolves false", async () => {
  const results = await runHealthChecks([{ name: "svc-b", check: async () => false }]);
  assert.equal(results[0].status, "unavailable");
});

test("reports unavailable when the check throws", async () => {
  const results = await runHealthChecks([
    {
      name: "svc-c",
      check: async () => {
        throw new Error("boom");
      },
    },
  ]);
  assert.equal(results[0].status, "unavailable");
});

test("reports unavailable when the check exceeds the timeout", async () => {
  const results = await runHealthChecks(
    [{ name: "svc-d", check: () => new Promise((resolve) => setTimeout(() => resolve(true), 50)) }],
    5,
  );
  assert.equal(results[0].status, "unavailable");
});
