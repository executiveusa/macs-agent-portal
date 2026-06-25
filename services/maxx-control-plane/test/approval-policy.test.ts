import assert from "node:assert/strict";
import test from "node:test";
import { classifyBrowserAction } from "../src/approval-policy.js";

test("allows observation and navigation without an approval", () => {
  assert.equal(classifyBrowserAction("navigate"), "automatic");
  assert.equal(classifyBrowserAction("extract"), "automatic");
  assert.equal(classifyBrowserAction("screenshot"), "automatic");
});

test("requires approval for consequential browser actions", () => {
  assert.equal(classifyBrowserAction("submit_form"), "approval_required");
  assert.equal(classifyBrowserAction("purchase"), "approval_required");
  assert.equal(classifyBrowserAction("upload"), "approval_required");
  assert.equal(classifyBrowserAction("delete"), "approval_required");
});
