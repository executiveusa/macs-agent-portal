# Agent MAXX — FINAL CODE-TO-SERVER HANDOFF (2026-11-17)

**Status: SOURCE CODE DELIVERED, STAGING NOT VERIFIED, PRODUCTION NOT READY.**
**This dated addendum supersedes older “S5 needs code” statements below.**

**Final source safety correction:** At portal source commit `9facf2cd26a472689c159ac7190bbca8c9991b5f`, gated client-only draft proposals, independent review, dispatch and signed receipts are permitted with `MAXX_PRODUCTION_MUTATIONS_ENABLED=false` **only** when `MAXX_CLIENT_WORKSPACES_ENABLED=true` and `MAXX_CLIENT_DRAFT_EXECUTOR_ENABLED=true`. The Fastify production pre-handler uses an exact UUID-scoped route pattern; unscoped `/v1/missions`, generic Hermes, uploads, spending and other global mutations remain locked. Regression tests in `services/maxx-control-plane/test/client-mission-routes.test.ts` cover both permitted and refused paths. The full runtime still requires an independently reviewed NO-TOOLS worker profile and actual TLS staging validation. Do not enable global production mutations to make scoped draft missions work.

**Windows artifact reconciliation:** The current PR branch *already* contains `desktop/maxx-tauri/src-tauri/Cargo.lock` (109,726 bytes) and runs `cargo check --locked` in Windows CI; do NOT replace the committed Cargo.lock with the **older** archived Actions artifact. The archived ZIP from run `43956683023` is not authoritative over the newer branch content. Always test the locked file at current HEAD.

 Existing design, source registry, rollout gates and constraints below remain authoritative where compatible.

