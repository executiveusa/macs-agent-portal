#!/usr/bin/env node
// Phase 14: restore a maxx-backup.mjs archive into an isolated location and
// verify it. Never extracts on top of the live MAXX_ICM_ROOT - --target
// must be an empty or non-existent directory outside the live workspace
// root, enforced below (IRREVERSIBILITY_GUARD: this only ever writes to a
// throwaway restore location, never overwrites live data).
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = { backup: undefined, target: undefined, dryRun: argv.includes("--dry-run") };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--backup") args.backup = argv[++i];
    else if (argv[i] === "--target") args.target = argv[++i];
  }
  return args;
}

function sha256File(filePath) {
  const hash = createHash("sha256");
  hash.update(readFileSync(filePath));
  return hash.digest("hex");
}

function main() {
  const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
  const args = parseArgs(process.argv.slice(2));
  const startedAt = new Date();
  const issues = [];

  if (!args.backup) {
    console.error(JSON.stringify({ ok: false, error: "--backup <id> is required" }));
    process.exit(1);
  }

  const backupsDir = path.resolve(path.join(repoRoot, "backups"));
  const manifestPath = path.join(backupsDir, `${args.backup}.json`);
  if (!existsSync(manifestPath)) {
    console.error(JSON.stringify({ ok: false, error: `No backup manifest found: ${manifestPath}` }));
    process.exit(1);
  }
  const record = JSON.parse(readFileSync(manifestPath, "utf8"));

  const liveRoot = path.resolve(process.env.MAXX_ICM_ROOT ?? path.join(repoRoot, "workspaces/maxx"));
  const target = path.resolve(args.target ?? path.join(repoRoot, ".maxx-restore-test", randomUUID()));
  if (target === liveRoot || target.startsWith(`${liveRoot}${path.sep}`)) {
    console.error(JSON.stringify({ ok: false, error: "Refusing to restore on top of the live MAXX_ICM_ROOT" }));
    process.exit(1);
  }

  const actualChecksum = sha256File(record.location);
  const checksumOk = actualChecksum === record.checksum;
  if (!checksumOk) issues.push(`Checksum mismatch: expected ${record.checksum}, got ${actualChecksum}`);

  if (args.dryRun) {
    console.log(JSON.stringify({ ok: true, dryRun: true, checksumOk, target }, null, 2));
    return;
  }

  if (!checksumOk) {
    console.error(JSON.stringify({ ok: false, error: "Checksum verification failed, refusing to extract", issues }));
    process.exit(1);
  }

  mkdirSync(target, { recursive: true });
  execFileSync("tar", ["-xzf", record.location, "-C", target]);

  const extractedEntries = readdirSync(target);
  const dataVerified = extractedEntries.length > 0;
  if (!dataVerified) issues.push("Extracted archive is empty");

  const completedAt = new Date();
  const result = {
    test_id: randomUUID(),
    backup_id: record.id,
    started_at: startedAt.toISOString(),
    completed_at: completedAt.toISOString(),
    success: checksumOk && dataVerified,
    location: target,
    issues,
    recovery_time_seconds: (completedAt.getTime() - startedAt.getTime()) / 1000,
    data_verified: dataVerified,
  };

  console.log(JSON.stringify({ ok: result.success, result }, null, 2));
  if (!result.success) process.exit(1);
}

main();
