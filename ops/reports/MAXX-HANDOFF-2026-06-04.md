# MAXX Handoff - 2026-06-04

## Repo State

- Repo: `E:\ACTIVE PROJECTS-PIPELINE\ACTIVE PROJECTS-PIPELINE\macs-agent-portal`
- Branch: `main`, tracking `origin/main`
- Last pre-BRAVO commit observed: `071e11964af9bea1bc2aa5e9092214735975cd61`
- Stack: React 18, TypeScript, Vite, Tailwind, GSAP, FastAPI BFF, local Pi package lane
- Package manager for this continuation: `npm`

## Current Surface

- Public story route: `src/pages/Index.tsx`
- Intro overlay and countdown: `src/components/site/IntroSequence.tsx`
- Soundtrack wiring: `src/components/layout/ShellLayout.tsx`
- Hero scene: `src/components/scenes/HeroScene.tsx`
- Briefing scene: `src/components/scenes/BriefingScene.tsx`
- Current Mustang/platform scene: `src/components/scenes/MustangScene.tsx`
- Outcome scenes: `src/components/scenes/OutcomeChaptersScene.tsx`
- Final mission scene: `src/components/scenes/FinalMissionScene.tsx`
- Scene data: `src/config/scenesConfig.ts`
- Motion timing and navigation chapters: `src/config/maxxStoryConfig.ts`
- Backend operator boundary: `backend/maxx_bff/main.py`, `backend/maxx_bff/settings.py`, `backend/maxx_bff/catalog.py`
- Pi lane: `.pi/settings.json`, `pi-packages/maxx/README.md`, `pi-packages/maxx/extensions/index.ts`

## Evidence

- Fresh repo-root verification confirmed `.git`, `package.json`, `src`, `tailwind.config.ts`, `AGENTS.md`, and `CLAUDE.md`.
- Repo directives require EMERALD TABLETS(TM) compliance, frontend/backend lane separation, direct imports, no `vendor/` edits, no `EMERALD-TABLETS/` edits, and ops reporting under `ops/reports/`.
- The saved implementation plan is `docs/superpowers/plans/2026-06-04-maxx-pi-self-setup-agent.md`.
- Current plan says prior browser verification and `npm run build` had passed before this BRAVO continuation. Those are prior-session facts and must be re-verified before final completion.
- jCodeMunch is installed locally, but the exposed interface in this session is not a usable retrieval tool. Direct reads have been kept targeted.

## Pending Work

- Add a plain-language Pi onboarding skill for MAXX.
- Wire that skill into the local MAXX Pi package without removing existing skills.
- Add a dedicated car intro/reveal scene before the current platform hotspot scene.
- Use a repo-local car asset path and keep the SeedDance brief documented because no SeedDance generator is available in this session.
- Re-run `npm run build` and, if possible, browser-check the intro to car reveal path.
- Write `ops/reports/BRAVO-COMPLETE.md` with commit, build, and blocker evidence.

## Systems Map

- Stocks: frontend scene config, Pi package settings, BFF catalogs, static MAXX asset folders, ops reports.
- Flows: intro completion event, music event, scroll-triggered scene progression, Pi skill discovery, BFF guarded catalog writes.
- Feedback loops: build verification, browser verification, ops reports, operator-key write guard, handoff notes.
- Leverage point: LP4 information flow. The handoff makes current state and next work legible to the next agent without broad rediscovery.

## Resume Prompt

Continue in `E:\ACTIVE PROJECTS-PIPELINE\ACTIVE PROJECTS-PIPELINE\macs-agent-portal` only. Use `npm`. Preserve the cinematic frontend and backend operator split. Do B2 Pi onboarding, B3 car reveal scene, B4 story/music alignment, then B5 verification and `ops/reports/BRAVO-COMPLETE.md`. Do not touch `vendor/` or `EMERALD-TABLETS/`.
