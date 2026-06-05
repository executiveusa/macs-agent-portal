# SKILL: maxx-code-search

**When to use:** When you need to find a specific symbol, config key, or component in the codebase without reading whole files. This saves tokens and reduces the chance of editing the wrong location.

---

## Search Patterns

### Find where a scene config key is used
```
grep -rn "car_intro" src/
```

### Find a specific component import
```
grep -rn "CarIntroScene" src/
```

### Find all GSAP ScrollTrigger usages
```
grep -rn "ScrollTrigger" src/components/
```

### Find where maxxStoryConfig is imported
```
grep -rn "maxxStoryConfig" src/
```

### Find all scene IDs referenced in scenesConfig
```
grep -n "id:" src/config/scenesConfig.ts
```

### Find the exact line of an export
```
grep -n "export const" src/config/maxxStoryConfig.ts
```

---

## Symbol Map (as of 2026-06-04)

| Symbol | File | Line approx. |
|---|---|---|
| `maxxStoryConfig` | `src/config/maxxStoryConfig.ts` | 1 |
| `scenesConfig` | `src/config/scenesConfig.ts` | 3 |
| `paymentPlans` | `src/config/scenesConfig.ts` | 59 |
| `HeroScene` | `src/components/scenes/HeroScene.tsx` | 8 |
| `BriefingScene` | `src/components/scenes/BriefingScene.tsx` | 6 |
| `CarIntroScene` | `src/components/scenes/CarIntroScene.tsx` | 1 |
| `MustangScene` | `src/components/scenes/MustangScene.tsx` | 7 |
| `IntroSequence` | `src/components/site/IntroSequence.tsx` | 1 |
| `ShellLayout` | `src/components/layout/ShellLayout.tsx` | 3 |
| `maxxExtensions` | `pi-packages/maxx/extensions/index.ts` | 1 |

---

## Rules

1. **Search before you read.** If you know the symbol name, grep first — don't open the file cold.
2. **Use exact symbol names.** Partial matches return too many results on this codebase.
3. **Update this symbol map** whenever you add a new export to a config or component file.
