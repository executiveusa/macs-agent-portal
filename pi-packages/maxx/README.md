# MAXX Pi Package

This local package is the MAXX lane for Pi.

It ships seven skills:

- `maxx-onboarding`
- `maxx-gsap-motion`
- `maxx-browser-verify`
- `maxx-code-search`
- `maxx-video-dossier`
- `maxx-software-factory`
- `maxx-skill-router`

`maxx-onboarding` is the first-session setup lane. It asks plain-language questions one at a time, captures the answers, and writes `ops/reports/MAXX-ONBOARDING-HANDOFF.md` before implementation begins.

`maxx-browser-verify` is the remote browser smoke-test lane. It uses `MAXX_BROWSER_WS_ENDPOINT` with Playwright CDP instead of a local browser binary.

`maxx-video-dossier` turns a public video source into a Markdown briefing file. It uses Firecrawl for source discovery and the remote browser bridge for verification.

`maxx-software-factory` installs the lazy-loaded skill router, README audit workflow, registry scaffolding, and software-factory blueprints for Agent Maxx. It is instruction-first and should only load the specific tools needed for the active task.

`maxx-skill-router` is the lightweight decision layer that chooses the minimum MAXX skill set for the task before any broader factory docs load.

It also exposes a light extension for session labeling so Pi can tell when the MAXX lane is active.

Load it from the project `.pi/settings.json` and keep the rest of the session resource set empty.
