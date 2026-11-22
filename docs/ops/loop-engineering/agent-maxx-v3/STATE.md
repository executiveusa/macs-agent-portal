# Agent MAXX V3 — ICM loop state

mode: brownfield
product: Agent MAXX / MAXX Migrations existing 3-repository federation
owner: MACS / authorized operator
status: NOT READY
stage: 07_verify
next_stage: 07_verify
canonical_portal: https://github.com/executiveusa/macs-agent-portal/pull/113
canonical_backend: https://github.com/executiveusa/maxx-migrations-agentic-systems/pull/45 (preferred reviewed candidate; #43 retained until independent decision)
current_slice: COMPLETE-001 non-server slice: persistent scoped chat, read-only client approvals, legacy global endpoint deny, verified repo candidates, and disposable RLS integration tests committed; production still blocked.
source_revision_portal: 644783ff0e2062e89235b30f5e07e494efc48c84 (four CI workflows pass on that code SHA; later UI status/doc commits require their own exact SHA)
latest_build_ci: PASS on code SHA 11855fbc — CI #43549628131, MAXX Pups CI #43549628182, MAXX release gates #43549628111, MAXX Gap Closure CI #43549628191 all COMPLETED SUCCESS. Windows thin-client cargo check and Hermes bridge both passed. This proves CI only, not production functionality. Subsequent doc commits require distinguishing source SHA from documentation SHA.
next_stage: 07_verify — reproducible checked-in Cargo.lock and locked Windows rerun, disposable DB RLS two-principal denial test with independent reviewer, operator Google login proof, protected preview mobile/desktop gauntlet, authorized real agent execution, production approval.
shared_supabase: botanic-creations / cyxdevcjycmffhmwxojh
shared_database_changed: false
production_modified: false

## Durable loop command

Read this STATE, GATES, BAR, GRAPH, ROLLBACK and current PRs. Compare actual CURRENT HEAD and CI. Execute one READY graph node using the existing repo and smallest reversible diff. Then run the actual executable gates, obtain independent review, update evidence and this STATE, and continue only to the next unblocked stage. Do not restart another manager, write duplicate mission runners, or claim success from code presence.

## Current primary blockers

1. **Backend isolation** — SQL PR #43 remains review-only. On connected shared Supabase, read-only metadata queries returned `maxx.memberships=0`, `maxx.projects=1`, no `maxx.project_memberships` table, and zero `maxx_v3_%` policies. Existing MAXX project-linked SELECT RLS uses org-wide `maxx.is_member(organization_id)`. No migration applied and no operator granted access. See https://github.com/executiveusa/maxx-migrations-agentic-systems/pull/43#issuecomment-6870700478
2. **Independent proof** — disposable database schema dry-run with two real test user identities and cross-client read/write/approval/run-step denial, plus rollback/restore proof; independent DBA/security signoff required before ANY shared DB change.
3. **Authentication + integration** — authorized operator identity, live Google OAuth and session claims, protected preview at 320/390/1440, real source-backed client agent delivery and approvals are unverified. No invention of identities or client repositories.
4. **Desktop reproducibility** — Windows `cargo check` has now passed after aligning `tauri = "=2.12.5"` and `tauri-build = "=2.7.4"` in code SHA `11855fbc`. The Rust Cargo.lock is still absent in repo. Generate/check in lock on trusted runner and use `cargo check --locked` for durable reproducibility.

## Run evidence — 2026-11-13 America/Mexico_City (continuation)

- Retrieved raw failing Windows GitHub Actions log from previous `MAXX Gap Closure CI` #43546823210; 27 errors in mixed pinned Tauri 2.11.5 / transitive 2.12.2 runtime dependencies.
- Committed one-file Rust manifest repair: https://github.com/executiveusa/macs-agent-portal/commit/11855fbc627cb81b345ee7f2e5630e8df6d855e6 ; rollback is to revert that commit.
- **Exact code SHA `11855fbc` verified all four GitHub CI workflows SUCCESS**, including Windows `Check Rust shell` and `hermes-bridge`: https://github.com/executiveusa/macs-agent-portal/actions/runs/43549628191
- Connected shared Supabase inspected using SELECT queries only. Baseline metadata proves current organization-wide access is NOT equivalent to client isolation. No DDL, production mutation, data release or role grant.
- Evidence posted on frontend PR #113 and backend PR #43. Preserve existing backend proposal as draft.
- G1-G5 have exact-code SHA CI evidence; Unlazy ledger still requires oracle verification. G6-G12 still unmet. Do not merge, deploy, or call production verified.

