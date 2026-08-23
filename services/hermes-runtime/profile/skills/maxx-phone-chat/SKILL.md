---
name: maxx-phone-chat
description: Manage and coordinate mobile phone chat & remote control sessions for Stacy / Operator, enforcing ICM discipline, instant CDP/WebSocket mirroring, and approval gates.
---

# MAXX Phone Chat & Mobile Remote Skill

## Mission & Purpose
Provides real-time mobile remote control and monitoring for Stacy and the operator. Connects the user's smartphone (iOS Safari, Android Chrome, Progressive Web App) to the live Agent MAXX / Hermes engine and Antigravity workspace with sub-100ms mirroring.

## 8-Stage ICM Lifecycle for Phone Interaction

1. **Stage 1 (Mobile Ingest / Pairing):**
   - User pairs their mobile phone via QR code or short-lived 6-digit passcode.
   - User initiates conversation via spoken voice, typed text, or photo upload from their phone camera.
   - Request enters the authenticated MAXX Control Plane (`POST /v1/chat` or `POST /v1/voice/session`).

2. **Stage 2 (Inspect & Context Load):**
   - MAXX loads only the relevant stage context from `/opt/data/product-context/icm/maxx/<stage>/CONTEXT.md` and active Second Brain notes.
   - Inspects active tool states and terminal sessions before proposing action.

3. **Stage 3 (Plan & Decompose):**
   - MAXX generates the concise execution plan.
   - Formulates plan cards formatted for mobile viewport (clear bullets, no wall of text).

4. **Stage 4 (Approval Gate - Phone Surface):**
   - If action involves external messaging (email, SMS, social post, phone call, cloud mutation), MAXX emits a `waiting_for_approval` state.
   - Renders interactive [ Approve ] / [ Reject ] card on the user's mobile screen.
   - Holds all execution until explicit operator touch.

5. **Stage 5 (Execute / Dispatch):**
   - Dispatches approved tools, connected apps, or Pup specialists.
   - Streams live thoughts, terminal progress, and tool calls to the phone in real-time.

6. **Stage 6 (Verify & Harden):**
   - Validates outputs against binary pass/fail criteria.
   - Captures evidence artifact.

7. **Stage 7 (Yield to Mobile):**
   - Emits clean outcome to phone: concise summary, action cards, and voice audio stream (ElevenLabs / browser speech).

8. **Stage 8 (Persist to Second Brain):**
   - Automatically logs key decision, summary, and action items to the Stacy Obsidian Second Brain vault (`/vault/Daily/` or `/vault/Projects/`).

## Operational Rules
- Never expose raw API keys or machine credentials to the mobile browser.
- Respect barge-in: If the user speaks or taps while MAXX is speaking, immediately pause playback and capture new input.
- Keep mobile responses punchy, direct, and actionable.
