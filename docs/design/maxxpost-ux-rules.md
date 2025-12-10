# UX Rules & Design Heuristics

## 1. Aesthetic: Comic-Noir

- **Atmosphere**: Dark, moody, rain-soaked.
- **Contrast**: High contrast neon (Cyan/Orange) against deep blacks/grays.
- **Texture**: Use grain overlays and "paper" textures for comic panels.

## 2. Interaction Rules (Don't Make Me Think)

- **Scroll Hijacking**: MINIMIZE. Only pin sections when necessary for storytelling (e.g., the car). Ensure user feels in control.
- **Buttons**:
  - Primary: Neon Cyan Glow, Sharp Corners (Cyberpunk style).
  - Secondary: Outlined, Orange text.
- **Micro-interactions**:
  - Hovering a hotspot should instantly reveal context (no click required on desktop).
  - Clicking a hotspot locks the view.

## 3. Responsiveness

- **Mobile First**: Design scenes to stack vertically on mobile if horizontal pinning is too cramped.
- **Touch Targets**: Min 44px for all interactables.

## 4. Accessibility

- `prefers-reduced-motion`: Disable parallax and smooth scrolling if set.
- **Alt Text**: All comic panels must have narrative alt text.
