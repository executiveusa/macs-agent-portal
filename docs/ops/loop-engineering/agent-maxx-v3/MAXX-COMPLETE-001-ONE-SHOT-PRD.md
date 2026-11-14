# AGENT MAXX — ONE-SHOT PRODUCT COMPLETION PRD
**Document ID:** MAXX-COMPLETE-001  
**Status:** IMPLEMENTATION CONTRACT / NOT PRODUCTION APPROVED  
**Mode:** Brownfield: finish the existing product, do not create another platform  
**Canonical frontend/control plane:** `executiveusa/macs-agent-portal` PR #113  
**Canonical backend/ICM:** `executiveusa/maxx-migrations-agentic-systems` PR #43; reconcile other open backend PRs by dependency, not bulk merging  
**Existing public studio storefront:** `executiveusa/macsdigitalmedia` — no duplicate frontend  
**Execution model:** one bounded completion mission, separate concurrent reviews where safe, no hourly-loop dependency  
**Owner-gated actions:** authorizing live users, real client-source accounts, production SQL migrations, external agent writes, and release  
**Last baseline:** portal PR #113 code commit `11855fbc627cb81b345ee7f2e5630e8df6d855e6` passed four workflows; subsequent documentation commit `5e29f88d6373bda17372dcffac648029d33a5908` independently also passed four workflows. No deploy / security proof implied.

## 1. Mission and business outcome

**Finish ONE Agent MAXX product**, not an isolated demo. An authorized operator signs in via Google, selects one of seven client workspaces, uses text/voice chat to inspect permitted source-backed information, drafts and authorizes real ICM missions, receives durable approvals/alerts, sees audit receipts, controls connections and agent permissions, and safely archives/restores a client. Switching companies must never mix histories, sources, permissions, pending approvals, or agent execution. A verifiable Bunna outcome is the first commercial acceptance case, using the actual authorized Bunna source only after approved connection.

**Definition of finished:** G1–G12 all pass on the same reviewed release revision, independent security and UX signoffs are recorded, rollback/recovery are tested, approved rollout succeeds, and authenticated production tests confirm the exact SHA. CI green alone is NOT completion.

**Non-goals:** a new CRM, second DB or control tower, new SaaS billing, speculative connectors, invented company repos, bulk Dependabot merges, autonomous spending/publishing/customer contact, a second agent system, nonconsensual permissions, or replacing the approved chat-first design.

## 2. Grounded baseline (verified vs unverified)

### Existing draft implementation
- PR #113: approved seven-client switcher, chat-first responsive interface, Settings drawer, guarded `/v1/client-workspaces` and scoped advisory-only chat, local per-client chat isolation, backend control plane with service-role RPC proxy, guarded create/archive/restore UI and API candidates.
- Shared Supabase project `botanic-creations` (`cyxdevcjycmffhmwxojh`): read-only inspection showed **one** existing `maxx.projects` project, **zero** `maxx.memberships`, **no** `maxx.project_memberships` table, **zero** V3 isolation policies. Existing project-linked SELECT policies admit org membership, not per-project membership. These are actual release blockers; do not apply draft SQL yet.
- PR #43 holds **review-only** schema/seed, restrictive RLS/service RPC, and management/archive SQL candidates. None were authorized or applied on shared production.
- Windows Tauri manifest changed from tauri 2.11.5 to 2.12.5 and tauri-build 2.6.3 to 2.7.4; exact-code Windows `cargo check`, Hermes bridge, frontend, control plane, SDK, release gates passed. **No checked-in Cargo.lock** and no proof of a Windows installer or launch.
- Existing seven named company labels are confirmed; their exact repositories, DBs, records, connection permissions and owners are **not** confirmed. Keep CLIENT_SOURCE_REGISTRY.md as source of truth, not guesses.
- Authenticated browser visual review, actual Google operator session, persistent tenant-scoped conversations, real scoped approvals, source-backed ICM execution, live FastAPI/Instinct ingress, complete voice path, notifications, 30-day archive restore and production verification remain unproven.

