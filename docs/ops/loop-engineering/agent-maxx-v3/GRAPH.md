# Dependency graph — one writer per artifact

A. Inspect latest portal/backend SHA, PRs, check conclusions, Supabase schema and interfaces [done in first loop].
B. Repair root TypeScript lock mismatch (only package.json and package-lock.json) [implemented: f178287; exact-HEAD CI pending]. Needs A.
C. Repair ensuing portal lint/unit/build on SAME branch; add targeted tests. Needs B passing.
D. Independently review MAXX SQL candidate #43, all project-related RLS + RPC grants, rollback and backup; disposable DB install, two Google TEST identities. Needs A; **no shared production DB writes**.
E. Wire only approved DB metadata and role memberships with audited state, seven user-named companies, prompts, proper settings and approval flags. Needs D.
F. End-to-end scoped chat, voice, owner approvals, ICM task execution, 30-day archive/restore, read-only client connectors; explicit source paths/credentials, zero fabricated claims. Needs C+E.
G. External agent ingress via existing MAXX control plane and Stacy's Instinct FastAPI, per-project keys + delivery receipts. Needs F.
H. User-facing visual gauntlet, WCAG, mobile and independent security testing. Needs C+F+G.
I. Only then release approved exact SHA with rollback, record public/runtime evidence. Needs H and owner authority.

**Parallelism:** C and D may be worked independently by separate authors. Do not let parallel writers mutate the same branch/file. No broad Dependabot merges.
