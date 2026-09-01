# Agent Context: Agent MAXX Voice & Multi-Sensory Production System

## Repository Purpose
Agent MAXX Control Plane and Portal for Stacy / MACS Digital Media. Single-brain architectural orchestrator powering Hermes Agent, autonomous Pups, Second Brain (Obsidian vault), multi-sensory hardware adapters, production voice gateway, and Flywheel deployment lifecycle.

## Technology Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Radix UI, Lucide Icons. Deployed to Vercel (`https://macs-agent-portal-main.vercel.app`).
- **Control Plane API**: Node.js 20, Fastify, TypeScript, Zod, Jose (JWT authentication). Running on VPS `31.220.58.212:8788`.
- **Brain / Primary Orchestrator**: Pinned NousResearch Hermes Agent (`services/hermes-runtime/UPSTREAM.lock`, image `maxx-hermes:b2c4f1f37616` on port `8642`).
- **Database & Auth**: Self-hosted Supabase (`supabase-db`, `supabase-pooler`, `supabase-kong` on internal network `supabase_default`).
- **Speech Input**: OpenAI Realtime (`gpt-realtime-2.1-mini`) with browser ephemeral sessions and Whisper fallback.
- **Speech Output**: ElevenLabs (`eleven_flash_v2_5`, voice ID `21m00Tcm4TlvDq8ikWAM`) with OpenAI audio fallback.
- **Vision Adapters**: Extensibility layer (`MetaDATAdapter`, `VisionClawAdapter`, `PhoneCameraAdapter`, `GenericWebRTCGlassesAdapter`).
- **Ingress & Edge**: Vercel (Frontend) + Cloudflare Tunnel + Caddy reverse proxy (`https://api.thepaulieffect.com/maxx/*`) -> VPS Host Loopback (`127.0.0.1:8788`).
- **Deployment**: MAXX Deployment Flywheel (`deploy/flywheel/deploy.sh`, `deploy/maxx/install.sh`, `deploy/maxx/verify.sh`).

## Main Directories
- `src/` — React frontend application, UI components, pages (`MaxxChat.tsx`, `MaxxPups.tsx`, `Index.tsx`), hooks, contexts, and API clients.
- `services/maxx-control-plane/` — Fastify backend service managing Pups, handoffs, workflows, event ingress, voice, vision, approvals, memory, and model routing.
- `services/hermes-runtime/` — Pinned Hermes container build and runtime overlay.
- `services/second-brain-worker/` — Background worker syncing durable state and embeddings into `/data/maxx/memory`.
- `deploy/flywheel/` — Provider-neutral deployment scripts (`bootstrap-vps.sh`, `deploy.sh`, `rollback.sh`, `detect-host.sh`, `compose.split.yml`).
- `deploy/maxx/` — Canonical installer (`install.sh`), environment templates, and verification suite (`verify.sh`).
- `supabase/migrations/` — Database schema migrations.

## Full-Stack Production Hardening & Recovery Results
1. **Zero Auth Bypass**: Removed temporary bypass flag `TEMP_PUBLIC_DASHBOARD` across control plane, frontend router, and AuthContext. Re-enabled passwordless magic link and Supabase JWT authentication.
2. **Strict CORS Policy**: Configured production domain whitelist (`macs-agent-portal-main.vercel.app`, `macs-agent-portal-pi.vercel.app`, `thepaulieffect.com`, `executiveusa.com`) rejecting untrusted origins with 401 / no CORS headers.
3. **Pup Profile Multiplexing**: Provisioned and registered all 3 bounded Pup profiles (`chief-pup`, `superdoer`, `business-pup`) in Hermes gateway with isolated execution context and personality files (`SOUL.md`).
4. **Governed Pup Delegation Verified**: Successfully executed bounded one-hop delegation from Chief Pup (`Scout`) to Superdoer (`Doer`), returning HTTP 202 Accepted and creating durable records in `maxx_pup_handoffs` and `maxx_missions`.
5. **Database Migration & Resiliency**: Migrated `maxx_pup_handoffs` run/mission ID columns to text format and eliminated silent in-memory fallback on database operations.
6. **Live Production Smoke Verification**: 100% test pass rate across backend (139/140 node tests), frontend (Vite build + Vitest + ESLint), client SDK, and live production endpoints on VPS.
7. **Bambu Personal Hermes Isolation**: Preserved complete isolation; zero references to `executiveusa/pauli-hermes-agent` or port 4800 in runtime code.

## Verification & Build Commands
- Frontend Production Build: `npm run build`
- Frontend Test Suite: `npm test`
- Control Plane Test Suite: `npm test --prefix services/maxx-control-plane`
- Client SDK Test Suite: `npm test --prefix packages/client-sdk`
- VPS Deploy Verification: `bash deploy/maxx/verify.sh`