### Known PR/dependency state
- Portal PR #113 is draft; backend PR #43 is draft. Preserve existing branches and identify any concurrent work before mutating.
- Reinspect all changed file SHA, current CI and merge conflicts before each batch. No stale HEAD conclusions.
- `STATE.md`, `GATES.md`, `GRAPH.md`, `BAR.md`, `ROLLBACK.md`, `AGENT_HANDOFF.md`, `CLIENT_SOURCE_REGISTRY.md` are mandatory context. This PRD is the terminal-scope contract; no plan sprawl.

## 3. Product specifications and acceptance

### P0: identity, tenancy, database
1. Identify operator through actual Google OAuth -> validated Supabase JWT subject -> active org membership -> active `maxx.project_memberships` for the requested project. Resolve actual operator UUID through a human-confirmed sign-in. No membership by matching email/name, no frontend-only authorization, no default org/client.
2. Instantiate PR #43 SQL **only** in a disposable Postgres/Supabase environment first, using appropriate versioned migration path, SQL review, ordered dependencies and backup/restore. Verify schema structure/grants/function ownership/search_path; check `SECURITY DEFINER` and exposed `public` RPC EXECUTE restrictions. Compare preexisting org-wide policies and MAXX app call sites.
3. Independently test two authenticated human test principals (Alice/Bob) with assigned A/B organizations/projects and no access to each other's tenant. Prove forbidden read, insert, update, delete, approval, run_steps parent join, messages, external refs, audit records, RPC access and REST endpoints fail closed, even on missing/expired/revoked membership; owner/admin access explicitly modeled and reviewed. Test cross-tenant parent-ID injection, project ID substitution, project-switch races, session/cache contamination, invalid JWTs, stale claims and service-role isolation.
4. Cover legacy `public.maxx_approvals`, `maxx_agent_snapshot` and other existing cross-project APIs. Do not claim a scoped zero when historical unscoped approvals remain unassessed. Identify and remediate bypass paths before real client data exists.
5. Verify non-destructive backup/restore and rollback by restoring a disposable clone. Do not revert to insecure permissive RLS as a rollback. Release requires independent DBA/security review receipt and owner approval.
**Pass:** independently repeatable SQL test transcript with expected and observed rows/errors, security signoff, no critical unscoped data path, and safe operator onboarding receipt.

### P0: functional seven-client workspace
1. Seven labels: CROWN AND CORE, THP FLOORING, BUNNA RESTAURANT, MACS DIGITAL MEDIA, ASC3ND, 3X PLUMBERS, TANGLES AND LOCS. Reuse seeded 4 template prompts per company (28). They remain labeled operator templates until actual evidence/source connections exist.
2. Client switching scopes prompt context, conversation identifiers, saved messages, notes, approvals, connection state, agent tasks, memory retrieval, source citations and notification counts by `organization_id + project_id + user_id`. Tenant enforcement persists server-side after refresh and across browsers; clear stale React Query/session cache on identity and workspace changes.
3. Persistent authorized chat: conversations/messages stored in the **existing canonical data model** after inspecting existing stores and their policies; no second conversation store. Migrate old unscoped rows only via verified ownership mapping, otherwise quarantine, not silent cross-client adoption. Support history, rename/archive/search, error recovery and reconnection using existing primitives.
4. Optional dashboards remain behind Settings; main chat/voice first; no fake badges, approvals, sales, integration status or green health.
5. Add-client UI uses a real owner-only service path, name/slug validation, audit trail and unique keys. Archive uses exact start -> acknowledge -> exact-name -> archive with >=30 day restore, request cancellation, no hard deletion, blocked while running/awaiting approval, concurrent write-safe transitions and tested restoration.
**Pass:** live authenticated create/use/switch/reload/archive/restore sequence, true persistence, no information leak, 28 prompts in correct contexts.

