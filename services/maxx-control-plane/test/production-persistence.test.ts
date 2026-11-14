import assert from "node:assert/strict";
import test from "node:test";
import { createStore } from "../src/store.js";
import { loadConfig } from "../src/config.js";

/**
 * Regression: returning an in-memory "success" when the configured DB fails
 * loses approvals and missions after a restart. Production must fail closed.
 */
test("production database failures never become transient success receipts", async () => {
  const originalFetch = globalThis.fetch;
  let attempted = 0;
  globalThis.fetch = (async () => {
    attempted++;
    return new Response(JSON.stringify({ message: "database unavailable" }), {
      status: 503, headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  try {
    const store = createStore(loadConfig({
      NODE_ENV: "production",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-only-server-role-secret",
    }));
    await assert.rejects(store.listMissions(), /status 503/);
    await assert.rejects(store.listApprovals(), /status 503/);
    await assert.rejects(store.createApproval({
      runId: "11111111-1111-4111-8111-111111111111",
      action: "publish",
      summary: "Must not pretend an approval was persisted",
    }), /status 503/);
    await assert.rejects(store.addEvent("run-1", "started", "must not lie"), /status 503/);
    await assert.rejects(store.decideApproval("approval-1", "approved", "operator-1"), /status 503/);
    assert.ok(attempted >= 5, "the database was actually called");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("non-production fallback remains explicit and is not production proof", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response("", { status: 503 })) as typeof fetch;
  try {
    const store = createStore(loadConfig({
      NODE_ENV: "test",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-only-server-role-secret",
    }));
    const pending = await store.createApproval({
      runId: "run-2", action: "draft", summary: "Local fallback",
    });
    assert.equal(pending.status, "pending");
    assert.equal((await store.listApprovals()).length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
