# MAXX Pi Package

The local agent lane for the MAXX-POST project. Loaded by the Pi runtime via `.pi/settings.json`.

## Skills

| Skill | Purpose |
|---|---|
| `maxx-onboarding` | **Runs first on every fresh session.** Asks plain-language questions before touching code. Saves answers to `ops/reports/` so the next session resumes without re-asking. |
| `maxx-gsap-motion` | GSAP timing and scroll-trigger guidance. Use before changing animation durations or pin behavior. |
| `maxx-browser-verify` | Step-by-step browser verification checklist. Use before marking a visual task complete. |
| `maxx-code-search` | Exact-symbol token-saving search. Use to find a specific component or config key without reading whole files. |

## Quick Start

Open the Pi lane, then let the onboarding skill run. It will ask you 11 questions in plain English—no code knowledge required. Once you answer, the session has everything it needs to build the next slice.

## File Layout

```
pi-packages/maxx/
  package.json              ← Pi manifest
  README.md                 ← This file
  extensions/index.ts       ← Registers all four skills
  skills/
    maxx-onboarding/SKILL.md
    maxx-gsap-motion/SKILL.md
    maxx-browser-verify/SKILL.md
    maxx-code-search/SKILL.md
```

## Notes

- Do not spread agent logic into scene components. Keep it here.
- When the SeedDance car intro asset arrives, drop it in `public/MUSTANG MAXX/CAR INTRO/` and update `src/config/scenesConfig.ts` → `car_intro.visualContent`.
- Timing constants for all scenes live in `src/config/maxxStoryConfig.ts`. Never hardcode durations in component files.
