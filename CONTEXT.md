# Agent MAXX — ICM root router

Agent MAXX is the customer-facing operator product in this repository.

## Product boundary

- Public surface: Agent 006 / MAXX landing experience.
- Private surface: Stacy's authenticated, mobile-first conversational app.
- Agent engine: a fresh MAXX Hermes runtime based only on pinned `NousResearch/hermes-agent` upstream.
- API boundary: the MAXX control plane is the only application-facing API. Frontends, CLI, MCP, vision, media edges and Hermes call MAXX; they do not call downstream services directly.
- Canonical business/ICM backend: `executiveusa/maxx-migrations-agentic-systems`.
- Public MACS storefront: `executiveusa/macsdigitalmedia`.
- Bambu's personal Hermes at `executiveusa/pauli-hermes-agent` is a separate system and is never a MAXX runtime dependency.

## ICM federation rule

ICM means **Interpretable Context Methodology**. The canonical federation contract, ICM core, money models and cross-repository walk test live in `executiveusa/maxx-migrations-agentic-systems`.

Before substantial cross-repository work, Agent MAXX must read the smallest relevant canonical ICM context through the federation contract. Do not copy canonical backend truth into this portal merely to make it easier to read.

The walk test cannot pass from docs/builds alone. There must be motion:

`Agent MAXX surface -> control plane -> MAXX Migrations API -> canonical result -> control plane -> surface -> evidence`

Use `/v1/migrations/health`, `/v1/migrations/manifest`, and `/v1/migrations/route` for the bounded federation path. CLI/MCP/Hermes all reach those routes through the control plane. The MAXX Migrations machine credential stays in the control plane and is never given to Hermes or the browser.

## Load only the stage you need

| Need | Read |
|---|---|
| Identity, voice, authority | `icm/maxx/01_identity/CONTEXT.md` |
| Stacy UI / public experience | `icm/maxx/02_experience/CONTEXT.md` |
| Hermes, model routing, API | `icm/maxx/03_runtime/CONTEXT.md` |
| Skills, vision, media, CLI/MCP | `icm/maxx/04_capabilities/CONTEXT.md` |
| Testing, Gauntlet, deploy | `icm/maxx/05_release/CONTEXT.md` |
| Hard architecture boundaries | `icm/maxx/_shared/architecture-boundaries.md` |
| Evidence rules | `icm/maxx/_shared/evidence-standard.md` |
| Security / credentials | `icm/maxx/_shared/security-policy.md` |
| Cross-repo federation client | `docs/architecture/icm-federation-client.md` |

Do not load the entire ICM tree for routine work.

## Relationship / business-partner context routes

Load relationship context only when the conversation triggers it; do not preload these folders into unrelated missions.

| Trigger | Read | Behavior |
|---|---|---|
| Stacy mentions `BluSky`, `Blue Sky`, or `Blusky` in the restoration/business context | `docs/strategy/blusky/README.md` | Enter BluSky Business Partner Mode: collaborate, interview one question at a time when human context is missing, verify assumptions, search for Black Swan leverage, and drive toward one measurable business test. |

If “Blue Sky” is ambiguous, disambiguate before loading business context. Do not route Bluehost hosting questions into the BluSky restoration wiki.

## Governing outcome

A nontechnical owner states an outcome once. MAXX determines the smallest safe machine workflow, executes what it can, stops only at real authority boundaries, and returns a plain-language result with observable proof.

## Required work contract

For substantial work record: MODE, OUTCOME, TARGET, CONSTRAINTS, PROOF, COMMERCIAL VALUE, AUTHORITY, and ROLLBACK.

Evidence stages are: `PROPOSED -> BUILT -> TESTED -> VERIFIED -> ADOPTED -> VALUABLE`. Never claim a later stage than the receipts support.
