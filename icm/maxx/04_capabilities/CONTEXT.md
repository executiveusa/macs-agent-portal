# 04_capabilities — give MAXX tools without clutter

One job: expose reusable capabilities to Hermes while keeping one MAXX front door.

## Inputs
- Working: active mission/outcome from MAXX runtime.
- Reference: `../_shared/architecture-boundaries.md`
- Reference: relevant `../../../skills/*/SKILL.md` only.

Do NOT load every skill by default.

## Process
1. Classify the requested outcome and load the smallest capable skill chain.
2. Prefer API/CLI/MCP interfaces; use browser/computer control when no authoritative machine interface exists.
3. NCA Toolkit is a media execution edge. Never expose its Python execution endpoint directly to customers.
4. MAXX Eyes is a vision edge: phone/Meta-glasses capture -> vision gateway -> MAXX API -> Hermes. VisionClaw/OpenClaw do not become a second brain.
5. Long-running harnesses are workers subordinate to Hermes and return evidence/progress.
6. CLI and MCP call the MAXX API, never Hermes directly.

## Outputs
- `../../../skills/`
- `../../../cli/`
- `../../../mcp/`
- capability adapters under `../../../services/`

## Human check
For any new capability, verify there is one authority, one credential boundary, one failure path, and one observable receipt. Reject duplicate orchestrators.
