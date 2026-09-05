# Four-Bucket Growth Client

## Role

`macs-agent-portal` is the human interaction surface for the MACS commercial system. It does not own a second copy of the money models.

Canonical authority: `executiveusa/maxx-migrations-agentic-systems`.

## Flow

`Stacy/team intent -> portal -> backend commercial router -> Reset | Momentum | Scale | Launch -> proposed next move -> approval if consequential -> execution -> evidence -> experiment decision`

## Portal contract

The portal should be able to display or capture:

```text
client
current_condition
bucket
problem_closest_to_money
desired_outcome
primary_metric
primary_cta
recommended_next_action
proof_state
experiment_state
approval_state
```

These fields are a UI/interaction contract, not permission to create a parallel source of truth. Prefer mapping them to backend entities and APIs that already exist.

## User experience

The owner should not need to know which model, agent, workflow engine, or automation produced the recommendation.

Default interaction:

1. What is important right now?
2. MAXX classifies the condition into one bucket.
3. MAXX shows the outcome and one recommended next move.
4. MAXX shows the evidence or assumption behind it.
5. The owner approves only when a consequential gate is reached.
6. MAXX returns the measured result and next decision.

## Public language

Use outcomes first. Hide implementation jargon by default.

Preferred:

- fix what is getting in the way
- turn attention into opportunity
- grow without complexity
- prove demand
- less to manage
- faster useful result
- repeatable system

Do not lead with AI, agentic, models, MCP, orchestration, RAG, or architecture language.

## Experiment UI

When experiments become a portal surface, preserve the backend state machine exactly:

`PROPOSED -> APPROVED -> RUNNING -> COMPLETE -> KILL | KEEP | IMPROVE | SCALE`

Primary metrics should prioritize money and qualified pipeline over vanity metrics.

## Integration rule

Before implementing new backend calls:

1. inspect existing client SDK/API adapters in this repo;
2. inspect the canonical backend endpoints/entities;
3. reuse or extend the smallest compatible contract;
4. do not create a new permanent backend service;
5. prove the integration with a real request/response path before calling it complete.

## Security

No service-role, admin, or private backend credentials belong in browser-visible variables. Consequential actions remain subject to persisted approval and immediate revalidation by the canonical backend.
