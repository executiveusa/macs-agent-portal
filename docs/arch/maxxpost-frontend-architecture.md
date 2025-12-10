# Frontend Architecture & Component Hierarchy

## 1. Core Layout Structure

- `ShellLayout`: Main wrapper. Handles global scroll progress, noise overlays, and navigation bar (sticky/hidden).
  - `ScrollContainer`: The scrollable area (likely using Locomotive Scroll or native scroll with GSAP hooks).

## 2. Component Hierarchy (Homepage)

- `Page: Home` (`/`)
  - `HeroScene` (Section 1)
    - `RainEffect` (Canvas/CSS)
    - `HeroBackground` (Parallax Image)
    - `HeroTitle` (Animated Text)
  - `BriefingScene` (Section 2)
    - `DossierCard` (Tilt effect)
    - `TypewriterText`
  - `CarShowcaseScene` (Section 3 - Pinned)
    - `MustangModel` (Image/3D)
    - `Hotspot` (Interactive markers)
    - `FeatureDetail` (Popup overlay)
  - `PipelineVertical` (Section 4)
    - `BlueprintCanvas` (SVG Draw animations)
  - `ComicStripScene` (Section 5)
    - `ComicPanel` (Scroll-triggered slide-in)
  - `FooterCTA`
    - `PaymentButtons` (Stripe/BTC)

## 3. Technology Strategy

- **Animation Engine**: GSAP (GreenSock) + ScrollTrigger.
  - Why: Superior pinning and timeline control for complex scroll stories compared to pure Framer Motion.
  - Framer Motion will be used for micro-interactions (hover, click, modal entry).
- **Styling**: Tailwind CSS for layout/typography. Custom CSS for noir effects (glows, grain).
- **State**: minimal local state. `scenesConfig` object to drive text/assets.

## 4. Payment Integration (Stub)

- `usePayment()` Hook:
  - `initiatePayment(provider: 'stripe' | 'bitcoin', planId: string)`
  - Returns `state: 'idle' | 'loading' | 'success' | 'error'`

## 5. Dashboard Shell

- `DashboardLayout`: Sidebar + Main Content Area.
- `PipelineBoard`: Kanban for active jobs.
