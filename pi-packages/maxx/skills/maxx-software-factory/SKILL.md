# SKILL: maxx-software-factory

**When to use:** When the task is to audit repositories/READMEs, classify external tools into Agent Maxx layers, build a lazy-loaded skill router, or turn a software-factory spec into docs and registries without loading every tool into context.

**Core rule:** Audit first, install second. Read only what the current task needs.

---

## Operating Rules

1. Read root `AGENTS.md` first, then the nearest repo docs for the area you are editing.
2. Start with README/AGENTS/CLAUDE/skill files before broad source reads.
3. Use jCodeMunch or symbol-first search before opening whole files.
4. Use Vercel opensrc when package internals matter.
5. Classify every tool as `kernel`, `mission-critical`, `lazy`, `research-only`, `quarantine`, or `reject`.
6. Keep the registry lazy-loaded. Never install the full repo list into runtime context.
7. Mark private, inaccessible, secret-bound, or push-capable autonomous tools as `quarantine` until proven safe.
8. Write public-safe observable events for meaningful build or registry actions.

---

## Router Flow

For a new task:

1. Classify intent.
2. Select the minimum tool layer.
3. Load only the needed docs or skills.
4. Make the smallest safe edit.
5. Test, verify, and write the registry/doc update.

### Intent shortcuts

- `code_understanding`, `bug_fix`, `feature_build`, `refactor` -> kernel + refactor tools.
- `dependency_research` -> kernel + opensrc + README audit.
- `ui_design`, `animation` -> MAXX UI and motion skills.
- `browser_qa`, `e2e_test` -> browser verification skills.
- `content_research`, `video_research` -> video dossier / content analysis skills.
- `handoff`, `documentation` -> registry, router, and handoff docs.
- `observable_ledger` -> ledger skill and public-safe redaction rules.

---

## Required Outputs

When this skill is used for the software-factory install, the work should produce:

- `docs/architecture/agentmax-skill-router.md`
- `docs/architecture/agentmax-software-factory.md`
- `pi-packages/maxx/registry/skill-registry.json`
- `pi-packages/maxx/registry/skill-router-policy.md`
- `pi-packages/maxx/registry/workflow-blueprints.json`
- `pi-packages/maxx/registry/tool-intake-status.md`

If a source is inaccessible, record it as inaccessible and continue without guessing.
