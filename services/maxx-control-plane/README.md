# MAXX Control Plane

Private policy boundary for Stacy's MAXX control tower.

## Responsibilities

- Verify Supabase JWTs and the Stacy email allowlist.
- Keep provider keys and service-role credentials server-side.
- Create isolated ICM mission workspaces.
- Route chat through OpenRouter with explicit model telemetry.
- Run only trusted Pi skills without a shell.
- Gate consequential browser and skill actions through approvals.
- Stream run events through Server-Sent Events.
- Persist missions, approvals, events, and usage to Supabase when configured.
- Report honest degraded state when dependencies are unavailable.

## Local Development

```powershell
npm install
$env:MAXX_DEV_AUTH_BYPASS='true'
$env:STACY_ALLOWED_EMAILS='stacy@local'
npm run dev
```

The service listens on `http://127.0.0.1:8787` by default. Development auth bypass is ignored when `NODE_ENV=production`.

## Verification

```powershell
npm test
npm run typecheck
npm run build
```

## Pi Runner Contract

`PI_EXECUTABLE` must point to an operator-controlled Pi wrapper that accepts:

```text
--skill <trusted-skill-id> --input-json <json>
```

The service never invokes a shell and rejects skill IDs outside the trusted registry.

## Coolify

Use `compose.coolify.yml`, mount persistent storage at `/data/maxx`, configure HTTPS, and set the variables listed in `.env.example` through the Coolify vault. Do not upload an environment file to source control.
