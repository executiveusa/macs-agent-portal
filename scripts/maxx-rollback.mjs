#!/usr/bin/env node
import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

function git(args, options = {}) {
  return execFileSync("git", args, { encoding: "utf8", stdio: options.stdio ?? ["ignore", "pipe", "pipe"] }).trim();
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    latest: args.includes("--latest"),
    checkpoint: args.includes("--checkpoint") ? args[args.indexOf("--checkpoint") + 1] : "",
  };
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

const args = parseArgs();
const repoRoot = git(["rev-parse", "--show-toplevel"]);
process.chdir(repoRoot);

const checkpoint = args.latest
  ? readJson(resolve(repoRoot, ".maxx-rollback", "latest.json"))
  : readJson(resolve(repoRoot, ".maxx-rollback", args.checkpoint, "checkpoint.json"));
const checkpointDir = resolve(repoRoot, checkpoint.path);
const manifestPath = resolve(checkpointDir, "created-files.json");
const manifest = existsSync(manifestPath) ? readJson(manifestPath) : [];

git(["cat-file", "-e", `${checkpoint.head}^{commit}`]);

const plan = {
  targetBranch: checkpoint.branch,
  targetCommit: checkpoint.head,
  checkpointPath: checkpoint.path,
  createdPathsToRemove: manifest,
};

if (args.dryRun) {
  console.log(JSON.stringify({ ok: true, dryRun: true, plan }, null, 2));
  process.exit(0);
}

const safetyBranch = `maxx-rollback-safety-${new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "Z")}`;
git(["branch", safetyBranch], { stdio: "inherit" });
git(["reset", "--hard", checkpoint.head], { stdio: "inherit" });

for (const entry of manifest) {
  if (typeof entry !== "string" || !entry.trim()) continue;
  const normalized = entry.replace(/\\/g, "/");
  if (/^\.env(\.|$)/.test(normalized) || /(^|\/)public\/audio\//i.test(normalized)) {
    console.log(`Skipping protected path: ${entry}`);
    continue;
  }

  const absolute = resolve(repoRoot, entry);
  if (!absolute.startsWith(repoRoot)) {
    console.log(`Skipping outside-repo path: ${entry}`);
    continue;
  }

  if (existsSync(absolute)) {
    rmSync(absolute, { recursive: true, force: true });
    console.log(`Removed task-created path: ${entry}`);
  }
}

console.log(JSON.stringify({ ok: true, safetyBranch, plan }, null, 2));
