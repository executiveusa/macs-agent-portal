# MAXX Platform: Risk Register

**Last Updated**: 2026-07-10  
**Owner**: Architecture & Security Teams

---

## Critical Risks (Phase 0 → Phase 5)

### R1: Hermes Integration Not Yet Implemented
**Severity**: HIGH  
**Impact**: Agent work currently delegated to Pi executable; no true reasoning engine  
**Mitigation**: Phase 5 implements Hermes adapter with proper sandboxing  
**Owner**: AI-agent engineer  
**Target Completion**: Phase 5

### R2: Voice System Not Ready
**Severity**: HIGH  
**Impact**: `/v1/voice/*` endpoints return 503; browser fallback only  
**Mitigation**: Phase 9 implements push-to-talk with local STT/TTS  
**Owner**: Voice systems engineer  
**Target Completion**: Phase 9

### R3: Production Mutations Not Locked
**Severity**: HIGH  
**Impact**: Production can be modified without explicit approval (missing `MAXX_PRODUCTION_MUTATIONS_ENABLED` gate)  
**Mitigation**: Implement feature flag; default to false; require env var override  
**Owner**: DevOps & security engineer  
**Target Completion**: Phase 3

### R4: No Backup or Restore Validation
**Severity**: HIGH  
**Impact**: If VPS fails, ICM workspaces, knowledge, and audit trail could be lost  
**Mitigation**: Phase 14 implements encrypted backups + monthly restore testing  
**Owner**: DevOps engineer  
**Target Completion**: Phase 14

### R5: Hostinger + Coolify Deployment Untested
**Severity**: HIGH  
**Impact**: Cannot move to production VPS without validation  
**Mitigation**: Phase 13 includes staging smoke tests; Phase 18 adds CI/CD validation  
**Owner**: DevOps engineer  
**Target Completion**: Phase 13

---

## High Risks (Phase 1 → Phase 10)

### R6: Multi-Tenant Isolation Not Validated
**Severity**: HIGH → **CORRECTED (Phase 17)**
**Impact**: This entry assumed a multi-organization schema exists. It doesn't: `supabase/migrations/*.sql` has no `organizations` table and no `organization_id` column anywhere. `is_control_tower_operator()` intentionally grants full read/write access to every row to *any* allowlisted operator (checked against `STACY_ALLOWED_EMAILS`) — this is a single-organization, shared command-center design (the MACS Digital Media team), not multi-tenant SaaS. There is no cross-tenant boundary to leak across, because there is no second tenant.
**Mitigation**: No code change needed for the system as currently scoped. If multi-organization support is ever added (a real `organizations` table, `organization_id` columns, per-org RLS), *that* work must ship with its own isolation tests before going live — this entry should be reopened at that point, not before.
**Owner**: Architecture (re-scope if multi-org is ever built)
**Target Completion**: N/A unless multi-org support is added to the roadmap

### R7: No Browser Mutation Execution Validation
**Severity**: MEDIUM  
**Impact**: Browser action approval gates created but execution not yet verified  
**Mitigation**: Phase 10 completes browser worker implementation  
**Owner**: Backend engineer  
**Target Completion**: Phase 10

### R8: Supabase RLS Policies Not Full-Scanned
**Severity**: MEDIUM → **PARTIALLY RESOLVED (Phase 15)**
**Impact**: RLS in place but security audit not completed
**Mitigation**: Phase 15 code-reviewed every RLS policy and every route (see SECURITY_REVIEW.md). **Still open**: policies have never been exercised against a live, reachable Postgres instance — this environment's configured Supabase host is not network-reachable. Live multi-tenant isolation testing remains Phase 17.
**Owner**: Security engineer
**Target Completion**: Phase 15 (review) / Phase 17 (live testing)

### R9: No Service-to-Service Authentication
**Severity**: MEDIUM
**Impact**: Hermes, voice, memory, and browser are currently in-process adapters within the control-plane process (Phases 5, 6, 9, 10), not separate deployable services, so there is no network boundary between them to authenticate across yet. This risk becomes real the moment any of them is split into its own deployed service (e.g., a real Hermes runtime reached over HTTP/MAXX_HERMES_ENDPOINT).
**Mitigation**: Not yet implemented. Add token-based auth on the control-plane→adapter direction when the first adapter is actually deployed as a separate service.
**Owner**: Backend & security engineer
**Target Completion**: Whenever the first adapter is split out (not yet scheduled)

### R10: No Secret Rotation Procedure
**Severity**: MEDIUM  
**Impact**: If a provider key or Supabase service-role key is exposed, no documented rotation process  
**Mitigation**: Phase 15 (Security) documents incident response and rotation  
**Owner**: Security engineer  
**Target Completion**: Phase 15

