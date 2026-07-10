# Architecture Rules

## System Boundary

The MAXX system enforces a strict boundary where all external communication passes through the authenticated control plane.

### Browser Frontend MUST NOT
- ✗ Access model providers (OpenRouter, Groq) directly
- ✗ Hold provider API keys or Supabase service-role key
- ✗ Communicate with Hermes agent runtime
- ✗ Call voice providers (STT/TTS) directly
- ✗ Operate browser workers without control plane mediation
- ✗ Query the knowledge/memory system directly
- ✗ Bypass approval gates for high-risk actions

### All External Calls Must Flow Through
→ MAXX Control Plane (`services/maxx-control-plane/src/app.ts`)

**Routes enforce**:
- Authentication (JWT from Supabase)
- Authorization (operator allowlist)
- Approval gates (high-risk actions)
- Budget tracking (token usage, costs)
- Audit logging (who did what when)
- Feature flags (safe rollout)
- Graceful degradation (missing providers don't crash)

---

## Component Boundaries

### Frontend (Vercel)
**Scope**: Operator interface only  
**Can Read**: Dashboard data, mission state, approval status (via API)  
**Can Write**: Chat messages, mission objectives, approval decisions (via API)  
**Cannot**: Anything outside /api/* routes

**Protected Routes**:
- `/dashboard` – Requires JWT
- `/admin` – Requires admin role
- All other routes public

**API Client**: `src/services/controlTowerApi.ts`  
**Never hardcode**: API base URL (use import from config)  
**Never embed**: Provider keys, Supabase service role key, operator allowlist

### Control Plane (Fastify)
**Scope**: Business logic, policy enforcement, external integrations  
**Owns**: 
- Operator authentication & authorization
- Approval gate decisions
- Model routing & provider selection
- Budget tracking
- Event logging
- Workspace isolation validation

**Routes**: `/v1/*` (versioned, backward compatible)  
**Never expose**: 
- Provider credentials in responses
- Supabase service-role key
- Operator allowlist values
- Sensitive field values in logs

**Graceful Degradation**:
- Missing Groq → fall back to OpenRouter
- Missing voice → return 503 with fallback instruction
- Missing memory → start without indexer
- Missing Hermes → fall back to Pi executable

### ICM Workspaces
**Scope**: Isolated, versioned mission directories  
**Structure**: 8-stage pipeline per mission  
**Ownership**: Per organization (multi-tenant via RLS)

**Boundaries**:
- No agent can read parent directory
- No agent can access sibling mission workspaces
- No agent can modify workspace structure
- All I/O traced to events table

### Adapters (Planned Phases)
Each external system (Hermes, voice, memory, browser, scheduler) connects via a typed adapter:
- Adapter validates requests before forwarding
- Adapter validates responses before returning
- Adapter handles provider authentication (not frontend)
- Adapter records all calls in audit log

---

## Module Organization

### src/ (Frontend)
```
src/
├── App.tsx                    # Router setup
├── pages/
│   ├── Index.tsx             # Home
│   ├── Dashboard.tsx         # ← Main work surface (protected)
│   ├── SignIn.tsx            # Auth
│   ├── Admin.tsx             # Settings (protected)
│   └── [other public pages]
├── components/
│   ├── dashboard/
│   │   └── DashboardLayout.tsx
│   ├── ui/                   # shadcn/ui primitives
│   └── [feature components]
├── services/
│   └── controlTowerApi.ts    # HTTP client to /api/* only
├── types/
│   └── controlTower.ts       # Types matching backend contracts
├── lib/
│   └── controlTower.ts       # Formatters, utilities
└── contexts/
    └── [React context providers]
```

**Dependencies**: React, React Router, React Query, Supabase JS (browser client), shadcn/ui, TailwindCSS  
**No dependencies on**: Agent libraries, provider SDKs, voice APIs, file system access  

### services/maxx-control-plane/src/ (Backend)
```
src/
├── server.ts                  # Entry point
├── app.ts                     # ← Route handlers (PRIMARY business logic)
├── config.ts                  # Environment & configuration
├── auth.ts                    # JWT verification, operator allowlist
├── approval-policy.ts         # Action classification (risky vs. safe)
├── model-router.ts            # Task → Provider routing
├── icm-runtime.ts             # Workspace creation & isolation
├── store.ts                   # Supabase data layer
├── openrouter.ts              # OpenRouter provider
├── groq.ts                    # Groq provider
├── pi-runner.ts               # Pi skill executor
├── skills.ts                  # Trusted skill registry
├── types.ts                   # Type definitions
└── [adapters placeholder]     # Future: hermes, voice, memory, browser, scheduler
```

**Dependencies**: Fastify, JWT (jose), Zod, PostgreSQL driver  
**No dependencies on**: Browser APIs, UI libraries, frontend frameworks  

---

## Contract Evolution

### Backward Compatibility
- New request fields are optional (default values provided)
- New response fields are additive (old clients ignore them)
- Removing fields requires major version bump (e.g., v2)
- Deprecation warning given 1 release before removal

### Request/Response Validation
- All inputs parsed and validated with Zod schemas
- Invalid requests → 400 Bad Request with issue details
- Validation errors never crash the server (caught in middleware)

### API Versioning
- Current: `v1` (`/v1/chat`, `/v1/missions`, etc.)
- Future breaking change → introduce `v2`
- Keep both versions active for ≥1 release
- Migrate frontend to new version, then deprecate old

---

## Error Handling

### Control Plane Error Responses
**4xx Client Errors**:
- `400 Bad Request` – Zod validation failed
- `401 Unauthorized` – JWT invalid or operator not allowlisted
- `403 Forbidden` – Operator lacks permission (role, org, etc.)
- `404 Not Found` – Resource doesn't exist
- `409 Conflict` – State mismatch (e.g., approval already decided)

**5xx Server Errors**:
- `502 Bad Gateway` – Provider unreachable or failed
- `503 Service Unavailable` – Required service degraded (e.g., Supabase down)
- `500 Internal Server Error` – Unexpected error (logged, operator notified)

### Frontend Error Handling
- Network errors → show "Connection failed, retrying..." 
- 401 → redirect to sign-in
- 403 → show "You don't have permission to do this"
- 4xx → show error message from API
- 5xx → show "System temporarily unavailable, please try again"

### Graceful Degradation Pattern
```typescript
if (provider === "groq") {
  try {
    result = await runGroq(...);
  } catch (error) {
    logger.warn("Groq failed, falling back to OpenRouter");
    result = await runOpenRouter(...);
  }
}
```

---

## Configuration & Secrets

### Environment Variables
**Frontend** (Vercel):
- `VITE_SUPABASE_URL` – Public endpoint
- `VITE_SUPABASE_PUBLISHABLE_KEY` – Anon key only (never service-role)
- `VITE_CONTROL_PLANE_URL` – Backend API base (defaults to same origin proxy)

**Control Plane**:
- `SUPABASE_URL` – Project URL
- `SUPABASE_SERVICE_ROLE_KEY` – Server-side database access (SECRET)
- `OPENROUTER_API_KEY` – Provider key (SECRET)
- `GROQ_API_KEY` – Provider key (SECRET)
- `MAXX_STACY_ALLOWLIST` – CSV of operator emails
- `MAXX_ICM_ROOT` – Workspace root directory
- `PI_EXECUTABLE` – Path to Pi agent binary (optional)
- `MAXX_BROWSER_WS_ENDPOINT` – Playwright CDP endpoint (optional)
- `NODE_ENV` – "production", "staging", "test"

### Secrets Management
- ✗ Never commit `.env` files with real values
- ✗ Never log provider keys
- ✗ Never expose secrets in response bodies
- ✓ Use `.env.example` with placeholder values
- ✓ Inject secrets via Vercel/Coolify environment
- ✓ Rotate immediately if exposed
- ✓ Redact in logs (configured in Fastify logger)

---

## Testing Strategy

### Unit Tests (Control Plane)
- Model routing behavior
- Approval classification
- Path traversal prevention
- ICM workspace structure
- Auth policy enforcement
- Skill registry validation

**Location**: `services/maxx-control-plane/test/`  
**Command**: `npm run test:control-plane`  
**Target**: ≥90% coverage by Phase 17

### Frontend Tests
- API client contract compliance
- Dashboard data display
- Navigation/routing
- Form submission (via API)

**Location**: `src/**/*.test.ts`  
**Command**: `npm run test`  
**Target**: ≥70% for UI; ≥90% for utilities

### Integration Tests
- End-to-end mission creation
- Chat + model routing + cost tracking
- Approval workflow (request → decision → execution)
- Browser action classification
- Multi-tenant isolation

**Target**: Phase 17  
**Command**: `npm run test:integration` (planned)

### Acceptance Tests
- All existing routes still work
- Production build succeeds
- Dashboard loads with test credentials
- Chat completes successfully
- Mission creates isolated workspace

**Target**: Phase 17  
**Command**: `npm run test:acceptance` (planned)

---

## Dependency Management

### Approved Libraries (Established)
- React 18+ (UI framework)
- React Router 6+ (routing)
- React Query 5+ (API state)
- TypeScript 5+ (type safety)
- Fastify 5+ (HTTP server)
- Zod 3+ (schema validation)
- Supabase JS 2+ (database client)
- TailwindCSS 3+ (styling)
- shadcn/ui (component library)

### Prohibited
- ✗ Any library generating code without audit
- ✗ Copyleft licenses (GPL, AGPL) in production
- ✗ Unmaintained packages (no updates in 2+ years)
- ✗ Packages with known unpatched vulnerabilities

### Before Adding
1. Check license (must be MIT, Apache-2.0, ISC, BSD, or similar)
2. Check maintenance (recent commits, active maintainer)
3. Check security (no unpatched CVEs)
4. Run `npm audit` after install (zero high/critical)
5. Confirm no duplicate functionality (reuse existing)
6. Document in DEPENDENCY_REPORT.md

---

## References

- **System Boundary**: ARCHITECTURE.md, section 1
- **Routes & Handlers**: services/maxx-control-plane/src/app.ts
- **Type Contracts**: services/maxx-control-plane/src/types.ts, src/types/controlTower.ts
- **Security**: .claude/rules/security.md
- **Testing**: .claude/rules/testing.md
- **Deployment**: .claude/rules/deployment.md
