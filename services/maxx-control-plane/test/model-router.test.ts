import assert from "node:assert/strict";
import test from "node:test";
import { routeModel } from "../src/model-router.js";

test("honors a manual model override", () => {
  const decision = routeModel({ message: "Summarize this", manualModel: "anthropic/claude-sonnet-4" });
  assert.equal(decision.model, "anthropic/claude-sonnet-4");
  assert.equal(decision.reason, "Manual operator override");
});

test("routes coding work to a tool-capable reasoning model", () => {
  const decision = routeModel({ message: "Refactor the TypeScript service and run its tests" });
  assert.equal(decision.taskClass, "coding");
  assert.match(decision.reason, /coding/i);
});

test("routes ordinary conversation to the low-latency lane", () => {
  const decision = routeModel({ message: "Give me a quick recap of today" });
  assert.equal(decision.taskClass, "conversation");
  assert.equal(decision.costTier, "low");
});

test("routes conversation to Groq for fast inference", () => {
  const decision = routeModel({ message: "Give me a quick recap of today" });
  assert.equal(decision.taskClass, "conversation");
  assert.equal(decision.provider, "groq");
  assert.equal(decision.model, "llama-3.3-70b-versatile");
});

test("routes high-risk actions to OpenRouter, not Groq", () => {
  const decision = routeModel({ message: "Send a payment to the vendor" });
  assert.equal(decision.taskClass, "high_risk");
  assert.equal(decision.provider, "openrouter");
});
