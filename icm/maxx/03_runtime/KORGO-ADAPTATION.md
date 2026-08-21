# Korgo patterns adopted by MAXX

Source reference: `nickvasilescu/korgo-bot` is treated as a reference implementation, not a runtime dependency.

## Adopt

1. **Persistent bot shelf → MAXX Pups**
   - product-level teammates backed by Hermes profiles,
   - persistent canonical Bot Chat,
   - separate identity/memory/model/skills per profile.

2. **Cloud state survives the owner's device**
   - MAXX lives on the customer VPS,
   - Hermes profiles, ICM, Second Brain, and Pup workspaces persist independently from Stacy's phone/laptop.

3. **Shared computer concept → MAXX Sandbox**
   - one self-hosted execution service per MAXX deployment,
   - separate per-Pup directories,
   - shell/file tools exposed only through the MAXX control plane.

4. **Reconnect test**
   - close/reopen the client,
   - restart runtime containers,
   - recover the same Pup identity, Bot Chat, pending work/approval, and sandbox files.

5. **Per-Pup specialization**
   - Hermes profiles permit distinct models/skills/tool access,
   - MAXX remains responsible for choosing the cheap/standard/power route and tool entitlement policy.

6. **Group/team UX**
   - future MAXX Team Room may use Hermes Bot/group primitives,
   - do not expose raw upstream group topology or allow recursive uncontrolled delegation.

## Do not adopt

- Orgo workspace/computer provisioning,
- Orgo API keys or credits,
- Orgo MCP,
- `orgo-agent` hosted computer-use dependency,
- Orgo VNC credential lifecycle,
- shared production credentials across every bot,
- public Hermes endpoints,
- unrestricted bot-to-bot recursion.

## Replacement stack

```text
Korgo desktop              -> Stacy MAXX PWA / future Android companion
Orgo computer              -> maxx-sandbox container + persistent volume
Orgo shell/files           -> MAXX Sandbox API
Orgo GUI/computer-use      -> MAXX browser/vision/computer-use provider edge
Orgo persistence           -> Docker volumes + Supabase + ICM
Orgo private cloud runtime -> customer VPS / Coolify / Docker
Composio-for-all-bots      -> MAXX connector entitlement policy per Pup
Hermes Bots                -> retained: current upstream Hermes profiles
```

## Product rule

Stacy sees MAXX and Pups. Infrastructure remains replaceable behind adapter boundaries.
