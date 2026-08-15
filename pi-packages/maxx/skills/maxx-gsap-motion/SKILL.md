---
name: maxx-gsap-motion
description: Maintain the public 006/MAXX story motion system without leaking experimental animation into Stacy's private chat UI.
---

# MAXX public-story motion

Use only for the public Agent 006 landing/story experience. Stacy's private `/dashboard` is intentionally restrained and should not inherit cinematic scroll/pin behavior.

## Canonical timing source

Read `src/config/maxxStoryConfig.ts` before changing scene timing. Current keys live primarily under `maxxMotionTiming` rather than hard-coded component durations.

Important current values include:

- `introFrameDuration`
- `introExitDuration`
- `heroTextShift`
- `briefingStart`, `briefingEnd`, `briefingScrub`
- `carIntroEnd`, `carIntroScrub`
- `mustangEnd`, `mustangScrub`
- `techSpecsStart`, `techSpecsEnd`, `techSpecsScrub`
- `chapterStart`, `chapterDuration`, `chapterStagger`
- `finaleStart`, `finaleCopyDuration`, `finaleCardDuration`

Do not rely on an old timing table; inspect the current config first.

## Rules

1. Change the central config before scattering numeric timing changes through scene components.
2. For GSAP React effects, scope animations and clean them up on unmount/re-render.
3. Pinned sections must be tested for jump/reflow behavior on desktop and mobile.
4. ScrollTrigger scrub/pin decisions should not block keyboard navigation or the primary CTA.
5. Motion must respect `prefers-reduced-motion`; important information and CTAs remain available without scroll choreography.
6. Image motion must preserve the approved subject/car framing at representative mobile and desktop viewports.
7. Do not add glow/neon/cyberpunk effects merely because MAXX is an AI character. The product direction is cinematic but grounded.
8. MAXX Mode animation belongs to the private avatar state and uses its own restrained component transition; do not couple it to public GSAP timelines.

## Verification

After a motion change:

- `npm run build` must pass;
- run `maxx-browser-verify` on the affected public scenes;
- inspect at roughly 390px mobile and 1280px+ desktop;
- test reduced-motion behavior where the changed component participates in scroll animation;
- report exactly which viewports/paths were actually exercised.

A smooth local scroll recording is not sufficient proof if the production build or mobile route was not tested.