---

## Medium Risks (Phase 1 → Phase 8)

### R11: Dashboard Never Showed Real-Time Data
**Severity**: MEDIUM  
**Impact**: Mission events may lag; dashboard refresh frequency not optimized  
**Mitigation**: Phase 11 optimizes event polling and WebSocket connections  
**Owner**: Frontend engineer  
**Target Completion**: Phase 11

### R12: No Approval Timeout
**Severity**: MEDIUM  
**Impact**: Pending approvals could hang indefinitely if operator doesn't act  
**Mitigation**: Phase 4 adds approval expiration (default: 24 hours)  
**Owner**: Backend engineer  
**Target Completion**: Phase 4

### R13: Skill Registry Is Static
**Severity**: MEDIUM  
**Impact**: Only trusted skills from hardcoded list; no dynamic skill loading  
**Mitigation**: Phase 3 clarifies this is intentional; dynamic loading deferred to Phase 20+  
**Owner**: Architecture  
**Target Completion**: Phase 3 (document) / Phase 20+ (implement)

### R14: No Graceful Shutdown
**Severity**: MEDIUM → **RESOLVED (Phase 15)**
**Impact**: Control plane killed in-flight requests; long-running ops could break
**Mitigation**: `server.ts` now handles SIGTERM/SIGINT by calling `app.close()` (drains in-flight requests, runs the scheduler/browser `onClose` hooks already registered in `app.ts`) before exiting. **Correction**: this was originally logged as done in Phase 3 in this document; it was not actually implemented until this Phase 15 audit found the gap. Verified live: started the server, sent SIGTERM, confirmed "Received shutdown signal" → "Shutdown complete" in the logs and a clean process exit.
**Owner**: Backend engineer
**Target Completion**: Phase 15 (corrected from the original Phase 3 claim)

### R15: No Rate Limiting on Chat/Skills
**Severity**: MEDIUM  
**Impact**: Malicious operator or leaked key could spam endpoints and exhaust quota  
**Mitigation**: Phase 3 adds rate limits (configurable per endpoint)  
**Owner**: Backend engineer  
**Target Completion**: Phase 3

---

## Low Risks (Phase 1 → Phase 5)

### R16: Large Frontend Bundle
**Severity**: LOW  
**Impact**: 944 KB main bundle; 293 KB gzipped (acceptable but not optimal)  
**Mitigation**: Phase 11 adds lazy route loading  
**Owner**: Frontend engineer  
**Target Completion**: Phase 11

### R17: Lint Warnings in UI Components
**Severity**: LOW  
**Impact**: Fast-refresh warnings in shadcn components (not production bugs)  
**Mitigation**: Non-blocking; ignore or suppress in ESLint config  
**Owner**: Frontend engineer  
**Target Completion**: Phase 11 (optional)

### R18: No Health Check on External Providers
**Severity**: LOW  
**Impact**: If Groq or OpenRouter goes down, control plane doesn't detect until request fails  
**Mitigation**: Phase 3 adds periodic health check jobs; Phase 18 adds CI monitoring  
**Owner**: Backend engineer  
**Target Completion**: Phase 3

### R19: Docker Image Versions Not Pinned
**Severity**: LOW  
**Impact**: Control plane Dockerfile uses `node:latest`; could introduce breaking changes  
**Mitigation**: Phase 13 pins to specific Node.js LTS version  
**Owner**: DevOps engineer  
**Target Completion**: Phase 13

### R20: No Dependency Scanning in CI
**Severity**: LOW  
**Impact**: Vulnerable dependencies not detected in CI  
**Mitigation**: Phase 18 adds `npm audit` and Snyk scanning  
**Owner**: DevOps & security engineer  
**Target Completion**: Phase 18

### R21: Backups Are Not Encrypted at Rest
**Severity**: HIGH
**Impact**: Phase 14's backup/restore is real and verified (checksum + restore-tested end-to-end), but no KMS/vault is configured in this environment, so backups are plain `tar.gz` files. Anyone with filesystem access to the backup location can read mission objectives, approval history, and any other ICM workspace content.
**Mitigation**: Choose and wire a real encryption approach (age, sops, or a cloud KMS) before storing backups anywhere other than a local, access-controlled disk. `backupRecordSchema.encryption_key_id` is already `null` rather than fabricated, so this gap is visible in every backup manifest rather than hidden.
**Owner**: Security & DevOps engineer
**Target Completion**: Before any backup leaves local disk (not yet scheduled — requires an owner decision on KMS provider)

