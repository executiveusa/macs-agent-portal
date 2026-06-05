# MAXX Pi Package

This local package is the MAXX lane for Pi.

It ships four skills:

- `maxx-onboarding`
- `maxx-gsap-motion`
- `maxx-browser-verify`
- `maxx-code-search`

`maxx-onboarding` is the first-session setup lane. It asks plain-language questions one at a time, captures the answers, and writes `ops/reports/MAXX-ONBOARDING-HANDOFF.md` before implementation begins.

It also exposes a light extension for session labeling so Pi can tell when the MAXX lane is active.

Load it from the project `.pi/settings.json` and keep the rest of the session resource set empty.
