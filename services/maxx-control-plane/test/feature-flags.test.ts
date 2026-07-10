import assert from "node:assert/strict";
import test from "node:test";
import { loadFeatureFlags, isEmergencyDisabled } from "../src/feature-flags.js";

test("feature flags default to false when unset", () => {
  const flags = loadFeatureFlags({});
  assert.equal(flags.MAXX_HERMES_ENABLED, false);
  assert.equal(flags.MAXX_VOICE_ENABLED, false);
  assert.equal(flags.MAXX_BROWSER_ENABLED, false);
  assert.equal(flags.MAXX_PRODUCTION_MUTATIONS_ENABLED, false);
});

test("feature flags turn on only with exact 'true' string", () => {
  const flags = loadFeatureFlags({ MAXX_HERMES_ENABLED: "true", MAXX_VOICE_ENABLED: "1" });
  assert.equal(flags.MAXX_HERMES_ENABLED, true);
  assert.equal(flags.MAXX_VOICE_ENABLED, false);
});

test("emergency disable requires exact 'true' string", () => {
  assert.equal(isEmergencyDisabled({}), false);
  assert.equal(isEmergencyDisabled({ MAXX_EMERGENCY_DISABLE: "true" }), true);
  assert.equal(isEmergencyDisabled({ MAXX_EMERGENCY_DISABLE: "yes" }), false);
});
