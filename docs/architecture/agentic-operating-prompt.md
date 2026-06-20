# Agentic Repo Operating Prompt

Use this prompt when starting in a new repository that may contain agent skills, router docs, reference repos, deployment workflows, and merge gates.

## Goal

Help the next agent decide:

- what the repository is for
- what to load first
- which references are useful now
- which references should stay quarantined
- how to verify work before claiming success

The prompt is repo-agnostic. Replace no placeholders. Load only the smallest safe context needed for the current task.

## Operating Rules

1. Read the root operating doc first: `AGENTS.md`, `CLAUDE.md`, or the repo equivalent.
2. Inspect the repo root, branch, and current status before changing anything.
3. Prefer local mirrors, local docs, and local skills before any remote repository.
4. Use symbol search or targeted reads before broad repo scans.
5. Load only the bucket that matches the current task.
6. Quarantine private, inaccessible, malformed, or secret-bound sources until they are explicitly approved.
7. Verify with real commands, browser checks, or deployment evidence before claiming completion.
8. Never autoload a giant reference list when a single bucket will do.

## Startup Sequence

1. Identify the repo root and current branch.
2. Read the root operating doc and the nearest task docs.
3. Classify the task into one primary intent, plus at most one secondary intent.
4. Choose the smallest matching bucket from the reference catalog.
5. Load only the docs or skills needed for that bucket.
6. Execute the smallest safe action.
7. Test or browser-check the result.
8. Report what changed, what was verified, and what remains open.

## Reference Catalog

The full bucketed catalog lives in `docs/research/agentmax-skill-readme-audit.md`.

Use these buckets as the first routing decision:

### Gateway and integration

Use when the task is about AI gateways, MCP integration, provider routing, or agent app surfaces.

Examples:

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
- `executiveusa/synthia-gateway`

### Browser and MCP automation

Use when the task needs browser control, symbol search, browser harnesses, or automation scaffolding.

Examples:

- `jgravelle/jcodemunch-mcp`
- `HKUDS/OpenHarness`
- `browser-use/browser-harness`
- `revfactory/claude-code-harness`
- `knowsuchagency/mcp2cli`
- `ast-grep/ast-grep-mcp`

### Skill and handoff design

Use when the task is about skills, prompts, reusable agent instructions, or handoff docs.

Examples:

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

Use when coordinating parallel work, review loops, branch landing, or post-merge verification.

Examples:

- `michaelshimeles/ralphy`
- `jonwiggins/optio`
- `ReviewStage/stage-cli`
- `gsd-build/get-shit-done`
- `adamjgmiller/adamsreview`
- `disler/claude-code-hooks-multi-agent-observability`

### Media, docs, and visual packaging

Use when turning code or content into visuals, docs, videos, or publication-ready artifacts.

Examples:

- `zarazhangrui/codebase-to-course`
- `robonuggets/hyperframes-helper`
- `greensock/GSAP`
- `dolanmiu/docx`
- `zakirullin/files.md`
- `gitroomhq/postiz-app`
- `yui540/comimi`
- `html-in-canvas.dev`

### Provider, model, and security selection

Use when choosing providers, comparing model access, or deciding secret-handling patterns.

Examples:

- `mnfst/awesome-free-llm-apis`
- `Andyyyy64/whichllm`
- `Keeper-Security`
- `Alishahryar1/free-claude-code`
- `perplexityai/modelcontextprotocol`

## Skills Inventory Layer

If the repo has a skills inventory file such as `skills.md`, `AGENTS.md`, `CLAUDE.md`, or a local package registry, read it after the root operating doc and before broad code reads.

Use the inventory to answer:

- what skills exist
- what each skill is for
- when not to use each skill
- which skills are local and which are reference-only
- which skills must stay quarantined

Inventory rules:

- Prefer the repo's own inventory over any copied list.
- Keep one primary skill active at a time unless the task clearly needs two.
- Load helper skills only when they reduce risk or save context.
- Do not autoload the entire inventory unless the task is explicitly about inventory or router design.

Suggested inventory fields for any agentic repo:

- `skill_name`
- `purpose`
- `when_to_use`
- `when_not_to_use`
- `source_path`
- `risk_level`
- `default_state`

## Reusable Handoff Template

Use this structure when handing the repo to another agent:

```md
# Handoff

## Repo Truth
- Repo root:
- Branch:
- Remote:
- Working tree state:

## Current Objective
- What we are trying to do:
- What success looks like:

## Active Bucket
- Bucket chosen:
- Why it was chosen:
- Skills loaded:
- References loaded:

## Verified State
- Commands run:
- Results:
- Browser or deploy URL:

## Open Loop
- What remains open:
- What is blocked:
- What should happen next:
```

Keep the handoff short enough to read in one pass and precise enough that the next agent can continue without re-reading the whole conversation.

## Decision Rules

Use this order when multiple buckets could apply:

1. Local repo docs and current code
2. Exact-file or symbol search
3. The smallest matching bucket
4. Only then broader reference repos

When in doubt:

- If the task is about finding or changing code, start with local search.
- If the task is about browser behavior, start with browser automation and verification.
- If the task is about a reusable workflow, start with skill and handoff design.
- If the task is about turning a branch into a safe merge, start with orchestration and closeout.
- If the task is about a provider or integration choice, start with gateway and integration.

## Quarantine Rules

Keep these out of automatic loading:

- private repos
- inaccessible repos
- malformed URLs
- chained or duplicated URLs from raw prompts
- secret-bound repositories
- anything that exists only as a name with no usable local clone

If a source is quarantined, say so and continue without guessing.

## Verification Contract

Before declaring success, provide evidence for:

- the repo root checked
- the branch checked
- the files changed
- the test, build, browser, or deploy command run
- the exact output that proves the claim

## Output Contract

Every response should end with:

- the chosen bucket
- why that bucket was chosen
- the smallest next action
- what was verified
- what remains open

## Implementation Note

This prompt should be paired with a small router doc and a reference audit file. Do not replace those with one giant prompt. The router decides the bucket; the audit tells the agent which repos belong in the bucket.
