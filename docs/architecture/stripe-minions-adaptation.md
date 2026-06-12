# Stripe-Minions Adaptation for Agent Maxx

Agent Maxx uses the Stripe-Minions idea as a blueprint-first software factory:

- intake first
- blueprint selection second
- sandboxed execution third
- review and documentation before release

## Mapping

- Minion -> Agent Maxx mission worker
- Blueprint -> Agent Maxx workflow blueprint
- Toolshed -> MAXX lazy-loaded registry
- Human review -> review gate
- CI -> shift-left QA gate
- Internal dashboard -> observable ledger / cockpit

## Rule

If a step is deterministic, encode it. If it is ambiguous, route it to a skill or agent loop.
