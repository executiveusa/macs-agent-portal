# MAXX Platform Operating Instructions

**Repository**: executiveusa/macs-agent-portal  
**Owner**: MACS Digital Media LLC  
**Product**: Agent MAXX  

## Core Principles

1. **Audit Before Editing**: Inspect existing code, tests, and architecture before making changes
2. **Preserve Working Code**: Do not rewrite functioning systems for cleanliness; extend and adapt
3. **Phase-Based Delivery**: Follow 19-phase implementation plan (Phase 0 through Phase 19)
4. **Evidence-First**: Rely on test results, deployments, and real browser checks—not assumptions
5. **Approval-Required Governance**: All consequential actions gated; no autonomous production mutations

## Quick Start

- **Audit/Planning**: `/claude/docs/maxx-platform/` (CURRENT_STATE, ARCHITECTURE, RISK_REGISTER, DECISIONS)
- **Architecture Rules**: `.claude/rules/architecture.md`
- **Security Rules**: `.claude/rules/security.md`
- **Test & Build**: See scripts in `package.json` and control-plane `package.json`
- **Dashboard**: Frontend deploys to Vercel; backend to Railway/Coolify

## System Boundaries

**Browser frontend MUST NOT**:
- Access model provider APIs directly
- Hold provider API keys or Supabase service-role key
- Bypass the control plane for any external call
- Communicate directly with Hermes, voice, browser workers, or memory systems

**All external calls flow through**: MAXX control plane (`services/maxx-control-plane`)

## Key Files

### Frontend
- `src/App.tsx` – Main routing and layout
- `src/pages/Dashboard.tsx` – Operator control interface (main working surface)
- `src/services/controlTowerApi.ts` – API client
- `src/types/controlTower.ts` – Type definitions
- `src/lib/controlTower.ts` – Utilities and formatters

### Control Plane
- `services/maxx-control-plane/src/app.ts` – Route handlers (primary business logic)
- `services/maxx-control-plane/src/model-router.ts` – Task classification and provider routing
- `services/maxx-control-plane/src/auth.ts` – JWT and operator allowlist
- `services/maxx-control-plane/src/approval-policy.ts` – Action classification (risky vs. read-only)
- `services/maxx-control-plane/src/icm-runtime.ts` – Workspace isolation
- `services/maxx-control-plane/src/store.ts` – Supabase data layer

### Database
- `supabase/config.toml` – Project configuration
- `supabase/migrations/` – Additive-only schema changes
- `.env` (not in repo) – Supabase credentials

### Configuration
- `.agents` – Secret manifest template
- `AGENTS.md` – Repository protocols
- `.claude/` – Claude Code rules, agents, and settings (see below)

## .claude/ Directory Structure

```
.claude/
├── rules/
│   ├── architecture.md         # System design and module boundaries
│   ├── security.md              # Auth, approval gates, RLS policy
│   ├── frontend.md              # React, routing, component patterns
│   ├── backend.md               # Fastify, database, error handling
│   ├── voice.md                 # Voice system (Phase 9+)
│   ├── icm.md                   # Workspace contracts and isolation
│   ├── deployment.md            # Docker, Coolify, production checklist
│   └── testing.md               # Test coverage, acceptance criteria
├── agents/
│   ├── architecture-auditor.md  # Design review, cross-component consistency
│   ├── backend-engineer.md      # Control plane, database, adapters
│   ├── frontend-engineer.md     # React, pages, dashboard, tooling
│   ├── voice-engineer.md        # STT/TTS, WebSocket, voice state
│   ├── security-reviewer.md     # Threat model, audit log, access control
│   ├── deployment-engineer.md   # Docker, Coolify, rollback, monitoring
│   └── qa-engineer.md           # Test design, test execution, smoke tests
└── settings.json                # Hook configuration (format validation, tests)
```

## Phase Roadmap

| Phase | Focus | Owner | Status |
|-------|-------|-------|--------|
| 0 | Audit, baseline | Architecture | ✅ Complete |
| 1 | CLAUDE.md, agents, rules | Architecture | ← You are here |
| 2 | Shared contracts, types | Backend | Blocked on Phase 1 |
| 3 | Control-plane hardening | Backend + Security | Phase 2 complete |
| 4 | Approval engine | Backend + Security | Phase 3 complete |
| 5 | Hermes integration | AI-agent engineer | Phase 4 complete |
| 6 | Memory indexer | Backend + AI | Phase 5 complete |
| 7 | Owner strategy overlay | Architecture | Phase 6 complete |
| 8 | Scheduler | Backend + DevOps | Phase 7 complete |
| 9 | Voice infrastructure | Voice engineer | Phase 8 complete |
| 10 | Browser worker | Backend | Phase 9 complete |
| 11 | Full dashboard | Frontend | Phase 10 complete |
| 12 | Data model extension | Backend | Phase 11 complete |
| 13 | Deployment setup | DevOps | Phase 12 complete |
| 14 | Backup & restore | DevOps | Phase 13 complete |
| 15 | Security hardening | Security | Phase 14 complete |
| 16 | Client package | DevOps | Phase 15 complete |
| 17 | Test suite | QA | Phase 16 complete |
| 18 | CI/CD pipeline | DevOps | Phase 17 complete |
| 19 | Documentation & runbooks | Tech writer | Phase 18 complete |