### P0: authentic task execution + safety
1. Keep current MAXX control plane and MAXX Migrations ICM; inspect actual executors before integration. Client-scoped chat starts advisory-only and can promote a request to explicit human-reviewed mission with server-resolved tenant + source inventory + allowed tools + expiration/idempotency key.
2. Use narrow capabilities and per-client delegation; never let model text, client-selected ID, injected source docs, old workspace state or external FastAPI worker override operator scope. Separate planning, approval, execution, observation, audit. No automatic money movement, message sends, public publish, code merges, deploys, or arbitrary data access.
3. Persist mission state and approvals (proposed/awaiting approval/approved/rejected/running/completed/failed/cancelled) with actor, timestamp, source, policy decision, receipts, reconciliation after crash/retry and truthful pending counts. Exactly-once effects where supported, otherwise idempotent deduplication and explicit reconciliation; timeouts and dead-letter visibility.
4. Integrate **existing** authenticated Instinct/FastAPI ingress only after discovering actual service and maintained repo; require signed/authenticated project-scoped requests, replay protection, worker result identity, delivery receipts and revocation. Do not add a parallel queue/daemon.
5. Demonstrate one safe, authorized **real** Bunna ICM mission from request -> plan -> owner approval -> executor -> verified source/result -> chat receipt, with a denied cross-client replay. If real source permission unavailable, report release gate blocked; a mock alone does not pass.
**Pass:** source-backed mission receipt, safety negative tests, persistent approvals and audit record, restart/retry/revocation proof.

### P1: operator UX, voice, connections and notifications (required before product completion)
1. Restore existing chat-first appearance, hero/logo, Settings drawer and responsive design. Authenticated screenshots at 320, 390, 768 and 1440 px; mouse/touch/keyboard focus/screen reader; contrast, aria labels, trap/restore focus, overflow, loading/error/empty states, long text, offline/retry. Approved design must not drift.
2. Voice controls: permission prompt, mic denial/revocation, muted/unavailable state, transcription, visible recording state, pause/stop, cancellation, text fallback and per-client isolation. Use existing audio stack; no invented always-on microphone.
3. Notifications: real persisted per-project approval and agent status updates, badge count source and semantics, unread/read acknowledgement, recovery after refresh; no invented 24/7 delivery or zero pending from disconnected source.
4. Connections panel: connected/disconnected/degraded/revoked, verified scopes, source provenance, last checked, owner, safe read-only health test, revocation and audit; never display server keys.
5. Real Second Brain retrieval must be per-project authorized, traceable to source and revocable; no global memory bleed.
**Pass:** independent 320/390/1440 accessibility + protected UI comparison and voice disabled/allowed flows; persisted notifications and revocation verified.

### P1: Windows thin client
1. Generate/check in reviewed `desktop/maxx-tauri/src-tauri/Cargo.lock` using trusted build environment. Change Windows CI to `cargo check --locked`; verify clean checkout. Maintain Tauri core/build compatibility.
2. Produce testable signed/unsigned-as-labeled Windows installer artifact from approved CI, confirm launch, secure TLS-only URL behavior, logout/session handling, updates (or explicitly unsupported), code-signing status and no embedded secrets.
**Pass:** clean Windows build, installer smoke test on Windows 11, endpoint-negative test, artifact SHA/rollback recorded.

### P1: real client source registry
For EACH of the seven clients, confirm exact canonical repo or explicitly `NONE`, ownership, main branch, deployment, DB/schema, connected accounts, allowed read/write actions, custodian, source permissions and revocation. Use owner-provided URLs as *leads to verify*, not blanket access. Don't infer mappings from similar repo names. Missing source means that client displays `not connected` and cannot claim live analytics or missions. Gate full seven-client external integration on each owner's permissions; do not invent outcomes.
**Pass:** 7/7 client registry rows independently verified or explicitly acknowledged as `NOT CONNECTED`; no false badges.

