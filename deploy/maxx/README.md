# Deploy Agent MAXX

This runbook deploys the **private backend stack**. The public/private Vite frontend may be hosted separately; it only needs the MAXX API URL and Supabase publishable credentials.

## Product topology

```text
public/private Vite frontend
  -> Supabase Auth
  -> MAXX control plane :8787
       -> MAXX Hermes :8642 (private network)
       -> NCA media :8080 (private network)
```

Bambu's `executiveusa/pauli-hermes-agent` is not part of this topology.

## 1. Required external configuration

Create deployment-specific secrets. Never copy another MAXX customer's runtime secrets.

Required for the backend:

- `SUPABASE_URL`
- `STACY_ALLOWED_EMAILS`
- `MAXX_API_KEY` — random machine-to-machine MAXX credential
- `MAXX_HERMES_API_KEY` — separate random internal Hermes API credential
- `NCA_TOOLKIT_API_KEY` — separate random internal media-edge credential
- `CONTROL_TOWER_ALLOWED_ORIGINS` — exact private frontend origin(s)
- at least one Hermes-supported model provider credential

Recommended:

- `SUPABASE_SERVICE_ROLE_KEY` for existing server-side Supabase-backed control-plane features;
- `MAXX_HERMES_FAST_PROVIDER` + `MAXX_HERMES_FAST_MODEL`;
- `MAXX_HERMES_STANDARD_PROVIDER` + `MAXX_HERMES_STANDARD_MODEL`;
- `MAXX_HERMES_POWER_PROVIDER` + `MAXX_HERMES_POWER_MODEL`.

Frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_CONTROL_TOWER_API_URL`

## 2. Deploy on Coolify / Docker Compose

Use:

`services/maxx-control-plane/compose.coolify.yml`

The stack builds:

- the self-seeding MAXX Hermes image/profile;
- the pinned NCA Toolkit media edge;
- the MAXX control plane.

Persistent volumes preserve MAXX ICM/runtime state and Hermes customer state across restarts.

Do not expose Hermes `:8642` or NCA `:8080` publicly. Publish/reverse-proxy only the MAXX control plane.

## 3. Frontend deployment

The repository Vite build serves both:

- `/` — public 006 landing/story;
- `/signin` and `/dashboard` — Stacy's private MAXX app;
- `/control/*` — advanced/recovery interface.

The current app may be previewed on Vercel while the backend remains sovereign. Public frontend hosting is not an authority for agent state.

## 4. First boot

The MAXX Hermes image self-seeds the product SOUL, skills and ICM contracts into its isolated `/opt/data` volume. Existing customer `SOUL.md` and `config.yaml` are not overwritten on later boots; tested product skills/context are refreshed.

## 5. Required verification

Run `deploy/maxx/verify.sh` from a trusted machine with the private API URL and machine credential.

Then manually verify the intended human path:

1. unauthenticated `/dashboard` redirects to `/signin`;
2. an approved Stacy account signs in;
3. normal chat returns through MAXX;
4. MAXX Mode returns through the power route when configured;
5. unapproved email/JWT fails at the control plane;
6. a pending approval appears as `MAXX needs you` and cannot be bypassed;
7. restart the backend stack and repeat chat/history/persistence checks;
8. run one real NCA media operation and inspect the produced asset before enabling it for customer work.

## 6. Rollback

- Frontend: roll back to the previous known-good Git/deployment revision.
- Backend image/config: redeploy the previous known-good repository revision against the same persistent volumes.
- Hermes customer state: do not delete `/opt/data` during rollback.
- If a schema migration is involved, use that migration's explicit database rollback/forward-repair plan; never improvise destructive rollback against customer data.

## Release rule

A successful container build or frontend deployment is `BUILT/TESTED`, not `VERIFIED`. Agent MAXX is production-verified only after the real private auth -> MAXX API -> isolated Hermes -> capability -> observable result path passes on the target deployment.