## Next safe action

Generate deterministic Cargo.lock from Windows, enable `--locked` and rerun. In parallel run approved SQL candidates in a truly disposable isolated DB and prove two-identity project isolation including legacy surfaces with independent reviewer. Then verify operator Google sign-in and the complete seven-client journey on the exact preview. No production rollout until owner approval, security signoff, and direct production verification.

## Run evidence — 2026-11-13 21:31 America/Mexico_City

- Exact PR #113 HEAD at start: `18f8e08b4fb635b28939fb049059fb14200162b6`. All four GitHub workflows completed SUCCESS (CI #43551614152, release gates #43551614015, Pups CI #43551614077, Gap Closure CI #43551614206). This is CI proof only, not production proof.
- **One reversible CI slice:** `.github/workflows/maxx-gap-closure-ci.yml` now uploads the actual Windows-generated `desktop/maxx-tauri/src-tauri/Cargo.lock` as a seven-day artifact, with missing-file failure, for independent review before checking the lockfile into source. Commit `9fe06fa1b6bf8078bb09e9bd826469b940e035bf`. No production or database change.
- **Gate remains open:** upload is not a checked-in lockfile, and `cargo check --locked` is not yet enforced. Wait for the new exact-HEAD Windows CI to complete, inspect the artifact, commit reviewed lockfile, change CI to `--locked`, and rerun. Do not claim this gate passed from YAML presence alone.
- Backend RLS, operator login, preview UX, real agent delivery, and client source registry remain blocked/unverified as recorded above. No new scheduler or control plane created.
- Rollback: revert `9fe06fa1` to remove the upload-artifact step; it changes CI evidence collection only.

## Run evidence — 2026-11-13 22:30 America/Mexico_City

- Exact PR #113 HEAD at start: `3337a2ae0ee22a7411a7f3a54e8b88386e9d7feb`; all four CI workflows COMPLETED SUCCESS: CI #43552140143, Pups #43552140234, release gates #43552140133, Gap Closure #43552140179.
- **Artifact independently downloaded and inspected:** Gap Closure run #43552140179 uploaded artifact ID `14096583693` (`maxx-windows-cargo-lock`, expires 2026-11-21T03:34:26Z). ZIP contains a single `Cargo.lock` (108042 bytes). Extracted lock SHA-256 `ac45c859bb8ca59f02f18e3cf625d0307e863e5e038e6661eb9a83d43af3d887`; TOML lock format version 4; 421 packages; tauri 2.12.5, tauri-build 2.7.4, tauri-runtime 2.12.2, tauri-runtime-wry 2.12.3; no git-sourced packages. ZIP artifact digest reported by GitHub: `sha256:260f941fb4f716826642c1cca599ab4bdac3fa70d767f9296caabb12a53102a4`. This verifies retrieval and basic lock consistency, not a full dependency security audit.
- **Gate NOT yet passed:** the inspected Cargo.lock is not committed to `desktop/maxx-tauri/src-tauri/Cargo.lock`; `cargo check --locked` is not yet enforced. Do not change CI to --locked before checking in the exact inspected lock bytes. Re-download the artifact from the GitHub Actions run, compare extracted SHA-256, check in the lockfile on this draft branch, then change Windows CI to --locked and rerun exact HEAD. Do not recreate a different lockfile without comparing dependency resolution.
- No shared Supabase mutation, operator permission assignment, deployment or production change. Backend RLS, OAuth, real agent delivery, and preview gates remain unmet. Rollback for this state-only commit: revert documentation update.

## Run evidence — 2026-11-13 23:28 America/Mexico_City

- Read exact PR #113 head `c23a768c21804078e972035f503153362cb70976`, existing GATES/STATE and Windows workflow before changing code. No new controller created.
- Re-downloaded GitHub Actions artifact ID `14096583693` from successful Gap Closure run `43552140179`; extracted `Cargo.lock` is 108042 bytes and SHA-256 `ac45c859bb8ca59f02f18e3cf625d0307e863e5e038e6661eb9a83d43af3d887`, matching prior evidence. Artifact remains a review source, not a committed lockfile.
- **One reversible test slice:** commit `9ac23a7d78267eb88f9e0cb65a5e2d4f16f2baf1` adds a second Windows `cargo check --locked` immediately after the existing lock-generating check and before upload. This tests locked re-resolution on the same runner; it does **not** establish checked-in lockfile reproducibility. New exact-HEAD CI was not yet available at inspection; gate remains OPEN until it passes.
- Blocker: repository contents connector supports UTF-8 text writes, but the downloaded ZIP artifact is only available as a local file reference, not transferable directly into GitHub's write connector in this run. Do not paste, regenerate, or claim the 108 KB lockfile is committed. Next executor with a Git-authenticated checkout should copy the extracted file after verifying SHA-256, commit `desktop/maxx-tauri/src-tauri/Cargo.lock`, replace the initial un-locked check with `cargo check --locked`, and rerun exact HEAD CI. Alternatively use an approved authenticated file upload path.
- No production deployment, Supabase mutation, membership grant, client data access, or revenue proof. Rollback: revert `9ac23a7` (CI-only step); this state append can be reverted independently.

