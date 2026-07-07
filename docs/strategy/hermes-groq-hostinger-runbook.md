# Hermes + Groq + Hostinger VPS — Install Runbook (Non-Destructive)

**Date:** 2026-07-07
**Status:** PREPARED & TESTED — awaits your morning go-ahead for VPS mutation
**Principle:** Everything below is reversible. No production DNS, no secret mutation, no destructive deploy without explicit confirmation.

---

## What is verified working RIGHT NOW

✅ **Groq API key** — valid, 56 chars, returns model list (qwen3.6-27b, llama-3.3-70b-versatile, etc.)
✅ **Groq chat completion as MAXX** — tested end-to-end: `llama-3.3-70b-versatile` responds in the MAXX follow-up-recovery persona in ~112ms
✅ **Hermes agent API key** — present in vault (`HERMES_AGENT_API=sk-nou...`)
✅ **Supabase URL + service role key** — present
✅ **Vercel auth** — logged in as `jointhepaulieffect-1358`; project `macs-agent-portal` exists at `macs-agent-portal-pi.vercel.app`
✅ **Frontend** — builds clean, 0 console errors, offer live in DOM

## Groq is OpenAI-compatible

Groq exposes `https://api.groq.com/openai/v1` — a drop-in for any OpenAI-compatible client. This means:
- Hermes can route to Groq by setting `base_url` and `api_key`.
- The existing `services/maxx-control-plane` model router can add Groq as a provider without code rewrite.
- No new SDK needed.

---

## Step 1 — Hermes agent config (local test, already verified)

Hermes provider block for Groq:

```env
# Groq — primary fast inference for MAXX
GROQ_API_KEY=gsk_2F...        # from Cosmos_Vault.env (DO NOT commit)
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_DEFAULT_MODEL=llama-3.3-70b-versatile

# Fallbacks (already in vault)
OPEN_ROUTER_API=sk-or-...
GLM_API_KEY=d910d6...
HERMES_AGENT_API=sk-nou...    # NousResearch Hermes endpoint
```

**Tested completion (run, then delete the key from history):**
```bash
curl -X POST https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"llama-3.3-70b-versatile","messages":[{"role":"system","content":"You are Agent MAXX..."},{"role":"user","content":"..."}]}'
```

---

## Step 2 — Add Groq to the MAXX control-plane model router (low-risk code change)

The control-plane (`services/maxx-control-plane/src/model-router.ts`) already supports OpenRouter. Groq slots in identically.

**Proposed edit (NOT yet applied — pending your OK):**

```ts
// In model-router.ts, add a Groq provider alongside OpenRouter:
const providers = {
  openrouter: { baseURL: "https://openrouter.ai/api/v1", apiKey: env.OPENROUTER_API_KEY },
  groq: { baseURL: "https://api.groq.com/openai/v1", apiKey: env.GROQ_API_KEY },
  hermes: { baseURL: env.HERMES_AGENT_API, apiKey: env.HERMES_AGENT_API_KEY },
};
// Default route: groq for speed (drafts), openrouter for quality (final copy).
```

This is additive — it does not break existing OpenRouter routing. I will apply this only after you confirm.

---

## Step 3 — Hostinger VPS install (UNDER MACS DIGITAL MEDIA / Stacy)

**⚠️ This step mutates your VPS. I have NOT done it. It waits for your morning confirmation.**

What it will do, in order:
1. SSH to the Hostinger VPS using `HOSTINGER_API_KEY` / SSH creds from the vault.
2. Create a project directory under Stacy's MACS Digital Media company space.
3. Clone `macs-agent-portal` (frontend) + reference `NousResearch/hermes-agent` (runtime).
4. Install Hermes with the Groq provider wired in.
5. Run a smoke test: MAXX responds to a recovery-audit prompt via Groq.
6. Wire the frontend's dashboard to call the Hermes runtime (the `https://maxx-migrations-agentic-systems-1yb-git-0f1995-the-pauli-effect.vercel.app/` backend you provided).
7. Set up a systemd / PM2 service so the agent stays up.

**What it will NOT do without explicit OK:**
- ❌ Point production DNS at the VPS
- ❌ Rotate or overwrite any existing secret
- ❌ Delete anything on the VPS
- ❌ Expose the operator password publicly

**The exact commands** will be reviewed against the live VPS state before execution. I'll show them to you first.

---

## Step 4 — Vault mapping (already loaded, no secrets committed)

The `Cosmos_Vault.env` keys relevant to this install:

| Key | Use | Status |
|---|---|---|
| `GROQ_API_KEY` | Primary model inference | ✅ tested working |
| `HERMES_AGENT_API` | Hermes runtime auth | ✅ present |
| `OPEN_ROUTER_API` | Fallback models | ✅ present |
| `GLM_API_KEY` | GLM fallback | ✅ present |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Data layer | ✅ present |
| `HOSTINGER_API_KEY` | VPS deploy | ✅ present (use pending OK) |
| `MAXX_OPERATOR_PASSWORD` | Operator login | ✅ present |
| `VERCEL_TOKEN` / `VERCEL_API_TOKEN` | Frontend deploy | ✅ present, in use |

**Zero secrets are committed to the repo.** The repo has `master.secrets.json.template` and `.gitignore` already enforcing this.

---

## Step 5 — Frontend ↔ backend contract

The frontend dashboard will call:
- **Hermes runtime** (on the VPS) for live agent runs — `POST /v1/agent/run` with the MAXX system prompt.
- **Maxx Migrations backend** (`https://maxx-migrations-agentic-systems-1yb-git-0f1995-the-pauli-effect.vercel.app/`) for CRM data — contacts, pipelines, missed calls.

Until those are live, the dashboard correctly shows **"Preview"** states (honest, per the audit). This is intentional — no fake backend claims.

---

## What to tell me in the morning

Just say **"go"** and I will:
1. Apply the Groq model-router code change (Step 2) — 5 min.
2. Run the Hostinger VPS install (Step 3) — I'll show you each command before it runs.
3. Smoke-test the live agent.
4. Wire the dashboard Preview states to real data as each backend comes online.

If you'd rather I skip the VPS work entirely and just keep the frontend live on Vercel (which is already pristine), say **"frontend only"** and I'll stop after deploy.
