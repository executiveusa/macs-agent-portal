# Agent Maxx Skill Router

Router goal: choose the smallest safe tool/skill set for the task.

## Routing rules

- `code_understanding` -> kernel skills first.
- `bug_fix` -> kernel + exact symbol search.
- `feature_build` -> kernel + docs + browser verify if UI changes.
- `dependency_research` -> kernel + opensrc.
- `content_research` / `video_research` -> `maxx-video-dossier`.
- `handoff` / `documentation` -> `maxx-software-factory`.

## Safety rules

- No full tool list autoload.
- Quarantine anything secret-bound or inaccessible.
- Keep observable public-safe events separate from private logs.
