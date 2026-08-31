# Agent Context: Agent MAXX Voice & Multi-Sensory Production System

## Repository Purpose
Agent MAXX Control Plane and Portal for Stacy / MACS Digital Media. Single-brain architectural orchestrator powering Hermes Agent, autonomous Pups, Second Brain (Obsidian vault), multi-sensory hardware adapters, production voice gateway, and Flywheel deployment lifecycle.

## Technology Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Radix UI, Lucide Icons. Deployed to Vercel (`https://macs-agent-portal-pi.vercel.app`).
- **Control Plane API**: Node.js 20, Fastify, TypeScript, Zod, Jose (JWT authentication). Running on VPS `31.220.58.212:8788`.
- **Brain / Primary Orchestrator**: Pinned NousResearch Hermes Agent (`services/hermes-runtime/UPSTREAM.lock`, image `maxx-hermes:b2c4f1f37616` on port `8642`).
- **Database & Auth**: Self-hosted Supabase (`supabase-db`, `supabase-pooler`, `supabase-kong` on internal network `supabase_default`).
- **Speech Input**: OpenAI Realtime (`gpt-realtime-2.1-mini`) with browser ephemeral sessions and Whisper fallback.
- **Speech Output**: ElevenLabs (`eleven_flash_v2_5`, voice ID `21m00Tcm4TlvDq8ikWAM`) with OpenAI audio fallback.
- **Vision Adapters**: Extensibility layer (`MetaDATAdapter`, `VisionClawAdapter`, `PhoneCameraAdapter`, `GenericWebRTCGlassesAdapter`).
- **Ingress & Edge**: Cloudflare Pages / Vercel (Frontend) + Cloudflare Tunnel `agent-maxx-bff` + Caddy reverse proxy (`https://api.thepaulieffect.com/maxx/*`) -> VPS Host Loopback (`127.0.0.1:8788`).
- **Deployment**: MAXX Deployment Flywheel (`deploy/flywheel/deploy.sh`, `deploy/maxx/install.sh`, `deploy/maxx/verify.sh`).

## Main Directories
- `src/` — React frontend application, UI components, pages (`MaxxChat.tsx`, `MaxxPups.tsx`, `Index.tsx`), hooks, contexts, and API clients.
- `services/maxx-control-plane/` — Fastify backend service managing Pups, handoffs, workflows, event ingress, voice, vision, approvals, memory, and model routing.
- `services/hermes-runtime/` — Pinned Hermes container build and runtime overlay.
- `services/second-brain-worker/` — Background worker syncing durable state and embeddings into `/data/maxx/memory`.
- `deploy/flywheel/` — Provider-neutral deployment scripts (`bootstrap-vps.sh`, `deploy.sh`, `rollback.sh`, `detect-host.sh`, `compose.split.yml`).
- `deploy/maxx/` — Canonical installer (`install.sh`), environment templates, and verification suite (`verify.sh`).
- `supabase/migrations/` — Database schema migrations.

## Server Execution Operator Recovery Results (Phases 1–7)
1. **Hermes Isolation Enforced**: Bambu's personal Hermes (`/root/hermes-manual-home` on port 4800) remains completely isolated. MAXX operates strictly on its own pinned Hermes runtime (`maxx-hermes` on container port 8642).
2. **Database Bridge Configured**: Connected `maxx-control-plane` and `maxx-second-brain-worker` to internal Docker network `supabase_default` via `deploy/flywheel/compose.split.yml`, resolving database queries in <10ms.
3. **Pup Profile Authentication & Governance**: Aligned profile endpoint authentication in `hermes-adapter.ts` and hardened Pup handoff repository in `pup-broker.ts`.
4. **Governed Handoff Verified**: Tested delegation from Chief Pup (`Scout`) to Superdoer Pup (`Doer`) returning HTTP 202 Accepted (`status: queued`, `dispatch: 202`).
5. **Persistence Across Reboots**: Restarted services and confirmed Pup fleet identity and handoff state persist across container cycles.
6. **Full Verification Suite Passed**: 8/8 tests pass in `deploy/maxx/verify.sh` with Exit Code 0.

## Verification & Build Commands
- Frontend Production Build: `npm run build`
- Production Verification Suite: `bash deploy/maxx/verify.sh`
- Flywheel Deploy: `sudo MAXX_PROFILE=business MAXX_DEPLOY_TOPOLOGY=cloudflare-split MAXX_DOMAIN=api.thepaulieffect.com MAXX_ENV_FILE=/opt/maxx/secrets/maxx.env bash deploy/flywheel/deploy.sh`
