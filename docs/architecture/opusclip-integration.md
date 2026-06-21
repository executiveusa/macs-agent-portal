# Agent Maxx OpusClip Integration

## Objective

Add a backend-only media execution lane so Agent Maxx can turn owned or licensed long-form video into short clips, transcripts, share links, social copy, and gated publishing actions through OpusClip.

## System Map

- Stock: `OPUSCLIP_API_KEY` in runtime environment, never source.
- Stock: OpusClip projects, clips, transcripts, templates, social accounts, schedules, and usage state.
- Flow: `scripts/maxx-opusclip.mjs` calls `scripts/lib/maxx-opusclip-client.mjs`, which calls the OpusClip API.
- Flow: Agent Maxx routes media commands through Pi skill metadata and registry entries.
- Feedback loop: `usage` checks account limits before large submissions.
- Circuit breaker: confirmation flags block owned-content, publish, schedule, thumbnail, and edit-cost actions.
- Observation: CLI responses return JSON; material workflow outputs should be written under `ops/reports/`.

## API Surface

The client defaults to `https://api.opus.pro/api` and reads:

- `OPUSCLIP_API_KEY`: required for API calls.
- `OPUSCLIP_BASE_URL`: optional override for test or staging.
- `MAXX_OPUSCLIP_DEFAULT_DURATIONS`: optional, defaults to `30,60,90`.
- `MAXX_OPUSCLIP_DEFAULT_MODEL`: optional, defaults to `ClipBasic`.
- `MAXX_OPUSCLIP_DEFAULT_ASPECT`: optional, defaults to `portrait`.

## Guardrails

- Do not hardcode credentials.
- Do not print environment values.
- Do not submit videos unless the owned/licensed-content confirmation flag is present.
- Publishing and scheduling require explicit command flags.
- Credit-bearing thumbnail and edit actions require explicit command flags.
- Avoid batch loops over publish, schedule, thumbnail, or edit operations without fresh human approval.

## Commands

```bash
npm run maxx:opusclip -- --help
npm run maxx:opusclip -- usage
npm run maxx:opusclip -- templates
npm run maxx:opusclip -- submit --url "https://youtube.com/watch?v=..." --durations "30,60,90" --confirm-owned
npm run maxx:opusclip -- list --project PROJECT_ID
npm run maxx:opusclip -- describe --project PROJECT_ID --clip CLIP_ID
npm run maxx:opusclip -- transcript --project PROJECT_ID
npm run maxx:opusclip -- share --project PROJECT_ID
npm run maxx:opusclip -- accounts
npm run maxx:opusclip -- generate-copy --project PROJECT_ID --clip CLIP_ID --account ACCOUNT_ID --prompt "tone"
npm run maxx:opusclip -- publish --project PROJECT_ID --clip CLIP_ID --account ACCOUNT_ID --title "Title" --confirm-publish
npm run maxx:opusclip -- schedule --project PROJECT_ID --clip CLIP_ID --account ACCOUNT_ID --title "Title" --at 2026-06-30T15:00:00Z --confirm-schedule
```

## Routing

Agent Maxx treats this as `media_execution`. The dashboard service returns metadata that points an operator to `maxx-opusclip`; it does not call OpusClip from the browser.
