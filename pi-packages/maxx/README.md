# MAXX Pi Package

This local package is the MAXX lane for Pi.

It ships five skills:

- `maxx-onboarding`
- `maxx-gsap-motion`
- `maxx-browser-verify`
- `maxx-code-search`
- `maxx-video-dossier`

`maxx-onboarding` is the first-session setup lane. It asks plain-language questions one at a time, captures the answers, and writes `ops/reports/MAXX-ONBOARDING-HANDOFF.md` before implementation begins.

`maxx-browser-verify` is the remote browser smoke-test lane. It uses `MAXX_BROWSER_WS_ENDPOINT` with Playwright CDP instead of a local browser binary.

`maxx-video-dossier` turns a public video source into a Markdown briefing file. It uses Firecrawl for source discovery and the remote browser bridge for verification.

It also exposes a light extension for session labeling so Pi can tell when the MAXX lane is active.

Load it from the project `.pi/settings.json` and keep the rest of the session resource set empty.
