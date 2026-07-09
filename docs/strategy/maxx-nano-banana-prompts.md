# MAXX Avatar — Nano Banana Image Prompts (Every Scroll Card)

**Purpose:** One ready-to-paste prompt per visual surface on the MAXX site. Each shows **Agent MAXX (the bulldog operative) doing the specific outcome the surrounding copy sells** — James-Bond fun, but the business outcome is unmistakable to a nonprofit executive director.

**Tool:** Paste each prompt into **Nano Banana** (Google Gemini image gen). Aspect ratios are specified per use.

---

## The Character (lock this into every prompt)

> **Agent MAXX** — a bulky, muscular bulldog with a stocky powerful frame. Wears a **black leather jacket** over a black turtleneck, a **black baseball cap with a gold "006" patch**, and **teal neon LED shutter glasses** that glow softly. A **chunky gold ring** with an "M" emblem on his right hand. Short bristly dark fur, wrinkled determined muzzle, furrowed brow. Palette: **black + gold + teal neon**. Style: **cinematic noir + cyberpunk + painterly comic**, grainy texture, dramatic fog, sepia-warm backlighting with cool teal key light. He is competent, calm, slightly humorous — never menacing.

**Consistency rule:** every prompt starts with the character block, then describes the action/scene. Keep the cap, glasses, jacket, and gold ring in EVERY image.

---

## Shared style suffix (append to every prompt)

> Cinematic noir illustration, painterly comic texture with subtle film grain, teal neon and gold accents on deep black, dramatic fog with sepia-warm backlight, high detail on the bulldog's fur and accessories, professional editorial-art quality, no text, no watermark, no logo.

---

## 1. HERO — full-body reveal (primary brand image)
**Used in:** `HeroScene` — the first thing visitors see
**Aspect:** 4:5 portrait (replaces `/MUSTANG MAXX/HERO FULL PAGE IMAGE/...`)
**Drop into:** `src/config/scenesConfig.ts` → `hero.visualContent`

**Prompt:**
> Agent MAXX, a bulky muscular bulldog in a black leather jacket over a black turtleneck, black baseball cap with a gold "006" patch, glowing teal neon LED shutter glasses, and a chunky gold "M" ring, standing in a confident hero pose, feet planted, right fist clenched at his side, left hand holding a glowing holographic tablet showing floating donor and volunteer contact cards rising into the air around him. Foggy noir alley backdrop with a faint Seattle skyline silhouette and subtle Space Needle outline in the deep background. Teal neon and gold accents on deep black. [shared style suffix]

---

## 2. BRIEFING — "Find the follow-ups that slipped" (recovery audit)
**Used in:** `BriefingScene` — the recovery-audit reveal
**Aspect:** 4:3 landscape (replaces `/MUSTANG MAXX/006/...`)
**Drop into:** `scenesConfig.ts` → `briefing.visualContent`

**Prompt:**
> Agent MAXX, the muscular bulldog in black leather jacket, black cap with gold "006" patch, and teal neon LED glasses, sitting at a noir detective desk covered in scattered papers, sticky notes, and a glowing teal holographic list of missed phone calls, web forms, and donor emails floating above the desk. He is studying the list through his glowing glasses, one paw pointing at a highlighted "RECOVER" entry, gold ring catching the light. Magnifying glass and an old rotary phone on the desk. A corkboard behind him with red string connecting donor photos and follow-up notes. [shared style suffix]

---

## 3. CAR INTRO — "Turn every reply into a relationship" (content engine)
**Used in:** `CarIntroScene` — the cinematic full-bleed car reveal (preserved brand moment)
**Aspect:** 16:9 ultrawide (replaces `/MUSTANG MAXX/CAR INTRO/...`)
**Drop into:** `scenesConfig.ts` → `car_intro.visualContent`

