# Security Rules

## Authentication & Authorization

### JWT Verification (Supabase)
- Every protected route must verify JWT signature
- Decoded JWT contains `sub` (user ID) and optional `app_metadata`
- Set operator role from `app_metadata.role` ("owner", "admin", "operator")
- JWT verification implemented in `services/maxx-control-plane/src/auth.ts`

**All protected routes**:
```typescript
app.addHook("preHandler", async (request, reply) => {
  if (request.url.startsWith("/health/")) return; // Exception for health checks
  const operator = await authenticate(request);
  if (!operator) return reply.code(401).send({ error: "Authentication required" });
  request.operator = operator;
});
```

### Operator Allowlist
- Environment variable: `MAXX_STACY_ALLOWLIST=email1@org.com,email2@org.com`
- Email matching is case-insensitive
- Only allowlisted operators can access protected routes
- Must be explicitly configured; no default "everyone" option

**Implementation**:
```typescript
const allowlist = (process.env.MAXX_STACY_ALLOWLIST || "")
  .split(",")
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

const operator = allowlist.includes(user.email.toLowerCase()) ? user : null;
```

---

## Approval Gates

### High-Risk Action Classification
Actions requiring explicit approval BEFORE execution:
- Send email or SMS
- Publish content publicly
- Submit web forms
- Make purchases or transfers
- Upload files
- Delete or overwrite data
- Change access permissions
- Enable external automation
- Rotate credentials
- Deploy to production

### Read-Only Actions (No Approval Needed)
- View/inspect documents
- Search approved knowledge
- Take screenshots
- Navigate to public pages
- Extract information
- Classify or tag records
- Summarize content
- Draft responses (not yet sent)

### Approval Workflow
1. Operator or agent initiates action
2. Control plane classifies as risky/safe via `approval-policy.ts`
3. If risky:
   - Create approval record (status: pending, unique ID)
   - Return 202 Accepted to caller
   - Dashboard shows pending approvals
4. Operator reviews and approves or rejects
5. If approved: execute action, log to events table
6. If rejected: stop, don't execute, log rejection

### Approval Record Fields
```typescript
{
  id: UUID,                    // Unique approval ID
  run_id: string,              // Associated mission or "standalone"
  operator_id: UUID,           // Who requested the action
  organization_id: UUID,       // Tenant ownership
  action: string,              // e.g., "send_email", "browser:purchase"
  summary: string,             // Human-readable description
  decision: "pending" | "approved" | "rejected",
  decided_by: UUID | null,     // Who made the decision
  decided_at: timestamp | null,
  created_at: timestamp,
  updated_at: timestamp,
}
```

### Anti-Replay Protection
- Approval token valid only once
- After approval is decided (approved or rejected), token cannot be reused
- If operator attempts to execute rejected approval, return 409 Conflict
- Each execution creates a new approval record if needed again

---

## Database Security (Supabase RLS)

### Row-Level Security Policies
Every table that stores organization data must have RLS policies:

**Operators Table**:
- Operator can read/update own row
- Admin can read/update other operators in same org
- Service role can read all

**Missions Table**:
- Operator can read own org's missions
- Admin can read own org's missions
- Cannot read/write missions from other organizations
- Service role can read/write all (for backups, maintenance)

**Approvals Table**:
- Operator can read own org's approvals
- Operator can update (approve/reject) own org's approvals
- Cannot access other org's approvals

**Events Table**:
- Operator can read events from own org's runs
- Cannot read other org's events

**Usage Records Table**:
- Operator can read own org's usage
- Admin can read own org's usage
- Cannot access other org's usage data

### Multi-Tenant Isolation Testing (Phase 17)
- Create test mission in org A
- Verify org B operator cannot read/write org A's data
- Verify org A admin cannot see org B's data
- Verify service role can see all for maintenance
- Document test results in test suite

---

## Secrets Management

### Never Commit
- ✗ `.env` files with real values
- ✗ API keys, access tokens, passwords in source
- ✗ Private books, strategy documents, personal data
- ✗ Database credentials, SSH keys
- ✗ Customer records, contact lists

### Use Instead
- ✓ Vercel/Coolify environment variables (encrypted at rest)
- ✓ Secret vaults (HashiCorp Vault, AWS Secrets Manager)
- ✓ `.env.example` with placeholder values only
- ✓ CLAUDE.md instructions for local setup

### If Exposed
1. Rotate immediately (especially Supabase service-role key)
2. Document in SECURITY_INCIDENT.log
3. Notify team lead
4. Revert commit if possible, or create cleanup commit
5. Verify no misuse in logs (audit trail)

### Redaction in Logs
Fastify logger redacts sensitive fields automatically:
```typescript
const app = Fastify({
  logger: {
    redact: [
      "req.headers.authorization",  // JWT
      "body.audio",                  // Voice data
      "*.apiKey",                    // Any field named apiKey
      "req.body.password",           // Passwords
    ],
  },
});
```

---

## Path Traversal Prevention

### ICM Workspace Boundaries
Agents cannot escape their assigned workspace using `../` or absolute paths.

**Validation in `icm-runtime.ts`**:
```typescript
function resolveSafePath(missionRoot: string, relativePath: string): string {
  const resolved = path.resolve(missionRoot, relativePath);
  const normalized = path.normalize(resolved);
  
  // Ensure path stays within missionRoot
  if (!normalized.startsWith(path.normalize(missionRoot))) {
    throw new Error("Path traversal blocked");
  }
  return normalized;
}
```

