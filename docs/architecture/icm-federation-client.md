# Agent MAXX -> MAXX Migrations federation

This repository is the operator/runtime client. It is not the canonical home of business ICM.

## Canonical authority

Read from `executiveusa/maxx-migrations-agentic-systems` when the task crosses the business/backend boundary:

- `docs/icm/FEDERATION_CONTRACT.md`
- `docs/icm/HUMAN_MACHINE_CONTRACT.md`
- `docs/icm/ICM_CORE.md`
- `icm/federation/CONTEXT.md`
- `icm/federation/WALK_TEST.md`

For commercial work, also route through the canonical `docs/icm/MONEY_MODELS.md` and one relevant Reset/Momentum/Scale/Launch skill.

## Supported machine path

```text
Agent MAXX UI / CLI / MCP / Hermes
  -> MAXX control plane
  -> server-side MAXX Migrations adapter
  -> authenticated MAXX Migrations API
  -> canonical ICM result
  -> control plane
  -> caller
```

Control-plane endpoints:

- `GET /v1/migrations/health`
- `GET /v1/migrations/manifest`
- `POST /v1/migrations/route` with `{ "condition": "..." }`

Only the control plane receives `MAXX_MIGRATIONS_API_KEY`. Browser code and Hermes never receive it. Hermes uses its existing scoped `MAXX_HERMES_TOOL_KEY` and therefore cannot bypass the control plane.

## Motion gate

The federation walk test is not complete until a real path executes across the boundary and returns a truthful result. Required evidence records exact revisions, runtime targets, response state, and whether the result is `TESTED` or `VERIFIED`.

A missing backend URL/key must return `unavailable`. A failed upstream call must return `degraded`. Neither may be disguised as success.

## Public taxonomy

The canonical backend may return only:

- Reset
- Momentum
- Scale
- Launch

Internal labels remain internal proof/capability labels.
