import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const compose = readFileSync(new URL("../compose.coolify.yml", import.meta.url), "utf8");

test("production Compose never enables unsanctioned MAXX mutations by default", () => {
  assert.match(
    compose,
    /MAXX_PRODUCTION_MUTATIONS_ENABLED:\s+"\$\{MAXX_PRODUCTION_MUTATIONS_ENABLED:-false\}"/,
  );
  assert.doesNotMatch(compose, /MAXX_PRODUCTION_MUTATIONS_ENABLED:\s*"true"/);
});

test("client workspace activation is explicit and off until reviewed RLS is deployed", () => {
  assert.match(
    compose,
    /MAXX_CLIENT_WORKSPACES_ENABLED:\s+"\$\{MAXX_CLIENT_WORKSPACES_ENABLED:-false\}"/,
  );
});
