# Agent MAXX — Gauntlet Report

**Method:** uploaded `gauntlet-loop`  
**Mission:** turn `macs-agent-portal` into the isolated Agent MAXX 006 product without contaminating Bambu's personal Hermes.  
**Primary UX bar:** a current simple conversational assistant interaction model: one obvious conversation, minimal navigation, voice/text, understandable status, explicit approvals, details on demand. The bar is interaction clarity, not copying another product's branding.  
**Architecture bar:** one MAXX front door with one authoritative Hermes runtime underneath; capabilities remain edges/skills, not competing brains.

## Exit rule

A slice wins only when the implemented branch passes its functional acceptance tests and no named critic can identify a larger unresolved gap. The whole mission does **not** exit while the real deployment path is unverified.

## Round 0 — authority / repo boundary

### Critic
The initial direction risked turning Bambu's `executiveusa/pauli-hermes-agent` into the MAXX backend. That would couple Bambu's identity, memory, secrets and lifecycle to a customer product.

### Verdict
**LOSES.**

### Fix
- hard boundary in root ICM, identity and runtime contexts;
- MAXX upstream changed to fresh NousResearch Hermes;
- final product destination locked to `executiveusa/macs-agent-portal`;
- release CI now rejects Bambu personal-Hermes references in executable/runtime dependency files.

### Current result
**WINS at code/contract level.** Live infrastructure isolation still requires deployment proof.

---

## Round 1 — Stacy first-use clarity

### Critic
The private app was being simplified, but the existing sign-in still taught Stacy about the control tower/ICM/server implementation. That failed the product promise before the conversation even began.

### Verdict
**LOSES.**

### Fix
- private `/dashboard` became the locked conversational MAXX wireframe;
- technical tower moved behind `/control/*`;
- sign-in rewritten to `Sign in to your private MAXX` with Google/email only;
- four pain-point starter prompts;
- normal/MAXX Mode avatar state;
- voice/text composer;
- plain `Working / Needs you / Done / Blocked` language;
- MAXX Eyes shown only as coming soon.

### Current result
**BUILT/TESTED by frontend build.** Physical-device and authenticated browser cold-walk remain live proof.

---

## Round 2 — machine credential authority

### Independent critic
The PR reviewer identified a P1: `MAXX_API_KEY` originally authenticated as a general operator, so an MCP/CLI client could potentially reach approval/strategy/browser mutation authority.

### Verdict
**LOSES / SECURITY BLOCKER.**

### Fix
- principal type distinguishes `human` and `machine`;
- timing-safe machine credential comparison retained;
- machine credential authenticates only `POST /v1/chat` and `POST /v1/missions`;
- tests prove approval, strategy, browser mutation and Hermes approval paths reject the machine key.

### Current result
**WINS / TESTED.**

---

## Round 3 — reproducible fresh Hermes

### Independent critic
The PR reviewer identified a P1: `UPSTREAM.lock` existed, but the runtime still defaulted to mutable `nousresearch/hermes-agent:latest`. The documented source and the deployed agent could diverge silently.

### Verdict
**LOSES / REPRODUCIBILITY BLOCKER.**

### Fix
- refreshed lock to an exact current NousResearch commit;
- `build-pinned-image.sh` fetches and verifies the exact SHA;
- builds the upstream Hermes Dockerfile from that checkout;
- applies the MAXX overlay after the upstream build;
- runtime compose requires an explicit pinned MAXX Hermes image;
- installer derives image name from the lock;
- CI verifies SHA format/fetchability and rejects mutable `latest/main` runtime references.

### Current result
**WINS at packaging/test level.** Target VPS image build/restart still requires live proof.

---

## Round 4 — degraded observability

### Independent critic
The PR reviewer identified a P2: CLI/MCP `status` treated readiness 503 as a generic failure and discarded the useful degraded dependency body.

### Verdict
**LOSES.**

### Fix
- status calls preserve structured non-2xx readiness bodies;
- CLI prints dependency state and returns a distinct non-ready exit code;
- MCP returns the degraded state as structured content.

### Current result
**WINS / IMPLEMENTED.**

---

## Round 5 — capability catalog mismatch

### Critic
A fresh Hermes image had the new MAXX profile skills but not all reusable skills already present in `macs-agent-portal`. The control tower and the actual agent runtime therefore disagreed about what MAXX could do.

### Verdict
**LOSES.**

### Fix
The MAXX image now packages and syncs, on demand:

1. root reusable repo skills;
2. existing `pi-packages/maxx/skills` catalog;
3. current MAXX profile skills last, so current canonical skills win collisions.

Release CI verifies packaging. Existing customer/upstream skills are preserved rather than deleting the whole skill directory.

### Current result
**WINS at package level.** Live Hermes skill discovery is a deployment proof.

---

