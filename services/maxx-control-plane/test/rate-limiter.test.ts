import assert from "node:assert/strict";
import test from "node:test";
import { RateLimiter } from "../src/rate-limiter.js";

test("allows requests under the limit", () => {
  const limiter = new RateLimiter(60_000, 3);
  const now = Date.now();
  assert.equal(limiter.consume("op-1", now).allowed, true);
  assert.equal(limiter.consume("op-1", now).allowed, true);
  assert.equal(limiter.consume("op-1", now).allowed, true);
});

test("blocks requests over the limit and reports retry-after", () => {
  const limiter = new RateLimiter(60_000, 2);
  const now = Date.now();
  limiter.consume("op-1", now);
  limiter.consume("op-1", now);
  const decision = limiter.consume("op-1", now + 1_000);
  assert.equal(decision.allowed, false);
  if (!decision.allowed) assert.ok(decision.retryAfterSeconds > 0);
});

test("resets the window after it elapses", () => {
  const limiter = new RateLimiter(1_000, 1);
  const now = Date.now();
  limiter.consume("op-1", now);
  assert.equal(limiter.consume("op-1", now + 500).allowed, false);
  assert.equal(limiter.consume("op-1", now + 1_500).allowed, true);
});

test("tracks separate operators independently", () => {
  const limiter = new RateLimiter(60_000, 1);
  const now = Date.now();
  assert.equal(limiter.consume("op-1", now).allowed, true);
  assert.equal(limiter.consume("op-2", now).allowed, true);
});
