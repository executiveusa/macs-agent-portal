# 03_runtime — run one isolated MAXX brain

One job: operate MAXX on a fresh, pinned NousResearch Hermes runtime behind the MAXX API.

## Inputs
- Working: `../../../services/hermes-runtime/UPSTREAM.lock`
- Reference: `../_shared/architecture-boundaries.md`
- Reference: `../_shared/security-policy.md`

Do NOT load or import `executiveusa/pauli-hermes-agent`. That is Bambu's personal agent and outside this product boundary.

## Process
1. Track the exact upstream Hermes source revision in `UPSTREAM.lock`.
2. Keep mutable Hermes identity/config/skills in a MAXX-only data directory/volume.
3. Expose Hermes only to the MAXX control plane over authenticated server-to-server traffic.
4. Keep the browser/PWA authenticated through Supabase; CLI/MCP automation uses the MAXX API credential, never the Hermes credential.
5. Hermes remains the sole agent orchestrator. The control plane owns authentication, product policy, evidence, approvals, and client contracts.
6. Normal mode uses configured automatic routing. MAXX Mode requests high reasoning without hard-coding UI users to a provider.
7. Enable tool-loop hard stops for unattended operation.

## Outputs
- `../../../services/hermes-runtime/`
- `../../../services/maxx-control-plane/`

## Human check
Verify a clean deployment can run without any Bambu Hermes files, secrets, memories, or endpoints and that the public/private clients only need the MAXX API contract.
