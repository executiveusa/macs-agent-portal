export const maxxExtensions = [
  {
    id: 'maxx-onboarding',
    skillPath: '../skills/maxx-onboarding/SKILL.md',
    isDefault: true,
    description: 'Plain-language onboarding interview. Runs first on every fresh session.',
  },
  {
    id: 'maxx-gsap-motion',
    skillPath: '../skills/maxx-gsap-motion/SKILL.md',
    isDefault: false,
    description: 'GSAP timing and scroll-trigger guidance for scene transitions.',
  },
  {
    id: 'maxx-browser-verify',
    skillPath: '../skills/maxx-browser-verify/SKILL.md',
    isDefault: false,
    description: 'Browser verification checklist for visual and interaction QA.',
  },
  {
    id: 'maxx-code-search',
    skillPath: '../skills/maxx-code-search/SKILL.md',
    isDefault: false,
    description: 'Exact-symbol search to locate components and config keys without full file reads.',
  },
] as const;
