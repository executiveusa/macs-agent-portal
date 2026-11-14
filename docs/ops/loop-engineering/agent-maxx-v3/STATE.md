# Agent MAXX V3 — ICM loop state

mode: brownfield
product: Agent MAXX / MAXX Migrations existing 3-repository federation
owner: MACS / authorized operator
status: NOT READY
stage: 07_verify
next_stage: 07_verify
canonical_portal: https://github.com/executiveusa/macs-agent-portal/pull/113
canonical_backend: https://github.com/executiveusa/maxx-migrations-agentic-systems/pull/43
current_slice: Frontend toolchain, React lint, shared Supabase settings and Windows Tauri dependency mismatch repaired; exact CODE HEAD all four CI workflows passed.
source_revision_portal: 11855fbc627cb81b345ee7f2e5630e8df6d855e6 (verified code revision before this documentation update)
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
