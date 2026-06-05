# MAXX-POST Handoff — 2026-06-04

## Status at Handoff

Branch: `claude/admiring-galileo-AOM9V` tracking `origin/claude/admiring-galileo-AOM9V`  
Last verified build: `npm run build` passes.  
Dev server: `npm run dev` → `http://127.0.0.1:8080/`

---

## What Exists (Verified in Repo)

### Frontend — React 18 / Vite / TypeScript / GSAP

| File | Role |
|---|---|
| `src/pages/Index.tsx` | Story shell: IntroSequence → HeroScene → BriefingScene → CarIntroScene → MustangScene → Mission placeholder |
| `src/components/site/IntroSequence.tsx` | Full-screen intro overlay; countdown frames; Escape skip; Tab trap; `maxx_intro_seen` localStorage gate |
| `src/components/scenes/HeroScene.tsx` | GSAP parallax hero; full-body MAXX visible; reads `scenesConfig.hero` |
| `src/components/scenes/BriefingScene.tsx` | Dossier slide-in; Agent 006 profile photo; reads `scenesConfig.briefing` |
| `src/components/scenes/CarIntroScene.tsx` | Cinematic scroll-pinned car reveal; low-angle; `object-contain` keeps full vehicle in frame |
| `src/components/scenes/MustangScene.tsx` | Interactive hotspot overlay on car; reads `scenesConfig.the_car` |
| `src/components/layout/ShellLayout.tsx` | Master shell; noise overlay; nav; audio element wired to `/audio/maxx-intro.mp3` |
| `src/config/scenesConfig.ts` | Asset paths and copy for all scenes |
| `src/config/maxxStoryConfig.ts` | Timing constants shared across scenes (durations, scrub values, skip keys) |

### Pi Package (Local Agent Lane)

| File | Role |
|---|---|
| `.pi/settings.json` | Pi runtime config; loads MAXX package; sets onboarding as default first step |
| `pi-packages/maxx/package.json` | Pi package manifest |
| `pi-packages/maxx/README.md` | Human-readable Pi package guide |
| `pi-packages/maxx/extensions/index.ts` | Extension registration (onboarding, gsap-motion, browser-verify, code-search) |
| `pi-packages/maxx/skills/maxx-onboarding/SKILL.md` | Plain-language interview; 11 questions; saves answers to handoff note |
| `pi-packages/maxx/skills/maxx-gsap-motion/SKILL.md` | GSAP timing guidance |
| `pi-packages/maxx/skills/maxx-browser-verify/SKILL.md` | Browser verification steps |
| `pi-packages/maxx/skills/maxx-code-search/SKILL.md` | Exact-symbol search guidance |

### Assets

| Path | Notes |
|---|---|
| `public/MUSTANG MAXX/HERO FULL PAGE IMAGE/ChatGPT Image Dec 10, 2025, 01_05_29 PM.png` | Hero background — full-body MAXX character |
| `public/MUSTANG MAXX/006/ChatGPT Image Jun 19, 2025, 01_06_02 PM.png` | Briefing dossier photo |
| `public/MUSTANG MAXX/MUSTANG MAXX/ChatGPT Image Jun 19, 2025, 01_04_31 PM.png` | MustangScene interactive hotspot image |
| `public/MUSTANG MAXX/CAR INTRO/` | **Placeholder directory — awaiting SeedDance asset** |
| `public/audio/maxx-intro.mp3` | **Placeholder path — drop the supplied MP3 here to activate soundtrack** |

---

## What Is Verified Working

- Story flow renders: Intro overlay → Hero → Briefing → Car Reveal → Mustang hotspots → Mission placeholder.
- GSAP scroll-pinning active on HeroScene and MustangScene.
- CarIntroScene uses `object-contain` so the full vehicle stays in frame.
- IntroSequence checks `localStorage` so repeat visitors skip the overlay.
- Audio element present in ShellLayout; plays silently if MP3 is missing.
- `npm run build` passes (TypeScript, no import errors).

---

## What Is Still Pending

- [ ] **SeedDance car intro asset** — drop the generated image/video into `public/MUSTANG MAXX/CAR INTRO/` and update `scenesConfig.car_intro.visualContent`.
- [ ] **Soundtrack MP3** — drop the supplied file at `public/audio/maxx-intro.mp3`.
- [ ] **Backend write gates** — `backend/maxx_bff/` directory created; `main.py`, `settings.py`, `catalog.py` stubs still needed for the operator API key boundary.
- [ ] **Onboarding interview answers** — run the Pi onboarding skill and save the answers so the next session inherits the user's choices.
- [ ] **Final copy pass** — outcome-based language audit on all scene copy.
- [ ] **Mobile timing QA** — verify car reveal timing on viewport < 768px.

---

## Quick-Start Commands for Next Session

```bash
git status --short --branch
cat .pi/settings.json
cat pi-packages/maxx/README.md
cat src/pages/Index.tsx
cat src/components/site/IntroSequence.tsx
npm run build
# then open http://127.0.0.1:8080/ in browser
```

---

## Key Decisions Recorded

1. **Pi lane is local** — agent logic stays in `pi-packages/maxx/`, not scattered across scene components.
2. **Onboarding asks first** — the Pi onboarding skill interviews the human in plain language before any code is written.
3. **`object-contain` for car** — ensures full vehicle visible on any viewport; do not change to `object-cover` without a confirmed full-frame asset.
4. **Timing lives in `maxxStoryConfig.ts`** — never hardcode durations inside scene components.
5. **SeedDance brief**: Cinematic reveal of the Mustang MAXX, full vehicle centered in frame, low-angle perspective, noir lighting, wet reflective pavement, black and orange accents, no crop, no extra vehicles, no people in front of the car, no text, premium and dramatic, designed for a scroll-pinned website intro.
