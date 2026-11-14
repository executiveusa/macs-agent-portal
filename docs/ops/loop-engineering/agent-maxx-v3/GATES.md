# Agent MAXX V3 — Unlazy acceptance ledger

## Runnable integration oracles (execute only in inspected safe repo/CI)

- [ ] G1: exact portal HEAD installs reproducibly without peer overrides
  CHECK: npm ci
  EXPECT: added
  CWD: .
  EVIDENCE: pending — CI run https://github.com/executiveusa/macs-agent-portal/actions; use actual exit 0 plus complete output, not string alone

- [ ] G2: portal lint finds no new errors
  CHECK: npm run lint
  EXPECT: no errors
  CWD: .
  EVIDENCE: pending

- [ ] G3: portal frontend tests pass
  CHECK: npm test -- --run
  EXPECT: Test Files
  CWD: .
  EVIDENCE: pending

- [ ] G4: portal production asset build succeeds
  CHECK: npm run build
  EXPECT: built
  CWD: .
  EVIDENCE: pending

- [ ] G5: control-plane tests, typecheck and build succeed
  CHECK: npm run test:control-plane && npm run typecheck:control-plane
  EXPECT: pass
  CWD: .
  EVIDENCE: pending — command should be replaced by a success-token verifier and inspected before execution

## Manual/runtime gates (never mark satisfied from mocks alone)

- [ ] G6: Google OAuth sign in and session/role login to correct Supabase project — pending
- [ ] G7: two independent test identities: deny cross-client reads, writes, chat memory, approvals and agent paths; revoke access immediately — pending
- [ ] G8: seven client records, 28 contextual prompts, client add/archive/restore with 30-day recovery and audit logs in isolated DB — pending
- [ ] G9: Instinct/FastAPI external mission request authenticated, exact project scoped and logged — pending
- [ ] G10: at least one user-approved end-to-end ICM mission with real source-backed receipt — pending
- [ ] G11: real 320/390/1440px, keyboard, ARIA and voice tests on exact preview revision — pending
- [ ] G12: independent review, reviewed migration backup/recovery, release approval and production verification with exact SHA — pending

**Important:** CHECK/EXPECT are planning examples until verified; do not run Unlazy checker with these without adapting to skill's success-only oracle and inspecting the exact commands. G1 requires checking CI exit status, not just text containing `added`. Any gate altered by a dependency change becomes STALE.
