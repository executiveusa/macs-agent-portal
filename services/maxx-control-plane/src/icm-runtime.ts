import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { resolveInsideRoot } from "./path-policy.js";

const STAGES = [
  ["01_intake", "Translate Stacy's request into one explicit mission contract."],
  ["02_research", "Gather only the evidence required by the mission contract."],
  ["03_plan", "Produce a bounded execution plan and identify approval gates."],
  ["04_execute", "Execute the approved plan using only allowed skills and tools."],
  ["05_verify", "Verify outputs against the mission contract and earlier artifacts."],
  ["06_approval", "Prepare consequential actions for Stacy's explicit decision."],
  ["07_deliver", "Deliver approved outputs and record their destinations."],
  ["08_learn", "Identify repeated operator corrections and propose source improvements."],
] as const;

function stageContract(stageId: string, purpose: string): string {
  const approvalRule =
    stageId === "06_approval"
      ? "\n## Approval Requirements\nNever approve on Stacy's behalf. Record approve or reject as an immutable event.\n"
      : "";

  return `# ${stageId}

## Inputs
- Layer 0: ../../../AGENTS.md
- Layer 1: ../../CONTEXT.md
- Layer 3: ../../../_config/
- Layer 4: ../artifacts/

## Process
${purpose}

## Outputs
- Write human-readable Markdown or JSON artifacts into ./output/
- Append public-safe execution events to ../../events.jsonl

## Verify
- Confirm outputs match the mission objective.
- Confirm no secret values are written to artifacts or events.
- Confirm filesystem access stayed inside MAXX_ICM_ROOT.

## Allowed Skills
- Load only skills selected by the trusted MAXX registry.

## Token Budget
- Default stage ceiling: 8,000 input tokens.
${approvalRule}`;
}

export async function createIcmRun(input: {
  root: string;
  missionId: string;
  objective: string;
  operatorId: string;
}) {
  const runId = `run-${randomUUID()}`;
  const runPath = resolveInsideRoot(input.root, path.join("runs", runId));
  const stagesPath = path.join(runPath, "stages");
  const artifactsPath = path.join(runPath, "artifacts");
  await mkdir(stagesPath, { recursive: true });
  await mkdir(artifactsPath, { recursive: true });

  for (const [stageId, purpose] of STAGES) {
    const stagePath = path.join(stagesPath, stageId);
    await mkdir(path.join(stagePath, "output"), { recursive: true });
    await writeFile(path.join(stagePath, "CONTEXT.md"), stageContract(stageId, purpose), "utf8");
  }

  const createdAt = new Date().toISOString();
  const manifest = {
    version: 1,
    runId,
    missionId: input.missionId,
    objective: input.objective,
    operatorId: input.operatorId,
    status: "working",
    currentStage: "01_intake",
    createdAt,
    stages: STAGES.map(([id]) => id),
  };

  await writeFile(path.join(runPath, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(
    path.join(runPath, "CONTEXT.md"),
    `# MAXX Mission ${input.missionId}\n\nObjective: ${input.objective}\n\nRun: ${runId}\n`,
    "utf8",
  );
  await writeFile(path.join(runPath, "events.jsonl"), "", "utf8");

  return {
    runId,
    runPath,
    stages: STAGES.map(([id, purpose]) => ({ id, purpose })),
    createdAt,
  };
}
