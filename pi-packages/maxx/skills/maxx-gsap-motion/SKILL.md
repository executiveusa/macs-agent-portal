# SKILL: maxx-gsap-motion

**When to use:** Before changing any animation duration, scroll pin length, scrub value, or GSAP timeline in this project. All timing constants are in `src/config/maxxStoryConfig.ts` — edit there, not inside scene components.

---

## Scene Timing Reference

| Scene | Key | Default |
|---|---|---|
| Intro overlay | `intro.durationMs` | 4000ms |
| Intro countdown frames | `intro.countdownFrames` | 4 |
| Hero parallax | `hero.textDriftY` | `50%` |
| Briefing slide-in | `briefing.slideInDuration` | 1.5s |
| Briefing scrub | `briefing.scrubAmount` | 1 |
| Car intro pin length | `carIntro.pinLength` | `+=150%` |
| Car intro scrub | `carIntro.scrubAmount` | 1.2 |
| Car intro overlay start | `carIntro.overlayOpacityStart` | 0.9 |
| Car intro overlay end | `carIntro.overlayOpacityEnd` | 0.15 |
| Mustang pin length | `mustang.pinLength` | `+=300%` |
| Mustang scrub | `mustang.scrubAmount` | 1 |

---

## Rules

1. **Change `maxxStoryConfig.ts` first.** If it feels too fast or slow, the fix is always in the config, not in a component.
2. **Never use `duration` directly in a `ScrollTrigger` — use `scrub`.** Duration conflicts with scrub.
3. **`anticipatePin: 1`** must be present on all pinned sections or you'll see a jump on iOS.
4. **Always call `ctx.revert()`** in the `useEffect` cleanup to avoid duplicate triggers on hot reload.
5. **Test at 0.5×, 1×, and 1.5× scroll speeds** before marking a timing task complete.
6. **Mobile:** Pin length `+=150%` reads as 150% of viewport height. On mobile this is shorter in absolute pixels — verify at < 768px viewport.

---

## Common Fixes

**Scene feels too fast on scroll:**  
Increase `scrubAmount` (e.g. 1 → 2) or increase `pinLength` (e.g. `+=150%` → `+=250%`).

**Scene feels too slow / viewer has to scroll forever:**  
Decrease `pinLength`.

**Overlay doesn't lift cleanly:**  
Check `overlayOpacityEnd` — lower values (0.05–0.1) give a more dramatic reveal.

**Text fades in before the car is visible:**  
Increase the GSAP timeline position offset on the title animation (currently `0.4`).
