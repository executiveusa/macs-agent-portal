#!/usr/bin/env node
// Phase 14: local filesystem backup of the MAXX ICM workspace root.
// No cloud storage credentials (S3/R2/etc.) are configured in this
// environment, so `location` is always a local path. Swap in an upload
// step once a real storage target and credentials exist - the manifest
// shape (backupRecordSchema in packages/shared-types) does not need to
// change.
//
// No encryption is applied: encrypting at rest requires a real key
// management system, and faking it with an ad-hoc key stored next to the
// backup would be worse than no encryption at all. encryption_key_id is
// left null and callers must not treat these backups as encrypted.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";

function parseArgs(argv) {
  const args = { root: undefined, out: undefined, ttlHours: 24 * 30 };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--root") args.root = argv[++i];
    else if (argv[i] === "--out") args.out = argv[++i];
    else if (argv[i] === "--ttl-hours") args.ttlHours = Number(argv[++i]);
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
  const root = path.resolve(args.root ?? process.env.MAXX_ICM_ROOT ?? path.join(repoRoot, "workspaces/maxx"));
  const outDir = path.resolve(args.out ?? path.join(repoRoot, "backups"));

  if (!existsSync(root)) {
    console.error(JSON.stringify({ ok: false, error: `Backup root does not exist: ${root}` }));
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });

  const id = randomUUID();
  const createdAt = new Date();
  const archiveName = `${id}.tar.gz`;
  const archivePath = path.join(outDir, archiveName);

  execFileSync("tar", ["-czf", archivePath, "-C", path.dirname(root), path.basename(root)]);

  const sizeBytes = statSync(archivePath).size;
  const checksum = sha256File(archivePath);
  const expiresAt = new Date(createdAt.getTime() + args.ttlHours * 3_600_000);

  const record = {
    id,
    created_at: createdAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    location: archivePath,
    size_bytes: sizeBytes,
    checksum,
    encryption_key_id: null,
    verified_at: null,
    restore_tested_at: null,
    components: [{ name: "icm_workspaces", status: "complete" }],
  };

  writeFileSync(path.join(outDir, `${id}.json`), `${JSON.stringify(record, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, record }, null, 2));
}

main();
