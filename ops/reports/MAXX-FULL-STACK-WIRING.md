# Agent MAXX — Full-Stack Wiring Audit

**Method:** Full-Stack Wiring Audit v2.0.0  
**Branch:** `feat/maxx-production-v1`  
**Release stage at this report:** TESTED, not production-verified

## Repository fingerprint

- Frontend: React + Vite + TypeScript.
- Human auth: Supabase session in browser; control plane verifies Supabase JWT and explicit operator email allowlist.
- Product API: Fastify control plane under `services/maxx-control-plane`.
- Agent engine: isolated MAXX Hermes image/profile based on pinned NousResearch upstream metadata in `services/hermes-runtime/UPSTREAM.lock`.
- Runtime packaging: Docker/Coolify composition for control plane + MAXX Hermes + private NCA Toolkit media edge.
- Durable operational state: existing control-plane Supabase/ICM stores plus isolated Hermes `/opt/data`; canonical ownership must remain explicit per domain.
- Public surface: `/` 006 MAXX story/offer.
- Private surface: `/signin` -> `/dashboard`.
- Advanced/recovery surface: `/control/*`.
- Machine surfaces: `cli/maxx.mjs`, `mcp/maxx-server.mjs` -> MAXX API only.

## Hard identity boundary

| System | Canonical role | May share |
|---|---|---|
| `executiveusa/pauli-hermes-agent` | Bambu's personal Hermes | generic public skills/patterns only |
| `macs-agent-portal` MAXX Hermes | `maxx-006` customer product runtime | MAXX product code and isolated customer state |

**Finding:** PASS at code/contract level. `pauli-hermes-agent` is explicitly forbidden as a runtime dependency in ICM and MAXX SOUL. Live infrastructure isolation still requires deployment proof.

## Promise-to-runtime ledger

### W1 — Stacy can privately sign in and talk to MAXX

`promise -> /signin -> Supabase OAuth/OTP -> Supabase session -> ProtectedRoute -> /dashboard -> MaxxChat`

- Surface: BUILT.
- Auth redirect: BUILT.
- Private route: BUILT.
- Sign-in copy no longer exposes ICM/control-plane jargon after Gauntlet correction.
- Target Supabase project deployment is **not verified in this session** because the repo project ref is not the Supabase project exposed by the connected tool.

**Status:** TESTED by frontend build; runtime auth remains UNVERIFIED.

### W2 — Normal conversation reaches Hermes

`MaxxChat -> controlTowerApi.chat -> Supabase bearer -> POST /v1/chat -> operator auth/allowlist -> Hermes adapter -> POST /v1/chat/completions -> response -> chat bubble`

- Browser never receives Hermes key.
- Control plane uses dedicated internal Hermes bearer key.
- Hermes failure truthfully falls back to configured direct model route and marks response degraded.
- UI exposes error if the request does not complete.

**Status:** TESTED in control-plane suite; live Hermes container path UNVERIFIED.

### W3 — MAXX Mode increases reasoning without becoming a model picker

`MAXX Mode button -> internal marker -> /v1/chat -> adapter strips marker -> POWER route if configured -> Hermes reasoning_effort=high -> response`

Tests prove:
- internal marker is not passed as user content;
- configured power provider/model is selected;
- reasoning effort is high;
- absent product routes fall back to Hermes runtime selection.

**Status:** TESTED.

### W4 — Cheap/standard/power routing remains provider-agnostic

`message complexity + explicit MAXX Mode -> FAST | STANDARD | POWER env pair -> Hermes provider/model fields`

- No provider selector appears in the Stacy UI.
- A route activates only when both provider and model are configured.
- Multiple provider credentials can be supplied to the isolated Hermes deployment.

**Status:** TESTED at request-contract level. Cross-provider live fallback is UNVERIFIED.

### W5 — Approval stays human-readable and human-gated

`bootstrap pending approval -> MAXX Needs you card -> Approve/Not yet -> approval endpoint -> refreshed state`

The simple UI exposes the decision without exposing agent internals. Existing control-plane/Hermes approval machinery remains behind it.

**Status:** BUILT/TESTED. A real consequential mission approval is UNVERIFIED in deployed runtime.

### W6 — CLI and MCP use one MAXX API

`CLI or MCP -> x-maxx-api-key -> control-plane auth -> MAXX endpoint`

- Dedicated machine credential is timing-safe compared.
- CLI/MCP do not receive Hermes credentials.
- MCP exposes chat/status/create-mission, not a bypass approval tool.

**Status:** TESTED for auth boundary; live remote calls UNVERIFIED.

