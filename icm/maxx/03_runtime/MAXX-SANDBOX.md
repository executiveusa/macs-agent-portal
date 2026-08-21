# MAXX Sandbox Runtime

## Outcome

Give Agent MAXX and its Pups a durable cloud scratch computer without depending on Orgo or exposing the customer VPS host to agent code.

## Why it exists

Korgo demonstrates a useful product pattern: persistent Hermes profiles share a cloud computer for shell/files and keep working when the user's laptop is closed. MAXX keeps that pattern but owns the runtime.

## Architecture

```text
Stacy / MAXX UI
      |
      v
MAXX control plane  -- policy / auth / approvals / evidence
      |
      +----> Hermes + Pup profiles
      |
      +----> MAXX Sandbox API (private Docker network)
                    |
                    +-- /workspace/pups/chief-pup
                    +-- /workspace/pups/superdoer
                    +-- /workspace/pups/business-pup
```

The sandbox is a dedicated non-root container with one persistent workspace volume. It is created by the same MAXX Docker/Coolify deployment as Hermes, the control plane, NCA media, and Second Brain.

## What replaces Orgo

| Korgo / Orgo function | MAXX-owned replacement |
| --- | --- |
| provision shared cloud computer | `maxx-sandbox` service in the customer MAXX compose stack |
| persistent computer files | `maxx-sandbox-workspace` Docker volume |
| shell/file tools | authenticated `maxx-sandbox` HTTP API exposed to Hermes through the MAXX MCP bridge |
| cloud persistence while laptop is closed | VPS Docker `restart: unless-stopped` + persistent volume |
| bot-specific work areas | per-Pup workspace directories |
| Orgo API key | deployment-local `MAXX_SANDBOX_KEY` |
| Orgo hosted computer-use agent | MAXX browser/vision/computer-use capability, kept as a separate optional execution edge |
| Orgo VNC | future optional MAXX Desktop viewer; not required for the v1 sandbox contract |

## Security contract

The sandbox container MUST NOT receive:
- Docker socket,
- VPS host root filesystem,
- Supabase service-role key,
- Hermes/model-provider API keys,
- customer OAuth credentials,
- production deployment credentials.

The current compose additionally uses:
- non-root UID,
- `read_only: true`,
- writable persistent `/workspace` volume only,
- bounded `/tmp`,
- `no-new-privileges`,
- all Linux capabilities dropped,
- PID, CPU, memory, command-time, and output limits.

The sandbox may access the network for ordinary package/source retrieval. Because it contains no production credentials, it cannot use that network access as a hidden shortcut around MAXX approval policy. Future hardened tiers may add an egress proxy/allowlist.

## Authority

Sandbox execution is **not production mutation**. It is safe scratch execution only.

A successful sandbox command proves only that the command ran inside the sandbox. Deploying a website, sending an email, publishing social content, spending money, or changing a customer system must still use the dedicated governed MAXX capability and target-environment proof.

## Hermes/Pup access

Hermes never receives `MAXX_SANDBOX_KEY`.

Flow:

```text
Pup
  -> maxx-control-plane MCP (`MAXX_HERMES_TOOL_KEY`)
  -> bounded /v1/sandbox/* route
  -> control plane authenticates to maxx-sandbox
  -> isolated workspace action
```

This keeps one policy choke point and prevents a Pup from bypassing MAXX by calling the sandbox directly.

## Browser and GUI

MAXX already owns a Playwright browser worker with explicit read-only/mutation policy. The sandbox does not duplicate it.

V1:
- sandbox = shell + files + persistent scratch state,
- browser worker = web navigation/extraction/screenshots,
- NCA Toolkit = media transforms,
- dedicated connectors = production systems.

Future optional `MAXX Desktop` may add a graphical browser/desktop container and viewer behind the same `SandboxProvider` boundary. It must not become a launch dependency.

## Proof gate

Before production adoption:
1. sandbox container passes its isolation tests,
2. production compose expands with no Docker socket or host root mount,
3. Scout can create a file in its workspace,
4. Doer cannot read Scout's workspace through the API,
5. environment inspection shows no provider/customer credentials,
6. restart preserves the workspace volume,
7. deleting/recreating the sandbox container does not alter Hermes memory or Supabase state,
8. a sandbox command cannot claim external production success without separate evidence.
