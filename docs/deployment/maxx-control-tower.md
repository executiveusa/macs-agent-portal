# MAXX Control Tower Deployment

## Services

- Public Vite application: existing Vercel project.
- Private control plane: separate Coolify service built from `services/maxx-control-plane/Dockerfile`.
- Durable records: Supabase.
- ICM working state: persistent volume mounted at `/data/maxx`.

## Required Preparation

1. Apply `supabase/migrations/20260625090000_maxx_control_tower.sql`.
2. Insert Stacy's lowercase email into `public.control_tower_operators`.
3. Create the Coolify service from `services/maxx-control-plane/compose.coolify.yml`.
4. Set secret values using the Coolify vault. Use `.env.example` only as a variable-name checklist.
5. Set `VITE_CONTROL_TOWER_API_URL` on the Vercel frontend to the private HTTPS control-plane origin.
6. Set `CONTROL_TOWER_ALLOWED_ORIGINS` to the exact Vercel production and preview origins that should be accepted.

## Health Contract

- `/health/live`: process liveness; no authentication required.
- `/health/ready`: returns `200` only when Supabase and OpenRouter are configured.
- Private endpoints return `401` unless a valid, allowlisted Supabase JWT is present.

## Persistent Storage

Back up `/data/maxx` daily. This volume contains human-readable ICM manifests, stage contracts, artifacts, and event streams. It must not contain provider keys.

## Production Gate

Do not change DNS, enter production credentials, or trigger the Coolify deployment until the operator explicitly approves production deployment and confirms VPS access.
