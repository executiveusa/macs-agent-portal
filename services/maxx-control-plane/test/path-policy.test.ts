import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { resolveInsideRoot } from "../src/path-policy.js";

test("resolves a mission path inside the configured ICM root", () => {
  const root = path.resolve("C:/maxx/workspaces");
  assert.equal(resolveInsideRoot(root, "runs/run-123/manifest.json"), path.join(root, "runs/run-123/manifest.json"));
});

test("blocks path traversal outside the configured ICM root", () => {
  const root = path.resolve("C:/maxx/workspaces");
  assert.throws(() => resolveInsideRoot(root, "../secrets.env"), /outside MAXX_ICM_ROOT/);
});
