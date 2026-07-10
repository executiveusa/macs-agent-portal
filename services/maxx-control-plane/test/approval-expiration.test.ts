import assert from "node:assert/strict";
import test from "node:test";
import { MemoryStore } from "../src/store.js";

test("creates an approval with a computed expiry based on the configured TTL", async () => {
  const store = new MemoryStore(1); // 1 hour TTL
  const before = Date.now();
  const approval = await store.createApproval({ runId: "run-1", action: "send_email", summary: "Send donor recap" });
  const expiresAt = new Date(approval.expiresAt).getTime();

  assert.equal(approval.status, "pending");
  assert.ok(expiresAt > before + 59 * 60_000 && expiresAt <= before + 61 * 60_000);
});

test("rejects a second decision on an already-decided approval (anti-replay)", async () => {
  const store = new MemoryStore(24);
  const approval = await store.createApproval({ runId: "run-1", action: "send_email", summary: "Send donor recap" });

  const first = await store.decideApproval(approval.id, "approved", "operator-1");
  assert.ok(first);
  assert.equal(first?.status, "approved");

  const replay = await store.decideApproval(approval.id, "approved", "operator-1");
  assert.equal(replay, undefined);

  const replayReject = await store.decideApproval(approval.id, "rejected", "operator-2");
  assert.equal(replayReject, undefined);
});

test("lazily expires a pending approval once its TTL has elapsed", async () => {
  // 0-hour TTL forces the approval to be already expired by the time we check it.
  const store = new MemoryStore(0);
  const approval = await store.createApproval({ runId: "run-1", action: "send_email", summary: "Send donor recap" });

  await new Promise((resolve) => setTimeout(resolve, 5));

  const listed = await store.listApprovals();
  assert.equal(listed.find((item) => item.id === approval.id)?.status, "expired");

  const decision = await store.decideApproval(approval.id, "approved", "operator-1");
  assert.equal(decision, undefined);
});
