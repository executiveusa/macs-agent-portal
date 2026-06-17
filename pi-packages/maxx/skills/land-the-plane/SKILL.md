# SKILL: land-the-plane

**When to use:** When a branch is ready to finish, a PR needs to be closed cleanly, or an agent must keep iterating until review comments, merge conflicts, CI failures, nitpicks, and verification gaps are gone and the change can land safely on `main`.

**Core rule:** Merge only when the branch is green, review-clean, conflict-free, and free of secret leakage.

---

## Mission

Turn a completed branch into a safe merge with no hand-holding:

1. Verify the current branch state.
2. Inspect PR comments, checks, and mergeability.
3. Fix blocking issues.
4. Apply low-risk nitpicks.
5. Re-run verification until green.
6. Ask for explicit in-session user confirmation before creating a PR if one does not already exist.
7. Ask for explicit in-session user confirmation immediately before merging.
8. Merge only when the gates pass.
9. Verify the merged result on `main`.

This skill is the closeout layer for Agent Maxx. It is a merge gate, not a shortcut around review.

---

## Required Inputs

- Current branch name.
- Current PR URL or PR number, if one exists.
- The repo root `AGENTS.md`.
- The branch diff and local verification commands for the repo.

If no PR exists, create one before attempting to merge.

---

## Workflow

### 1. Context load

- Read root `AGENTS.md`.
- Read the nearest Dox `AGENTS.md` chain for the files being touched.
- Run:
  - `git status --short`
  - `git branch --show-current`
  - `git log --oneline -5`
- Identify the PR with `gh pr view`.

### 2. Conflict and review check

- Fetch the base branch.
- Check GitHub mergeability first.
- Inspect review comments, requested changes, status checks, and nitpicks.
- If there are merge conflicts, resolve them in a safe local integration branch or worktree.

### 3. Verification loop

- Run the repo’s required checks.
- For MAXX, default to:
  - `npm run lint`
  - `npm run build`
  - any repo-specific smoke test or browser verify command
- Re-run after each fix.
- Stop after 3 repeated failures of the same blocker and report the blocker clearly.

### 4. Code simplification gate

- After the branch is green, run a simplification pass only on recently changed code.
- Preserve functionality exactly.
- Do not simplify prompts, docs, configs, or strings unless a functional fix requires it.

### 5. Security gate

- Scan for secret leakage, auth bypasses, unsafe merge automation, and unsafe dependency changes.
- Stop if any secret, token, credential, or private file is present in the diff or logs.

### 6. Merge

- Merge only when:
  - required checks pass,
  - blocking review comments are resolved,
  - merge conflicts are gone,
  - no secrets are present,
  - rollback is clear.
- Prefer squash merge unless the repo says otherwise.

### 7. Post-merge verify

- Fetch `main`.
- Confirm the merge landed on `origin/main`.
- Run a cheap smoke check that proves the landed state is visible.

---

## Negative Prompts

Do not:

- merge with red checks,
- merge with unresolved blocking comments,
- merge with known conflicts,
- merge with secret leakage,
- ignore reviewer comments,
- overwrite unrelated user work,
- use destructive git commands,
- simplify content files that are not code,
- hide repeated failures,
- assume the PR is the right branch without checking.

---

## Circuit Breakers

Stop and report if:

- the same failure repeats 3 times,
- required checks keep failing after a fix loop,
- mergeability never becomes clean,
- the branch contains unknown or unrelated changes,
- a security issue appears,
- the work would cross into a destructive or unauthorized action.

---

## Output

When successful:

```text
Landed: <PR URL>
Merged to: main
Verification: <commands and pass/fail>
Resolved: <conflicts/reviews/checks summary>
Remaining risks: <none or concise list>
```

When blocked:

```text
Landing blocked: <reason>
Last passing check: <check>
Needs: <specific next action>
```
