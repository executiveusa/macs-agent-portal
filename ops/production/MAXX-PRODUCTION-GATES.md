# MAXX Production Acceptance Ledger

Last initialized: 2026-09-01

Production frontend: `https://macs-agent-portal-delta.vercel.app`  
Vercel project: `prj_Vg3yqMBhdgabIw3GkaRUAn7ZWOIG`  
Supabase project ref: `sxkemnqvxlgewrjplcag`  
Public API base: `https://api.thepaulieffect.com/maxx`

Status values: `PASS`, `FAIL`, `BLOCKED`, `UNVERIFIED`.

| Gate | Status | Evidence / next proof |
|---|---|---|
| GitHub `main` CI | PASS | Reverify on every new SHA. |
| MAXX release gates | PASS | Reverify on every new SHA. |
| New Vercel project exists | PASS | `macs-agent-portal`, new Pauli Vercel team. |
| Vercel production deployment READY | PASS | Production deployment from main was READY at ledger initialization. Reverify after changes. |
| Production root returns app shell | PASS | HTTP 200 and Vite shell observed at initialization. |
| Direct `/signin` route works | PASS | HTTP 200 SPA shell observed at initialization. |
| Supabase project identity | PASS | Existing project ref `sxkemnqvxlgewrjplcag`. |
| Supabase Site URL is production | FAIL | Magic-link verification redirected to `http://localhost:3000`; browser agent must update Auth URL Configuration. |
| Production `/dashboard` redirect is allowed | FAIL | Same fallback proves requested production redirect was not accepted at initialization. |
| Google provider enabled | FAIL | Supabase Auth log: `provider is not enabled` for Google. |
| Google OAuth end-to-end | FAIL | Cannot pass until provider + Google OAuth client are configured and browser-tested. |
| Fresh magic link ends at `/dashboard` | FAIL | Existing observed flow ended at localhost. Generate a new link after config repair. |
| Session persists after refresh | UNVERIFIED | Browser acceptance required after auth repair. |
| Logged-out dashboard protection | UNVERIFIED | Browser acceptance required. |
| Public API `/health/live` | UNVERIFIED | Enforced by `.github/workflows/maxx-production-loop.yml`. |
| Public API `/health/ready` | UNVERIFIED | Enforced by `.github/workflows/maxx-production-loop.yml`. |
| Authenticated bootstrap | UNVERIFIED | Requires valid production session. |
| MAXX chat via private control plane | UNVERIFIED | Requires authenticated acceptance. |
| Chief Pup governed handoff | UNVERIFIED | Requires authenticated runtime acceptance. |
| Superdoer governed handoff | UNVERIFIED | Requires authenticated runtime acceptance. |
| Business Pup governed handoff | UNVERIFIED | Requires authenticated runtime acceptance. |
| Approval stop/resume | UNVERIFIED | Requires authenticated runtime acceptance. |
| Persistence / no duplicate success | UNVERIFIED | Requires mission/run test and refresh/restart. |
| Browser console/network clean | UNVERIFIED | Final browser acceptance. |
| Mobile usability | UNVERIFIED | Final browser acceptance. |

## Current decision

**NO-SHIP** until the failing Auth gates are repaired and all required `UNVERIFIED` gates receive current production evidence.

## Rule

Do not change a gate to `PASS` from intention, source inspection alone, an old run, or a builder's claim. Record the actual observation and date/commit/deployment where applicable.
