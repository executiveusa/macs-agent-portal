# Vercel Transfer Handoff — Agent MAXX / MACS Agent Portal

**Prepared:** 2026-08-16  
**Target:** a new Vercel account/team for the frontend, not the current deployment owner.  
**Repository:** `executiveusa/macs-agent-portal`  
**Default branch:** `main`

## Current product state

This repository is the primary interaction/product repository for **Stacy's Agent MAXX**. It is intentionally separate from Bambu's personal Hermes/Cosmos repository.

Current boundaries:
- Public/customer-facing MAXX experience lives in this repository.
- Stacy's authenticated/mobile-first Agent MAXX experience lives in this repository.
- MAXX uses a fresh Hermes runtime architecture rather than importing Bambu's personal Hermes state.
- The MAXX control plane is the application-facing API boundary; frontend surfaces should not call Hermes directly.
- The repository also contains deployment/fallback documentation for Railway, Coolify, and Hostinger infrastructure. A Vercel transfer must not silently move or redefine those backend/runtime responsibilities.

Recent completed work in this thread:
1. Added a living `docs/strategy/blusky/` wiki for BluSky Restoration business development.
2. Added a GrillMe-style interview protocol so MAXX asks Stacy one useful question at a time, resolves uncertainty, and persists durable business context instead of dumping full conversations.
3. Added an opportunity ledger separating Stacy-direct knowledge, public verification, inference, and unknowns.
4. Added session notes for durable relationship and opportunity discoveries.
5. Added automatic BluSky Business Partner Mode routing to root context and the MAXX runtime identity so ordinary BluSky/Blue Sky/Blusky mentions can load the relevant strategy context.
6. Preserved the hard identity boundary between Agent MAXX and Bambu's personal Hermes/Cosmos.

## New Vercel project settings — frontend only

Import the GitHub repository into the new Vercel team.

- Framework preset: **Vite**
- Root directory: repository root
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`

The repository `vercel.json` is portable and contains only the SPA rewrite to `/index.html`; it contains no current-account project IDs.

The repository already ignores `.vercel`, so local/project binding metadata should not be committed during relinking.

## Environment variables

Do not copy secret values into Git. Recreate authorized environment values in the new Vercel project from the real secret owner/store.

Known frontend/runtime variables documented by the repository include:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID` when a deployment path requires explicit project identification
- `VITE_FIRECRAWL_API_KEY` when that optional client path is enabled
- `VITE_FIRECRAWL_BASE_URL` when overriding the default Firecrawl endpoint

Before transfer, inspect the new account's Environment Variables panel against current code and deployment docs. Treat provider settings as deployment state, not repository truth.

## Important architecture boundary

A Vercel import is **not** a migration of the entire Agent MAXX system.

The frontend can move to another Vercel account. The repository also contains backend/control-plane/runtime assets and deployment paths that may belong on Railway, Coolify, Hostinger/VPS, or another suitable server environment.

Do not assume that moving the Vite frontend also moves:
- MAXX control-plane services;
- Hermes runtime workers;
- persistent workspaces/backups;
- Supabase data/auth/storage;
- Railway/Coolify/Hostinger deployment state;
- third-party provider credentials;
- DNS owned outside Vercel.

Each of those remains an explicit dependency/authority boundary.

## New-account verification gate

Before production cutover on the new Vercel account:
1. import `executiveusa/macs-agent-portal` from `main`;
2. add authorized frontend environment variables;
3. run `npm ci` and `npm run build` through Vercel;
4. verify the public landing experience;
5. verify direct SPA routes and reload behavior;
6. verify any Supabase-backed frontend paths that are expected to work;
7. confirm the frontend points at the intended MAXX control-plane/runtime endpoints, not stale provider URLs;
8. run `npm run lint` and `npm test` in an independent CI/local gate where available;
9. smoke-test desktop and mobile;
10. verify there are no secrets, `.vercel` bindings, or old-account IDs in the repo.

## Domain cutover

Do not remove a production domain from the current Vercel project until the new account deployment is verified.

Safe order:
1. create new Vercel project from GitHub;
2. restore authorized env values;
3. deploy and smoke-test the generated URL;
4. verify backend/control-plane connectivity;
5. add/verify the production domain on the new account;
6. perform DNS/ownership cutover only when the new project is ready;
7. verify TLS, routes, auth, data access, and mobile behavior;
8. keep the old Vercel project as rollback until owner approval;
9. retire the old project only after explicit approval.

## Rollback

GitHub `main` remains the source of truth. If the new Vercel frontend fails, restore domain routing/attachment to the previous known-good frontend while leaving backend services and data untouched.

## Current closeout state

- Thread-created MACS PR #50: merged/closed.
- BluSky/MAXX business-partner wiki is on `main`.
- No open MACS PR remains from this work session at preparation time.
- No open MACS issue remains from this work session at preparation time.
- Current Vercel deployment is not being deleted or modified by this handoff.

## Transfer acceptance gate

Do not call migration complete until:
- new Vercel account owns the new frontend project;
- `main` builds successfully there;
- required frontend env values are recreated from authorized sources;
- all expected routes work on desktop/mobile;
- intended control-plane/backend connectivity is verified;
- production domain/TLS resolve to the new account;
- rollback target remains available until owner approval;
- the old Vercel project is retired only after explicit approval.
