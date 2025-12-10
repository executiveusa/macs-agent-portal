# Responsive Strategy

## 1. Breakpoints

- **Mobile (< 768px)**:
  - **Hero**: Reduced text size, static background (no heavy video).
  - **Car Scene**: Instead of horizontal scroll, car features stack vertically as cards below the car image.
  - **Comic Panels**: Stack 1 per view.
- **Tablet (768px - 1024px)**:
  - Condensed margins.
  - Reduced parallax depth.
- **Desktop (> 1024px)**:
  - Full experience.

## 2. Adaptation Techniques

- **CSS Grid/Flex**: Use `flex-col` on mobile, `flex-row` on desktop.
- **GSAP MatchMedia**: Use `ScrollTrigger.matchMedia()` to define different scroll animations for mobile vs desktop.
  - _Mobile_: Simple fade-ins.
  - _Desktop_: Complex pinning and parallax.

## 3. Performance

- Lazy load off-screen images.
- Use WebP for all heavy assets.
