#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "Z");
}

const repoRoot = git(["rev-parse", "--show-toplevel"]);
process.chdir(repoRoot);

const id = process.argv.includes("--id") ? process.argv[process.argv.indexOf("--id") + 1] : timestamp();
const checkpointPath = resolve(repoRoot, ".maxx-rollback", id);
const head = git(["rev-parse", "HEAD"]);
const branch = git(["branch", "--show-current"]) || "detached";
const checkpoint = {
  checkpoint: id,
  path: `.maxx-rollback/${id}`,
  rollback: `.maxx-rollback/${id}/rollback.sh`,
  head,
  branch,
  createdAt: new Date().toISOString(),
};

mkdirSync(checkpointPath, { recursive: true });
writeFileSync(resolve(checkpointPath, "checkpoint.json"), `${JSON.stringify(checkpoint, null, 2)}\n`);
writeFileSync(resolve(checkpointPath, "created-files.json"), "[]\n");
writeFileSync(
  resolve(checkpointPath, "rollback.sh"),
  `#!/usr/bin/env bash
set -euo pipefail
node scripts/maxx-rollback.mjs --checkpoint ${id}
`,
);
writeFileSync(resolve(repoRoot, ".maxx-rollback", "latest.json"), `${JSON.stringify(checkpoint, null, 2)}\n`);

console.log(JSON.stringify({ ok: true, checkpoint }, null, 2));