## 2026-11-16 non-server full-slice implementation (newer than historical notes above)

**Release status: NOT READY.** Exact portal source `644783ff0e2062e89235b30f5e07e494efc48c84` passed all four workflows: CI `43957842396`, Pups `43957842452`, release `43957842433`, Windows/Gap Closure `43957842349`. Later `fb54779c` UX provenance and this run packet need their exact SHA recheck. No production DB, secrets, source integration, DNS cutover, server deploy or real user grants modified.

**Implemented in existing PR #113:** project-scoped chat history GET, atomic advisory exchange writes via verified actor and service-only RPC, role-/project-scoped read-only approval list, session-partitioned cache, no legacy cross-project runId reuse, verified owner/admin gating of legacy global control APIs when V3 enabled, production mutations kill switch preserved for dangerous actions while verified client draft chat can persist, additional negative tests. Draft-only client UI labels state honestly. Auth and voice remain generally integrated; client agent tools remain off pending scoped ICM proof.

**Implemented in preferred backend PR #45:** additive chat persistence and read-only client approval SQL proposal, disposable SQL execution and synthetic two-principal security tests (including write denial, revocation, retry idempotency, rollback, archive/restore). PR #45 `6b1c6ae92f7190a1ad73a2cbbec9b0f326e6e3c1` passed `MAXX client boundary gates` CI `43956422255`, lint, semantic, Patch. This is NOT actual-schema or independent security proof and is not deployed. #43 remains open until a documented supersession review; dependent #44 needs reconciliation.

**Read-only GitHub source discovery:** candidate repo links for Crown & Core, Bunna, MACS Digital Media and ASC3ND recorded in `CLIENT_SOURCE_REGISTRY.md`; THP Flooring, 3X Plumbers and Tangles & Locs have no verified accessible match. All integrations intentionally OFF pending owner scope confirmation.

**Windows lock:** verified Actions ZIP artifact 14270953199 produced 109,726-byte Cargo.lock, SHA-256 `8d74bfbaba308c6194c09e2d45489aa8d9feeefae8b13f6f70ad30b6f591277a`. It is NOT yet in Git. Reusable agent with authenticated checkout must commit exact bytes and enforce primary `cargo check --locked`. Composio's separate GitHub connection returned 401 and was not used.

**SERVER ONLY final execution:** read `SERVER-AGENT-EXECUTION-HANDOFF-2026-11-16.md`. Fix HTTPS gateway 502, verify legacy-vs-V3 Supabase data owner and operator Google subject, independently review real-schema RLS and backup/restore, apply migrations only with approval, configure runtime/Instinct/Hermes source-scoped execution, prove Bunna real workflow, live browser/voice/Windows E2E, then release with exact-sha verification and rollback. No duplicate manager, app, or loop. Keep feature flag OFF now.


## 2026-11-20 03:25 America/Mexico_City — dependency repair gate refresh

- **INTENT/BAR/LOCK:** Continue the existing Agent MAXX workstream; release status **NOT READY**. No production deployment, shared Supabase SQL, membership grant, customer contact or spend authorized.
- **EVIDENCE:** Portal PR #113 pre-update exact HEAD `671f563a4c8e80efdb0b161c66dd26e82126a1e7` has four completed successful commit-associated workflows: `44159508092`, `44159508181`, `44159508309`, `44159508250`. This is CI evidence, not live verification. PR #89 remains nonmergeable with malformed TypeScript range `~5.9.3\\n5.9.3` in its lockfile diff.
- **SLICE/VERIFY:** Existing targeted repair PR #115 HEAD `1d6ace66128c96bb84f0d4feef4c6acc15240075` corrects the TypeScript manifest/lockfile range and adds `npm ci`/lint/test/build acceptance. Commit-associated runs `44608586855` and `44608586902` completed successfully. GitHub review submissions: zero. Do not treat successful CI as independent approval. This append records verified gate state only; no code or DB change.
- **GRAPH/GAUNTLET:** PR #115 targets the #89 repair branch, not the seven-workspace branch. Independent review of #115 and exact-HEAD parent integration remain outstanding. Backend PR #50 requires real disposable PostgreSQL two-principal isolation proof and independent review. Operator OAuth, scoped approvals, recoverable archive, voice and Instinct delivery are not independently verified.
- **NEXT/ROLLBACK:** Independent reviewer inspects #115 diff and acceptance receipts; integrate only reviewed repair into #89, rerun exact-HEAD CI, then execute authorized disposable-DB RLS tests. Roll back this documentation-only update by reverting its commit. Do not merge/deploy without separate release authorization.

