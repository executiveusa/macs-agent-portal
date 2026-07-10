# MAXX Platform Operations Runbook

Concrete, copy-pasteable procedures for running MAXX day to day. For the "why," see `ARCHITECTURE.md` and `DECISIONS.md`. For security incidents specifically, see `SECURITY_INCIDENT.md`.

Every command below was actually run in this session unless marked `[UNVERIFIED]`.

---

## Local Development

### Start the control plane
```sh
cd services/maxx-control-plane
npm install
MAXX_DEV_AUTH_BYPASS=true npm run dev
```
`MAXX_DEV_AUTH_BYPASS=true` skips Supabase JWT verification — every request is treated as the first allowlisted operator (or `local-stacy`/`stacy@local` if none configured). Never set this in production (`config.devAuthBypass` is force-disabled when `NODE_ENV=production`).

### Start the frontend
```sh
npm install
echo "VITE_CONTROL_TOWER_API_URL=http://127.0.0.1:8787
VITE_MAXX_DEV_AUTH_BYPASS=true" > .env.local
npm run dev
```

### Run the full test suite
```sh
npm run test                                       # frontend
npm run test --prefix services/maxx-control-plane   # control plane
npm run test --prefix packages/client-sdk           # client SDK
```

### Enable optional subsystems locally
All default off. Set any combination:
```sh
MAXX_HERMES_ENABLED=true MAXX_HERMES_ENDPOINT=https://...
MAXX_MEMORY_ENABLED=true
MAXX_SCHEDULER_ENABLED=true
MAXX_BROWSER_ENABLED=true          # uses local Playwright by default
MAXX_VOICE_ENABLED=true MAXX_STT_ENDPOINT=... MAXX_TTS_ENDPOINT=...
```

---

## Backup & Restore

### Create a backup
```sh
npm run maxx:backup
# or: node scripts/maxx-backup.mjs --root workspaces/maxx --out backups --ttl-hours 720
```
Writes `backups/<uuid>.tar.gz` + `backups/<uuid>.json` (manifest with SHA-256 checksum). **Not encrypted** — see RISK_REGISTER.md R21 before storing anywhere other than a local, access-controlled disk.

### Restore and verify a backup
```sh
npm run maxx:restore -- --backup <uuid>
# extracts to .maxx-restore-test/<uuid>/ by default (never the live root)
```
Refuses to run if the checksum doesn't match, or if `--target` resolves inside the live `MAXX_ICM_ROOT`.

### Dry-run a restore (checksum only, no extraction)
```sh
node scripts/maxx-restore.mjs --backup <uuid> --dry-run
```

---

## Emergency Procedures

### System-wide emergency disable
```sh
export MAXX_EMERGENCY_DISABLE=true
# restart the control plane
```
Every mutating route (`POST`/`PATCH`/`PUT`/`DELETE`) immediately returns 503. Read-only routes keep working. Log the trigger in `SECURITY_INCIDENT.md`.

### Graceful shutdown
```sh
kill -TERM <control-plane-pid>
```
Drains in-flight requests, runs the scheduler/browser-worker cleanup hooks, then exits. Verified in this session: logs show `"Received shutdown signal, draining in-flight requests"` → `"Shutdown complete"` before a clean exit. `Ctrl+C` (SIGINT) does the same.

### Git checkpoint / rollback (code, not data)
```sh
node scripts/maxx-checkpoint.mjs --id <label>     # snapshot current HEAD
node scripts/maxx-rollback.mjs --latest --dry-run # preview
node scripts/maxx-rollback.mjs --latest           # execute (creates a safety branch first)
```

---

## CI/CD

### Check the latest CI run for a branch
Use the GitHub MCP tools (`mcp__github__actions_list` with `list_workflow_runs`, filtered by branch) rather than polling the UI. `.github/workflows/ci.yml` runs on every push/PR to `main`: frontend, control-plane, client-sdk, dependency-audit.

### If control-plane or client-sdk tests fail only in CI, not locally
Check for shell-dependent test globs first — this bit us in Phase 18. GitHub Actions runs npm scripts under `bash -e {0}` **without** `globstar` enabled; a pattern like `test/**/*.test.ts` silently fails there even though it works in an interactive shell with globstar on. Reproduce locally with the exact invocation before debugging further:
```sh
bash -e -c 'npm run test'
```

### `npm audit` findings
`dependency-audit` job is report-only (`continue-on-error: true`) per RISK_REGISTER.md R20 — check the job log for findings; nothing blocks merge yet. Triage before flipping it to blocking.

---

## Deployment `[UNVERIFIED — no Docker daemon in the environment this runbook was written in]`

```sh
docker build -t maxx-control-plane services/maxx-control-plane/
docker run -p 8787:8787 \
  -e SUPABASE_URL=... -e SUPABASE_SERVICE_ROLE_KEY=... \
  -e STACY_ALLOWED_EMAILS=... \
  maxx-control-plane
```
Coolify: see `compose.coolify.yml` and `COOLIFY_MIGRATION.md`.

Before flipping `MAXX_PRODUCTION_MUTATIONS_ENABLED=true`:
1. All tests green (locally and in CI).
2. `SECURITY_REVIEW.md` reviewed for anything that's changed since.
3. A recent backup exists (`npm run maxx:backup`) and has been restore-tested.
4. Explicit operator/owner approval obtained — this is a guardrail in `CLAUDE.md`, not optional.

---

## Common Diagnostics

### "MAXX control plane is unreachable" in the dashboard
1. Is the control plane process running? `curl http://127.0.0.1:8787/health/live`
2. Check `VITE_CONTROL_TOWER_API_URL` matches where it's actually listening.
3. Check CORS: `CONTROL_TOWER_ALLOWED_ORIGINS` must include the frontend's origin exactly.

### Bootstrap returns 500
Check the control plane's logs for a Supabase connection error. If `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are set but unreachable, `store.ts` will throw rather than silently falling back to `MemoryStore` — this is intentional (a configured-but-broken database should be loud, not silently degrade to in-memory data). Unset both env vars to force `MemoryStore` for local debugging.

### A feature route returns 503 with a `reason` field
That's the intended graceful-degradation behavior, not a bug — check the `reason` string, it names the exact missing flag/credential (e.g. `"MAXX_HERMES_ENABLED is false"`).

---

## References
- `docs/maxx-platform/SECURITY_REVIEW.md`
- `docs/maxx-platform/RISK_REGISTER.md`
- `SECURITY_INCIDENT.md`
- `COOLIFY_MIGRATION.md`
- `packages/client-sdk/README.md`
