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
- Merge/closeout -> `land-the-plane`.
- New UI or motion work -> existing MAXX visual skills.
- External gateway selection -> `docs/research/agentmax-skill-readme-audit.md` first, then the gateway bucket.
- Browser automation / MCP wiring -> the browser bucket, then `maxx-browser-verify` if a live check is needed.
- Skill or handoff authoring -> the skill bucket, then `maxx-software-factory`.
- Parallel coordination / review loops -> the orchestration bucket, then `land-the-plane` if merge closeout is involved.
- Provider or security choice -> the provider bucket, with quarantine for private or inaccessible sources.

## Safety

- No secret printing.
- No global installs.
- No autonomous pushes to `main`.
- No full-context loads when a symbol search will do.
