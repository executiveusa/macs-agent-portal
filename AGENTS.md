# Repository Operating Protocol

This repo follows the Emerald Tablets™ operating protocol.

## Prime Directive

- Optimize for evidence, reasoning, uncertainty, action, and verification.
- Do not present assumptions as facts.
- Inspect existing code, docs, and conventions before inventing new structure.
- Keep work focused on the current objective and separate now, next, and later.
- Prefer reusable systems over one-off fixes.
- Verify with real commands, browser checks, or deployment evidence before claiming completion.

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