## 4. Build order — complete slices, no new manager

| Slice | Concrete deliverable | Dependency | Proof |
|---|---|---|---|
| S0 | Snapshot exact SHAs, branch/PR diff, CI, API/schema map, changed-file owners, baseline; record test oracle | Existing PRs | Proven baseline + rollback |
| S1 | Reviewed versioned SQL, disposable DB/RLS two-principal integration suite and backup/restore | S0 | Independent security signoff; **no shared DB mutation** |
| S2 | Real operator OAuth, verified memberships, 7-client scoped persistent chat/prompts/archival | S1 | Two user end-to-end tenant negatives + live auth |
| S3 | Existing ICM mission/approvals/evidence + authenticated Instinct bridge | S2 | Real approved Bunna mission and cross-tenant denial |
| S4 | Voice/notifications/connections/Second Brain with scoped state | S2–S3 | Persisted, revocable, audited live flows |
| S5 | Windows Cargo.lock, reproducible installer; 320–1440 responsive/a11y gauntlet | S0–S4 | Independent Windows and UI proof |
| S6 | Review/merge in dependency order, owner-authorized DB migration and staged release, exact SHA verification, rollback rehearsal | S1–S5 | Production E2E + reviewer + owner approval |

S1 and S5 Windows lockfile may proceed in parallel in isolated files. No multiple writers to same SQL or frontend code. If a P0 fails, repair it before advancing release; do not deliver another summary instead of code.

## 5. Test matrix — independently checked or fail

- Auth: genuine Google session, expired/revoked session, unknown identity, missing org membership, missing project membership, role downgrade, frontend-supplied foreign ID.
- RLS: Alice/Bob cross-client read/write/delete/create, child-table joins, projects, histories, approvals, audit/source, RPC with anon/authenticated/service, revoked role and historical data; errors and data absence independently proved.
- Tasks: plan/draft, approve/deny/expire, run once, worker unavailable, retry/restart, forged callback, duplicate message, cross-client callback, trace/receipt, cancelled run.
- Client lifecycle: seeded 28 prompts, add validation, duplicate slug, archive 3 confirmed steps, blocked active runs, cancel, restore within 30-day window, expired restore denied, no deletion.
- UI: 320/390/768/1440, keyboard/ARIA, screen reader, mic denial, chat cancel, tab refresh, multi-browser session switch, notifications, source citations and offline states.
- Infrastructure: clean `npm ci`, lint, TS checks, unit/integration, Vite, control-plane, SDK, dependency audit, Hermes bridge, Windows `cargo check --locked`, installer smoke; no fail/skipped required jobs.
- Security: code review for SQL ownership/definer/grants, CORS, SSRF, prompt injection, secrets in build, key expiry/revocation, logging redaction, per-client tool permissions, backup/restore and migration impact.

Each check records exact commands, expected/actual, exit codes, input fixture and SHA; do not mark `PASS` from mocks or written code alone. Treat untested production integrations as BLOCKED.

## 6. Release acceptance / non-negotiable stop conditions

**G1–G5:** verified clean install, lint, unit/build and control plane CI. Current green CI is a baseline only; rerun after changes.  
**G6:** authorized real Google OAuth and correct Supabase project + session subject.  
**G7:** two-user project and org isolation incl. approval/mission/source paths and access revocation.  
**G8:** seven client records, 28 prompts, add/archive/restore 30-day recovery and persistent scoped histories on approved DB.  
**G9:** verified authenticated Instinct/FastAPI external ingress with receipts.  
**G10:** one human-approved real ICM Bunna mission with verifiable source-backed outcome.  
**G11:** protected preview visual/accessibility/voice testing, including mobile, with independent reviewer.  
**G12:** security signoff, backup/rollback proof, explicit owner authorization, production exact-SHA authenticated verification.

