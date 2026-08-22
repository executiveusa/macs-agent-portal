# MAXX Platform Implementation Status

**Last Updated:** 2026-08-22  
**Source of truth:** `executiveusa/macs-agent-portal`  
**Target runtime:** VPS, `business` Flywheel profile  
**Frontend target:** Cloudflare Pages  
**Public API ingress:** Cloudflare Tunnel  
**Human auth:** Supabase Auth + Stacy allowlist  

---

## Executive Summary

Agent MAXX is a production-candidate business operator built as a controlled wrapper around a pinned NousResearch Hermes runtime.

The current architecture is intentionally simple for the owner:

```text
Stacy
  ↓
Supabase login
  ↓
MAXX app
  ↓
voice / chat / approvals
  ↓
MAXX control plane
  ↓
Hermes + Pups + skills + connected apps
  ↓
Supabase + second brain + business systems
```

The browser is the interface. The VPS is the always-on worker.

The product is designed so Stacy does not need to understand models, MCP, Docker, agents, tool routing, or infrastructure.

---

## Canonical Product Experience

1. Stacy opens the private MAXX app URL.
2. Supabase Auth verifies him.
3. He lands directly in MAXX.
4. He talks or types the outcome he wants.
5. MAXX decides whether to handle it directly or hand bounded work to a Pup.
6. Safe preparatory work continues server-side.
7. Consequential actions stop for approval.
8. Durable business context is written into MAXX's second brain.

The public-facing MAXX/avatar/car experience remains visually separate from the private authenticated operating app.

---

## Core Runtime

### MAXX control plane — BUILT

Provides:

- authenticated chat;
- missions/runs;
- approval governance;
- events;
- scheduling;
- browser worker;
- owner strategy;
- memory/second brain;
- Pup management;
- Pup-to-Pup handoffs;
- Operations Hub;
- scoped Hermes MCP bridge;
- deployment health endpoints.

### Hermes — PINNED

MAXX does not track mutable `latest` Hermes.

The reviewed Hermes source revision is stored in:

`services/hermes-runtime/UPSTREAM.lock`

Production policy:

```text
review upstream
  ↓
select useful changes
  ↓
test behind MAXX boundaries
  ↓
pin exact SHA
  ↓
build immutable image
```

A wholesale upstream jump is not accepted merely because a newer Hermes commit exists.

### Pups — BUILT + HARDENED

Persistent specialist workers include:

- Scout / Chief Pup;
- Doer / Superdoer;
- Business-in-a-Box;
- custom Pups.

Each Pup has its own:

- persistent identity;
- role;
- standing objective;
- Hermes session id;
- scheduling state;
- run evidence;
- status.

Pup delegation is one-hop and governed.

Pups cannot:

- delegate recursively;
- self-grant permissions;
- silently expand autonomy;
- store plaintext credentials;
- bypass MAXX approvals.

Recent hardening also treats upstream timeout/error/orphaned run states as terminal instead of allowing phantom `running` Pups, and applies a bounded run timeout.

---

## 2026 Capability Absorption

MAXX has been audited against:

- `nickvasilescu/nicks-stack`
- `nickvasilescu/korgo-bot`
- recent NousResearch Hermes upstream changes

The rule is **harvest capabilities, do not replace MAXX architecture**.

### From Nick's Stack

| Capability | MAXX status |
|---|---|
| Always-on Hermes runtime | Already had; VPS Flywheel is canonical |
| Obsidian second-brain surface | ADOPTED as Obsidian-compatible live vault |
| Composio MCP | ADOPTED, parked until key exists |
| AgentMail MCP | ADOPTED, parked until key exists |
| Latitude observability MCP | ADOPTED, parked until key exists |
| Secret-free repo / runtime credentials | Already had |
| 1Password secret plane | CONTRACT RESERVED; not activated in production yet |
| AgentPhone | DEFERRED behind explicit messaging/approval review |
| AgentCard / spending | DEFERRED behind explicit spending controls |
| Orgo desktop | NOT REQUIRED for canonical MAXX VPS deployment |
| Telegram QR onboarding | NOT REQUIRED for Stacy v1 |

### From Korgo Bot

| Capability | MAXX status |
|---|---|
| Persistent bot identity | Already implemented as Pups |
| Canonical conversation per bot | Implemented via persistent Pup Hermes session ids |
| Shared durable memory | Already stronger through MAXX second brain |
| Scheduled routines | Already implemented |
| Remote always-on runtime | Already implemented via VPS |
| Private runtime boundary | Already implemented; Hermes is not public |
| Connected-app synchronization pattern | ADOPTED as managed parked MCP connectors |
| Group chat between bots | DEFERRED; not required to ship Stacy's single-owner UX |
| Shared Orgo computer | DEFERRED; VPS/browser worker is canonical today |
| Multi-profile Electron/Mac shell | NOT ADOPTED; browser app is simpler for Stacy |