## Running Tasks

### Frontend
```sh
npm install              # Install dependencies
npm run dev             # Vite dev server (port 3000)
npm run build           # Production build
npm run lint            # ESLint check
npm run test            # Vitest (currently 3/3 pass)
npm run build:dev       # Development build with source maps
npm run typecheck:control-plane  # Type-check backend
```

### Control Plane
```sh
cd services/maxx-control-plane
npm install
npm run dev             # tsx watch (auto-reload)
npm run build           # TypeScript → dist/
npm run start           # node dist/server.js
npm run test            # Node test runner (18/18 pass)
npm run typecheck       # tsc --noEmit
```

### Docker
```sh
docker build -t maxx-control-plane services/maxx-control-plane/
docker run -p 3001:3000 -e SUPABASE_URL=... maxx-control-plane
```

## Testing Strategy

- **Frontend**: Vitest, React Testing Library (when UI changes made)
- **Control Plane**: Node test runner, no external dependencies (fast)
- **Integration**: Manual browser testing via dashboard
- **Security**: Phase 15 threat model and audit
- **Acceptance**: Phase 17 automated test suite

## Deployment

**Current** (Vercel + control plane on laptop):
- Frontend: `npm run build` → Push to main → Vercel auto-deploys

**Staging** (Phase 13+):
- Docker build → Push to Railway
- Run smoke tests
- Manual verification

**Production** (Phase 13, gated):
- Same as staging
- Requires `MAXX_PRODUCTION_MUTATIONS_ENABLED=true`
- Backed up before deploy
- Rollback procedure documented and tested

## Emergency Procedures

### If Control Plane Crashes
1. Check logs: `docker logs <container>`
2. Verify config: `echo $SUPABASE_URL`, `echo $OPENROUTER_API_KEY`
3. Restart: `docker restart <container>`
4. Dashboard will show degraded; operators notified
5. Report to DevOps team

### If Vercel Frontend Fails
1. Check build logs: Vercel dashboard
2. Rollback: Revert commit, re-push
3. Or manually trigger redeploy in Vercel UI
4. Frontend will warn about API unavailability

### If Supabase RLS Policy Breaks
1. Control plane will error on every query
2. Check migrations: `supabase migration list`
3. Consult SECURITY_REVIEW.md (Phase 15)
4. Revert policy or open support ticket
5. No data loss; schema preserved

### Emergency Disable (If Needed)
```bash
# Disable agent work system-wide
export MAXX_EMERGENCY_DISABLE=true
# Restart control plane
# Dashboard shows all work queued; no new execution
```

## Common Workflows

### Adding a New Route
1. Define request/response schema (Zod)
2. Add handler in `services/maxx-control-plane/src/app.ts`
3. Add test in `services/maxx-control-plane/test/*.test.ts`
4. Run `npm run test:control-plane` (must pass)
5. Update frontend service client if user-facing
6. Commit with clear message

### Fixing a Bug
1. Reproduce in test (add failing test first)
2. Fix the code
3. Run test suite (all must pass)
4. Test in browser if UI-related
5. Commit with bug number reference

### Adding a Dependency
1. Run `npm install <package>` or `npm install --prefix services/maxx-control-plane <package>`
2. Check license (must be permissive)
3. Verify no new build warnings
4. Commit `package.json` and lock file together
5. Update DEPENDENCY_REPORT.md if major library

### Deploying to Production
1. All tests passing
2. Code reviewed
3. Pull request created and approved
4. Merge to main
5. Vercel auto-deploys frontend
6. Manual deployment of control plane (wait for approval)
7. Post-deployment verification (health checks pass)
8. Monitor logs for 30 minutes
9. Create release tag

## Guardrails

✅ **These are safe and encouraged**:
- Creating branches and feature-flagged code
- Running tests locally
- Building containers
- Editing documentation
- Refactoring internal functions
- Adding logging
- Improving test coverage

❌ **These require explicit confirmation**:
- Pushing to main or production branches
- Running database migrations (even additive)
- Rotating secrets or changing credentials
- Deploying to production
- Disabling approval gates
- Enabling production mutation switches
- Deleting data or tables
- Force-pushing

⚠️ **Check with team first**:
- Changing CORS/authentication logic
- Modifying approval policies
- Adding new external providers
- Major dependency upgrades
- Restructuring directories
- Removing deprecated code paths

## References

- **Phase Documentation**: `docs/maxx-platform/`
- **Architecture**: `.claude/rules/architecture.md`
- **Security**: `.claude/rules/security.md`
- **Testing**: `.claude/rules/testing.md`
- **Deployment**: `.claude/rules/deployment.md`
- **GitHub**: executiveusa/macs-agent-portal

---

**Last Updated**: 2026-07-10  
**Status**: Phase 1 (CLAUDE.md established)  
**Next**: Phase 1 continues with .claude/ directory creation