**Block merge / feature-flag activation / release if:** unknown operator UUID, unreviewed SQL/privileged functions, any cross-tenant path, invented source integrations, failed mandatory workflow, unresolved secret exposure, no independent reviewer, no rollback, or user approval missing for live migration/deployment.

## 7. Execution handoff — implement instead of re-planning

Read this PRD plus existing `STATE.md`, `GRAPH.md`, `GATES.md`, `BAR.md`, `ROLLBACK.md`, `AGENT_HANDOFF.md`, and both live PRs. Do not create new repos or planning systems. Start with S0 then S1; independently test the candidate SQL in an isolated disposable environment before touching `botanic-creations`. Work every remaining slice and create/update PRs with runnable test evidence. Use exact identities, real sources, and human approvals when needed. If blocked by owner data, continue every unblocked implementation slice and leave ONE precise owner request with purpose, minimum required detail, and safe default; never fake success.

At the end deliver **one release report** containing: code and merge SHAs, all test artifacts and reviewer signoffs, exact production URL/SHA, real Bunna mission receipt, verified client source register, external connections and revoked/disabled states, safety/rollback results, any owner approvals, and clear `PRODUCTION VERIFIED` or `NOT READY`. Nothing is “done” based on frontend CI, mocked mission, a preview deployment or an automation schedule.

**Commercial proof:** one owner-authorized Bunna workflow demonstrably saves time or produces a measurable approved business outcome, with baseline, result, receipt and no fabricated revenue claim.

**Safety rollback:** keep `MAXX_CLIENT_WORKSPACES_ENABLED=false` until release; if deployment fails disable new flows, revoke new RPC exposure, revert app revision, preserve restrictive RLS and all customer data; database recovery only through separately verified non-destructive migration strategy. No automatic broad RLS rollback.


## 8. Whole-product gap audit and integrated completion mandate — 2026-11-14

This section supersedes any interpretation of the work as an indefinite sequence of documentation or static-test micro-slices. Execute S1–S6 as ONE integrated product completion effort, retaining independent reviews and owner release gates. Reuse this PRD and the existing PR branches; do not create another scheduler, controller, PRD, CRM, or agent runtime.

### Exact repository baseline at audit

- Portal PR #113: open draft, HEAD `0ffc200d16d98998190e03ad5f5e4d9f6b6fb129`, targets `main`; 24 changed files. Earlier four CI workflows passed; fresh exact-HEAD proof must be retrieved before declaring any current check green.
- Backend PR #43: open draft, HEAD `d6f570a7aa80703b41d98c787a2ef5f2987b6b5a`, targets `develop`; 7 changed files. Candidate SQL is review-only. Static boundary tests are not runtime RLS evidence.
- Backend dependent PR #44: open draft, HEAD `8ac34d70cbd7e0d484d24cd1c9245f30e4e6f48b`, targets PR #43 branch. Its Frappe upstream-branch checkout repair progressed CI into an ERPNext v16 migration failure (`Unknown column 'letter_head_for' in 'SET'`); do not bypass the migration tests.
- Backend PR #29: open draft, broad 96-file Revenue Capture integration against `develop`; NOT a prerequisite to merge wholesale. PR #42: open draft, 19-file restaurant cash/POS integration against `develop`; reconcile only required interfaces and independent proof.
- Existing `ops/reports/MAXX-FULL-STACK-WIRING.md` identifies an isolated MAXX Hermes runtime, Fastify control plane, Supabase browser authentication, private dashboard, CLI/MCP API, and contract-level approval/voice features. This architecture is reused, not rebuilt. Reported runtime proofs are incomplete.
- Existing production Supabase project `cyxdevcjycmffhmwxojh` must remain untouched pending approved reviewed migrations. Existing STATE.md records org-wide SELECT policy and no project-membership table as an isolation blocker; independently reverify before release.

### Critical path, explicit ownership, proof, and exit

