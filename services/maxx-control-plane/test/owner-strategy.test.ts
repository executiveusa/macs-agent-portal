import assert from "node:assert/strict";
import test from "node:test";
import { OwnerStrategyStore, applyProviderPreference, isActionForbidden, defaultStrategy } from "../src/owner-strategy.js";
import type { ModelDecision } from "../src/model-router.js";

test("get returns a default strategy for an operator with no stored preferences", () => {
  const store = new OwnerStrategyStore();
  const strategy = store.get("operator-1");
  assert.equal(strategy.riskTolerance, "standard");
  assert.deepEqual(strategy.forbiddenActions, []);
});

test("set merges partial updates onto the existing strategy", () => {
  const store = new OwnerStrategyStore();
  store.set("operator-1", { riskTolerance: "conservative" });
  const strategy = store.set("operator-1", { forbiddenActions: ["browser:purchase"] });
  assert.equal(strategy.riskTolerance, "conservative");
  assert.deepEqual(strategy.forbiddenActions, ["browser:purchase"]);
});

const baseDecision: ModelDecision = {
  model: "llama-3.3-70b-versatile",
  taskClass: "conversation",
  costTier: "low",
  provider: "groq",
  reason: "Fast Groq model selected",
};

test("applyProviderPreference overrides the provider when preferred provider is available", () => {
  const strategy = { ...defaultStrategy("operator-1"), preferredProvider: "openrouter" as const };
  const result = applyProviderPreference(baseDecision, strategy, { groq: true, openrouter: true });
  assert.equal(result.provider, "openrouter");
  assert.match(result.reason, /overridden to openrouter/);
});

test("applyProviderPreference leaves the decision alone when the preferred provider is unavailable", () => {
  const strategy = { ...defaultStrategy("operator-1"), preferredProvider: "openrouter" as const };
  const result = applyProviderPreference(baseDecision, strategy, { groq: true, openrouter: false });
  assert.equal(result.provider, "groq");
});

test("applyProviderPreference is a no-op when no preference is set", () => {
  const strategy = defaultStrategy("operator-1");
  const result = applyProviderPreference(baseDecision, strategy, { groq: true, openrouter: true });
  assert.deepEqual(result, baseDecision);
});

test("isActionForbidden checks the strategy's forbidden action list", () => {
  const strategy = { ...defaultStrategy("operator-1"), forbiddenActions: ["browser:purchase"] };
  assert.equal(isActionForbidden("browser:purchase", strategy), true);
  assert.equal(isActionForbidden("browser:navigate", strategy), false);
});