**Prompt:**
> Agent MAXX, the muscular bulldog in black leather jacket and black cap with gold "006" patch and teal neon LED glasses, leaning confidently against the hood of a sleek matte-black classic Mustang muscle car at night in a rain-slicked Seattle street. The car's headlights glow teal. Floating holographic thank-you cards, donor letters, and volunteer-welcome messages drift up from the car like exhaust, turning into golden light. Wet pavement reflections, neon city signs reflected in puddles, Space Needle silhouette in the foggy distance. MAXX gives a subtle confident smirk, gold ring visible on the hand resting on the hood. [shared style suffix]

---

## 4. OUTCOMES — three mission cards (recover / own / approve)
**Used in:** `QuickWinsSection` — the three outcome cards at top
**Aspect:** 16:11 each (replaces generic icons)
**Drop into:** `maxxOutcomes[].image` (add field) — one image per card

### 4a. RECOVER CONVERSATIONS
**Prompt:**
> Agent MAXX, the muscular bulldog in black leather jacket, black "006" cap, and teal neon LED glasses, reaching out and catching glowing teal holographic envelope and phone-call icons that are falling like rain around him — each one labeled with subtle donor and volunteer silhouettes. He is scooping them into a golden net of light flowing into a glowing CRM crystal on his belt. Dynamic catching motion, gold ring gleaming. Foggy noir backdrop. [shared style suffix]

### 4b. OWN YOUR DATA
**Prompt:**
> Agent MAXX, the muscular bulldog in black leather jacket and black "006" cap with teal neon LED glasses, standing protectively in front of a large glowing teal vault door etched with the gold "M" emblem, one paw resting on the vault handle, gold ring visible. Inside the open vault: neatly organized stacks of glowing contact cards, donor files, and workflow blueprints — clearly HIS to keep. A small "PROPERTY OF YOUR ORGANIZATION" plaque in gold. Confident guardian stance. [shared style suffix]

### 4c. APPROVE AUTOMATION SAFELY
**Prompt:**
> Agent MAXX, the muscular bulldog in black leather jacket and black "006" cap with teal neon LED glasses, holding up a glowing teal clipboard with a drafted donor message on it, his other paw hovering over a large gold "APPROVED" stamp. A human hand (just a sleeve cuff visible) reaches in to press the stamp down with him. A checklist on the clipboard shows source, risk level, and model — all checked green. Calm, careful, trustworthy posture. [shared style suffix]

---

## 5. HOW IT WORKS — five-step mission plan
**Used in:** `HowItWorksSection` — the numbered steps
**Aspect:** 1:1 square each (optional, for step thumbnails)
**Drop into:** `maxxHowItWorks[].image` (add field)