| Track | Reuse and deliver | Blocking proof | Done when |
|---|---|---|---|
| A — Security/database | PR #43 SQL and existing Supabase model; disposable isolated Postgres fixture and versioned migration | Two real JWT subjects, role/revocation tests, legacy approval and child-record bypass tests, backup/restore, independent SQL review | Every unauthorized cross-client read/write/RPC fails closed; authorized reads work; reversible migration approved |
| B — Identity/chat | Portal #113 switcher, Fastify control plane, Supabase Auth, existing canonical conversation storage | Real Google OAuth and owner-approved subject mapping; persistence across refresh and device; client-switch cache tests | Stacy/team see only authorized clients, chat, prompts, approvals and history |
| C — ICM execution | Existing Hermes/ICM engine, mission and approval APIs; Instinct/FastAPI adapter | Authenticated source-backed Bunna read-only mission, explicit human approval, replay/cross-tenant rejection, audit receipt, restart/retry | One complete, traceable approved request-to-result workflow |
| D — Operator product | Existing responsive chat, browser voice, Settings, notification and connection surfaces | Mobile/desktop protected screenshots, accessibility, mic deny/revoke, source-backed connection health, archive restore at >=30 days | Real usable chat/voice-first seven-workspace product without fake data |
| E — Delivery | Existing CI, Tauri, deployment and rollback scripts | Clean npm ci, full required CI, checked-in Cargo.lock, Windows smoke, live staging and rollback rehearsal, independent review | Exact release SHA deployable and independently preview verified |

### Execution sequence and stop rules

1. Freeze the current exact SHA/dependency graph and capture full mandatory CI job statuses and failure logs. Treat PR #44 patch failure and backend lint/semantic failures as tracked release blockers, not a reason to redesign MAXX.
2. Build and run the disposable Postgres migration and two-identity isolation suite first. If there is no safe disposable environment, prepare executable Docker/Supabase-local fixtures and CI instructions; request only the exact infrastructure authorization needed. Never use shared botanic-creations as a test fixture.
3. Integrate scoped identity, persistence, approvals and ICM execution across the existing frontend/backend in compatible branches. Apply least-privilege server checks at every API/tool boundary, not only UI filters. Keep feature flags off in production.
4. Finish seven-workspace operator UX, voice and connection-state truthfulness; test archive/recovery and Windows build as part of the same release candidate. Source registry may state NOT CONNECTED where permission is absent.
5. Require independent security and UX review, then request owner approval for any live database migration or release. After approval, run staged deployment, rollback rehearsal and authenticated production tests. No automatic merge or deployment.

### Integrated acceptance run (one evidence bundle)

A passing bundle must include: exact portal/backend SHAs; clean CI and complete log links; isolated SQL migration and rollback transcripts; two-identity deny/allow matrix including legacy APIs; real OAuth subject and membership evidence without secrets; 7/7 workspace switching and 28 labeled prompts; durable chat and approvals; 30-day archive recovery; authenticated Instinct ingress; a consented real Bunna ICM mission and verifiable receipt; voice/keyboard/mobile results; Windows artifact and launch evidence; reviewer signoffs; and explicit owner release approval. Missing any item means NOT READY or, after an independently verified protected staging journey, PREVIEW VERIFIED — never PRODUCTION VERIFIED.

### Owner-dependent inputs (ask only when actually blocked)

Authorized Stacy/team Google identities and approved roles; permission to create/use a disposable Supabase test project if no local equivalent; verified source custodians and authorized connections for each company; independent security reviewer; and separate written production migration/deployment authorization. Never request or paste raw secrets into GitHub issues or PRs.

**Commercial acceptance:** first authorized Bunna task yields a measured operational result and source-backed receipt, without inventing revenue. **Rollback:** revert isolated app commits and disable flags; retain restrictive database policies and preserve records. **Decision:** finish existing MAXX, no duplicate systems.
