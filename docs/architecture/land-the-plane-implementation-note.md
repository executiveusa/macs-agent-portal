# Land The Plane Implementation Note

Implemented on 2026-06-12.

## What was added

- `pi-packages/maxx/skills/land-the-plane/SKILL.md`
- `pi-packages/maxx/skills/land-the-plane/agents/openai.yaml`
- `docs/architecture/land-the-plane.md`
- registry and router updates for the new skill

## What the skill does

- Follows the branch-close workflow.
- Keeps merging gated on CI, review, mergeability, and security.
- Stops on repeated failure or secret leakage.
- Uses a post-merge verification step to confirm the result landed.

## Why it exists

- Greptile-style closeout loops keep PR hygiene tight.
- Dox-style AGENTS traversal prevents wrong-folder edits.
- Optio-style task-to-PR automation keeps the merge loop explicit.
- Code simplification is only applied after the branch is green and only to recently changed code.
