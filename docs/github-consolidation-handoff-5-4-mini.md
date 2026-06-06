# Handoff: GitHub Consolidation for 5.4 Mini

Target model: 5.4 mini
Repo: `executiveusa/macs-agent-portal`
Local checkout: `C:\Users\execu\.codex\worktrees\ec80\macs-agent-portal-main`
Default branch: `main`
Current pushed head: `3aa8160`
Production alias: `https://macs-agent-portal-pi.vercel.app`
Vercel project: `the-pauli-effect/macs-agent-portal`

## Objective

Finish the GitHub cleanup by consolidating all dependency/security PR work into one new PR that is fully green, reviewed by the normal checks, and ready to merge into `main`.

Do not merge the old open PRs one by one. They are stale, dirty, or attached to old Vercel states. Supersede them with one clean branch from current `main`.

## Current Truth

`main` is clean and pushed.

Recent commits:

```text
3aa8160 [SYNTHIA][MACS-AGENT-PORTAL-002] docs: ignore Vercel local metadata | LP4 information flow | DOC 7 to 8
f63b3e6 [SYNTHIA][MACS-AGENT-PORTAL-001] fix: harden lint and briefing render | LP4 information flow | VIS 7 to 8
247f27e feat: MAXX Pi self-setup agent - onboarding, car intro scene, story alignment (#21)
```

Validation from current `main`:

```text
npm run lint  -> exits 0, with 8 existing Fast Refresh warnings
npm run build -> exits 0
```

Production deploy from correct project is ready:

```text
deployment id: dpl_8j4BwZpwiEd13tBSHYAwvuqLrRwv
immutable URL: https://macs-agent-portal-kp703a5tt-the-pauli-effect.vercel.app
alias: https://macs-agent-portal-pi.vercel.app
```

Installed project instructions:

- `AGENTS.md`
- `Emerald Tablets™/PRIME_DIRECTIVE.md`

## Open PR Backlog

All current open PRs target `main`. Treat them as source signals only, not as merge candidates.

```text
#19 chore(deps): bump minimatch
#18 chore(deps): bump rollup from 4.24.0 to 4.59.0
#16 chore(deps): bump minimatch, sucrase, eslint and typescript-eslint
#15 chore(deps): bump next from 16.0.8 to 16.1.6
#13 chore(deps): bump lodash from 4.17.21 to 4.17.23
#12 chore(deps): bump react-router and react-router-dom
#10 chore(deps-dev): bump vite from 5.4.19 to 5.4.21
#7 build(deps-dev): bump js-yaml from 4.1.0 to 4.1.1
#6 build(deps): bump glob from 10.4.5 to 10.5.0
#5 [WIP] Enhance zero-secrets deployment capabilities for Railway
```

Current PR merge state from `gh pr list`: `DIRTY` for the dependency PRs. Some Vercel checks are failed or stale. Do not force-merge them.

## Audit Snapshot

Local `npm audit --json` currently reports:

```text
18 vulnerabilities total
10 high
8 moderate
0 critical
```

Known affected packages from local audit:

```text
@remix-run/router
ajv
brace-expansion
esbuild
flatted
glob
js-yaml
lodash
minimatch
next
picomatch
postcss
react-router
react-router-dom
rollup
vite
ws
yaml
```

GitHub push also reported default-branch dependency alerts:

```text
49 GitHub vulnerabilities
20 high
24 moderate
5 low
```

This mismatch is normal because GitHub sees advisory/dependency graph state beyond the local `npm audit` tree. The consolidated PR should reduce or close as many as possible without breaking the Vite app.

## Critical Repo Facts

This is a Vite React app, not a Next app.

`next` appears in the dependency graph because an old dependency PR introduced or referenced it. Before updating `next`, first prove whether `next` is still present in `package.json` or only in the lockfile. Do not add or preserve unused framework dependencies.

Use these checks:

```powershell
rg -n '"next"|"react-router-dom"|"vite"|"lodash"|"glob"|"js-yaml"' package.json package-lock.json
rg -n "from 'next|from \"next|next/" src docs ops
npm ls next
npm ls lodash glob js-yaml minimatch rollup vite react-router-dom postcss
```

If a vulnerable dependency is unused and only lockfile-resolved from old state, prefer removing the path through normal package-manager operations rather than pinning unused code forever.

## Execution Plan

1. Start from latest `main`.

```powershell
git fetch origin
git checkout main
git pull --ff-only origin main
git checkout -b chore/consolidate-github-dependency-fixes
```

2. Capture baseline.

```powershell
git status --short --branch
npm run lint
npm run build
npm audit --json
gh pr list --repo executiveusa/macs-agent-portal --state open --limit 20 --json number,title,mergeStateStatus,statusCheckRollup,url
```

3. Consolidate dependency fixes in one branch.

Prefer targeted updates first:

```powershell
npm install vite@latest rollup@latest react-router-dom@latest postcss@latest
npm install -D eslint@latest typescript-eslint@latest js-yaml@latest
npm install glob@latest
```

