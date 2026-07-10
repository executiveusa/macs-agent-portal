# MAXX Platform Architecture

## System Boundary

The MAXX platform enforces a strict system boundary where all external communications pass through the authenticated control plane:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Vercel (Public MAXX Site)                    │
│                         + Dashboard                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ HTTPS / JWT
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│          MAXX Control Plane (Fastify, Authenticated)             │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Policy Engine                                            │   │
│  │  • Approval gates                                         │   │
│  │  • Permission checks                                      │   │
│  │  • Budget enforcement                                     │   │
│  │  • Feature flags                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Adapters                                                 │   │
│  │  • Hermes (agent runtime)                                 │   │
│  │  • Voice gateway (STT/TTS)                                │   │
│  │  • Browser worker                                         │   │
│  │  • Memory indexer                                         │   │
│  │  • Scheduler                                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────┬──────────┬──────────┬──────────┬──────────┬──────────────┘
       │          │          │          │          │
   [Models]   [Voice]     [Browser]  [Memory]   [Storage]
   OpenRouter  Groq         Local      Vector    Supabase
   Groq        Local STT    Playwright DB       Filesystem
              Local TTS

Boundaries the browser frontend MUST NOT cross:
  ✗ Direct Hermes communication
  ✗ Direct model provider access
  ✗ Direct Supabase service-role key usage
  ✗ Direct voice provider calls
  ✗ Direct browser worker commands
