# Agent Maxx Skill Router Policy

Install lazily. Load the minimum.

## Kernel rules

- Read `AGENTS.md` first.
- Use jCodeMunch before broad file reads.
- Use opensrc when package internals matter.
- Quarantine secret-bound, inaccessible, or autonomous push-capable tools until reviewed.
- Prefer dedicated MAXX skills over ad-hoc prompts.

## Routing

- Code understanding and refactors -> kernel skills.
- Video/content analysis -> `maxx-video-dossier`.
- Browser verification -> `maxx-browser-verify`.
- Registry/router work -> `maxx-software-factory`.
- New UI or motion work -> existing MAXX visual skills.

## Safety

- No secret printing.
- No global installs.
- No autonomous pushes to `main`.
- No full-context loads when a symbol search will do.
