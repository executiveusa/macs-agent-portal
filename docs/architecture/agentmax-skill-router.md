# Agent Maxx Skill Router

Router goal: choose the smallest safe tool/skill set for the task.

## Routing rules

- `code_understanding` -> kernel skills first.
- `bug_fix` -> kernel + exact symbol search.
- `feature_build` -> kernel + docs + browser verify if UI changes.
- `dependency_research` -> kernel + opensrc.
- `content_research` / `video_research` -> `maxx-video-dossier`.
- `handoff` / `documentation` -> `maxx-software-factory`.
- `merge` / `release` / `close_branch` -> `land-the-plane`.

## External reference routing

Use the reference catalog only when the task matches the bucket.

| Bucket | Examples | When to load |
|--------|----------|--------------|
| Gateway and integration | `12britz/awesome-ai-gateways`, `vercel-labs/open-agents`, `modelcontextprotocol/ext-apps`, `upstash/context7`, `supabase-community/supabase-mcp`, `InsForge/InsForge`, `paperclipai/paperclip`, `Mnexa-AI/e2a`, `kanwas-ai/kanwas`, `darula-hpp/uigen`, `safishamsi/graphify`, `rtk-ai/rtk`, `gh repo clone executiveusa/synthia-gateway` | When deciding provider routing, MCP surfaces, or the right integration layer |
| Browser and MCP automation | `jgravelle/jcodemunch-mcp`, `HKUDS/OpenHarness`, `browser-use/browser-harness`, `revfactory/claude-code-harness`, `knowsuchagency/mcp2cli`, `ast-grep/ast-grep-mcp` | When the task needs browser control, symbol search, CLI bridges, or automation scaffolding |
| Skill and handoff design | `mattpocock/skills`, `virgiliojr94/book-to-skill`, `google-gemma/gemma-skills`, `yetone/native-feel-skill`, `human-avatar/skills-for-humanity`, `willseltzer/claude-handoff`, `executiveusa/pauli-taste-skill`, `executiveusa/paulsuperpowers`, `executiveusa/pauli-blog` | When building or updating skills, prompts, handoffs, or reusable operator docs |
| Orchestration, review, and merge closeout | `michaelshimeles/ralphy`, `jonwiggins/optio`, `ReviewStage/stage-cli`, `gsd-build/get-shit-done`, `adamjgmiller/adamsreview`, `disler/claude-code-hooks-multi-agent-observability` | When coordinating parallel work, review loops, branch closeout, or observability |
| Media, docs, and visual packaging | `zarazhangrui/codebase-to-course`, `robonuggets/hyperframes-helper`, `greensock/GSAP`, `dolanmiu/docx`, `zakirullin/files.md`, `gitroomhq/postiz-app`, `yui540/comimi`, `html-in-canvas.dev` | When turning code or content into visuals, docs, videos, or publication-ready artifacts |
| Provider, model, and security selection | `mnfst/awesome-free-llm-apis`, `Andyyyy64/whichllm`, `Keeper-Security`, `Alishahryar1/free-claude-code`, `perplexityai/modelcontextprotocol` | When choosing providers, comparing model access, or deciding secret-handling patterns |
| Quarantine / audit first | `executiveusa/pauli-Uncodixfy`, `git@github.com:executiveusa/pauli-blog.git`, `git@github.com:executiveusa/paulsuperpowers.git`, `executiveusa/VisionClaw/tree/main`, malformed chained URLs from the prompt | When the repo is private, inaccessible, malformed, or not yet trusted |

Automatic use rule:

- If a task mentions one of the buckets above, consult the matching bucket first.
- If a specific repo is already known and local, use the local clone before any remote lookup.
- If the task is broad, load the catalog and keep only the bucket needed for the next action.

## Safety rules

- No full tool list autoload.
- Quarantine anything secret-bound or inaccessible.
- Keep observable public-safe events separate from private logs.
