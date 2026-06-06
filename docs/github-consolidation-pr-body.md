## Summary
- Consolidates stale Dependabot/security updates into one branch from current `main`.
- Updates vulnerable dependency paths while preserving the Vite React runtime.
- Supersedes stale dirty dependency PRs: #6, #7, #10, #12, #13, #15, #16, #18, #19.

## Validation
- [x] `npm run lint`
- [x] `npm run build`
- [x] `npm audit`
- [x] Browser screenshot: `/`
- [x] Browser screenshot: `/dashboard`

## Remaining Risk
- `npm run lint` still reports the existing Fast Refresh warnings in shared UI helper files. They are warnings only and do not block the build or audit.

## Notes
- Does not merge or alter WIP PR #5 unless explicitly handled.
