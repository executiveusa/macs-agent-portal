# 05_release — prove MAXX before shipping

One job: decide whether a MAXX build is actually releasable.

## Inputs
- Working: branch/PR under test.
- Reference: `../_shared/evidence-standard.md`
- Reference: `../_shared/security-policy.md`
- Reference: uploaded Full Stack Wiring Audit v2 and Gauntlet Loop methods used for this release.

Do NOT treat build success, deployment success, screenshots, or agent self-report as product proof by themselves.

## Process
1. Run lint, frontend tests/build, control-plane typecheck/tests, and security checks.
2. Run the Full Stack Wiring Audit from promise -> UI -> handler -> transport -> backend -> dependency -> canonical state -> observable result.
3. Run a Gauntlet with a separate builder and critic pass. UI bar: the approved MAXX wireframe plus the simplicity of the current ChatGPT-style conversational pattern. Runtime bar: the pinned upstream Hermes API contract and this repo's tests.
4. Exercise happy path and failure path: auth rejection, unavailable Hermes, normal chat, MAXX Mode, approval, health, CLI/MCP contract, restart/persistence where deployment access exists.
5. Record every unresolved item as a blocker or explicit post-launch item; never hide it behind demo data.

## Outputs
- `../../../ops/reports/MAXX-FULL-STACK-WIRING.md`
- `../../../ops/reports/MAXX-GAUNTLET.md`
- PR/CI/deploy receipts

## Human check
Release only when all critical wiring is proven, no secret is committed, consequential authority is preserved, and the private Stacy path is simpler than the technical control surface it replaces.
