import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedOperator, parseAllowedEmails } from "../src/auth-policy.js";

test("normalizes and deduplicates the Stacy allowlist", () => {
  assert.deepEqual(parseAllowedEmails(" Stacy@Example.com,stacy@example.com, ops@example.com "), [
    "stacy@example.com",
    "ops@example.com",
  ]);
});

test("rejects a valid identity that is not allowlisted", () => {
  assert.equal(isAllowedOperator("visitor@example.com", ["stacy@example.com"]), false);
});

test("accepts an allowlisted identity without case sensitivity", () => {
  assert.equal(isAllowedOperator("STACY@example.com", ["stacy@example.com"]), true);
});