---

## Second Brain

MAXX keeps immutable imported evidence and a separate curated working layer.

### Imported evidence

Path inside Hermes:

`/opt/data/maxx-icm/second-brain/`

Imports remain immutable.

### Live Stacy vault

Production installer seeds:

`/data/maxx/second-brain/stacy-vault/`

which is exposed to Hermes at:

`/opt/data/maxx-icm/second-brain/stacy-vault/`

It is plain markdown and Obsidian-compatible.

Default structure:

```text
HOME.md
00-Inbox/
10-People/
20-Companies/
30-Projects/
40-Meetings/
50-Decisions/
60-Playbooks/
70-Reference/
90-Archive/
```

Obsidian is a human-readable surface, not a replacement for Supabase/ICM authority.

---

## Connected Apps

The Hermes entrypoint now manages a small set of optional MCP connectors.

They are **parked by default** and only enabled when their matching runtime credential exists.

### Composio

Environment:

`COMPOSIO_CONSUMER_KEY`

Purpose: approved business apps through one MCP surface.

### AgentMail

Environment:

`AGENTMAIL_API_KEY`

Purpose: agent-owned email workflows.

Sending remains approval-governed.

### Latitude

Environment:

`LATITUDE_API_KEY`

Purpose: trace/model/tool observability and debugging.

### Reserved / not yet activated

- `AGENTPHONE_API_KEY`
- `OP_SERVICE_ACCOUNT_TOKEN`

Phone/SMS and secret-manager migration remain explicit follow-up integrations rather than silent production changes.

---

## Voice

The private MAXX app already exposes browser voice input from the MAXX chat screen.

The control-plane voice gateway also exists behind feature flags.

Current ship target:

- voice input to MAXX;
- same approval policy as typed requests;
- no technical routing decisions exposed to Stacy.

Full duplex voice/TTS vendor integration can iterate after the core production runtime is live.

---

## Authentication

Stacy's private MAXX app uses Supabase Auth.

Human authentication and machine credentials remain separate.

### Human

- Supabase JWT;
- operator email allowlist.

### Machine

- `MAXX_API_KEY` — narrow machine client surface;
- `MAXX_HERMES_TOOL_KEY` — scoped Hermes bridge;
- `MAXX_EVENT_INGEST_KEY` — event ingestion only.

These keys are intentionally not interchangeable.

---

## Deployment

Canonical production topology:

```text
Cloudflare Pages
  └─ MAXX frontend
       ↓
Cloudflare Tunnel
       ↓
VPS
  ├─ maxx-control-plane
  ├─ maxx-hermes
  ├─ Pups / schedulers
  ├─ second-brain worker
  └─ media/browser capabilities
       ↓
Supabase
```

Deployment workflow:

`.github/workflows/maxx-cloudflare-production.yml`

Flywheel lifecycle:

`DETECT -> PRESERVE -> PROVE -> BOOTSTRAP -> DEPLOY -> VERIFY -> RECORD -> RECOVER`

The workflow deploys an exact Git SHA, not an unpinned moving target.

---

## Production Proof Required

MAXX should only be called fully `VERIFIED` after the live server proves:

1. Cloudflare frontend loads.
2. Supabase login works for Stacy.
3. Frontend reaches the MAXX API.
4. `/health/live` passes.
5. `/health/ready` passes.
6. Unauthorized API access is rejected.
7. Authenticated MAXX chat works.
8. Voice-originated intent reaches MAXX.
9. Scout and Doer are persistent.
10. Scout -> Doer handoff succeeds.
11. Handoff evidence persists.
12. Consequential action stops for approval.
13. Duplicate events do not execute twice.
14. Two workflows can target one Pup independently.
15. Second-brain vault persists.
16. Browser closure does not stop the runtime.
17. Container restart preserves state.
18. VPS reboot recovers MAXX and Cloudflare Tunnel.
19. Rollback target is recorded.

---

## Current Ship Decision

### Product architecture

**READY**

### Core code

**READY**

### Pups

**READY**

### Hermes strategy

**READY — pinned and controlled**

### Second brain

**READY — durable + Obsidian-compatible surface**

### Connected apps

**PARTIAL — Composio/AgentMail/Latitude ready when credentials are supplied**

### Production deployment

**READY TO RUN THE FLYWHEEL**

### Production verified

**NOT UNTIL THE LIVE SERVER PROOF PASSES**

---

## Shipping Rule

Do not delay Stacy's launch for optional integrations that do not block the core outcome.

Ship the smallest complete system:

```text
login
+ MAXX app
+ voice/chat
+ Hermes
+ Pups
+ approvals
+ second brain
+ scheduler
+ deployment recovery
```

Then activate additional connected apps one at a time through the parked integration model.
