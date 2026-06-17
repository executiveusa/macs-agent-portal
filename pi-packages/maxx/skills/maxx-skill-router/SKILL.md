# SKILL: maxx-skill-router

**When to use:** When a task arrives and you need to decide which MAXX skill(s) to load, which tools to touch, and which context to avoid.

---

## Router Rules

1. Classify the request into one or more intents.
2. Load only the minimum skill set for those intents.
3. Prefer `maxx-code-search`, `maxx-browser-verify`, and `maxx-gsap-motion` before broad reads or edits.
4. Send repo research and registry work to `maxx-software-factory`.
5. Send video/content extraction to `maxx-video-dossier`.
6. Send merge/closeout work to `land-the-plane`.
7. Keep secrets out of prompts, docs, registries, and logs.
8. Do not load the entire MAXX lane unless the task truly needs it.

## Default mapping

- `code_understanding` -> `maxx-code-search`
- `browser_qa` -> `maxx-browser-verify`
- `animation` -> `maxx-gsap-motion`
- `content_research` / `video_research` -> `maxx-video-dossier`
- `documentation` / `handoff` / `registry` -> `maxx-software-factory`
- `merge` / `release` / `close_branch` / `land_the_plane` -> `land-the-plane`

## Output

Return the skill(s) chosen, the reason, and the smallest next action.