### W7 — Media/video work is available behind MAXX

`Hermes -> maxx-media skill -> NCA Toolkit internal URL + x-api-key -> bounded media endpoint -> produced asset -> verification`

- Upstream revision pinned in product metadata.
- Toolkit is private to the backend.
- Arbitrary Python execution endpoint is explicitly excluded from the MAXX media allowlist.
- Coolify composition includes a private media service.

**Status:** BUILT. No live media job executed in this session; UNVERIFIED.

### W8 — MAXX Eyes can be added without replacing the brain

`Samsung / compatible Meta glasses -> future native edge -> MAXX API -> control plane -> MAXX Hermes`

- VisionClaw is reference/native-edge source, not orchestrator.
- Camera/audio marked sensitive by default.
- Existing upstream WebRTC-vs-live-assistant limitation is not hidden.
- Private UI labels Eyes as coming soon; launch does not depend on it.

**Status:** CONTRACT ONLY / NOT LAUNCH FEATURE.

### W9 — Long-running harness stays subordinate

`Hermes mission -> bounded longrun packet -> DeepSeek harness worker -> return packet -> Hermes reconciliation -> user result`

- Scope/evidence/cost/blocker packet is defined.
- Harness cannot approve its own consequential result.

**Status:** CONTRACT ONLY. Dispatcher is not yet production-wired.

### W10 — Android private experience is install-shaped

`/dashboard -> manifest.webmanifest + service worker -> standalone portrait PWA`

- mobile-first composer/touch targets/safe-area behavior are built;
- voice input uses browser SpeechRecognition when available;
- native Android/Meta integration is explicitly optional.

**Status:** FRONTEND TESTED. Galaxy S25 install/voice behavior UNVERIFIED on device.

## Canonical state reconciliation

| Durable fact | Intended boss | Audit result |
|---|---|---|
| Human authentication | Supabase Auth | clear |
| Allowed Stacy operators | control-plane env policy | clear |
| MAXX conversational orchestration | isolated Hermes | clear |
| Product approval/evidence contract | MAXX control plane | clear |
| Hermes sessions/memories | isolated MAXX Hermes volume | clear |
| Product ICM contracts | repo -> synced runtime product-context | clear |
| Browser customer UI state | projection only | clear |
| NCA media job internals | NCA edge, subordinate | clear |
| Bambu personal Hermes state | external, forbidden | clear |
| Customer second brain | NOT YET IMPLEMENTED | blocker for template-product completeness |

## Security boundary results

### Passed in code/test
- root tracked `.env` removed without reading/reproducing it;
- browser does not receive Hermes/NCA/service-role credentials;
- machine API key is distinct from human auth and Hermes key;
- authorization headers are redacted in control-plane logs;
- NCA arbitrary Python endpoint is not in the product media skill;
- customer/Bambu Hermes isolation is explicit;
- dependency npm audits pass at configured high-severity gate.

### Release blockers / unresolved
1. If the removed historical `.env` ever held live secrets, those credentials must be rotated before production.
2. Actual target Supabase RLS/auth behavior has not been exercised against the repo's declared project.
3. `HERMES_IMAGE` defaults to mutable `latest` even though source metadata is pinned; production should prefer an immutable image version/digest or verified build from the pinned source.
4. Cloudflare Workers Git deployment currently fails while repository CI and both Vercel deployment statuses pass. Root cause is not exposed by the available GitHub check output.
5. The global production mutation flag gates all POST/PUT/PATCH/DELETE calls. Deployment currently enables it so chat works; side-effecting endpoints must continue to rely on their narrower approval/feature policies. A future hardening slice should separate conversational POSTs from true external mutations.

## Missing product promises

### P0 before claiming the reusable customer product complete
- customer second-brain large import + ICM ingestion + query path;
- live isolated Hermes deployment and restart/persistence proof;
- live Supabase auth/allowlist/RLS proof;
- live normal chat + MAXX Mode through deployed backend;
- live approval path;
- live NCA media job and asset verification;
- deploy rollback verification.

### Explicit post-launch/optional
- native MAXX Eyes Android/Meta client;
- lip-sync/live animated avatar;
- Android app intents/share sheet/background integrations;
- unified simultaneous realtime assistant + browser POV if the upstream conflict is later solved.

## Release verdict

**TESTED / HOLD.**

The codebase now has the correct product boundary and core conversational wiring, but the Full-Stack Wiring Audit does not permit `PRODUCTION_READY` until deployed runtime evidence closes the P0 rows above. A green build or Vercel preview alone is not sufficient.
