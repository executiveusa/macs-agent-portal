# Instant Agent / Hermes implementation handoff — Agent MAXX

Operate ONE canonical Agent MAXX engineering loop, not another app or control tower. Read `STATE.md`, `GRAPH.md`, `GATES.md`, `BAR.md`, `ROLLBACK.md` in this folder and current GitHub PRs. Use:
- Loop Engineering from the owner-supplied `loop-engineering-skill-v1.0.0`: INTENT → BAR → LOCK → EVIDENCE → GRAPH → SPEC → SLICE → BUILD → VERIFY → GAUNTLET → RELEASE → LEARN
- `Leonxlnx/unlazy`: explicit acceptance ledger with observed exits and parent verification; no pretending a check passes
- `DietrichGebert/ponytail`: inspect callers and existing primitives; smallest complete diff; keep security, accessibility and tests

Canonical repos:
- `executiveusa/macs-agent-portal` — default authenticated chat UI, settings, Fastify MAXX control plane; PR #113
- `executiveusa/maxx-migrations-agentic-systems` — MAXX ICM, client data and state; PR #43 and dependent revenue PR #29/#42
- `executiveusa/macsdigitalmedia` — storefront only; do not create a second public frontend.

Seven confirmed client names: CROWN AND CORE; THP FLOORING; BUNNA RESTAURANT; MACS DIGITAL MEDIA; ASC3ND; 3X PLUMBERS; TANGLES AND LOCS. **Their exact repositories, provider accounts, active databases and tenant data permissions are UNKNOWN until the owner identifies them. Do not infer from similar project names.** Build a per-client source register with `claimed`, `verified`, `missing`, and independent receipts, never automatic cross-tenant joins.

Current prioritized action: confirm portal CI at TypeScript 5.9.3 lock repair on latest PR #113 head; repair any remaining failures in a bounded slice. Parallel reviewer: inspect candidate SQL #43 and test in disposable Supabase. Preserve documented human authority for migrations, releases and external business actions. No second MCP server, no new CRM, no fake green alert, no arbitrary cross-client access. End each run with exact SHA, files changed, tests, gaps, reviewer, risk, rollback and next task. Do not conclude PRODUCTION VERIFIED until direct production runtime evidence exists.
