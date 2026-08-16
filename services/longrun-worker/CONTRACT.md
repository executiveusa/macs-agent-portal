# MAXX long-running worker contract

The DeepSeek harness is a **worker/harness**, not the Agent MAXX orchestrator.

## Authority

Hermes owns the mission. A long-running worker receives a bounded task packet and returns progress/evidence. It cannot silently expand scope, approve its own consequential result, alter MAXX identity, or become the durable source of customer truth.

## Dispatch packet

A worker mission should include:

```json
{
  "mission_id": "stable MAXX mission id",
  "outcome": "bounded desired result",
  "target": "repo/system/path",
  "constraints": [],
  "proof": [],
  "authority": "explicit allowed mutations",
  "rollback": "expected rollback path",
  "timeout_minutes": 60
}
```

## Return packet

```json
{
  "mission_id": "...",
  "status": "completed|blocked|failed",
  "summary": "plain factual result",
  "artifacts": [],
  "changes": [],
  "tests": [],
  "evidence": [],
  "cost": {},
  "blockers": []
}
```

Hermes independently reconciles the return packet against the requested proof before MAXX says `Done`.

## Failure rules

- bounded retries/circuit breaker;
- no infinite loop after repeated no-progress state;
- preserve logs/evidence needed to diagnose failure without storing credentials;
- user-facing conversation remains responsive while background work proceeds;
- cancellation propagates from MAXX/Hermes to the worker where supported.
