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
