# MAXX OpusClip Integration Report

## Status

Backend-only integration implemented.

Full release verification is blocked locally because `npm ci` repeatedly timed out and left `node_modules` without `.bin/eslint` or `.bin/vite`.

## Scope

- Added an OpusClip API client and CLI bridge.
- Added the `maxx-opusclip` Pi skill.
- Added Agent Max routing metadata for media execution commands.
- Added registry and workflow blueprint entries.
- Added deployment and source-map docs.
- Added rollback checkpoint helpers.
- Added `vercel.json` SPA fallback after production route testing showed direct React Router links returned Vercel 404s.

No visual frontend surfaces were edited.

## Rollback

- Checkpoint: `.maxx-rollback/20260620T213030Z`
- Target commit: `42677fab9d8b3f78ca85e7ab60c3d6acdda6caac`
- Dry-run command: `node scripts/maxx-rollback.mjs --latest --dry-run`
- Bash syntax check was blocked by Windows WSL having no installed distribution.

## Validation Completed

- JSON parse: `package.json`, `pi-packages/maxx/package.json`, skill registry, workflow blueprints.
- Node syntax: OpusClip client, OpusClip CLI, checkpoint helper, rollback helper.
- Skill validation: `pi-packages/maxx/skills/maxx-opusclip`.
- CLI help: `node scripts/maxx-opusclip.mjs --help`.
- Missing key path: `node scripts/maxx-opusclip.mjs usage` fails clearly without network work.
- Missing ownership gate: `node scripts/maxx-opusclip.mjs submit --url https://example.com/video.mp4 --durations 30` prints the copyright notice and fails on `--confirm-owned`.
- Rollback dry-run: passed.
- Diff whitespace check: passed.
- Secret scan: no raw OpusClip key found; only env placeholders and runtime bearer-template code.
- Production `/` browser smoke: passed. Homepage showed `ONE AGENT`, briefing, Mustang content, and no console errors.
- Production intro control: passed. `Begin` was uniquely found and clicked.

## Validation Blocked

- `npm run lint`: blocked because `eslint` shim is missing after dependency install failures.
- `npm run build`: blocked because `vite` shim is missing after dependency install failures.
- `npm ci --no-audit --no-fund --ignore-scripts`: timed out multiple times while fetching packages through the npm registry.
- `bun install --frozen-lockfile`: blocked because `bun.lockb` would change and Bun does not support the nested npm `overrides` in this package manifest.
- `bun run lint` and `bun run build`: blocked because `eslint` and `vite` are missing from the incomplete local install.
- Production deep routes `/dashboard`, `/shop`, `/admin`, `/blog`, and `/signin`: currently return Vercel `404: NOT_FOUND` until the new `vercel.json` rewrite is built and deployed.

## Live API Calls

No live OpusClip API call was made. `OPUSCLIP_API_KEY` was not present in the runtime environment during validation.

## Guardrails

- `OPUSCLIP_API_KEY` is runtime-only.
- `submit` requires `--confirm-owned`.
- `publish` requires `--confirm-publish`.
- `schedule` and `cancel-schedule` require `--confirm-schedule`.
- `thumbnail` requires `--confirm-cost`.
- `censor` requires `--confirm-edit-cost`.
- The CLI prints the required copyright notice before project submission.
