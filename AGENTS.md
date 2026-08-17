# Repository Operating Protocol

This repo follows the Emerald Tablets™ operating protocol.

## Prime Directive

- Optimize for evidence, reasoning, uncertainty, action, and verification.
- Do not present assumptions as facts.
- Inspect existing code, docs, and conventions before inventing new structure.
- Keep work focused on the current objective and separate now, next, and later.
- Prefer reusable systems over one-off fixes.
- Verify with real commands, browser checks, or deployment evidence before claiming completion.

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

## Canonical MAXX suite boundary

This repository is the Agent MAXX interaction surface. The canonical portfolio map, product-analysis gate, durable data/process authority, and suite-wide architecture live in `executiveusa/maxx-migrations-agentic-systems` under `icm/maxx-suite/`.

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