## 2026-11-21 16:28 America/Mexico_City — exact-HEAD evidence refresh

- Scope: existing Agent MAXX workstream only. Read current PR metadata for portal #89/#113/#115 and backend #29/#42/#43/#45/#50; no HEAD drift against the previously recorded eight SHAs. Existing run packet located on portal PR #113 branch (not default branch); prior default-branch 404 was a ref-selection error, not proof of missing packet.
- Portal #113 pre-documentation HEAD `c61671d0c44704c019b4f1138cc38bc214d469c6`: four exact-HEAD successful workflow runs: release gates 44710735757, CI 44710735796, Pups 44710735888, Gap Closure 44710735759. This establishes CI at that SHA, not preview/production verification.
- Portal #115 HEAD `1d6ace66128c96bb84f0d4feef4c6acc15240075`: TypeScript repair acceptance 44608586855 and release gates 44608586902 both successful. Submitted review is COMMENTED by executiveusa, **not** independent APPROVED. PR #89 at `e68fb51e09c8dccacfea6d691241ae4bf615e9df` remains nonmergeable; #115 targets #89's branch. Do not merge or call gate closed.
- Backend #43 HEAD `28e709dc004dd311367edf13d49b117188a7be57`: semantic commits failed (43794142407), Postgres skipped (43794142323). Backend #50 HEAD `1bf87af236e0628abe5a04ecb9c2ec24b056b4db`: static preflight successful (44402500678), Postgres skipped (44402499638), MariaDB cancelled (44402499765). No executed two-principal isolation proof established by these workflows.
- Smallest reversible slice this run: **evidence-only STATE correction** on the existing PR #113 branch; no new scheduler/control plane, production operation, database change, role grant, or deployment. This documentation commit itself requires exact-HEAD CI recheck; earlier workflow runs do not automatically validate the new documentation SHA.
- Next gate: independent authorized review of #115, then narrow TypeScript repair integration into #89 with exact-HEAD npm ci/lint/test/build. After that, use an authorized disposable Postgres/Supabase instance and two test principals for cross-workspace read/write/approval/run-step denial and rollback proof; independent security signoff before shared database changes.
- Rollback: revert this documentation-only commit. Status remains **NOT READY**.

## Verification checkpoint — 2026-11-22 13:30 America/Mexico_City

- Refreshed PR HEADs: portal #89 `e68fb51e09c8dccacfea6d691241ae4bf615e9df` (nonmergeable), #113 `9e6b7b7f3d8ee9cf2c581a38700097b75336fae3`, #115 `1d6ace66128c96bb84f0d4feef4c6acc15240075`; backend #29 `75074cb4faae791aa1cd80ee8ffcf1f8bfa309ed`, #42 `bab6a79456d9ae8d9cddac3b341400b70b8ee084`, #43 `28e709dc004dd311367edf13d49b117188a7be57`, #45 `4c173991b8dde5e20e9c56a7716deac5ec77ced8`, #49 `936373feeaac9ce1efdbb442dc858f7151d060ad`, #50 `1bf87af236e0628abe5a04ecb9c2ec24b056b4db`.
- Portal #115 exact-HEAD TypeScript acceptance `44608586855` SUCCESS and release gates `44608586902` SUCCESS; only review COMMENTED by `executiveusa`, not independent approval. Backend #50 exact-HEAD boundary static preflight `44402500678` SUCCESS, PostgreSQL `44402499638` SKIPPED, MariaDB `44402499765` CANCELLED. No two-principal database isolation proof.
- Documentation-only checkpoint; no new tests executed, SQL, access grants, merge, deployment or production mutation. Next: independent authorized #115 review, narrow integration into #89 and exact-HEAD acceptance; independently reviewed #50 sentinel negative-control test on authorized disposable real-schema PostgreSQL with two test principals. Shared `cyxdevcjycmffhmwxojh` untouched. Status NOT READY. Rollback: revert this documentation commit.
