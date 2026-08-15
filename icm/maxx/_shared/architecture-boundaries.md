# MAXX architecture boundaries

## Canonical identities

- `maxx-006`: Agent MAXX product in this repository.
- `bambu-hermes`: Bambu's personal Hermes in `executiveusa/pauli-hermes-agent`; external and isolated.

## One boss per layer

| Layer | Authority |
|---|---|
| Public story / 006 product presentation | MAXX public frontend |
| Stacy private interaction | MAXX private frontend |
| Authentication, product API, approvals, evidence contract | MAXX control plane |
| Agent reasoning, tools, skills, subagents | fresh MAXX Hermes runtime |
| Customer/runtime context | MAXX ICM + isolated MAXX data stores |
| Vision capture | MAXX Eyes edge adapter |
| Media execution | NCA Toolkit edge adapter |

## Forbidden coupling

- MAXX must not import Bambu's SOUL, memory, credentials, endpoints, cron state, or deployment volume.
- Browser, CLI, MCP, vision, and media clients do not bypass the MAXX API to call Hermes.
- NCA Toolkit, VisionClaw, PopeBot/flywheel workers, DeepSeek harnesses, and similar systems are capabilities/workers, not competing orchestrators.
- Frontend state is not canonical business/runtime truth.
- Public landing deployment must not be required for the private agent runtime to operate.

## Portability

A customer deployment gets an isolated MAXX runtime/data namespace from the same product template. Shared code is allowed; customer memory, secrets, sessions, evidence, and credentials are not.
