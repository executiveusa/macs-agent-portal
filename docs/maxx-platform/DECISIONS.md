# MAXX Platform: Architectural Decisions

**Log Format**: YYYY-MM-DD | Decision ID | Title | Owner | Status

---

## Ratified Decisions

### 2026-07-10 | AD-001 | System Boundary: Browser Never Touches Provider APIs
**Owner**: Architecture  
**Status**: ✅ APPROVED (Phase 0)

All external communication, including model providers (OpenRouter, Groq), voice providers, browser workers, and knowledge systems, must pass through the authenticated MAXX control plane. The frontend cannot hold provider credentials or communicate directly with external systems.

**Rationale**:
- Operator oversight: All actions flow through control plane, enabling approval gates
- Security: No provider keys exposed to browser
- Auditability: All interactions logged server-side
- Policy enforcement: Budget, rate limits, feature flags enforced centrally

**Impact**: All external adapters (Hermes, voice, memory, browser) must be control-plane services, not browser-side libraries

**Implementation**: Documented in ARCHITECTURE.md; enforced in code review

---

### 2026-07-10 | AD-002 | ICM-First Workspace Architecture
**Owner**: Architecture  
**Status**: ✅ APPROVED (Phase 0)

Every mission gets an isolated ICM workspace with eight-stage structure, immutable input manifest, and versioned reference material. Agents cannot write to parent directories or workspaces outside their current mission.

**Rationale**:
- Isolation: Client data never mixes
- Reproducibility: Each run has immutable inputs and manifest
- Auditability: All work contained in versioned structure
- Scalability: Workspaces can be archived, backed up, and restored independently

**Impact**: Hermes adapter must respect workspace boundaries; no cross-mission reads without explicit approval

**Implementation**: icm-runtime.ts; validated in tests

---

### 2026-07-10 | AD-003 | Approval-First Action Governance
**Owner**: Security & Backend  
**Status**: ✅ APPROVED (Phase 0)

Consequential actions (sending messages, publishing, making purchases, uploading files, changing permissions, browser mutations) require explicit operator approval before execution. Approval and execution are separate operations.

**Rationale**:
- Human-in-the-loop: No autonomous external actions
- Accountability: Approval record shows who authorized what
- Safety: Accidental requests caught before execution
- Auditability: Full chain of decision-making logged

**Impact**: Phase 4 requires approval engine hardening; all external actions check approval status

**Implementation**: approval-policy.ts; approval decision flow in control plane routes

---

### 2026-07-10 | AD-004 | Graceful Degradation for Optional Services
**Owner**: Backend  
**Status**: ✅ APPROVED (Phase 0)

Voice endpoints, memory indexer, Hermes agent, and scheduler are optional. MAXX boots and operates without them. Missing services report degraded status but don't crash the control plane.

**Rationale**:
- Resilience: System survives dependency failure
- Rollout safety: New features can be disabled without redeployment
- Testing: Staging can omit expensive services (GPU STT/TTS)
- Client flexibility: Lite deployments can skip memory/scheduler

**Impact**: Phase 9 voice is feature-flagged; Phase 6 memory is degraded by design; Phase 8 scheduler is optional

**Implementation**: Dependencies() function reports status; routes check feature flags

---

### 2026-07-10 | AD-005 | Vercel Frontend, Self-Hosted Control Plane
**Owner**: DevOps  
**Status**: ✅ APPROVED (Phase 0)

Public-facing Vercel deployment (frontend + edge cache) proxies protected routes to self-hosted control plane (Railway, Coolify, or on-prem). Database lives in managed Supabase for now; long-term may move to self-hosted PostgreSQL.

**Rationale**:
- Performance: CDN serves frontend globally
- Simplicity: Vercel handles TLS, certificate rotation, auto-scaling
- Control: MAXX logic and data stay in operator-controlled infrastructure
- Cost: Separate billing; easier to scale control plane independently

**Impact**: Control plane must be resilient to Vercel CDN caching; must set Cache-Control headers carefully

**Implementation**: Proxy rules in Vercel config; CORS validation in control plane

---

### 2026-07-10 | AD-006 | No Server-Side Voice by Default; Browser Fallback
**Owner**: Voice & Architecture  
**Status**: ✅ APPROVED (Phase 0)

Initially, voice interaction uses browser Speech Recognition API (SpeechRecognition) as fallback, clearly labeled. Server-side push-to-talk with local STT/TTS deployed in Phase 9 behind feature flag. No always-listening wake-word mode by default.

**Rationale**:
- Safety: No ambient microphone access without explicit user gesture
- Privacy: Browser API doesn't retain audio by default
- Rollout: Voice can be tested in staging before production
- Simplicity: Reduces Phase 0-8 dependency count

**Impact**: Phase 9 implements server voice; Phase 10 integrates with browser worker

**Implementation**: Voice endpoints return 503 with fallback instruction; feature flag added in Phase 3

---

### 2026-07-10 | AD-007 | Model Routing with Graceful Fallback
**Owner**: Backend  
**Status**: ✅ APPROVED (Phase 0)

Task classification routes requests to Groq (fast/cheap) for everyday work, fallback to OpenRouter (capable) if Groq unavailable. High-risk actions always use OpenRouter (auditable reasoning).

**Rationale**:
- Cost: Groq is 50-70% cheaper for commodity chat
- Latency: Groq responds faster for research/extraction
- Safety: High-risk work gets careful reasoning model
- Resilience: Either provider missing degrades gracefully

**Impact**: Model contracts include provider and routing reason; fallback tested in Phase 17

**Implementation**: model-router.ts; runGroq fallback in chat route

---

### 2026-07-10 | AD-008 | Supabase RLS for Multi-Tenant Safety
**Owner**: Security & Backend  
**Status**: ✅ APPROVED (Phase 0)

