# MAXX Monorepo Packages

Shared type definitions and contracts for inter-service communication.

## Packages

### @maxx/shared-types
Core type definitions used across all services:
- Operators, Organizations, Missions, Approvals
- Events, Usage Records, Agent Runs
- Voice sessions, Browser actions
- Deployments, Backups, Service health

**Usage**:
```typescript
import { missionSchema, usageRecordSchema } from "@maxx/shared-types";

const mission = missionSchema.parse(data); // Runtime validation
type Mission = z.infer<typeof missionSchema>; // Type extraction
```

**Versioning**: Additive only. New fields are optional (default values). Removing fields requires major version bump (e.g., @maxx/shared-types@2.0.0).

### @maxx/agent-contracts (Planned Phase 5)
Agent runtime interface and protocols:
- AgentRunInput, AgentRunState, AgentEvent
- ToolCall, ToolResponse
- Agent sandbox requirements
- Event streaming protocol

### @maxx/event-contracts (Planned Phase 1)
Standardized event types and validation:
- Event enumeration (mission.created, approval.approved, etc.)
- Event schema with metadata
- Event sourcing patterns

### @maxx/policy-engine (Planned Phase 4)
Approval and policy evaluation:
- Action classification (risky vs. safe)
- Risk level assessment
- Budget enforcement
- Permission checking

### @maxx/voice-contracts (Planned Phase 9)
Voice system interface:
- VoiceSession state machine
- STT/TTS provider contract
- WebSocket message protocol
- Voice configuration schema

### @maxx/deployment-contracts (Planned Phase 13)
Deployment and infrastructure types:
- Deployment manifest
- Release notes
- Backup/restore records
- Feature flag definitions
- Service health schema

## Design Principles

### Type Safety
- All contracts defined with Zod for runtime validation
- TypeScript types extracted from schemas
- No separate type files; schema is source of truth
- Supports JSON serialization and runtime parsing

### Backward Compatibility
- New fields are optional with sensible defaults
- Removing fields requires major version bump
- Old clients gracefully ignore new fields
- New clients provide defaults for old missing fields

### Versioning
Each package uses semantic versioning:
- MAJOR: Breaking changes (incompatible API, removed fields)
- MINOR: New features (new optional fields, new schemas)
- PATCH: Bug fixes (no schema changes)

### Usage Pattern
```typescript
// 1. Import schema for validation
import { missionSchema } from "@maxx/shared-types";

// 2. Parse untrusted data
const mission = missionSchema.parse(untrustedData);
// Throws ZodError if invalid

// 3. Extract type for compile-time safety
type Mission = z.infer<typeof missionSchema>;

// 4. Use safely
const objective: string = mission.objective; // Type-safe
```

## Integration with Services

### Frontend (uses @maxx/shared-types)
```typescript
// src/services/controlTowerApi.ts
import { createMissionSchema } from "@maxx/shared-types";

export async function createMission(objective: string) {
  const payload = createMissionSchema.parse({ objective });
  const response = await fetch("/v1/missions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return missionSchema.parse(await response.json());
}
```

### Control Plane (uses @maxx/shared-types)
```typescript
// services/maxx-control-plane/src/app.ts
import { createMissionSchema, missionSchema } from "@maxx/shared-types";

app.post("/v1/missions", async (request, reply) => {
  const input = createMissionSchema.parse(request.body);
  const mission = await store.createMission(input);
  return reply.send(missionSchema.parse(mission));
});
```

### Hermes Adapter (uses @maxx/agent-contracts)
```typescript
// services/maxx-hermes-adapter/src/adapter.ts
import { agentRunInputSchema, agentEventSchema } from "@maxx/shared-types";

export async function startRun(input: unknown) {
  const validated = agentRunInputSchema.parse(input);
  // Start Hermes run...
}
```

## Building & Publishing

### Build all packages
```bash
npm install
npm run build --workspaces
```

### Typecheck all packages
```bash
npm run typecheck --workspaces
```

### Publish to private registry (planned)
```bash
npm publish --workspaces --registry=https://registry.maxx.com
```

## Adding a New Package

1. Create directory: `packages/new-package/`
2. Create `package.json`, `tsconfig.json`, `src/index.ts`
3. Define types using Zod schemas
4. Export from `src/index.ts`
5. Add build script to root `package.json`
6. Document contract in README
7. Commit: "packages: Add new-package with XYZ contracts"

## Contract Review Checklist

Before finalizing a contract:
- [ ] Schema is additive (never breaking backward compatibility)
- [ ] All fields have sensible defaults (where applicable)
- [ ] Type names are clear and consistent
- [ ] Documentation includes usage examples
- [ ] Zod validation is strict (min lengths, formats, etc.)
- [ ] Type is exported from package `index.ts`
- [ ] Integration test passes
- [ ] No hardcoded values (all configurable)

## References

- **Zod docs**: https://zod.dev/
- **Semantic versioning**: https://semver.org/
- **Event sourcing**: https://martinfowler.com/eaaDev/EventSourcing.html