### 5a. STEP 01 — Recovery Audit
**Prompt:** Agent MAXX at the detective desk (same as Briefing #2 but square), scanning a magnifying glass over a stack of 90-day-old inquiry slips, gold ring on the desk. [shared style suffix]

### 5b. STEP 02 — Data Cleanup
**Prompt:** Agent MAXX with sleeves rolled, sorting a chaotic pile of duplicate contact cards into five neat glowing-teal stacks labeled with gold tags, a satisfied nod, fog around his feet. [shared style suffix]

### 5c. STEP 03 — Reactivation Sprint
**Prompt:** Agent MAXX pressing a glowing gold "LAUNCH" button on a console, warm donor-reply envelopes bursting outward like fireworks, teal holographic charts showing response rates rising. [shared style suffix]

### 5d. STEP 04 — Owned System Install
**Prompt:** Agent MAXX plugging a glowing teal cable from a laptop into a golden server tower bearing the "M" emblem, the tower lighting up section by section, fog parting around it. [shared style suffix]

### 5e. STEP 05 — You Operate or We Manage
**Prompt:** Agent MAXX handing a golden key to a bulldog-shaped organization mascot (or a pair of human hands), both smiling, a glowing dashboard hovering between them showing the system running smoothly. [shared style suffix]

---

## 6. PRICING — three package codename badges
**Used in:** `PricingSection` — package header art
**Aspect:** 16:9 banner each (replaces text-only headers)
**Drop into:** `maxxPackages[].badgeImage` (add field)

### 6a. OPERATION RECOVERY (Starter)
**Prompt:** Agent MAXX crouched in action, magnifying glass in one paw, catching a single golden "lead" card mid-air, a small triumphant grin. Minimalist noir background. [shared style suffix]

### 6b. OPERATION FIELD OFFICE
**Prompt:** Agent MAXX standing in a fully-equipped mobile field office (a noir van interior), multiple teal screens showing follow-up workflows active at once, gold ring on the gear shift, confident operator pose. [shared style suffix]

### 6c. OPERATION MISSION CONTROL
**Prompt:** Agent MAXX at the center of a circular mission-control room ringed with teal holographic screens, multiple smaller bulldog-agent silhouettes at stations around him, orchestrating with both paws, gold ring gleaming, the "M" emblem glowing on the floor. [shared style suffix]

---

## 7. AUDIT CTA — the conversion anchor
**Used in:** `AuditCtaSection` — background or side art
**Aspect:** 16:9 (background, dimmed) or 1:1 (side)
**Drop into:** `AuditCtaSection.tsx` as decorative art

**Prompt:**
> Agent MAXX, the muscular bulldog in black leather jacket and black "006" cap with teal neon LED glasses, extending a golden business card toward the viewer, the card glowing with a teal "BOOK YOUR RECOVERY AUDIT" shimmer (rendered as light, not crisp text). Behind him, a wall of recovered donor and volunteer portraits lighting up one by one in gold. Warm inviting expression under the noir mood, fog parting around him like a curtain opening. [shared style suffix]

---

## 8. OPERATIONS — three department cards
**Used in:** `OutcomeChaptersScene` — department cards
**Aspect:** 16:11 each (replaces current card images)
**Drop into:** `maxxDepartmentCards[].image` (already wired)

### 8a. DAILY MISSION BOARD
**Prompt:** Agent MAXX standing before a massive noir mission-board wall covered in pinned tasks, missed calls, and follow-up cards connected by red string, pointing with his gold-ring paw at the top priority glowing gold, teal glasses scanning. [shared style suffix]

### 8b. MEMORY & CONTEXT
**Prompt:** Agent MAXX touching a glowing teal holographic brain/filing-cylinder floating above a desk, donor conversation threads and decision notes orbiting it like satellites, gold ring on the console, calm focused expression. [shared style suffix]

### 8c. TOOL COMMAND LAYER
**Prompt:** Agent MAXX at a circular command console with six different app icons (phone, email, CRM, calendar, social, forms) arranged around him, all feeding glowing teal lines into a single golden "MAXX" core in front of him, one paw on the master switch. [shared style suffix]

---

## 9. TECH SPECS — the system dossier
**Used in:** `TechSpecsScene` — blueprint background
**Aspect:** 16:9 (replaces `/MUSTANG MAXX/COMIC/1920x0.jpg`)
**Drop into:** `scenesConfig.ts` → `tech_specs.visualContent`

**Prompt:**
> Agent MAXX, the muscular bulldog in black leather jacket and black "006" cap with teal neon LED glasses, examining a massive glowing teal architectural blueprint pinned to a wall — the blueprint shows a flowchart of intake forms, missed-call text-back, donor workflows, and agent memory all connecting to a central "M" core. He holds a teal measuring caliper in one paw, gold ring on the other, nodding in approval. Blueprint grid lines, fog at floor level. [shared style suffix]

---

## 10. FINALE — "Book the recovery audit"
**Used in:** `FinalMissionScene` — closing hero art
**Aspect:** 16:9 (add as background)
**Drop into:** `FinalMissionScene.tsx` decorative background

**Prompt:**
> Agent MAXX, the muscular bulldog in black leather jacket, black "006" cap, and teal neon LED glasses, walking confidently toward the viewer down a foggy Seattle street at dawn, golden sunrise breaking behind him through the fog, the Space Needle silhouette ahead. He tips his cap slightly with his gold-ring paw in a friendly salute. A trail of recovered golden donor and volunteer cards floats up behind him like a victory trail. Triumphant, warm, trustworthy. [shared style suffix]

---

## 11. BONUS — OG social share image
**Used in:** `index.html` → `og:image` / `twitter:image`
**Aspect:** 1.91:1 (1200×630)
**Save to:** `public/og.jpg`

**Prompt:**
> Agent MAXX, the muscular bulldog in black leather jacket, black "006" cap, and teal neon LED glasses, hero pose center frame, golden donor and volunteer cards orbiting him, Seattle skyline and Space Needle silhouette in foggy background, bold empty space on the left for text overlay. Teal neon and gold on deep black. [shared style suffix]

---

## How to wire the new images (after generation)

1. Save each generated PNG to the matching path in `public/MUSTANG MAXX/<FOLDER>/`.
2. Update the `visualContent` / `image` fields in:
   - `src/config/scenesConfig.ts` (hero, briefing, car_intro, tech_specs)
   - `src/content/maxxOffer.ts` (maxxDepartmentCards; add `image` to maxxOutcomes, maxxHowItWorks, maxxPackages if you add those fields)
3. Rebuild: `npm run build`. The hashes update automatically.

## Naming convention (recommended)

```
public/MUSTANG MAXX/HERO/maxx-hero-recovery.png
public/MUSTANG MAXX/BRIEFING/maxx-briefing-audit.png
public/MUSTANG MAXX/CAR INTRO/maxx-car-relationships.png
public/MUSTANG MAXX/OUTCOMES/maxx-outcome-recover.png
public/MUSTANG MAXX/OUTCOMES/maxx-outcome-own.png
public/MUSTANG MAXX/OUTCOMES/maxx-outcome-approve.png
public/MUSTANG MAXX/STEPS/maxx-step-01-audit.png ... 05-operate.png
public/MUSTANG MAXX/PACKAGES/maxx-pkg-recovery.png / field-office.png / mission-control.png
public/MUSTANG MAXX/CTA/maxx-audit-cta.png
public/MUSTANG MAXX/OPS/maxx-ops-board.png / memory.png / command.png
public/MUSTANG MAXX/TECH/maxx-tech-blueprint.png
public/MUSTANG MAXX/FINALE/maxx-finale-walk.png
public/og.jpg
```

**Total: 17 prompts** covering every visual surface on the site. Each one ties MAXX's action directly to the outcome the surrounding copy promises — a client looking at any card instantly connects the fun secret-agent image to the real business result.

---

# BONUS SET — The New Cards (Pain + Quick-Win Workflows)

These cover the sections the first set didn't: the **three Pain cards** (`#pain`) and the **six Quick-Win workflow cards** (inside `#outcomes`). Same character lock + shared style suffix as above.

## Pain cards — MAXX discovering the leak (`#pain`)
**Aspect:** 16:11 each
**Drop into:** add `image` field to `maxxPains[]` in `src/content/maxxOffer.ts`

These are intentionally a touch more dramatic — MAXX caught mid-problem — so the contrast with the outcome cards lands.

### P1. INQUIRIES FALL THROUGH THE CRACKS
**Prompt:**
> Agent MAXX, the muscular bulldog in black leather jacket, black "006" cap, and teal neon LED glasses, standing alarmed in front of five glowing teal screens each showing a different missed channel — a phone, an email, a DM, a web form, a voicemail — with golden contact cards slipping down through cracks in the floor between them, his paws reaching to catch them but too many falling at once. Worried furrowed brow, gold ring glinting. Fog swirling at floor level. [shared style suffix]

### P2. THE CRM IS RENTED AND AVOIDED
**Prompt:**
> Agent MAXX, the muscular bulldog in black leather jacket and "006" cap with teal neon LED glasses, staring in frustration at a dusty locked glass cabinet labeled "RENTED CRM" full of tangled, duplicated contact cards and cobwebs — a heavy chain and padlock on the cabinet door, a "PROPERTY OF VENDOR" plaque. MAXX has his paws on his hips, unimpressed, one eyebrow raised over his glowing glasses, gold ring catching light. Dust motes in teal light. [shared style suffix]

### P3. THE TEAM IS OVERLOADED
**Prompt:**
> Agent MAXX, the muscular bulldog in black leather jacket and "006" cap with teal neon LED glasses, buried at a desk overflowing with stacked papers, sticky notes, coffee cups, and ringing phones, his paws full, looking overwhelmed but determined. A wall clock shows late hours. Teal holographic "OVERDUE" tags piling up. Tired but resolute expression, furrowed brow, gold ring on the hand gripping a pen. Foggy office noir. [shared style suffix]

---

## Quick-Win workflow cards — MAXX running each mission (inside `#outcomes`)
**Aspect:** 16:10 each
**Drop into:** add `image` field to `maxxQuickWins[]` in `src/content/maxxOffer.ts`

These show MAXX *doing* each specific workflow — the exact outcome the card sells.

### Q1. MISSED-CALL TEXT-BACK
**Prompt:**
> Agent MAXX, the muscular bulldog in black leather jacket and "006" cap with teal neon LED glasses, holding a glowing teal smartphone showing an incoming "MISSED CALL" notification, his other paw tapping a golden holographic reply that auto-drafts a warm compliant text message floating above the screen. A small teal checkmark appears. Confident efficient motion, gold ring visible. [shared style suffix]

### Q2. MISSED-FORM RECOVERY
**Prompt:**
> Agent MAXX, the muscular bulldog in black leather jacket and "006" cap with teal neon LED glasses, sorting through a chaotic stack of old glowing teal web-form submission cards, ranking them on a golden triage board with labels "HOT / WARM / COLD", plucking the top one and drafting a follow-up that floats up as golden light. Analytical focused expression, gold ring on the sorting paw. [shared style suffix]

### Q3. DONOR REACTIVATION
**Prompt:**
> Agent MAXX, the muscular bulldog in black leather jacket and "006" cap with teal neon LED glasses, writing a warm handwritten-style thank-you note at a desk, a holographic golden donor list behind him with stale entries lighting back up one by one as he writes. Heartfelt focused expression, gold ring on the writing paw, a small donor-portrait floating warmly nearby. [shared style suffix]

### Q4. VOLUNTEER REACTIVATION
**Prompt:**
> Agent MAXX, the muscular bulldog in black leather jacket and "006" cap with teal neon LED glasses, extending a friendly golden "WELCOME BACK" handshake hologram toward a queue of faded volunteer silhouettes who brighten and solidify as they step forward. Warm encouraging smile under the glowing glasses, open welcoming paw with gold ring. Community-energy lighting. [shared style suffix]

### Q5. EVENT FOLLOW-UP
**Prompt:**
> Agent MAXX, the muscular bulldog in black leather jacket and "006" cap with teal neon LED glasses, standing at a console transforming a scattered crowd of event-attendee silhouettes into neat rows of glowing teal contact cards, each sprouting a small thank-you note, a task tag, and a follow-up reminder. Orchestrator pose, both paws active, gold ring gleaming. [shared style suffix]

### Q6. GRANT TRACKER
**Prompt:**
> Agent MAXX, the muscular bulldog in black leather jacket and "006" cap with teal neon LED glasses, reviewing a large noir wall calendar with golden grant-deadline markers, each connected by red string to an owner portrait, an attachment icon, and a draft-checklist glowing teal. He points at the nearest deadline with his gold-ring paw, a calm alert expression. Fog around the calendar's edges. [shared style suffix]

---

## Wiring the new card images

After generating, add an `image` field to each entry and update the card components to render it. The Pain cards are in `PainSection.tsx`; the Quick-Win cards are in `QuickWinsSection.tsx`. Pattern (same in both):

```tsx
// In maxxOffer.ts:
export const maxxPains: PainCard[] = [
  { id: "missed-inquiries", ..., image: "/MUSTANG MAXX/PAIN/maxx-pain-cracks.png" },
  ...
];
// In PainSection.tsx, inside the card <article>:
{pain.image && <img src={pain.image} alt="" className="mb-4 aspect-[16/11] w-full rounded-2xl object-cover" />}
```

**New grand total: 26 prompts** — every visual surface on the site, including all nine new cards, each tying MAXX's action to the exact outcome the copy sells.
