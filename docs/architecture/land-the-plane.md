# Land The Plane

This repo now has a dedicated closeout skill for finishing completed work and merging it safely to `main`.

## Why it exists

- The project already uses a strong PR/branch workflow.
- The closeout phase needs its own merge gate so branches do not linger half-finished.
- The workflow is designed to be reusable by any agent that can read `SKILL.md` files and GitHub PR state.

## Design sources

- Dox: read the nearest `AGENTS.md` chain before editing.
- Greptile: loop on review comments and status checks until clean.
- Code Simplifier: simplify recently changed code without changing behavior.
- Optio: keep the task -> PR -> checks -> merge loop explicit and observable.

## What the skill does

- Checks branch, PR, and mergeability state.
- Resolves blocking review feedback.
- Re-runs verification until the branch is green.
- Applies nitpicks only when low risk.
- Merges only after checks pass and conflicts are gone.
- Verifies the merge on `main`.

## Guardrails

- If checks are failing or the branch is unstable, do not merge.
- Resolve blocking comments before merging.
- Treat unresolved merge conflicts as a stop sign.
- Prevent secret leakage in the diff, logs, and generated output.
- Stop after repeated identical failures.

## Output

The agent should report the landed PR URL, the merge result, the verification commands, and any remaining risk.
