# MAXX Platform Security Review (Phase 15)

**Status**: Initial audit complete. Reviewed against `.claude/rules/security.md` checklist.
**Scope**: `services/maxx-control-plane` as of this commit (Phases 0-15).
**Method**: Direct code review of every route in `src/app.ts` and every module it imports. No automated scanner was run (none is configured in this repo yet — see Gaps).

---

## Checklist Results

| Item | Status | Evidence / Notes |
|---|---|---|
| All secrets in environment, not in code | ✅ Pass | `config.ts` reads everything from `process.env`; grepped `src/` for hardcoded key-shaped strings, found none. |
| RLS policies reviewed and tested | ⚠️ Partial | RLS policies exist on every table (`supabase/migrations/*.sql`) but have never been tested against a live Postgres instance in this environment — no reachable Supabase instance here (see CURRENT_STATE.md). Policy SQL was reviewed by eye, not executed. |
| Approval gates cover all high-risk actions | ✅ Pass | `approval-policy.ts` classifies all 12 browser action types; mutating ones require approval. Skills use `skill.approvalPolicy`. Owner-strategy `forbiddenActions` adds a hard 403 block *before* the approval path, so a forbidden action can never even reach the approval queue. |
| Operator allowlist configured | ✅ Pass | `auth.ts` / `auth-policy.ts`; case-insensitive, requires `STACY_ALLOWED_EMAILS`. |
| CORS origins correct | ✅ Fixed during this audit | Found during Phase 11 manual verification: `@fastify/cors` was not allowing `PUT` (default method list didn't include it), so the first PUT route (`/v1/strategy`) was silently broken cross-origin. Fixed by explicitly listing `methods: ["GET","POST","PATCH","PUT","DELETE"]`. Regression test added (`api.test.ts`, "CORS preflight allows PUT"). |
| No path traversal vectors | ✅ Pass | `path-policy.ts` / `icm-runtime.ts` resolve and validate every workspace path stays inside `MAXX_ICM_ROOT`. `browser-worker.ts` takes URLs, not filesystem paths, so it isn't a traversal vector. `memory-indexer.ts`'s `FileMemoryIndexer` writes to a single configured path, not operator-controlled paths. |
| Audit logging on all consequential actions | ⚠️ Partial | Mission creation/update, approvals, skill runs, Hermes run start/cancel all call `store.addEvent`. **Gap**: `/v1/browser/sessions` (automatic actions), `/v1/memory/documents`, and `/v1/strategy` do not log to the events table. Logged as a follow-up item below. |
| Rate limits configured | ✅ Fixed during this audit | Originally only `chat`/`skills`/`missions` were rate-limited. Found during this review that `hermes`, `memory`, `browser`, and `strategy` (all mutating, operator-triggered routes) had none. Added limiters for all four (`rate-limiter.ts`); 4 new regression tests. |
| Graceful degradation for missing providers | ✅ Pass | Every adapter (Hermes, voice, browser, memory) has an honest "unavailable" fallback that states the exact missing config rather than hanging or fabricating success — verified in each phase's tests. |
| Error messages don't leak sensitive info | ✅ Pass | Global error handler (`app.setErrorHandler`) returns a generic 500 and logs the real error server-side only; Zod validation errors return field-level issues but never secret values. |
| Logs redact secrets automatically | ✅ Pass | Fastify logger `redact: ["req.headers.authorization", "body.audio", "*.apiKey"]`. |
| JWT verification enabled on protected routes | ✅ Pass | Global `preHandler` hook runs `authenticate()` for every route except `/health/*`. |
| Database backups encrypted and tested | ⚠️ Partial (honest gap, not fixed) | Phase 14 backups are checksum-verified and restore-tested (real, run end-to-end), but **not encrypted at rest** — no KMS/vault is available in this environment to do so honestly. `encryption_key_id` is explicitly left `null` in every backup manifest rather than faking encryption. **This must be addressed before backups containing real operator/mission data are stored anywhere other than a local, access-controlled disk.** |
| Incident response plan documented | ✅ Fixed during this audit | `SECURITY_INCIDENT.md` created (see below). |
| Security contact and escalation path defined | ⚠️ Partial | Placeholder in `SECURITY_INCIDENT.md` — no real on-call contact exists yet; requires an operator/owner decision, not something this audit can fabricate. |

---

## Findings Fixed During This Audit

1. **CORS PUT bug** (`app.ts`) — see table above. Real bug, found via live browser verification in Phase 11, not a code-review guess.
2. **Missing rate limits on 4 mutating routes** (`app.ts`, `rate-limiter.ts`) — Hermes run creation, memory writes, browser sessions, strategy updates could previously be called at unlimited rate by an authenticated operator. Now capped consistently with the existing chat/skills/missions pattern.

## Findings Documented But Not Fixed (Require a Decision, Not Just Code)

1. **Backup encryption** — needs a real KMS/vault choice (age, sops, cloud KMS) before this is safe to close. Tracked as RISK in RISK_REGISTER.md.
2. **Audit logging gaps** on `/v1/browser/sessions` (automatic actions), `/v1/memory/documents`, `/v1/strategy` — low severity (these are read/write-your-own-data or read-only-classified actions, not consequential-action-on-behalf-of-others), but should be closed before Phase 17's audit-trail-immutability tests are written, so the trail is actually complete.
3. **RLS policies untested against a live database** — this environment cannot reach the configured Supabase host (`SUPABASE_URL` present but unreachable network-wise; confirmed via a live connection timeout during Phase 11 verification). Multi-tenant isolation testing (per `.claude/rules/security.md`) requires a reachable test database and is deferred to Phase 17.
4. **No automated dependency/secret scanning configured** (`npm audit` was run manually per-dependency-add, but nothing runs it in CI yet — see Phase 18).

## Out of Scope for This Audit

- Penetration testing (requires a running, network-reachable deployment).
- Third-party dependency CVE audit beyond `npm audit` (ran clean at time of each `npm install` in this session).
- Physical/infrastructure security of the eventual Coolify/VPS host (owner's responsibility, not code-reviewable).

---

**Reviewed by**: Claude Sonnet 5 (ZTE execution agent), this session.
**Next review**: Before production deployment (Phase 13 `MAXX_PRODUCTION_MUTATIONS_ENABLED=true` gate), and again at Phase 17 (multi-tenant isolation testing against a live database).
