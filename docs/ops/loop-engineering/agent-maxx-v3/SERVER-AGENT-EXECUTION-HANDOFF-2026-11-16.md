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

### Windows Rust artifact

- Windows `cargo check` and follow-up `cargo check --locked` pass on current CI; the repo does NOT yet check in `desktop/maxx-tauri/src-tauri/Cargo.lock`.
- The verified GitHub Actions artifact `maxx-windows-cargo-lock`, ID `14270953199`, run `43956683023`, expires 2026-11-23, includes ONLY `Cargo.lock` (109,726 bytes; SHA-256 `8d74bfbaba308c6194c09e2d45489aa8d9feeefae8b13f6f70ad30b6f591277a`).
- On a GitHub-authenticated checkout: download that exact artifact (or newer and independently verify); extract the single file; compare SHA-256; commit as `desktop/maxx-tauri/src-tauri/Cargo.lock` to PR #113 branch; change first Windows CI check from `cargo check` to `cargo check --locked`; rerun clean-checkout Windows CI and installer smoke test. Never blindly regenerate versions or update Tauri packages. **Do not try to copy a ZIP into the source tree.**
- Current GitHub Contents connector writes UTF-8 files but could not securely transfer this archived binary to a branch; a second authorized Composio GitHub connection returned HTTP 401 and was NOT used to write. This remains a trusted Git checkout action, not a conceptual blocker.

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