Row-level security policies isolate data by organization. Operators see only their org's records. Admins see all records in their org. Service-role key (server-only) can see all data for backups and migrations.

**Rationale**:
- Isolation: Client data never leaks to competitors
- Compliance: Supports GDPR/privacy regulations
- Scalability: Schema design supports future SaaS model
- Safety: Accidental queries to wrong org caught by RLS

**Impact**: Phase 17 validates multi-tenant isolation; Phase 2 creates shared contracts with org_id

**Implementation**: Supabase RLS policies; operator.organization_id checked in control plane

---

### 2026-07-10 | AD-009 | Additive-Only Schema Migrations
**Owner**: Backend  
**Status**: ✅ APPROVED (Phase 0)

Never drop columns, alter types, or delete tables without explicit downtime window. Migrations are additive: new tables, new columns, new policies. Removals happen 2-3 releases after deprecation.

**Rationale**:
- Safety: Rollback always possible
- Zero-downtime: New code runs with old schema during deploy
- Auditability: Schema history preserved
- Learning: Can revert mistakes without data loss

**Impact**: All Phase 2-18 database work must follow this pattern; Phase 13 documents removal window

**Implementation**: Supabase migration folder; code review enforces pattern

---

### 2026-07-10 | AD-010 | No Plaintext Secrets in Source Code or Logs
**Owner**: Security  
**Status**: ✅ APPROVED (Phase 0)

Provider keys, Supabase service-role key, operator credentials, and customer data never appear in Git, logs, or responses. Secrets injected via environment variables or secure vaults. Logs redact sensitive fields automatically.

**Rationale**:
- Compliance: Meets data protection regulations
- Incident response: No secrets to rotate if code leaked
- Simplicity: CI doesn't need to manage secrets
- Safety: Accidental paste in chat/ticket doesn't expose system

**Impact**: Phase 1 adds pre-commit hooks; Phase 15 adds secret scanning to CI; Phase 3 adds redaction

**Implementation**: .gitignore; Fastify log redaction; secret-scanning tool in CI

---

## Pending Decisions (To Be Made in Phases 1-3)

### PD-001: Hermes Sandboxing Strategy
**Depends On**: Phase 5  
**Options**:
- A) Container-per-run (heavyweight, secure, slow)
- B) Process-per-run (lightweight, moderate isolation, faster)
- C) Thread pool with namespace isolation (shared memory, risky)

**Decision**: To be made in Phase 5 design phase based on performance targets

---

### PD-002: Memory Backend Storage
**Depends On**: Phase 6  
**Options**:
- A) PostgreSQL full-text search (included with Supabase)
- B) Vector database (Pinecone, Weaviate) for semantic search
- C) Elasticsearch for hybrid search
- D) Local search (no external dependency)

**Decision**: To be made in Phase 6 based on cost/performance analysis

---

### PD-003: Voice Model Licensing
**Depends On**: Phase 9  
**Options**:
- A) Libre models only (less capable, open-source)
- B) Commercial models with licensing (capable, costs)
- C) Hybrid (local libre for fallback, commercial for quality)

**Decision**: To be made in Phase 9 based on licensing audit and capability requirements

---

### PD-004: Deployment Upgrade Strategy
**Depends On**: Phase 13  
**Options**:
- A) Blue-green deployment (dual infrastructure, expensive)
- B) Rolling update (single infrastructure, risky)
- C) Canary deployment (gradual rollout, moderate risk)

**Decision**: To be made in Phase 13 based on traffic patterns and risk tolerance

---

## Rejected Decisions

### XD-001: Browser-Side Agent Execution
**Rejected**: 2026-07-10  
**Owner**: Architecture  
**Reason**: Browser cannot be trusted with policy enforcement; agent work must be server-side

---

### XD-002: Direct Model Provider Credentials in Vercel Env
**Rejected**: 2026-07-10  
**Owner**: Security  
**Reason**: Violates boundary principle (AD-001); keys would leak to CDN cache headers

---

### XD-003: Shared Workspace for All Missions
**Rejected**: 2026-07-10  
**Owner**: Architecture  
**Reason**: Isolation requirement (AD-002) makes per-mission workspaces mandatory

---

### XD-004: Optional Approval Gates
**Rejected**: 2026-07-10  
**Owner**: Security  
**Reason**: All consequential actions must gate (AD-003); no exceptions for "trusted" agents

---

## Contingency Decisions (If Risks Materialize)

### CD-001: If Vercel CDN Caching Breaks Control Plane
**Contingency**: Move control plane behind Cloudflare (free tier) instead of Vercel proxy; reconfigure frontend to direct-call

---

### CD-002: If Groq Becomes Unreliable
**Contingency**: Remove Groq routing; use OpenRouter for all requests (cost increase ~30%)

---

### CD-003: If Supabase RLS Audit Fails
**Contingency**: Migrate to PostgreSQL + Row-level security implemented in control plane code (slower, more auditable)

---

### CD-004: If Hermes Sandboxing Fails to Meet Performance SLA
**Contingency**: Fall back to Pi executable for agent work (less capable, but proven)

---

## Decision Log Statistics

**Total Decisions**: 10 (ratified) + 4 (pending) + 4 (rejected) + 4 (contingency) = 22  
**Ratification Rate**: 10/14 = 71% (typical for Phase 0)  
**Pending Resolution**: Phase 1-5  

---

## Review Process

Each decision is:
1. **Proposed** by an engineer with @Owner tag
2. **Discussed** in architecture review meeting (async or sync)
3. **Documented** in this file (either ratified, pending, or rejected)
4. **Implemented** during applicable phase (or deferred)
5. **Validated** through tests and security audit

For contingency decisions, escalation to leadership required before execution.