**Rules**:
- All agent file I/O routed through `resolveSafePath()`
- No absolute paths allowed
- Workspace directory itself read-only for structure
- Only stage directories writable

---

## CORS Configuration

### Origin Allowlist
Frontend can only be on one domain. CORS must be strict:

```typescript
app.register(cors, {
  origin: (origin, callback) => {
    const allowed = [
      "https://macs-agent-portal-pi.vercel.app",  // Production
      "http://localhost:3000",                     // Local dev
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Origin not allowed"), false);
    }
  },
  credentials: true,
});
```

**Never use**:
- ✗ `origin: "*"` (allows any domain)
- ✗ Wildcard domains like `https://*.vercel.app`
- ✗ Comments like "TODO: secure this"

### Preflight Requests
- Browser sends `OPTIONS` before `POST`
- Control plane responds with `Access-Control-Allow-*` headers
- Credentials (`withCredentials: true`) only for same-site

---

## Audit Logging

### Every Consequential Action Must Log
```typescript
// Format: {runId, type, message, metadata, timestamp, operator}
await store.addEvent(runId, "mission.created", "Operator created mission", {
  objective: mission.objective,
  missionId: mission.id,
  operatorId: operator.id,
  organizationId: operator.organization_id,
});
```

**Actions that must log**:
- Operator login (via Supabase audit trail)
- Mission created/updated/completed/cancelled
- Approval created/approved/rejected
- High-risk actions executed
- External API calls (model, voice, browser)
- Configuration changes
- Permission changes
- Data exports or backups

**Fields captured**:
- `run_id` – Associated mission or "system"
- `type` – Event category (e.g., "mission.created", "approval.approved")
- `message` – Human-readable description
- `metadata` – JSON: who, what, why, relevant IDs
- `created_at` – Timestamp (ISO 8601)
- `operator_id` – Attribution

### Audit Trail Immutability
- Events are append-only (never deleted)
- Events table has no UPDATE/DELETE triggers
- Backups include full audit trail
- Operator cannot edit approval decision after made

---

## Request Limits

### Payload Sizes
- POST body: ≤20 MB (for file uploads, set explicitly)
- Chat message: ≤20,000 characters
- Audio chunk: ≤5 MB per WebSocket message

### Rate Limiting (Planned Phase 3)
- Chat endpoint: 10 requests per minute per operator
- Skill execution: 3 requests per minute per operator
- Mission creation: 5 per hour per operator
- Fallback: 429 Too Many Requests with retry-after header

---

## External API Communication

### Timeout & Retry Policy
```typescript
const request = {
  timeout: 30_000,      // 30 second timeout
  retries: 3,           // Exponential backoff: 100ms, 200ms, 400ms
};

// On error: exponential backoff, then give up
// On success: return immediately
```

### Circuit Breaker (Planned Phase 3)
If provider fails 5 consecutive times:
- Stop sending requests for 30 seconds
- Return 503 "Service degraded" to operator
- Show fallback option or alternative provider
- After recovery window, try again

### Provider Health Checks (Planned Phase 3)
Every 5 minutes:
- Ping Groq health endpoint
- Ping OpenRouter status API
- Update dependency status in control plane
- Dashboard shows provider status

---

## Emergency Disable Switches

### Production Mutation Lock
- Default: `MAXX_PRODUCTION_MUTATIONS_ENABLED=false`
- Before production deployment: must be set to `true`
- After disabling: must manually re-enable
- Blocks all external writes (email, SMS, web forms, purchases, etc.)

**Usage**:
```typescript
if (!config.MAXX_PRODUCTION_MUTATIONS_ENABLED && config.NODE_ENV === "production") {
  return reply.code(503).send({
    status: "locked",
    message: "Production mutations disabled. Set MAXX_PRODUCTION_MUTATIONS_ENABLED=true to proceed.",
  });
}
```

### System-Wide Emergency Disable
```bash
export MAXX_EMERGENCY_DISABLE=true
# All agent work stops; queue persists; operators notified
# Restart control plane to re-enable
```

---

## Security Review Checklist

Before deploying to production:
- [ ] All secrets in environment, not in code
- [ ] RLS policies reviewed and tested
- [ ] Approval gates cover all high-risk actions
- [ ] Operator allowlist configured
- [ ] CORS origins correct
- [ ] No path traversal vectors
- [ ] Audit logging on all actions
- [ ] Rate limits configured
- [ ] Graceful degradation for missing providers
- [ ] Error messages don't leak sensitive info
- [ ] Logs redact secrets automatically
- [ ] JWT verification enabled on protected routes
- [ ] Database backups encrypted and tested
- [ ] Incident response plan documented
- [ ] Security contact and escalation path defined

---

## References

- **Auth**: services/maxx-control-plane/src/auth.ts
- **Approvals**: services/maxx-control-plane/src/approval-policy.ts
- **ICM Isolation**: services/maxx-control-plane/src/icm-runtime.ts
- **Supabase RLS**: docs/maxx-platform/ARCHITECTURE.md (Data Model section)
- **Threat Model**: docs/maxx-platform/THREAT_MODEL.md (Phase 15)
- **Incident Response**: SECURITY_INCIDENT.md (To be created Phase 15)
