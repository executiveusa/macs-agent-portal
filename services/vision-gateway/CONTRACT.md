# MAXX Eyes — vision edge contract

MAXX Eyes is a future native companion for Android/Samsung and compatible Meta glasses. It is **not required** for the current private web/PWA release.

## Reference

VisionClaw is pinned in `UPSTREAM.lock` because it already demonstrates Android/Samsung phone-camera mode, Meta glasses capture, realtime audio/vision, and a tool-call bridge. MAXX reuses those edge patterns without adopting OpenClaw as another orchestrator.

## Locked path

```text
Samsung phone or compatible Meta glasses
  -> MAXX Eyes native client
  -> scene/voice understanding edge
  -> MAXX API credential/session
  -> MAXX control plane
  -> dedicated MAXX Hermes
  -> skills/tools/subagents
  -> evidence-backed result
```

## Integration modes

### Assist mode
Realtime phone/glasses vision and voice. A realtime multimodal provider may maintain low-latency conversation, but real-world actions route through the MAXX API/Hermes authority boundary.

### Observe frame mode
The native client can send a bounded image/frame plus user instruction to a future authenticated MAXX vision endpoint. Hermes' multimodal path performs the analysis and task routing.

### Live-share mode
POV streaming to an authorized viewer is a separate capability. Do not imply that realtime assistant audio and browser WebRTC share are simultaneously verified unless they have been tested together in the MAXX fork.

## Credential rules

- No shared token compiled into the Android application.
- Authenticate each installation/user separately.
- Vision provider secrets, Hermes key, and Supabase service-role key never ship in the app.
- Client gets only the credential/session required to call the MAXX edge/API.

## Privacy

Camera/audio are sensitive by default. Prefer transient processing. Persist frames, recordings, transcripts, locations, or faces only when the requested mission requires it and the retention purpose is explicit.

## Android product target

The web app remains installable as a PWA today. A native Galaxy S25 companion can later add:
- phone camera / Meta DAT integration;
- background microphone where platform policy permits;
- Android share sheet;
- notifications;
- app intents/deep links;
- device sensors/location only with explicit permission;
- a one-tap handoff back to the private MAXX conversation.

The native app must remain optional: the MAXX API and Hermes runtime work without it.
