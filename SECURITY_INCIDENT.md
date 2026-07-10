# MAXX Platform Security Incident Log & Response Procedure

This file has two purposes: a **procedure** to follow when something goes wrong, and a **log** of incidents that have actually happened. Do not remove past entries — append only, oldest first.

## Response Procedure

### If a secret is exposed (API key, service-role key, JWT signing material)

1. **Rotate immediately** at the provider (Supabase, OpenRouter, Groq, etc.). Do not wait to finish investigating first.
2. **Revert or scrub the commit** that exposed it, if it reached git history. A force-push may be required — follow the destructive-operation confirmation rule in CLAUDE.md before doing so.
3. **Check for misuse**: review provider-side access logs (Supabase auth logs, OpenRouter/Groq usage dashboards) for the exposure window.
4. **Log the incident below** with: what was exposed, how long it was exposed, what was rotated, and what (if anything) was misused.
5. **Notify the team lead / repository owner.**

### If `MAXX_EMERGENCY_DISABLE` needs to be triggered

1. Set `MAXX_EMERGENCY_DISABLE=true` in the control plane's environment and restart it. Every mutating route (`POST`/`PATCH`/`PUT`/`DELETE`) will return 503 immediately; read-only routes keep working.
2. Log the trigger below: what prompted it, when, who authorized it.
3. Investigate with the system in a known-safe (read-only) state.
4. Unset the variable and restart only after the root cause is understood and fixed.

### If a data breach or unauthorized access is suspected

1. Do not delete anything — preserve evidence (events table, audit logs, Supabase auth logs).
2. Identify scope: which operator, which organization, which tables/rows.
3. Rotate any credentials the suspected access path could have used.
4. Log the incident below.
5. If operator/mission data (not just system credentials) was exposed, this requires explicit escalation to the repository owner before any public communication.

### If a dependency vulnerability is disclosed (npm audit / GitHub security advisory)

1. Check whether the vulnerable code path is actually reachable from this codebase (many advisories are for unused code paths).
2. If reachable: patch or replace the dependency, re-run the full test suite, and confirm no behavior regression.
3. If unreachable but still flagged by scanners: document why in a code comment near the dependency, or accept the upgrade if low-risk.
4. Log below if the vulnerability was ever exploitable in a deployed environment (not just theoretically present in `node_modules`).

---

## Incident Log

_No incidents have been recorded as of this file's creation (Phase 15, this session). This is expected — the platform has not yet been deployed to a network-reachable production environment. The first real entry, whenever it happens, should follow the format below._

<!--
### YYYY-MM-DD: <short title>
**Severity**: LOW | MEDIUM | HIGH | CRITICAL
**What happened**:
**Detected by**:
**Actions taken**:
**Root cause**:
**Follow-up**:
-->

---

## Escalation Contacts

**Repository owner**: MACS Digital Media LLC (see repository access list)
**Security contact**: _Not yet designated — this is a real gap, not a placeholder to be filled in later by an AI agent. An owner/operator must name a person or channel here before production deployment._

## References

- `.claude/rules/security.md` — full security rules
- `docs/maxx-platform/SECURITY_REVIEW.md` — Phase 15 audit findings
- `docs/maxx-platform/RISK_REGISTER.md` — tracked risks, including R21 (backup encryption, currently unresolved)
