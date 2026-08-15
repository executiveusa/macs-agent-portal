# Deploy Agent MAXX

This runbook deploys the **private backend stack**. The public/private Vite frontend may be hosted separately; it only needs the MAXX API URL and Supabase publishable credentials.

## Product topology

```text
public/private Vite frontend
  -> Supabase Auth
  -> MAXX control plane :8787
       -> MAXX Hermes :8642 (private network)
       -> NCA media :8080 (private network)
       -> second-brain worker (private)
```

Bambu's `executiveusa/pauli-hermes-agent` is not part of this topology.

## 1. Required external configuration

Create deployment-specific secrets. Never copy another MAXX customer's runtime secrets.

Required for the backend:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STACY_ALLOWED_EMAILS`
- `MAXX_API_KEY` — constrained machine-to-machine MAXX credential
- `MAXX_HERMES_API_KEY` — separate internal Hermes API credential
- `NCA_TOOLKIT_API_KEY` — separate internal media-edge credential
- `CONTROL_TOWER_ALLOWED_ORIGINS` — exact private frontend origin(s)
- at least one Hermes-supported model provider credential

Recommended model tiers:

- `MAXX_HERMES_FAST_PROVIDER` + `MAXX_HERMES_FAST_MODEL`;
- `MAXX_HERMES_STANDARD_PROVIDER` + `MAXX_HERMES_STANDARD_MODEL`;
- `MAXX_HERMES_POWER_PROVIDER` + `MAXX_HERMES_POWER_MODEL`.

Frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_CONTROL_TOWER_API_URL`

## 2. One-command VPS install

Create a private environment file from `deploy/maxx/.env.example`, then run:

```bash
MAXX_ENV_FILE=/secure/path/maxx.env bash deploy/maxx/install.sh
```

The installer:

1. reads the exact NousResearch Hermes commit from `services/hermes-runtime/UPSTREAM.lock`;
2. fetches that exact commit into an isolated source cache;
3. builds the upstream Hermes Dockerfile from that commit;
4. applies the MAXX SOUL/skills/ICM overlay;
5. starts the control plane, media edge, second-brain worker and pinned Hermes image;
6. waits for backend readiness.

A mutable `nousresearch/hermes-agent:latest` or `:main` image is not an accepted production path.

## 3. Coolify

`services/maxx-control-plane/compose.coolify.yml` requires `MAXX_HERMES_IMAGE` to reference an image that was built/published from the exact `UPSTREAM.lock` commit. The compose file intentionally does **not** fall back to a mutable upstream tag.

For a VPS where the deployment agent has shell access, the canonical path is `deploy/maxx/install.sh`. A deployment factory may instead build/publish the pinned image first and set `MAXX_HERMES_IMAGE` before handing the compose stack to Coolify.

Persistent volumes preserve MAXX ICM/runtime state and Hermes customer state across restarts.

Do not expose Hermes `:8642` or NCA `:8080` publicly. Publish/reverse-proxy only the MAXX control plane.

## 4. Frontend deployment

The repository Vite build serves both:

- `/` — public 006 landing/story;
- `/signin` and `/dashboard` — Stacy's private MAXX app;
- `/control/*` — advanced/recovery interface.

The frontend can be hosted independently from the backend. Public frontend hosting is not an authority for agent state.

## 5. First boot

The MAXX Hermes image self-seeds the product SOUL, skills and ICM contracts into its isolated `/opt/data` volume. Existing customer `SOUL.md` and `config.yaml` are not overwritten on later boots; tested product skills/context are refreshed.

## 6. Required verification

Run `deploy/maxx/verify.sh` from a trusted machine with the private API URL and constrained machine credential.

Then verify the intended human path:

1. unauthenticated `/dashboard` redirects to `/signin`;
2. an approved Stacy account signs in;
3. normal chat returns through MAXX;
4. MAXX Mode returns through the power route when configured;
5. unapproved email/JWT fails at the control plane;
6. the machine credential cannot approve, change strategy, or invoke browser mutation endpoints;
7. a pending approval appears as `MAXX needs you` and cannot be bypassed;
8. restart the backend stack and repeat chat/history/persistence checks;
9. run one real NCA media operation and inspect the produced asset before enabling it for customer work;
10. upload one second-brain export, wait for `Ready for MAXX`, and prove a query can cite the imported source concept/path.

## 7. Rollback

- Frontend: roll back to the previous known-good Git/deployment revision.
- Backend image/config: redeploy the previous known-good repository revision against the same persistent volumes.
- Hermes customer state: do not delete `/opt/data` during rollback.
- If a schema migration is involved, use that migration's explicit database rollback/forward-repair plan; never improvise destructive rollback against customer data.

## Release rule

A successful container build or frontend deployment is `BUILT/TESTED`, not `VERIFIED`. Agent MAXX is production-verified only after the real private auth -> MAXX API -> isolated pinned Hermes -> capability -> observable result path passes on the target deployment.