```

## Component Overview

### 1. Frontend (Vercel)

**Technology**: Vite + React 18 + TypeScript + React Router 6  
**Responsibility**: Operator interface and user-facing views  
**Authentication**: Supabase JWT (read-only token, no service-role)

**Routes**:
- `/` – Home page (public)
- `/signin` – Authentication (public)
- `/dashboard` – Control center (protected)
- `/admin` – System settings (protected, admin-only)
- `/blog` – News/updates (public)
- `/shop` – Pricing/products (public)

**Dashboard Panels**:
- **System Status**: Agent state, dependency health, version
- **Missions**: Active and completed work, stage progress
- **Approvals**: Pending decisions and history
- **Browser**: Current session, action history, screenshots
- **Skills**: Registered capabilities, execution results
- **Usage**: Token counts, costs, trends
- **Audit**: Operator actions, approval chain

**API Surface**: 
- All calls to `/api/*` proxy to control plane
- No direct provider access from browser
- Graceful degradation if control plane unavailable

### 2. Control Plane (Fastify)

**Deployment**: Local container or Railway/Coolify  
**Port**: 3000 (configurable)  
**Database**: Supabase (read/write via service-role key, server-side only)

**Core Responsibilities**:
- Operator authentication and allowlisting
- Request routing to appropriate provider/adapter
- Approval gate enforcement
- Budget and quota tracking
- Event logging and audit trail
- Mission lifecycle management
- Dependency health reporting

**Security Posture**:
- No plaintext secrets in responses
- Operator allowlist from environment
- JWT validation on every protected route
- CORS origin validation (exact match)
- Request body size limits
- Rate limiting on chat/skill endpoints (planned)
- Automatic logout of failed authentication

**Request Flow**:

```
Browser Request (with JWT)
  │
  ▼
Fastify Middleware: Authenticate & Authorize
  ├─ Validate JWT signature
  ├─ Check operator allowlist
  ├─ Verify organization membership
  │
  └─ If failed → 401 Unauthorized
                 Stop
  │
  ▼ (Authorized)
Route Handler
  ├─ Parse & validate request body (Zod)
  ├─ Check feature flags
  │
  ├─ If read-only → Execute
  │
  ├─ If high-risk → Create approval record
  │                 Return 202 Accepted (approval pending)
  │
  └─ If approved → Execute action
                   Log to audit trail
                   Return result
```

### 3. Adapter Layer

The control plane communicates with external systems through typed adapters:

#### 3a. Model Routing Adapter
**File**: services/maxx-control-plane/src/model-router.ts  
**Task Classification**:
- **everyday**: Casual conversation → Groq (fast, low-cost)
- **research**: Information gathering → OpenRouter (capable)
- **coding**: Technical work → OpenRouter (tool-capable reasoning)
- **high_risk**: Sensitive actions → OpenRouter (careful, auditable)

**Fallback Strategy**:
- Primary: Groq (if unavailable, fall back to OpenRouter)
- Secondary: OpenRouter (always available if key configured)
- Graceful degradation: Error returned to operator if both fail

#### 3b. Agent Runtime (Hermes) Adapter
**Status**: To be implemented in Phase 5  
**Interface**:
```typescript
interface AgentRuntime {
  startRun(input: AgentRunInput): Promise<AgentRun>;
  sendMessage(runId: string, message: string): Promise<void>;
  cancelRun(runId: string): Promise<void>;
  getStatus(runId: string): Promise<AgentRunStatus>;
  streamEvents(runId: string): AsyncIterable<AgentEvent>;
}
```

#### 3c. Voice Gateway Adapter
**Status**: To be implemented in Phase 9  
**Endpoints**:
- WebSocket: `/voice/session` (authenticated session handshake)
- REST: `/v1/voice/transcribe` (STT request)
- REST: `/v1/voice/synthesize` (TTS request)

#### 3d. Browser Worker Adapter
**Status**: Partial (read-only ready, mutations gated)  
**Method**: Remote Playwright CDP endpoint  
**Validation**: All mutations require approval before execution

#### 3e. Memory Indexer Adapter
**Status**: To be implemented in Phase 6  
**Operations**:
- Index source documents
- Search indexed memory
- Propose new facts
- Approve/reject proposals
- Manage conflicts and duplicates

#### 3f. Scheduler Adapter
**Status**: To be implemented in Phase 8  
**Scope**:
- Register scheduled jobs
- Trigger jobs at scheduled times
- Report job execution results
- Manage retry and failure policies

### 4. Data Model (Supabase)

**Schema** (PostgreSQL, RLS-protected):

**Operators Table**:
```
id (UUID)
email (text, unique)
organization_id (UUID, FK)
role (enum: owner, admin, operator)
created_at (timestamp)
updated_at (timestamp)
```

**Organizations Table**:
```
id (UUID)
name (text)
slug (text, unique)
created_at (timestamp)
updated_at (timestamp)
```

**Missions Table**:
```
id (UUID, PK)
operator_id (UUID, FK)
organization_id (UUID, FK)
objective (text)
status (enum: working, ready, completed, failed, cancelled)
run_id (text, FK to Events)
workspace_path (text)
created_at (timestamp)
updated_at (timestamp)
```

**Approvals Table**:
```
id (UUID, PK)
run_id (text)
operator_id (UUID, FK)
organization_id (UUID, FK)
action (text)
summary (text)
decision (enum: pending, approved, rejected)
decided_by (UUID, FK)
decided_at (timestamp)
created_at (timestamp)
updated_at (timestamp)
```

**Events Table**:
```
id (UUID, PK)
run_id (text)
type (text)
message (text)
metadata (jsonb)
created_at (timestamp)
```

**Usage Records Table**:
```
id (UUID, PK)
run_id (text)
model (text)
prompt_tokens (integer)
completion_tokens (integer)
estimated_cost_usd (decimal)
created_at (timestamp)
```

**Row-Level Security (RLS)**:
- Operators can only read/write their own organization's records
- Admins can read all records within their organization
- Service-role key used server-side only (control plane)

### 5. ICM Runtime

**Purpose**: Isolated, versioned workspace for each mission  
**Root Directory**: `$MAXX_ICM_ROOT` (e.g., `/srv/maxx/workspaces`)

**Workspace Structure** (per mission):
```
owner/                          # Owner-exclusive missions
└── 20260710-mission-abc123/   # run_id
    ├── CONTEXT.md              # Mission mandate and context
    ├── AGENTS.md               # Registered agents and roles
    ├── README-FIRST.md         # Onboarding and current state
    ├── _config/
    │   ├── approved-references/ # Whitelisted external sources
    │   ├── voice/              # Voice behavior config
    │   └── schedules/          # Job definitions
    ├── shared/                 # Shared resources
    ├── knowledge/              # Second-brain references
    ├── runtime/                # Hermes execution environment
    ├── stages/
    │   ├── 00_inbox/           # Incoming requests
    │   ├── 01_intake/          # Analysis and planning
    │   ├── 02_research/        # Information gathering
    │   ├── 03_plan/            # Strategy formulation
    │   ├── 04_execute/         # Action execution
    │   ├── 05_verify/          # Validation and testing
    │   ├── 06_approval/        # Human review gates
    │   ├── 07_deliver/         # Output packaging
    │   └── 08_learn/           # Post-mission review
    └── _manifest.json          # Immutable input record

clients/                        # Client-owned missions
└── client-name/
    └── 20260710-mission-xyz789/
        └── [same structure]
```

**Stage Contract** (per directory):
- `CONTEXT.md` – Stage purpose, inputs, allowed tools, expected outputs
- `references/` – Stable reference material (read-only)
- `input/` – Stage inputs (may be modified by predecessor)
- `output/` – Stage outputs (read by successor)

**Immutable Manifest** (`_manifest.json`):
```json
{
  "run_id": "20260710-mission-abc123",
  "mission_id": "...",
  "operator_id": "...",
  "organization_id": "...",
  "objective": "...",
  "created_at": "2026-07-10T00:00:00Z",
  "inputs": {
    "source_file": "...",
    "parameters": {...}
  },
  "stages": [
    {"id": "00_inbox", "status": "completed", ...},
    ...
  ]
}
```

### 6. Approval Engine

**Purpose**: Gate consequential actions and ensure operator oversight  
**Lifecycle**:

```
Operator or Agent initiates high-risk action
  │
  ▼
Control plane receives request
  │
  ├─ Classify action (read-only vs. risky)
  │
  ├─ If read-only → Execute immediately
  │
  └─ If risky:
     │
     ├─ Create approval record (status: pending)
     ├─ Assign unique approval ID
     ├─ Return 202 Accepted to caller
     │
     ▼ (Operator reviews dashboard)
     │
     ├─ Operator approves → Update record (status: approved)
     │ or
     ├─ Operator rejects → Update record (status: rejected)
     │                     Stop; no execution
     │
     ▼ (If approved)
     │
     └─ Execute action
        Log to audit trail
        Return result to operator
```

**Classified as Risky (approval_required)**:
- Submit forms
- Send messages
- Publish content
- Make purchases
- Upload files
- Delete data
- Change permissions
- Browser mutations (upload, delete, form submission, etc.)
- External sends (email, SMS, webhooks)

**Allowed Without Approval (read_only)**:
- View/inspect approved documents
- Search approved knowledge
- Take screenshots
- Navigate to public pages
- Extract public information
- Classify records
- Summarize content
- Draft (pre-approval)

### 7. Observability

**Logging**:
- Fastify structured logging (JSON format)
- Sensitive fields redacted: auth headers, API keys, audio data
- Correlation IDs on every request
- Request ID generation for tracing

**Metrics** (planned):
- Request latency (p50, p95, p99)
- Error rates by endpoint
- Token usage by model/provider
- Approval acceptance/rejection rates
- Service dependency health

**Events**:
- Mission created/updated/completed/failed
- Approval created/decided
- High-risk actions executed
- Provider failures and fallbacks
- Operator logins
- Skill executions
- Browser actions

**Audit Trail**:
- Every consequential action logged to events table
- Operator attribution on all changes
- Immutable record of approvals and decisions

### 8. Feature Flags

**Purpose**: Safe rollout and emergency disable  
**Scope**: Environment variables + Supabase override

**Planned Flags**:
- `MAXX_HERMES_ENABLED` (default: false until Phase 5)
- `MAXX_VOICE_ENABLED` (default: false until Phase 9)
- `MAXX_BROWSER_ENABLED` (default: true for read-only)
- `MAXX_BROWSER_MUTATIONS_ENABLED` (default: false)
- `MAXX_MEMORY_ENABLED` (default: false until Phase 6)
- `MAXX_SCHEDULER_ENABLED` (default: false until Phase 8)
- `MAXX_PRODUCTION_MUTATIONS_ENABLED` (default: false)
- `MAXX_EMERGENCY_DISABLE` (default: false; kills all agent work)

---

## Deployment Topology

### Development (Local)
```
npm run dev (frontend, port 3000)
cd services/maxx-control-plane && npm run dev (control plane, port 3001)
Supabase local (docker-compose, port 5432)
```

### Staging (Railway / Coolify)
```
Vercel (frontend)
   ↓ (proxy to)
Railway app (control plane + worker)
   ↓
Supabase (managed, staging project)
```

### Production (Hostinger + Coolify)
```
Vercel (frontend)
   ↓ (proxy to)
Coolify (orchestrates all services)
   ├─ Fastify control plane (MAXX_PORT=3000)
   ├─ Hermes worker (HERMES_PORT=3001)
   ├─ Voice gateway (VOICE_PORT=3002)
   ├─ Memory indexer (MEMORY_PORT=3003)
   ├─ Browser worker (BROWSER_PORT=3004)
   └─ Scheduler (native Coolify jobs)
   ↓
PostgreSQL (managed by Coolify or external Supabase)
   ↓
/srv/maxx/ (persistent volumes)
   ├─ workspaces/ (ICM mission directories)
   ├─ second-brain/ (knowledge storage)
   ├─ voice-models/ (local STT/TTS models)
   ├─ backups/ (encrypted backups)
   └─ audit/ (event logs)
```

---

## Cross-Component Communication

| From | To | Protocol | Auth |
|------|----|-----------|----|
| Browser | Control Plane | HTTPS | JWT |
| Control Plane | Supabase | SQL + API | Service-role key |
| Control Plane | Hermes | HTTP/WebSocket | Service-to-service token |
| Control Plane | Voice Gateway | gRPC or HTTP | mTLS or token |
| Control Plane | Memory | HTTP or gRPC | Service token |
| Control Plane | Scheduler | Job queue or HTTP | Internal |
| Browser | Hermes | ✗ BLOCKED | - |
| Browser | Model providers | ✗ BLOCKED | - |
| Hermes | Control Plane | HTTP callbacks | Service token |
| Voice Gateway | STT provider | HTTP + key | API key |
| Voice Gateway | TTS provider | HTTP + key | API key |

---

## Security Guarantees

1. **Browser never sees provider keys** – Control plane owns credentials
2. **No direct database access from browser** – Service-role key server-only
3. **All mutations gated by approval** – No autonomous consequential actions
4. **Every action auditable** – Event log with operator attribution
5. **Operator allowlist enforced** – Only known Stacy operators allowed
6. **CORS strictly validated** – Only Vercel domain on production
7. **Path traversal prevented** – ICM paths validated; no `../` escape
8. **Secrets redacted** – No API keys or credentials in logs or responses
9. **Multi-tenant safe** – RLS policies prevent cross-org data access
10. **Graceful degradation** – Missing providers degrade; don't crash

---

## Upgrade & Rollback

**Frontend** (Vercel):
- Commit to `main` → Vercel auto-deploys
- Rollback: Re-deploy previous commit or revert

**Control Plane** (Coolify):
- New release tagged in GitHub
- Coolify pulls image, replaces container
- Rollback: Coolify maintains previous N images; switch via UI

**Database** (Supabase):
- Migrations in `supabase/migrations/`
- Always additive; never drop/alter existing tables
- Rollback: Revert migration file; Supabase downgrades schema

---

## Next Steps (Phase 1)

1. Add `.claude/` directory with operating rules and agents
2. Create root `CLAUDE.md` configuration file
3. Implement Hermes adapter (Phase 5)
4. Add voice infrastructure (Phase 9)
5. Build memory/knowledge system (Phase 6)
6. Implement scheduler (Phase 8)
7. Harden deployment and add feature flags
8. Complete test coverage and security review
