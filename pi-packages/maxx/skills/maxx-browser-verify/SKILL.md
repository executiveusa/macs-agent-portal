# SKILL: maxx-browser-verify

**When to use:** After any visual or interaction change, before marking a task complete. Run the checklist below in the browser at `http://127.0.0.1:8080/`.

---

## Verification Checklist

### Intro Sequence
- [ ] Intro overlay appears on first load (clear `localStorage.maxx_intro_seen` first if needed).
- [ ] All 4 countdown frames cycle.
- [ ] Escape key dismisses the overlay.
- [ ] Clicking "skip" dismisses the overlay.
- [ ] On second load, overlay does NOT appear (localStorage gate active).
- [ ] Focus is trapped inside the overlay while it is visible.

### Hero Scene
- [ ] Full-body MAXX character is visible and not cropped on desktop (1280px+).
- [ ] Full-body MAXX character is visible and not cropped on mobile (375px).
- [ ] Parallax text drifts up as you scroll down.
- [ ] "Scroll to Initialize" bounce animation is present.

### Briefing Scene
- [ ] Agent 006 dossier photo slides in from the left on scroll.
- [ ] Text block slides in from the right.
- [ ] "Read Dossier" button is visible and hoverable.

### Car Intro Scene
- [ ] Full car is visible — no roofline or front fascia cropped.
- [ ] Dark overlay lifts as you scroll through the pin.
- [ ] Title and "ASSET DECLASSIFIED" label fade in mid-reveal.
- [ ] Orange and cyan edge accents are visible.
- [ ] Scene transitions cleanly into MustangScene below.

### Mustang Scene (Interactive Hotspots)
- [ ] Hotspot dots are visible.
- [ ] Clicking a hotspot opens the tooltip.
- [ ] Tooltip shows label, description, and 007 reference.
- [ ] Car image scales slightly on scroll.

### Audio
- [ ] If `/audio/maxx-intro.mp3` is present, it plays on intro dismissal.
- [ ] No console errors about missing audio (should fail silently if file absent).

### General
- [ ] No TypeScript errors in browser console.
- [ ] No GSAP ScrollTrigger warnings in console.
- [ ] `npm run build` passes before submitting.

---

## How to Clear Intro State for Re-Testing

In browser DevTools console:
```js
localStorage.removeItem('maxx_intro_seen');
location.reload();
```
