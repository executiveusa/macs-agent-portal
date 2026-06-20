# Agent Maxx Software Factory

This repo now has a starter install for the Agent Maxx software-factory routing layer.

## Purpose

- Classify tasks into intents.
- Load only the minimum MAXX skill set required.
- Keep repo research, registry work, and content/video workflows separate.
- Preserve the existing MAXX lane while adding a lazy-loaded router.

## Installed pieces

- `pi-packages/maxx/skills/maxx-software-factory/SKILL.md`
- `pi-packages/maxx/skills/maxx-skill-router/SKILL.md`
- `pi-packages/maxx/registry/skill-registry.json`
- `pi-packages/maxx/registry/skill-router-policy.md`
- `pi-packages/maxx/registry/workflow-blueprints.json`
- `pi-packages/maxx/registry/tool-intake-status.md`

## Next step

Fill the registry from the external reference audit and keep the new buckets lazy-loaded before activating more tools.

For a fresh repo or a handoff to another agent, start from `docs/architecture/agentic-operating-prompt.md` before loading any large reference list.