Then re-run:

```powershell
npm audit
npm ls next lodash minimatch picomatch brace-expansion flatted ws yaml ajv
```

If `lodash`, `next`, or other vulnerable packages remain only because they are unused or accidentally retained, inspect import usage and remove the direct dependency if safe. Do not remove runtime dependencies without a usage check.

4. Keep the blast radius tight.

Allowed files for this PR:

```text
package.json
package-lock.json
docs/github-consolidation-handoff-5-4-mini.md only if updating this handoff
minimal source fixes required by dependency API changes
```

Avoid unrelated design edits, route changes, asset changes, or Vercel project changes.

5. Validate hard.

Required local gates:

```powershell
npm run lint
npm run build
npm audit
```

Expected state:

- lint exits `0`
- build exits `0`
- audit should be materially reduced
- if audit is not zero, document each remaining advisory and why it cannot be fixed safely in this PR

6. Browser check.

Start local app:

```powershell
npm run dev -- --host 127.0.0.1 --port 4180
```

Capture at least homepage and one dashboard route:

```powershell
npx playwright screenshot --device="Desktop Chrome" --wait-for-timeout=5000 http://127.0.0.1:4180 "%TEMP%\macs-home-after-deps.png"
npx playwright screenshot --device="Desktop Chrome" --wait-for-timeout=5000 http://127.0.0.1:4180/dashboard "%TEMP%\macs-dashboard-after-deps.png"
```

If Playwright CLI is unavailable, use Vercel preview plus browser screenshot tooling. Do not skip visual verification if source or dependency changes affect routing/build output.

7. Commit.

Commit format:

```text
[SYNTHIA][MACS-AGENT-PORTAL-003] security: consolidate dependency fixes | LP4 information flow | SEC 6 to 8
```

8. Push and open one PR.

```powershell
git push -u origin chore/consolidate-github-dependency-fixes
gh pr create --repo executiveusa/macs-agent-portal --base main --head chore/consolidate-github-dependency-fixes --title "security: consolidate dependency fixes" --body-file docs/github-consolidation-pr-body.md
```

If you create `docs/github-consolidation-pr-body.md`, include it in the branch only if useful. Otherwise pass the body inline.

9. Wait for checks.

```powershell
gh pr checks --repo executiveusa/macs-agent-portal --watch
gh pr view --repo executiveusa/macs-agent-portal --json mergeStateStatus,statusCheckRollup,url
```

The PR is only ready when checks are green and merge state is clean or mergeable.

10. Close stale PRs after the consolidated PR is green.

Do not close the old PRs until the new consolidated PR is green. When closing, comment that they are superseded by the new PR.

Example:

```powershell
gh pr close 19 --repo executiveusa/macs-agent-portal --comment "Superseded by the consolidated dependency/security PR: <NEW_PR_URL>."
```

Repeat for dependency PRs only after the replacement PR is healthy.

Be careful with `#5`: it is a WIP Railway/zero-secrets PR, not a normal dependency PR. Do not close it unless the consolidated PR explicitly replaces its scope.

## PR Body Template

Use this shape:

```markdown
## Summary
- Consolidates stale Dependabot/security updates into one branch from current main.
- Updates vulnerable dependency paths while preserving the Vite React runtime.
- Supersedes stale dirty dependency PRs: #6, #7, #10, #12, #13, #15, #16, #18, #19.

## Validation
- [ ] npm run lint
- [ ] npm run build
- [ ] npm audit
- [ ] Browser screenshot: /
- [ ] Browser screenshot: /dashboard

## Remaining Risk
- List any audit advisories that remain and explain why they were not safely fixable here.

## Notes
- Does not merge or alter WIP PR #5 unless explicitly handled.
```

## Stop Conditions

Stop and report instead of pushing if any of these happen:

- `npm install` requires a major framework migration.
- `next` cannot be safely removed but is unused by the app.
- `npm run build` fails after dependency updates and the fix is not obvious.
- `npm audit fix --force` wants to downgrade or replace core app packages in a way that changes runtime behavior.
- Vercel links to the wrong project. Correct project is `the-pauli-effect/macs-agent-portal`, project id currently seen locally as `prj_OkH9RAV46Ocr7zXxLZHKYJWt234c`.
- Any step requires deleting a Vercel project or changing production domains. That is destructive and needs explicit human approval.

## Known Vercel Footnote

During the previous handoff, a fresh clone accidentally created a separate Vercel project named `macs-agent-portal-main`. It was not deleted because deletion is destructive. The correct project was relinked and production was redeployed to `macs-agent-portal`.

Do not deploy to `macs-agent-portal-main`.

## Definition of Done

- One new PR exists from `chore/consolidate-github-dependency-fixes` into `main`.
- PR checks are green.
- PR is mergeable.
- Audit is zero or remaining advisories are documented with evidence.
- Old dependency PRs are closed as superseded after the new PR is green.
- `#5` remains open unless explicitly replaced.
- No production project/domain changes were made.