## Round 6 — stale specialist skills

### Critic
Simply copying the skill catalog exposed stale contracts:
- browser verification still expected an old intro/countdown UX;
- onboarding referenced obsolete product flow;
- motion skill referenced stale timing keys;
- OpusClip/video dossier assumed repo-local npm scripts rather than a packaged Hermes runtime.

### Verdict
**LOSES.**

### Fix
- browser verification rewritten for public `/`, private `/signin`/`/dashboard`, MAXX Mode, approvals, second brain and PWA;
- onboarding rewritten around outcome interview, approvals, connections and second brain;
- motion skill now reads current config and is public-story-only;
- runtime-native `maxx-opusclip` added;
- runtime-native `maxx-video-dossier` added;
- `maxx-media` uses private NCA Toolkit;
- `maxx-social-postiz` adds optional approval-gated social publishing;
- `maxx-scheduled-ops` uses Hermes cron but intentionally creates no default paid recurring jobs.

### Current result
**WINS at contract/package level.** Individual external providers remain unverified until credentials are configured and a real job is run.

---

## Round 7 — large second brain

### Critic
The product spec promised that a new MAXX customer could upload prior ChatGPT/Gemini/files and turn them into a portable second brain. No durable implementation existed.

### Verdict
**LOSES / PRODUCT GAP.**

### Fix
- private chunked browser upload (5 MiB pieces);
- private Supabase bucket + owner RLS migration;
- durable import queue;
- private worker reconstructs the original file;
- ZIP traversal, file-count, expanded-size and member-size guards;
- output is ICM + Google Open Knowledge Format compatible progressive-disclosure knowledge;
- source provenance retained;
- binaries retained but not automatically injected into prompts;
- imported claims explicitly remain unverified source material;
- worker tests cover bundle generation/provenance and archive safety;
- Hermes receives a read-only second-brain volume and `maxx-second-brain` skill.

### Current result
**WINS at code/behavior-test level.** Actual target Supabase migration -> upload -> Ready -> cited query is still unverified.

---

## Round 8 — Android install shape

### Critic
The private UX was mobile-first but the PWA manifest initially claimed a 720x720 asset as 192x192, weakening install correctness.

### Verdict
**LOSES minor packaging detail.**

### Fix
- added a real 192x192 MAXX icon;
- manifest declares actual 192 and 720 sizes;
- standalone portrait launch at `/dashboard`;
- service worker + safe-area composer;
- native MAXX Eyes remains optional rather than blocking launch.

### Current result
**WINS at build/package level.** Galaxy S25 install/microphone test remains live device proof.

---

## Round 9 — full-stack wiring

### Critic
A collection of green components is not a product unless the promised path can be traced from UI through handler/API/runtime/state and back to observable evidence.

### Verdict
**PARTIAL.**

### Fix
`ops/reports/MAXX-FULL-STACK-WIRING.md` now traces the actual paths for:
- Supabase auth;
- normal chat;
- MAXX Mode;
- model tiers;
- approvals;
- CLI/MCP;
- skills;
- NCA/Opus media;
- optional Postiz;
- second brain;
- PWA;
- MAXX Eyes contract;
- long-running worker contract;
- scheduled operations;
- immutable Hermes source build.

### Current result
**TESTED / NOT YET VERIFIED LIVE.**

---

# Current biggest remaining gap

The single largest remaining gap is not another code feature. It is **live target-environment proof**.

This build session does not have the actual MAXX backend VPS/Coolify connection, and the connected Supabase tool exposes a different project than the repo's declared MAXX project. Mutating those unrelated systems would violate the mission.

Therefore the Gauntlet does not permit `AGENT_MAXX_PRODUCTION_READY` yet.

## Required final acceptance run

On the actual target environment prove, in order:

1. apply the second-brain migration to the intended Supabase project;
2. approved Stacy account signs in; unapproved account is rejected by the control plane;
3. build the exact locked Nous Hermes revision and start the isolated MAXX stack;
4. normal chat returns through deployed MAXX Hermes;
5. MAXX Mode uses the configured power route;
6. machine API key cannot approve or mutate protected admin/browser state;
7. real pending approval -> Stacy approval -> execution/result receipt;
8. real NCA media operation -> inspect the produced asset;
9. real second-brain export -> Ready -> MAXX answer points to imported source concept/path;
10. restart the stack -> identity/state remain intact;
11. roll back one release safely and recover;
12. perform a real mobile cold-walk on Stacy's Galaxy S25 or equivalent Android viewport/device before calling the mobile experience adopted.

## Gauntlet verdict

**CORE PRODUCT: TESTED.**  
**PRODUCTION SYSTEM: HOLD — LIVE ENVIRONMENT PROOF REQUIRED.**

The loop should resume at the actual deployment target, not by adding speculative features to the repository.
