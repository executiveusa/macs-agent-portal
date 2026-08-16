# MAXX Deployment Flywheel

Provider-neutral deployment layer for Agent MAXX. The Flywheel does not fork Hermes or create a second runtime. It wraps the existing `deploy/maxx/install.sh` and adds host detection, ingress, evidence, and provider adapters.

## Loop

`DETECT -> PRESERVE -> PROVE -> BOOTSTRAP -> DEPLOY -> VERIFY -> RECORD -> RECOVER`

The host is inspected before mutation. Existing web services are preserved. Unsupported shapes are reported as blocked instead of guessed.

## Profiles

- `runtime`: core MAXX control plane, pinned Hermes, ICM/memory and approvals.
- `business` (default): runtime plus the configuration expected for always-on Pups, scheduling, browser/hosting operations and customer workflows.
- `builder`: business plus selected development/factory capabilities when a controlled build server actually needs them.

Profiles are deployment intent. They do not weaken MAXX approval, authentication, secret, or emergency-stop boundaries.

## Supported targets

### Hostinger VPS / generic clean VPS

Use a root-capable Linux VPS with Docker Engine + Compose. The Flywheel edge container owns ports 80/443 and serves the built MAXX frontend plus reverse proxies `/v1/*` and `/health/*` to the private control plane. Hermes and media remain private Docker-network services.

Hostinger's Docker VPS template already supplies Docker/Compose, but the Flywheel may also bootstrap supported Ubuntu/Debian/Alma/Rocky/RHEL-family VPS hosts.

### Bluehost VPS / Dedicated with cPanel/WHM

Do not take over ports 80/443. The Flywheel binds the MAXX edge to `127.0.0.1:8788` and creates supported per-vhost cPanel Apache userdata includes that proxy the selected domain to MAXX. It rebuilds/restarts Apache through cPanel scripts. Ordinary Bluehost shared hosting is not a supported full Agent MAXX runtime target.

## Required DNS

Create a dedicated hostname such as `maxx.example.com` pointing to the target VPS before direct-Caddy deployment. cPanel deployments should create the hostname/domain in the intended cPanel account first so AutoSSL/web-server ownership is established.

## Required secret file

Start from `deploy/maxx/.env.example` and store the real file outside Git. For the VPS-hosted frontend it must also include:

```dotenv
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
CONTROL_TOWER_ALLOWED_ORIGINS=https://maxx.example.com
```

The backend secrets documented in `deploy/maxx/README.md` remain required.

## Database gate

A deployment is blocked from production status until all `supabase/migrations` are applied to the intended MAXX Supabase project in timestamp order. The merged Pups and handoff broker require their tables/RLS policies. Never apply MAXX migrations to an unrelated Supabase project just because it is connected.

Recommended CI path:

```bash
supabase db push --db-url "$SUPABASE_DB_URL" --dry-run
supabase db push --db-url "$SUPABASE_DB_URL"
```

## Manual VPS deployment

```bash
sudo MAXX_PROVIDER=hostinger bash deploy/flywheel/bootstrap-vps.sh
sudo MAXX_PROVIDER=hostinger \
  MAXX_PROFILE=business \
  MAXX_DOMAIN=maxx.example.com \
  MAXX_ENV_FILE=/opt/maxx/secrets/maxx.env \
  bash deploy/flywheel/deploy.sh
```

For Bluehost/cPanel, use `MAXX_PROVIDER=bluehost`; set `MAXX_CPANEL_USER` only if the owner cannot be safely detected.

## Release evidence

Each run stores evidence under `/var/lib/maxx-flywheel/runs/<timestamp-revision>/`:

- detected host/provider/panel;
- deployed Git revision;
- pre/post container state;
- secret-file snapshot with mode 0600 for local rollback only;
- selected deployment plan;
- public health response;
- public frontend sample;
- existing MAXX runtime verifier output.

A deployment is `VERIFIED` only when the target's public health and MAXX runtime verifier pass. Container startup alone is not proof.
