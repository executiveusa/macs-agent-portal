# Agent Context: Agent MAXX Voice & Multi-Sensory Production System

## Repository Purpose
Agent MAXX Control Plane and Portal for Stacy / MACS Digital Media. Single-brain architectural orchestrator powering Hermes Agent, autonomous Pups, Second Brain (Obsidian vault), multi-sensory hardware adapters, and production voice gateway.

## Technology Stack
- **Control Plane API:** Node.js 20, Fastify, TypeScript, Zod, Jose (JWT authentication).
- **Brain / Primary Orchestrator:** Hermes Agent (`b2c4f1f376167e7e34a88c3dbd544e1fdc848c14`).
- **Database & Auth:** Self-hosted Supabase (`supabase-db`, `supabase-pooler`, Kong on VPS `31.220.58.212`).
- **Speech Input:** OpenAI Realtime (`gpt-realtime-2.1-mini`) with browser ephemeral sessions (`POST /v1/voice/session`) and Whisper fallback (`POST /v1/voice/transcribe`).
- **Speech Output:** ElevenLabs (`eleven_flash_v2_5`, voice ID `21m00Tcm4TlvDq8ikWAM`) with OpenAI audio fallback (`POST /v1/voice/synthesize`).
- **Vision Adapters:** Extensibility layer (`MetaDATAdapter`, `VisionClawAdapter`, `PhoneCameraAdapter`, `GenericWebRTCGlassesAdapter`).
- **Frontend Portal:** React 18, Vite, Tailwind CSS, Radix UI, Lucide Icons.

## Main Directories
- `services/maxx-control-plane/`: Fastify backend handling chat, voice, vision, memory, Pups, missions, and approvals.
- `services/hermes-runtime/`: Pinned Hermes Agent container definition and entrypoints.
- `deploy/flywheel/`: VPS Flywheel deployment scripts, compose overlays, and host detection.
- `src/pages/`: React views including `MaxxChat.tsx` (Stacy voice conversation UI) and `MaxxPups.tsx`.
- `src/services/`: Frontend API clients (`controlTowerApi.ts`, `pupsApi.ts`).

## Files Modified / Added for Voice Gateway
- `services/maxx-control-plane/src/voice-gateway.ts`: Separated `SpeechInputProvider` and `SpeechOutputProvider`, OpenAI Realtime session creation, ElevenLabs TTS synthesizer.
- `services/maxx-control-plane/src/vision-gateway.ts`: Multi-sensory hardware abstraction boundary (`VisionInputAdapter`).
- `services/maxx-control-plane/src/config.ts`: Added OpenAI Realtime and ElevenLabs configuration schemas + direct JWT secret support.
- `services/maxx-control-plane/src/auth.ts`: Operator JWT authentication supporting self-hosted Supabase HS256/RS256 tokens and JWKS.
- `services/maxx-control-plane/src/app.ts`: Control plane routing for `/v1/voice/session`, `/v1/voice/transcribe`, `/v1/voice/synthesize`, `/v1/voice/health`.
- `services/maxx-control-plane/compose.coolify.yml`: Container environment forwarding for voice engine.
- `src/pages/MaxxChat.tsx`: Automatic mic streaming, auto-commit without manual Send button, ElevenLabs TTS playback, barge-in playback cancellation.
- `services/maxx-control-plane/src/phone-chat.ts`: Mobile phone chat adapter with pairing and status gateway.
- `services/phone-chat/`: Mobile real-time CDP & WebSocket companion interface.
- `services/hermes-runtime/profile/skills/maxx-phone-chat/SKILL.md`: ICM-style operating skill for mobile phone chat.

## Verification Commands & Results
- **Unit & Integration Test Suite:** `npm test` inside `services/maxx-control-plane` -> 134 passing, 0 failing, 1 skipped.
- **Frontend Production Build:** `npm run build` -> Built in 1.48s with 0 errors.
- **Live Health Diagnostics:** `GET /health/ready` -> `{"status":"ready","voice":{"enabled":true,"inputProvider":"openai","inputReady":true,"outputProvider":"elevenlabs","outputReady":true}}`.
- **Live Paid Smoke Test 1 (Utterance -> Hermes -> ElevenLabs TTS):** Succeeded (MAXX generated 1-sentence description, ElevenLabs synthesized 218KB audio stream).
- **Live Paid Smoke Test 2 (Approval Gate Recognition):** Succeeded (consequential action recognized, email stopped and held before dispatch).

## Next Recommended Steps
1. Perform in-browser voice validation on the live Stacy frontend at `https://maxx.executiveusa.com` with microphone permission.
2. Pair mobile device using `POST /v1/phone/pair` or scan QR code to connect mobile companion interface.
3. Hook up Meta DAT / camera feed streaming into `VisionInputAdapter` when smart glasses hardware is paired.