---

## Resolved Risks (Baseline)

✅ **Path Traversal** – Prevented by validation in icm-runtime.ts  
✅ **Authentication Bypass** – JWT verified on every protected route  
✅ **Operator Impersonation** – Allowlist checked case-insensitively  
✅ **CORS Misconfiguration** – Strict origin allowlist in place  
✅ **Plaintext Secrets in Logs** – Redaction configured in Fastify logger  
✅ **Unrestricted Browser Mutations** – Approval gates in place  

---

## Risk Scoring Matrix

| Likelihood | Impact | Score | Action |
|-----------|--------|-------|--------|
| High | Critical | 20+ | **STOP** work; unblock immediately |
| High | High | 16-19 | **URGENT** phase dependency |
| High | Medium | 12-15 | **HIGH** priority in phase |
| Medium | High | 12-15 | **HIGH** priority in phase |
| Medium | Medium | 8-11 | **MEDIUM** priority; schedule |
| Medium | Low | 6-7 | **LOW** priority; defer if needed |
| Low | Medium | 6-7 | **LOW** priority; defer if needed |
| Low | Low | 1-5 | **TRACK** only; accept if impossible |

---

## Risk Mitigation Strategy

### By Phase

**Phase 0**: Audit existing system, document baseline (this document)  
**Phase 1**: Lock down CLAUDE.md, agent definitions; R3 & R9 partially addressed  
**Phase 3**: Service authentication, feature flags, rate limiting (R3, R9, R14, R15)  
**Phase 4**: Approval timeouts, expiration (R12)  
**Phase 5**: Hermes integration validates safe agent execution (R1)  
**Phase 6**: Memory system optional; R2 still pending (R2)  
**Phase 8**: Scheduler framework; no new blocking risks  
**Phase 9**: Voice infrastructure deployed behind feature flag (R2)  
**Phase 13**: Deployment hardening, Docker pinning, monitoring (R5, R19)  
**Phase 14**: Backup & restore validation (R4)  
**Phase 15**: Security audit, threat model, incident response (R8, R10)  
**Phase 17**: R6 reclassified (no multi-org schema exists; see corrected entry) — focus shifted to end-to-end lifecycle testing  
**Phase 18**: CI/CD & dependency scanning (R5, R20)  

### By Owner

**Security Engineer**:
- R8, R10 (Phase 15)
- R6 (Phase 17)
- R20 (Phase 18 co-owner)

**Backend Engineer**:
- R3, R9, R14, R15 (Phase 3)
- R12 (Phase 4)
- R18 (Phase 3)

**DevOps Engineer**:
- R5, R19 (Phase 13)
- R4 (Phase 14)
- R20 (Phase 18 co-owner)

**AI-Agent Engineer**:
- R1 (Phase 5)

**Voice Engineer**:
- R2 (Phase 9)

**Frontend Engineer**:
- R16, R17 (Phase 11)
- R11 (Phase 11)

---

## Acceptance Criteria for Phase Completion

Each phase must close associated risks before proceeding:

- **Phase 0**: ✅ Risk register created; baseline documented
- **Phase 1**: R3 design documented; R9 service auth architecture defined
- **Phase 3**: R3 implemented; R9 keys generated and stored; R14/R15 added; R18 health checks running
- **Phase 5**: R1 Hermes adapter integrated; tests pass
- **Phase 9**: R2 voice endpoints functional; degradation tested
- **Phase 13**: R5 Coolify deployment works; R19 Docker pins version; monitoring live
- **Phase 14**: R4 backup tested; restore succeeds
- **Phase 15**: R8 RLS audit passed; R10 rotation procedure documented
- **Phase 17**: End-to-end mission lifecycle test passes (R6 reclassified as not applicable to the current single-organization schema)
- **Phase 18**: R20 CI scanning enabled

---

## Escalation Path

**If a risk becomes **CRITICAL** before scheduled mitigation**:

1. Immediate Slack notification to architecture lead
2. Emergency meeting within 1 hour
3. Possible phase re-ordering or emergency patch
4. Document decision in DECISIONS.md

**Examples of escalation trigger**:
- Hermes security vulnerability discovered (R1 → Phase 5 scheduled but urgent)
- Supabase RLS bypass found (R8 → Phase 15 scheduled but urgent)
- Backup failure discovered in production (R4 → Phase 14 scheduled but critical)

---

## Review Schedule

This register is reviewed:
- **Weekly** during active development (Phases 1-18)
- **Before each phase start** (risk assessment)
- **After each phase completion** (risk closure verification)
- **Quarterly** post-launch (new operational risks identified)
