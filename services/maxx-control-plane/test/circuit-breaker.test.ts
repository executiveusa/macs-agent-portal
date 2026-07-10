import assert from "node:assert/strict";
import test from "node:test";
import { CircuitBreaker } from "../src/circuit-breaker.js";

test("stays closed under the failure threshold", () => {
  const breaker = new CircuitBreaker(5, 30_000);
  for (let i = 0; i < 4; i += 1) breaker.recordFailure();
  assert.equal(breaker.getState(), "closed");
  assert.equal(breaker.canRequest(), true);
});

test("opens after reaching the failure threshold", () => {
  const breaker = new CircuitBreaker(3, 30_000);
  const now = Date.now();
  breaker.recordFailure(now);
  breaker.recordFailure(now);
  breaker.recordFailure(now);
  assert.equal(breaker.getState(), "open");
  assert.equal(breaker.canRequest(now), false);
});

test("moves to half_open after cooldown and closes on success", () => {
  const breaker = new CircuitBreaker(2, 30_000);
  const now = Date.now();
  breaker.recordFailure(now);
  breaker.recordFailure(now);
  assert.equal(breaker.canRequest(now + 30_000), true);
  assert.equal(breaker.getState(), "half_open");
  breaker.recordSuccess();
  assert.equal(breaker.getState(), "closed");
});

test("re-opens if the half_open probe fails", () => {
  const breaker = new CircuitBreaker(2, 30_000);
  const now = Date.now();
  breaker.recordFailure(now);
  breaker.recordFailure(now);
  breaker.canRequest(now + 30_000);
  breaker.recordFailure(now + 30_000);
  assert.equal(breaker.getState(), "open");
});
