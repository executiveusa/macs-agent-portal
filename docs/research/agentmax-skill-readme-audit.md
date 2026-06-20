# Agent Maxx External Reference Audit

Status: cataloged and deduped from the user-provided reference list.

This file is the landing zone for the README-first audit and the automatic reference-routing catalog.

## Method

- Audit README / AGENTS / CLAUDE / skill docs before broad source reads.
- Deduplicate repeated URLs before classifying them.
- Mark private, inaccessible, malformed, or secret-bound repos clearly.
- Do not guess when a repo cannot be accessed.
- Prefer local mirrors first when they already exist in the workspace.

## Use now

### Gateway and integration

Use these when the task is about AI gateways, agent app surfaces, MCP integration, or provider routing.

- `12britz/awesome-ai-gateways`
- `vercel-labs/open-agents`
- `modelcontextprotocol/ext-apps`
- `upstash/context7`
- `supabase-community/supabase-mcp`
- `InsForge/InsForge`
- `paperclipai/paperclip`
- `Mnexa-AI/e2a`
- `kanwas-ai/kanwas`
- `darula-hpp/uigen`
- `safishamsi/graphify`
- `rtk-ai/rtk`
- `gh repo clone executiveusa/synthia-gateway`

### Browser and MCP automation

Use these when the task needs browser control, symbol search, CLI bridges, or automation scaffolding.

- `jgravelle/jcodemunch-mcp`
- `HKUDS/OpenHarness`
- `browser-use/browser-harness`
- `revfactory/claude-code-harness`
- `knowsuchagency/mcp2cli`
- `ast-grep/ast-grep-mcp`

### Skill and handoff design

Use these when building or updating skills, prompts, handoffs, or reusable operator docs.

- `mattpocock/skills`
- `virgiliojr94/book-to-skill`
- `google-gemma/gemma-skills`
- `yetone/native-feel-skill`
- `human-avatar/skills-for-humanity`
- `willseltzer/claude-handoff`
- `executiveusa/pauli-taste-skill`
- `executiveusa/paulsuperpowers`
- `executiveusa/pauli-blog`

### Orchestration, review, and merge closeout

Use these when coordinating parallel work, review loops, branch closeout, or observability.

- `michaelshimeles/ralphy`
- `jonwiggins/optio`
- `ReviewStage/stage-cli`
- `gsd-build/get-shit-done`
- `adamjgmiller/adamsreview`
- `disler/claude-code-hooks-multi-agent-observability`

### Media, docs, and visual packaging

Use these when turning code or content into visuals, docs, videos, or publication-ready artifacts.

- `zarazhangrui/codebase-to-course`
- `robonuggets/hyperframes-helper`
- `greensock/GSAP`
- `dolanmiu/docx`
- `zakirullin/files.md`
- `gitroomhq/postiz-app`
- `yui540/comimi`
- `html-in-canvas.dev`

### Provider, model, and security selection

Use these when choosing providers, comparing model access, or deciding secret-handling patterns.

- `mnfst/awesome-free-llm-apis`
- `Andyyyy64/whichllm`
- `Keeper-Security`
- `Alishahryar1/free-claude-code`
- `perplexityai/modelcontextprotocol`

## Quarantine

Keep these out of automatic loading until they are locally cloned or explicitly approved.

- `executiveusa/pauli-Uncodixfy`
- `git@github.com:executiveusa/pauli-blog.git`
- `git@github.com:executiveusa/paulsuperpowers.git`
- `executiveusa/VisionClaw/tree/main`
- malformed chained URLs from the prompt
- duplicate references already captured above

## Automatic use rule

- If a future task matches one of the buckets above, load only that bucket.
- If a local clone already exists, use it before any remote lookup.
- If the task is broad, keep the catalog loaded and promote only the smallest needed bucket into the active context.

## Next action

Keep the audit current as new external references are added.
