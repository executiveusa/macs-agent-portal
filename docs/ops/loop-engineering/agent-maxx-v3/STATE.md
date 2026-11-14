# Agent MAXX V3 — ICM loop state

mode: brownfield
product: Agent MAXX / MAXX Migrations existing 3-repository federation
owner: MACS / authorized operator
status: NOT READY
stage: 06_build
next_stage: 07_verify
canonical_portal: https://github.com/executiveusa/macs-agent-portal/pull/113
canonical_backend: https://github.com/executiveusa/maxx-migrations-agentic-systems/pull/43
current_slice: Frontend toolchain repaired (TS 5.9.3, Tailwind 3.4.19), React hook lint repairs, shared Supabase config.
source_revision_portal: b34345d279b58ede1af5c357a2d19f24a988d231 (last code revision independently checked)
baseline_root_ci: npm ci FAILED due TypeScript 7 incompatible with typescript-eslint <6.1; initial build FAILED Tailwind 4/PostCSS 3 config.
latest_build_ci: PASS — GitHub Actions run 43541621582 at exact code SHA b34345d; npm ci, lint, frontend tests+build, dependency audit, control-plane typecheck/test/build, client SDK checks. MAXX Pups CI passed run 43541621615. MAXX release gates passed run 43541621593. Gap Closure Rust-shell check still pending/independent.
next_stage: 07_verify — protected preview, independent tenant/RLS review, operator Google login proof; do not call production verified.
shared_supabase: botanic-creations / cyxdevcjycmffhmwxojh
shared_database_changed: false
production_modified: false

## Durable loop command

Read this STATE, GATES, BAR, GRAPH, ROLLBACK and current PRs. Compare actual CURRENT HEAD and CI. Execute one READY graph node using the existing repo and smallest reversible diff. Then run the actual executable gates, obtain independent review, update evidence and this STATE, and continue only to the next unblocked stage. Do not restart another manager, write duplicate mission runners, or claim success from code presence.

## Next graph action

Frontend build checks passed at exact code SHA `b34345d` (CI #43541621582). Next: independent review of candidate backend Supabase SQL PR #43 with disposable test DB and explicit two-user cross-tenant denial proof; then bind an authorized Google operator identity, connect a protected preview, and retest user journey. Do not apply draft SQL on shared botanic-creations, invent owner IDs or auto-merge. Never use force/peer-overrides to hide install failures.

Release gate: independently reviewed two-user Supabase RLS and owner-authorized deployment, exact revision production verification. Never auto-apply draft SQL to botanic-creations.
