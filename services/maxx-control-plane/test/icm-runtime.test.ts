import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createIcmRun } from "../src/icm-runtime.js";

test("creates an isolated eight-stage ICM workspace and manifest", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "maxx-icm-"));

  try {
    const run = await createIcmRun({
      root,
      missionId: "mission-123",
      objective: "Research and prepare a lead follow-up",
      operatorId: "stacy",
    });

    assert.match(run.runId, /^run-/);
    assert.equal(run.stages.length, 8);
    assert.equal(run.stages[0].id, "01_intake");
    assert.equal(run.stages[7].id, "08_learn");

    const manifest = JSON.parse(await readFile(path.join(run.runPath, "manifest.json"), "utf8"));
    assert.equal(manifest.missionId, "mission-123");
    assert.equal(manifest.objective, "Research and prepare a lead follow-up");

    const approvalContract = await readFile(
      path.join(run.runPath, "stages", "06_approval", "CONTEXT.md"),
      "utf8",
    );
    assert.match(approvalContract, /Approval Requirements/);
    assert.match(approvalContract, /Never approve on Stacy's behalf/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
