# 03_runtime — run one isolated MAXX brain

One job: operate MAXX on a fresh, pinned NousResearch Hermes runtime behind the MAXX API.

## Inputs
- Working: `../../../services/hermes-runtime/UPSTREAM.lock`
- Reference: `../_shared/architecture-boundaries.md`
- Reference: `../_shared/security-policy.md`

Do NOT load or import `executiveusa/pauli-hermes-agent`. That is Bambu's personal agent and outside this product boundary.

## Process
1. Track the exact upstream Hermes source revision in `UPSTREAM.lock`.
2. Keep mutable Hermes identity/config/skills in a MAXX-only data directory/volume.
3. Expose Hermes only to the MAXX control plane over authenticated server-to-server traffic.
4. Keep the browser/PWA authenticated through Supabase; CLI/MCP automation uses the MAXX API credential, never the Hermes credential.
5. Hermes remains the sole agent orchestrator. The control plane owns authentication, product policy, evidence, approvals, and client contracts.
6. Normal mode uses configured automatic routing. MAXX Mode requests high reasoning without hard-coding UI users to a provider.
7. Enable tool-loop hard stops for unattended operation.

## Pups runtime contract

A **Pup** is MAXX product language for a governed persistent specialist. The underlying runtime primitive is a Hermes profile/Bot; Stacy does not need to know that implementation detail.

Built-in mapping:

| MAXX product role | Hermes profile |
| --- | --- |
| Chief Pup / Scout | `chief-pup` |
| Superdoer / Doer | `superdoer` |
| Business-in-a-Box / Biz Pup | `business-pup` |

Rules:
1. Each built-in Pup gets its own SOUL, memory, sessions, model scope, skills, and profile credential scope.
2. MAXX business truth remains in ICM/Supabase. Profile memory is relationship/working memory, not canonical authority.
3. One multiplex Hermes gateway may serve the bounded local Pup roster. Secondary profiles do not bind separate API-server ports.
4. Profile-scoped API calls use `/p/<profile>/...` and a profile-specific bridge key. The default Hermes API key must not be reused as a named-profile credential.
5. Pup chat uses the profile's persistent named `Bot Chat` conversation rather than a disposable stateless chat.
6. MAXX one-hop delegation remains authoritative even though upstream Hermes supports richer Bot-to-Bot and group behavior. Do not expose unrestricted recursive delegation.
7. MAXX approvals, evidence, cost controls, mutation policy, ICM, and owner authority remain above Hermes Bot Mode.
8. Custom Pups are not silently mapped onto one of the three built-in profiles. Dynamic profile provisioning is a separate capability and must preserve isolation.
9. Routines currently remain governed by MAXX's scheduler while profile-backed execution is proven. Do not enable a second Hermes cron schedule for the same routine until scheduler authority is migrated intentionally.
10. Cross-machine peers/groups are future capability flags, not part of the initial local Pup runtime proof.

## Outputs
- `../../../services/hermes-runtime/`
- `../../../services/maxx-control-plane/`

## Proof
A valid Pup runtime proof demonstrates:
- three distinct Hermes profile homes,
- distinct profile API credentials,
- persistent profile-scoped chat,
- a manual Pup run routed to the correct profile,
- a waiting approval resolved against the same profile/run,
- one-hop delegation preserved,
- no dependency on Bambu's personal Hermes,
- restart without losing Pup identity or conversation state.

## Human check
Verify a clean deployment can run without any Bambu Hermes files, secrets, memories, or endpoints and that the public/private clients only need the MAXX API contract.