# MAXX Production Loop

Use this skill when moving Agent MAXX from a code-complete state to a production-verified state.

## Purpose

Do not equate a successful build with a successful product. Drive the real system through an evidence loop until every required production outcome is observed or an explicit blocker is recorded.

## Operating model

This loop combines five complementary ideas without importing their implementations into the runtime:

1. **Depth / acceptance discipline (Unlazy-inspired)**
   - Write the acceptance outcomes before changing code.
   - Give each outcome a concrete observation, command, endpoint, or browser behavior.
   - Re-run evidence after changes; old evidence is not proof of the new state.

2. **Minimum necessary change (Ponytail-inspired)**
   - Read the real flow first.
   - Reuse what already exists.
   - Prefer configuration fixes over code when configuration is the fault.
   - Never remove validation, auth, approvals, accessibility, error handling, or evidence merely to reduce code.

3. **Bounded execution loop (Ralphy-inspired)**
   - Work one blocker at a time from the acceptance ledger.
   - After each change: verify, classify PASS/FAIL, and select the next blocker.
   - Never loop blindly. Stop on a missing credential, human-only provider setup, destructive action, or ambiguous production ownership and report the exact handoff.

4. **Independent critic (Gauntlet-inspired)**
   - The builder does not declare its own work done.
   - Compare the live result to the acceptance bar using a fresh verification pass.
   - Use binary outcomes for release-critical gates: PASS or FAIL.

5. **Human copy finishing (Humanizer-inspired)**
   - Apply only to user-facing prose after functional gates pass.
   - Never run copy rewriting over identifiers, API contracts, security messages, legal text, auth configuration, logs, code, or structured data.

## Production acceptance ledger

For the current MAXX production target, all of these are required before SHIP:

### Source and deploy
- Current GitHub `main` SHA is known.
- GitHub CI passes for that SHA.
- MAXX release gates pass for that SHA.
- New Vercel project `prj_Vg3yqMBhdgabIw3GkaRUAn7ZWOIG` has a READY production deployment from that SHA.
- Root and direct SPA routes return the app shell.

### Authentication
- Supabase project ref is exactly `sxkemnqvxlgewrjplcag`.
- Production Site URL is not localhost.
- Production dashboard redirect is allowed.
- Google provider is enabled.
- Google OAuth reaches the Google account/consent screen and returns to `/dashboard`.
- A newly generated magic link returns to `/dashboard`, never localhost.
- Session survives refresh.
- Logged-out `/dashboard` remains protected.

### Runtime
- `https://api.thepaulieffect.com/maxx/health/live` passes.
- `https://api.thepaulieffect.com/maxx/health/ready` passes.
- Authenticated bootstrap succeeds.
- MAXX chat succeeds through the private control plane.
- Chief Pup, Superdoer, and Business Pup each complete a governed handoff.
- Mission creation persists.
- Approval-required work stops before side effects and resumes only after approval.
- Evidence/events persist without duplicate success claims.
- Restart/refresh does not lose required state.

### Browser quality
- No release-blocking console errors.
- No unexpected 4xx/5xx on required flows.
- No CORS failure.
- Mobile sign-in and dashboard remain usable.

## Loop

Repeat:

1. Read the current ledger and latest production evidence.
2. Select the highest-impact failing gate.
3. Trace the real cause before editing.
4. Make the minimum safe change.
5. Run repository CI/release gates when code changed.
6. Observe the live production deployment/configuration.
7. Run an independent verification pass.
8. Mark only evidence-backed gates PASS.
9. Continue until all required gates pass or a precise external blocker is reached.

## Release decision

- **SHIP**: every required gate above has current evidence.
- **NO-SHIP**: any required gate fails, is untested, or relies on stale evidence.
- **BLOCKED**: a specific external action is required and cannot be performed with available credentials/tools. State exactly what action, account/project, and validation must follow.

Never weaken auth, CORS, RLS, approval policy, credential boundaries, or MAXX/Bambu Hermes isolation to make a gate green.

## Attribution / references

Method ideas are informed by:
- Leonxlnx/unlazy
- DietrichGebert/ponytail
- michaelshimeles/ralphy
- robonuggets/gauntlet-loop
- blader/humanizer

Use their upstream repositories as references. This skill is a MAXX-specific production policy and does not vendor their source code.
