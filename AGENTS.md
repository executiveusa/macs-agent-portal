# Repository Operating Protocol

This repo follows the Emerald Tablets™ operating protocol.

## Prime Directive

- Optimize for evidence, reasoning, uncertainty, action, and verification.
- Do not present assumptions as facts.
- Inspect existing code, docs, and conventions before inventing new structure.
- Keep work focused on the current objective and separate now, next, and later.
- Prefer reusable systems over one-off fixes.
- Verify with real commands, browser checks, or deployment evidence before claiming completion.

## ICM federation — mandatory

ICM means **Interpretable Context Methodology**. Agent MAXX is one member of a three-repository system:

- `executiveusa/macsdigitalmedia` — public storefront;
- this repository — Stacy/operator surface, control plane, approvals and Hermes runtime;
- `executiveusa/maxx-migrations-agentic-systems` — canonical ICM/business backend.

Before substantial cross-repository work, read `CONTEXT.md` and `docs/architecture/icm-federation-client.md`, then load only the smallest relevant canonical ICM context from MAXX Migrations. Do not copy canonical backend truth here merely to avoid the federation boundary.

Every agent must understand that **motion comes before walk-test PASS**. A build, route declaration, document or mock is not motion. The required path is an actual call through the intended transport to the canonical owner and back with observable evidence. Keep `TESTED` and `VERIFIED` separate.

The only supported Agent MAXX -> MAXX Migrations path is through the MAXX control plane. UI, CLI, MCP and Hermes use the control plane; only the control plane holds `MAXX_MIGRATIONS_API_KEY`.

## Business-plan discovery — mandatory for Agent MAXX

Whenever Agent MAXX enters, opens, audits, resumes, or is asked to operate a repository, check for a durable business plan **before making product, growth, sales, positioning, pricing, market, partnership, or major architecture decisions**.

Search the smallest likely locations first, including:
- `docs/business/README.md`
- `docs/business/BUSINESS_PLAN.md`
- `BUSINESS_PLAN.md`
- `NORTH_STAR.md`
- `STRATEGY.md`
- `CONTEXT.md`
- `AGENTS.md`
- `docs/strategy/`
- equivalent ICM/context folders.

If a business-plan folder exists:
1. load its North Star and current status first;
2. use the plan as the business operating contract unless the human owner explicitly changes it;
3. compare proposed work against the North Star, current constraint, target customer, commercial model, and status metrics;
4. avoid work that does not materially move customer proof, revenue/pipeline/cash, delivery repeatability, operating cost, security/compliance, or deployment reliability;
5. update the repository's durable status/decision notes after material business work when the local plan requires it.

If no business plan exists, do **not** invent one silently. Note `BUSINESS PLAN: NOT FOUND`, inspect available context, and ask or propose creating an agent-operable business plan when the task is business-critical.

The first question for substantial repo work should effectively be: **What business outcome is this repository supposed to move, and where is that contract written?**

For this repository, the durable local business contract is `docs/business/BUSINESS_PLAN.md`.

## Four-bucket commercial routing

For growth, offer, lead, conversion, sales language, positioning, productization, launch, or commercial experiment work:

1. Read `docs/business/BUSINESS_PLAN.md`.
2. Treat the public commercial taxonomy as exactly **Reset, Momentum, Scale, Launch**.
3. Load the canonical commercial rules from `executiveusa/maxx-migrations-agentic-systems`:
   - `docs/icm/MONEY_MODELS.md`
   - `icm/growth-engine/SKILL.md`
   - the one relevant bucket skill only.
4. Do not duplicate those money models or create a fifth public bucket in this portal.
5. Use `docs/architecture/four-bucket-growth-client.md` as the portal/backend boundary.

Internal labels such as Client Zero, Built Here, labs, or named products are evidence/capability labels, not public commercial buckets.

## Canonical MAXX suite boundary

This repository is the Agent MAXX interaction surface. The canonical portfolio map, product-analysis gate, durable data/process authority, suite-wide architecture, and four-bucket commercial engine live in `executiveusa/maxx-migrations-agentic-systems`.

For a new MAXX product, repo, model, workflow, integration, salvage/merge decision, or high-level architecture task, load `icm/maxx-suite/00_router/CONTEXT.md` from that backend repo and only the smallest relevant context folder. Do not autoload or duplicate the full suite catalog here.

This repository already contains substantial tested control-plane code. Treat it as consolidation source material, not justification for a second permanent backend. Preserve useful tests, contracts, adapters and `packages/client-sdk`; move or wrap durable process/data authority behind MAXX Migrations only after equivalent behavior is proven.

## SYNTHIA™ 3.0 Systems Rules

- Treat architecture as stocks, flows, and feedback loops.
- Identify persistent state, runtime flows, feedback loops, blockers, risks, and owner surfaces before major changes.
- Do not fake integrations, provider readiness, or deployment health.
- Keep blast radius small; avoid changes that affect more than three services without an explicit deploy plan.
- Do not commit secrets. Use provider vaults or secure runtime configuration.

## Repo Workflow

- Prefer `rg` and targeted reads before broad scans.
- Reuse local components and design patterns before adding dependencies.
- Keep frontend changes consistent with the existing MAXX-POST visual language unless a task explicitly calls for redesign.
- Run `npm run lint` and `npm run build` before release work.
- Browser-check user-facing surfaces after visual changes.

## Reference Routing

- For a new or unfamiliar repo, start with `docs/architecture/agentic-operating-prompt.md`.
- Before using any large external repo list, open `docs/architecture/agentmax-skill-router.md` and `docs/research/agentmax-skill-readme-audit.md`.
- Prefer local mirrors first: `pi/`, `jcodemunch-mcp/`, and `vendor/mcp-ext-apps/`.
- Route new references into the smallest matching bucket:
  - gateway and integration
  - browser and MCP automation
  - skill and handoff design
  - orchestration, review, and merge closeout
  - media, docs, and visual packaging
  - provider, model, and security selection
- Quarantine private, inaccessible, malformed, or secret-bound references until they are explicitly audited.
- Do not autoload the full reference list. Load only the bucket needed for the current task.
