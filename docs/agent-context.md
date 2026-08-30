# Agent Context: Agent MAXX Voice & Multi-Sensory Production System

## Repository Purpose
Agent MAXX Control Plane and Portal for Stacy / MACS Digital Media. Single-brain architectural orchestrator powering Hermes Agent, autonomous Pups, Second Brain (Obsidian vault), multi-sensory hardware adapters, production voice gateway, and Flywheel deployment lifecycle.

## Technology Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Radix UI, Lucide Icons.
- **Control Plane API**: Node.js 20, Fastify, TypeScript, Zod, Jose (JWT authentication).
- **Brain / Primary Orchestrator**: Pinned NousResearch Hermes Agent (`services/hermes-runtime/UPSTREAM.lock`).
- **Database & Auth**: Self-hosted Supabase (`supabase-db`, `supabase-pooler`, Kong on VPS `31.220.58.212`).
- **Speech Input**: OpenAI Realtime (`gpt-realtime-2.1-mini`) with browser ephemeral sessions and Whisper fallback.
- **Speech Output**: ElevenLabs (`eleven_flash_v2_5`, voice ID `21m00Tcm4TlvDq8ikWAM`) with OpenAI audio fallback.
- **Vision Adapters**: Extensibility layer (`MetaDATAdapter`, `VisionClawAdapter`, `PhoneCameraAdapter`, `GenericWebRTCGlassesAdapter`).
- **Ingress & Edge**: Cloudflare Pages / Vercel (Frontend) + Cloudflare Tunnel (`api.maxx.<DOMAIN>`) -> VPS Host Loopback (`127.0.0.1:8788`).
- **Deployment**: MAXX Deployment Flywheel (`deploy/flywheel/deploy.sh`, `deploy/maxx/install.sh`, `deploy/maxx/verify.sh`).

## Main Directories
- `src/` — React frontend application, UI components, pages (`MaxxChat.tsx`, `MaxxPups.tsx`, `Index.tsx`), hooks, contexts, and API clients.
- `services/maxx-control-plane/` — Fastify backend service managing Pups, handoffs, workflows, event ingress, voice, vision, approvals, memory, and model routing.
- `services/hermes-runtime/` — Pinned Hermes container build and runtime overlay.
- `services/second-brain-worker/` — Background worker syncing durable state and embeddings into `/data/maxx/memory`.
- `deploy/flywheel/` — Provider-neutral deployment scripts (`bootstrap-vps.sh`, `deploy.sh`, `rollback.sh`, `detect-host.sh`, `compose.split.yml`).
- `deploy/maxx/` — Canonical installer (`install.sh`), environment templates, and verification suite (`verify.sh`).
- `supabase/migrations/` — Database schema migrations.

## Hardening Gate Applied
1. **Cloudflare Split Topology**: Added `MAXX_DEPLOY_TOPOLOGY=cloudflare-split` and `compose.split.yml` to bind the control plane strictly to `127.0.0.1:8788`, allowing Cloudflare Tunnel to handle API ingress without VPS port conflicts.
2. **Supabase Security Migration**: Created `20260821000000_maxx_hardening_gate.sql` guaranteeing `public.handle_updated_at()` exists and setting `public.is_control_tower_operator()` to `SECURITY INVOKER`.
3. **Control Plane Port Publication**: Changed compose defaults from broad host publication to `expose: - "8787"` and host-loopback publication (`127.0.0.1:8788:8787`).
4. **Secret Manifest Safety**: Hardened Flywheel run evidence to record sanitized secret manifests (variable names, mode, sha256 checksum) instead of plaintext `.env` snapshots.
5. **Comprehensive Verifier**: Expanded `deploy/maxx/verify.sh` to test liveness, readiness, 401 unauthorized rejection, normal chat, Power Mode, Pups directory, workflows, and event idempotency.

## Verification & Build Commands
- Frontend Production Build: `npm run build`
- Local Verification Suite: `bash deploy/maxx/verify.sh`
- Flywheel Deploy: `sudo MAXX_PROFILE=business MAXX_DEPLOY_TOPOLOGY=cloudflare-split MAXX_DOMAIN=api.maxx.<DOMAIN> MAXX_ENV_FILE=/opt/maxx/secrets/maxx.env bash deploy/flywheel/deploy.sh`