**One workstream, no new services:** canonical frontend/Fastify `executiveusa/macs-agent-portal` draft [PR #113](https://github.com/executiveusa/macs-agent-portal/pull/113); canonical MAXX ICM/SQL `executiveusa/maxx-migrations-agentic-systems` draft [PR #45](https://github.com/executiveusa/maxx-migrations-agentic-systems/pull/45), clean-history replacement candidate for existing #43. Old #43, dependent #44 and unrelated #29/#42 remain untouched. Fetch **live HEAD and CI**, never infer from these checkpoint SHAs:
- Portal implemented code SHA `09e87db16ca96478a0d9ec79d823c0bf7ee343fc` (before this handoff doc update). Previous exact-commit CI: main CI, Pups, release gates SUCCESS; locked Windows CI still in progress at checkpoint.
- Backend SQL implementation SHA `978e53d438280de8fe579416bd357e10ccd2575f`, then run packet docs updated at `26b78d933fd47e6279296bea1bd454456ea216c9`. Disposably executed SQL + test run [44156735096](https://github.com/executiveusa/maxx-migrations-agentic-systems/actions/runs/44156735096), job `134299352857`: PASS, with actual PostgreSQL 17 isolation, client mission/approval/receipt/replay/revoke, archive recovery and rollback logs. **Synthetic baseline, not a production schema clone.**

## Completed non-server implementation (inspect before changing)

**Portal PR #113**
- `services/maxx-control-plane/src/client-workspaces.ts`: active org+project membership and verified JWT-subject service RPC boundary, project-scoped chat, scoped mission inbox, propose, independent decision, one-time claim, dispatch ACK, dispatch quarantine, partial receipt and status.
- `services/maxx-control-plane/src/client-missions.ts`: existing Hermes adapter + existing ICM directory, not a new worker/orchestrator. Requires explicitly enabled workspace and client-executor flags; the global mutation flag stays false. Only the exact scoped mission POST routes and signed callback are exempted from the global production mutation lock; legacy/unscoped POST remains blocked. Worker identity and requested action originate from trusted SQL claim, never from untrusted browser content.
- `services/maxx-control-plane/src/client-mission-routes.ts`: human-only proposal/decision/start/poll, machine-only signed Instinct callback.
- `services/maxx-control-plane/src/instinct-a2a.ts`: HTTPS/no redirect, canonical HMAC-SHA256 (timestamp/delivery ID/body), 5-minute receive window, exact run ACK, no-model-authorization scope.
- `src/components/maxx/ClientMissionPanel.tsx` and `src/pages/MaxxChat.tsx`: existing chat-first UI with per-workspace approval request, separate reviewer decision, gated dispatch, poll and honest receipt state; optional manual reuse of latest typed or dictated chat objective.
- `desktop/maxx-tauri/src-tauri/Cargo.lock`: committed and independently checked Git blob `b687d359a3c8d3a258bb8f261038ee7c0ad0c13a` (109,726 bytes); checksum for this newer, exact compiled lock `355455d77eb40ac6afad0c5641019e17ea1b4082c826b2dcf4330d130e663446`. Windows workflow now runs `cargo check --locked` from clean checkout (verify exact HEAD CI).
- Added/updated isolated tests: `test/client-missions.test.ts`, `test/client-mission-routes.test.ts`, `test/instinct-a2a.test.ts`, browser endpoint and production-compose guards. No credentials committed.

**Backend PR #45**
- Existing five SQL review candidates: `PROPOSED-SCHEMA-AND-SEED.sql`, `CANONICAL-CLIENT-RPC-AND-RLS-CANDIDATE.sql`, `MANAGEMENT-RPC-CANDIDATE.sql`, `CLIENT-CHAT-PERSISTENCE-CANDIDATE.sql`, `CLIENT-APPROVAL-READ-CANDIDATE.sql`.
- **Sixth SQL candidate (NEW, review-only)** `docs/client-workspaces/CLIENT-ICM-EXECUTION-CANDIDATE.sql`: operates the existing `maxx.workflow_runs`, `action_proposals`, `approvals`, `evidence_receipts`, `audit_log`. Service-only RPCs `maxx_service_client_missions`, `_mission_propose`, `_mission_decide`, `_mission_claim`, `_mission_record_dispatch`, `_mission_dispatch_block`, `_mission_finish`, `_mission_status` (prefix `maxx_service_client`). Never create a second approvals database.
- `disposable-client-icm.assert.sql` extends the **real disposable PostgreSQL CI**: same-org cross-project refusal, unassigned identity, independent approval, no self-approval, expiry and one-time claim, blocked unconfirmed dispatch, external run ACK binding, durable partial receipts, replay/idempotency, project membership revoke and browser RPC ACL denial.
- **Only permitted v1 worker task: `client_draft_only`, `allowedTools:[]`, `budgetUsd:0`, `externalSideEffects:false`.** No live customer/source data, remote tools, external messages, spending, publishing, code execution or actual revenue claim. An internal draft can be accepted with an authentic remote run ID but is *not* independently verified commercial evidence.

### Exact API contract (use real authenticated test sessions)

All browser routes use JWT auth with verified Supabase UUID subject and service-role-only SQL behind the Fastify server:
- `GET /v1/client-workspaces/:projectId/missions` — read authorized scope and durable inbox.
- `POST /v1/client-workspaces/:projectId/missions` — body `{"missionId":"<UUID>","objective":"Draft internal Bunna note"}`; returns pending distinct-human approval.
- `POST /v1/client-workspaces/:projectId/missions/:missionId/decision` — `{"decision":"approved"}` or `rejected`; proposer cannot self-approve, must have same project reviewer role.
- `POST /v1/client-workspaces/:projectId/missions/:missionId/start` — claim+dispatch once using *server-stored* approved objective/policy. Reject if no audited no-tools executor. Return only real worker ACK, **not** completed work.
- `POST /v1/client-workspaces/:projectId/missions/:missionId/poll` — Hermes state and durable partial/failed evidence, no fabricated success. Instinct is callback-only.
- `GET /v1/client-workspaces/:projectId/missions/:missionId` — current ledger state, receipt reference, real dispatch ACK if present.
- `POST /v1/client-execution/instinct/events` — **machine only**, requires existing `x-maxx-event-key` plus separate `x-maxx-instinct-timestamp`, `x-maxx-instinct-delivery-id` and `x-maxx-instinct-signature:sha256=<HMAC>`. Payload has `actorId,projectId,missionId,deliveryId,externalRunId,outcome,summary`. HMAC covers canonical JSON and timestamp+delivery ID. Different keys for ingress and outbound. No permission to initiate or approve tasks from this webhook.

### REQUIRED SERVER-ONLY NEXT STEPS (S1–S6; do not ask owner to repeat repo context)

**S1 · Gateway and hosting**
- Verify Contabo/Coolify canonical MAXX container, pinned Hermes upstream and API. Earlier `https://api.thepaulieffect.com/maxx/health/live` returned 502; test actual TLS, path stripping, /health/live (200), /health/ready (dependency status), CORS, and reverse proxy logs. Never publish private Hermes port 8642.
- Verify Vercel preview-only `VITE_CONTROL_TOWER_API_URL` resolves to working **HTTPS** control plane; old Vercel env pointed to public HTTP IP and the frontend now **refuses** to send bearer JWT over HTTP. Fix preview first; never overwrite production env until owner approves release.
- Surface Windows Surface tablet is currently offline to Remote Desktop Commander; a real Windows installer/smoke/voice test needs the authorized device online, not assumed from CI.

**S2 · Choose the authorized identity and rehearse SQL**
- **Stop before any shared SQL:** previous prod notes mention Supabase `sxkemnqvxlgewrjplcag`, connected MAXX candidate uses `botanic-creations` `cyxdevcjycmffhmwxojh`. These are not interchangeable. Establish owner-approved canonical auth+DB, real Google subject UUID, allowed callback origins, and approved org/project memberships. No auto-enrollment.
- Independently inspect current grants/RLS/constraint compatibility, back up and RESTORE a **disposable clone of the real schema**. Run all SIX candidate SQL files in the exact order above. Two separately signed accounts must prove client read/write/approval/mission/revocation/archival boundaries on real schema. Independent DBA/security signoff and separate owner approval before live DDL.
- Apply approved versioned migration only once; verify seven clients and 28 prompt templates without invented source integrations or duplicated orgs.

**S3 · Runtime-specific no-tools enforcement and Instinct bridge**
- A prompt saying “no tools” is **NOT a security control**. Independently prove an isolated `client-draft-sandbox` Hermes profile exists with tools/MCP/terminal/browser/network egress disabled at the worker runtime **or** deploy the existing Instinct worker with equivalent enforced deny-all capabilities. No implicit privileges from a profile name. Verify pinned Hermes multiplex/profile conventions on the actual runtime.
- Configure vault-only secrets on the same canonical control plane (no printing/copying secret values): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STACY_ALLOWED_EMAILS`, `MAXX_HERMES_ENDPOINT`, `MAXX_HERMES_API_KEY`, `MAXX_INSTINCT_A2A_URL`, `MAXX_INSTINCT_A2A_KEY`, `MAXX_INSTINCT_INGRESS_KEY`, `MAXX_EVENT_INGEST_KEY`, `MAXX_EVENT_OPERATOR_ID`. Match URLs/identity and exact callback routes. Instinct receiver must validate the same canonical HMAC and return `202 {"accepted":true,"missionId":...,"projectId":...,"externalRunId":...}` after durable queue acceptance. No mock ACKs.
- **Activation order:** `MAXX_CLIENT_WORKSPACES_ENABLED=false`, `MAXX_CLIENT_DRAFT_EXECUTOR_ENABLED=false`, `MAXX_PRODUCTION_MUTATIONS_ENABLED=false` until schema+auth+worker checks pass. For isolated authorized staging only, enable after independent review, set `MAXX_CLIENT_DRAFT_EXECUTOR=hermes|instinct` and verified profile or keys. Test `MAXX_EMERGENCY_DISABLE=true` and rollback.
- Deliberately do NOT expand beyond internal drafts or read customer data through arbitrary connected tools without a later explicit tool-by-tool scope decision and independent acceptance tests.

**S4 · Actual Bunna happy path AND failure path**
- Authorized proposer logs in via Google, selects BUNNA, submits internal draft from chat/voice. A **different** authorized reviewer approves in the same client. Start returns an **actual** acknowledged Hermes/Instinct run ID and empty tools; poll or signed callback returns only a partial receipt with `human_review_required`. Review source and result manually before calling complete.
- Confirm workspace switch to CROWN AND CORE can't view/approve/dispatch Bunna; prove absent/stale/revoked user is blocked; replay of signed event does not forge an extra receipt; bad HMAC, expired timestamp, unexpected run ACK and wrong project are denied; disconnect after dispatch results in **blocked and needs human reconciliation** (never duplicate-dispatch).

**S5 · Deterministic acceptance**
- From clean checkout: `npm ci`, `npm run lint`, `npm test`, `npm run build`; separately `npm ci --prefix services/maxx-control-plane`, `npm run typecheck --prefix services/maxx-control-plane`, `npm test --prefix services/maxx-control-plane`, `npm run build --prefix services/maxx-control-plane`; Windows `cargo check --locked --manifest-path desktop/maxx-tauri/src-tauri/Cargo.toml`.
- Verify 320/390/768/1440 mobile/desktop, keyboard, PWA, voice/transcription/consent, every workspace, archive recovery >=30 days, approval and error states, authentic receipt and audit. Do not infer staging success from passing synthetic test or Vercel build.
- Independent security/UX reviewer must inspect two PRs and real runtime. Verify exact-HEAD CI, any queued MariaDB, dependency PR #44, and repository ownership in `CLIENT_SOURCE_REGISTRY.md`.

**S6 · Release and rollback**
- Keep draft PR #45 and #113 unmerged until reviewer proof. Release order after approval: backend reviewed migration+PR #45, then portal #113, then approved configuration/traffic rollout. **Never** merge broad #29/#42/#43 or apply unreviewed SQL. No automatic production deployment, money, publishing or client contact.
- Rollback first: disable `MAXX_CLIENT_DRAFT_EXECUTOR_ENABLED`, `MAXX_CLIENT_WORKSPACES_ENABLED`, and `MAXX_PRODUCTION_MUTATIONS_ENABLED`; restore prior app image/HTTPS route/Vercel variable; revoke newly exposed RPC grants if necessary; use reviewed **forward repair**, never restore permissive legacy RLS or delete customer data. Verify no unreviewed callback could be replayed.
- Only report **PREVIEW VERIFIED** with executed browser+runtime evidence; **PRODUCTION VERIFIED** requires an owner-approved release and successful real signed operator journey in the deployed production system.

**Proof packet to return:** canonical chosen DB and operator subject (redacted user identifiers as appropriate), exact repo SHAs, SQL review signoff and restored-clone test, chosen TLS URL/status, screenshots/session checks, provider run IDs (nonsecret), per-client isolation evidence, audit/receipt IDs, security reviewer, recovery proof, rollback test, blockers, cost and the exact release action requiring owner approval.

---

# Agent MAXX V3 — final server/operator execution handoff
**Date:** 2026-11-16 (America/Mexico_City)
**Status:** NON-SERVER CODE IMPLEMENTED IN DRAFT PRs; PRODUCTION NOT VERIFIED
**Mode:** Finish ONE existing Agent MAXX (MACS portal + existing MAXX Migrations ICM + existing Hermes/Instinct server). No new platform, queue, database, control plane, scheduler or frontend.

## 0. Pull exact refs; do not trust a stale SHA

- Portal/control plane: https://github.com/executiveusa/macs-agent-portal/pull/113 ; branch `feat/agent-maxx-multiclient-v3-20261113`, base `main`. Most recent code implementation SHA before this handoff: `fb54779c969e2694e7e50ce35344ecb76bb4cf68`. **Re-fetch actual HEAD and all CI after this documentation commit.**
- Backend SQL/ICM: https://github.com/executiveusa/maxx-migrations-agentic-systems/pull/45 ; branch `feat/maxx-client-workspaces-clean-history-20261115`, base `develop`, tested candidate HEAD `6b1c6ae92f7190a1ad73a2cbbec9b0f326e6e3c1`. This is the clean-history alternative to #43, but #43 is not yet closed. Dependent test-only #44 must be reconciled, not blindly merged.
- Existing commercial studio storefront `executiveusa/macsdigitalmedia` is NOT the portal/control plane; do not create another dashboard.
- Exact source registry: `docs/ops/loop-engineering/agent-maxx-v3/CLIENT_SOURCE_REGISTRY.md`; candidate repo links are **NOT** owner-approved integrations.

## 1. Non-server code delivered and evidence

### Portal + Fastify PR #113

- True project + verified Supabase JWT-subject membership read through server-only `public.maxx_service_client_workspaces` RPC.
- Seven-client selector, per-client operator-authored prompts, chat-first UI, protected settings, archive/restore controls and honest provenance/status.
- New `GET /v1/client-workspaces/:projectId/chat-history` and `GET /v1/client-workspaces/:projectId/pending-approvals`: human-only, exact project-scoped, private no-store responses and fail-closed RPC schema validation.
- New advisory `POST /v1/chat` path with client ID + immutable UUID exchange ID, atomic server-side storage of both messages, retrieval after refresh, no cross-client history, no legacy unscoped run IDs, **NO Hermes/tool execution**.
- Pending client approvals rendered **read-only**; no unsafe decision buttons until actual scoped execution proof.
- Enabled-mode global guard: non-admin client members cannot use unscoped legacy missions, approvals, control-tower bootstrap, strategy, browser, etc. Verified org owners/admins retain management access. Machine endpoints preserve existing explicit machine-auth rules but are NOT client-scoped.
- Production storage fails closed on missing/down Supabase; no synthetic success or volatile receipt. Production mutation kill switch stays in effect. Explicit scoped human advisory POST may persist a draft while other unsafe mutations remain disabled.
- Browser React Query caches partitioned by authenticated user and project; auth transitions clear cached client history/approvals and global bootstrap.
- Tests `services/maxx-control-plane/test/client-workspaces.test.ts` include service RPC parsing, auth/error/machine denials, cross-client history, approval read denial, legacy-run rejection, global API bypass, production kill-switch restrictions.

### Backend SQL PR #45

Review-only proposals in this exact order:
1. `docs/client-workspaces/PROPOSED-SCHEMA-AND-SEED.sql` — 7 clients, 28 operator templates, project membership and 30-day archive requests.
2. `docs/client-workspaces/CANONICAL-CLIENT-RPC-AND-RLS-CANDIDATE.sql` — restrictive existing project + parent/child isolation, scope read.
3. `docs/client-workspaces/MANAGEMENT-RPC-CANDIDATE.sql` — service-only create, three-step archive, restore and audit.
4. `docs/client-workspaces/CLIENT-CHAT-PERSISTENCE-CANDIDATE.sql` — append-only per-user/per-project messages, idempotent exchange, list/record service RPC.
5. `docs/client-workspaces/CLIENT-APPROVAL-READ-CANDIDATE.sql` — service-only per-project pending approval summaries; **does not approve or execute**.

- CI `MAXX client boundary gates` from #45 exact code SHA `6b1c6ae...` passed including **disposable PostgreSQL 17 two-user project RLS, approval isolation, chat persistence and revocation, archive/restore and full transaction rollback**. Node static/negative controls also pass. This is an approximate synthetic baseline, **not** an independent security review on the real database.
- CI Linters, Semantic Commits and Patch passed at that SHA; general Frappe Server (Postgres) was skipped, MariaDB was queued, do not claim whole backend integration passed.
- No shared Supabase SQL executed in this non-server slice.

### Windows Rust artifact (source completed)

- The exact branch includes **committed** `desktop/maxx-tauri/src-tauri/Cargo.lock` (109,726 bytes; Git blob `b687d359a3c8d3a258bb8f261038ee7c0ad0c13a`). The clean Windows CI workflow runs `cargo check --locked`, not unconstrained Cargo regeneration. Do NOT overwrite this with the earlier archival ZIP, whose hash differs.
- Remains server/device-side: verify current exact-HEAD Windows CI, produce a signed/approved installer candidate if required, and execute Windows 11 launch, microphone and keyboard/screen-reader acceptance on an authorized device. Remote Desktop Commander last reported the Surface offline.
- Neither a successful Rust check nor a build artifact proves a working microphone, real Google login or safe operator desktop runtime.

## 2. Server and real-account ONLY actions, strict execution order

### S1 — public HTTPS control-plane origin
- Inspect current Contabo/Coolify service and health for Fastify on private port 8788, Hermes private port 8642, reverse proxy Caddy prefix strip, TLS and Cloudflare tunnel/DNS.
- At prior direct verification `https://api.thepaulieffect.com/maxx/health/live` returned 502. Existing Cloudflare A DNS `api.thepaulieffect.com -> 31.220.58.212` is NOT proxied; remote tunnel `agent-maxx-bff` healthy but not proven to route MAXX. Do NOT switch DNS blindly (existing auth/rest/storage routes share the tunnel).
- Prove public HTTPS `GET /maxx/health/live` returns 200 JSON; `GET /maxx/health/ready` reflects actual Supabase/model dependencies; approved CORS and auth negatives; no public Hermes port or secrets. Record request IDs, service image SHA, origin logs and rollback.

### S2 — choose ONE canonical auth/DB identity, with owner approval
- Older deployed Vercel production configuration and old production ledger refer to Supabase `sxkemnqvxlgewrjplcag`; V3 PR/connected backend refer to `botanic-creations` `cyxdevcjycmffhmwxojh`. This is a **data ownership and cutover question**, not proof that older production is wrong.
- Branch-specific Vercel preview variables were created only for V3 `cyxdevcjycmffhmwxojh` and HTTPS MAXX API, leaving production environment untouched.
- Authorize exact operator Google user `auth.users.id` from a real session and provider, callback/redirect allowlist, email allowlist, active org role and assigned project role. Never derive an owner from email alone, auto-enroll or copy auth users between projects.
- Confirm current database before migration: at last read V3 MAXX had zero org memberships, one internal project, no project_memberships and zero V3 policies.

### S3 — actual-schema migration with independent reviewer
- Snapshot connected project's real `maxx` schema, RLS, indexes, role grants, foreign keys, views, definer functions, existing org-wide policies, public `maxx_approvals`, agent snapshot, action-proposal joins and all client data; inspect existing migrations.
- Take and independently restore a *disposable clone* backup before any live DDL. Rehearse the five SQL candidates **in order** on a real-schema clone, not just the synthetic fixture; two distinct signed principals: Alice/Bob, wrong project, wrong org, stale/revoked JWT, NULL project, child tables, public RPC grants and historical surfaces. Check archived recoverability >=30 days and no hidden destructive purge.
- Produce a versioned, non-destructive reviewed migration with explicit forward-repair/rollback; independent DBA/security signoff and owner release approval BEFORE applying to shared database.
- Apply reviewed migration ONCE through a controlled connection; confirm 7 workspace rows, 28 prompts, expected grants/RLS, scoped chat + approval RPCs; create only owner-approved memberships and log receipt. Keep all historic customer data intact.

### S4 — set runtime/auth boundaries safely
- Set `SUPABASE_URL` and server-side `SUPABASE_SERVICE_ROLE_KEY` to the approved same project, `STACY_ALLOWED_EMAILS` and exact permitted HTTPS origins in secure server env (never print secrets).
- Keep `MAXX_CLIENT_WORKSPACES_ENABLED=false` until S3 pass. Then selectively enable verified client mode. Keep `MAXX_PRODUCTION_MUTATIONS_ENABLED=false` during draft-only rollout: scoped advisory draft POST is explicitly allowed without enabling arbitrary missions/spending. Keep emergency kill switch tested.
- Prove authorized browser `/dashboard` Google login, identity claims, seven switcher, reload-persistent chat, read-only pending approvals, membership revoke, archived restore, and negative access to legacy global routes for non-admin clients.

### S5 — REAL existing ICM + Instinct/FastAPI + Hermes, NOT a new runner
- Existing client-mode chat intentionally does not call Hermes or execute tools. Extend the current MAXX ICM authority so a server-verified project + operator + allowed tools + source references passes all the way to the approved executor. Do not treat model text or projectId in requests as authority.
- Implement authenticated, per-project Instinct/FastAPI ingress/reply signatures, replay protection, idempotency keys, persisted approval state, bounded budgets, worker identity, result receipts and error reconciliation. Reuse existing Paperclip/Hermes/ICM; no new message bus or second approval store.
- Never enable sending customer messages, spending, publishing, deploying, merging PRs, deleting records, or external data reads without action-specific human approval and source ownership verification.
- Confirm exact repo/domain/DB owner and allowed scopes for each of the seven client candidates (see registry); don't automatically wire candidate repositories. Non-connected sources must display unavailable, not zero or a fabricated report.
- Execute one authorized real Bunna ICM workflow (draft -> approval -> actual connected source -> result -> receipts) and a denied cross-client replay; measure time or cash value against a real baseline, do not invent receipts.

### S6 — verified release and rollback
- Authenticated independent visual tests 320/390/768/1440 (mobile overflow, keyboard, ARIA, voice allow/deny, notifications, settings, archive/restore, user-switch and cross-tenant history).
- Reproducible Windows `Cargo.lock` + `cargo check --locked`, installer artifact and Windows 11 launch/safety test.
- Verify ALL G1–G12 in `GATES.md`; exact SHA on frontend/backend/runtime, independent security and UX reviews, backup recovery, owner-approved rollout, production HTTP auth E2E and real Bunna receipt.
- Merge dependency order **reviewed backend PR #45 first, frontend PR #113 second**, never bulk-merge #43/#44/Dependabot. No force push, rewritten history, direct default-branch edits or secret logging.
- Rollback: first disable `MAXX_CLIENT_WORKSPACES_ENABLED` and client executor capabilities; revert app revision; revoke newly exposed RPC execute if necessary; **do not restore org-wide permissive RLS**. Recover DB only from reviewed forward-repair / verified restore while preserving live data.

## 3. Definition of DONE and final response

Do not return `DONE` until same-sha proof supports: verified login, seven active and authorized clients, each scoped chat reload, read-only real client approvals, authorized task approval + execution through existing ICM/Instinct/Hermes with durable audit, real Bunna commercial result, protected responsive UI and Windows artifact, release/rollback verification. Include links to exact PRs, review signatures, CI runs, external health check, database tests, deployment/commit ID, Bunna evidence, risks, rollback, and owner approval receipt. If approval is required, request it once with exact scope and keep app safely disabled; don't pretend a code mock equals production.

**Hard boundary:** this document is execution-ready handoff, NOT permission to mutate production automatically. No new app or loops.
