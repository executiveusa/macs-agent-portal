# Cloudflare Pages Pipeline

This repository now has a direct-upload Cloudflare Pages pipeline for `macs-agent-portal`.

## What was created

- Cloudflare Pages project: `macs-agent-portal`
- Pages URL: `https://macs-agent-portal.pages.dev`
- Current preview deployment: `https://zte-land-plane.macs-agent-portal.pages.dev`
## Required GitHub secrets

Set these repository secrets in GitHub:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Use a narrowly scoped token with:

- `Cloudflare Pages:Edit`
- access limited to the `721e9ac18d0752a0bdde88f21b49e5cf` account

## How the pipeline works

- Direct upload deployments target the Pages project with `wrangler pages deploy`.
- Deployments are triggered manually by a maintainer or agent run; a push does not deploy by itself.
- The current live preview alias is branch-scoped, so each branch can publish its own deployment URL.
- If you later add GitHub Actions, use the same `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` secret pair and let the workflow trigger the deploy instead of the local CLI.

## Current deployment target

- Project: `macs-agent-portal`
- Account ID: `721e9ac18d0752a0bdde88f21b49e5cf`
- Build command: `npm run build`
- Output directory: `dist`

## Safety note

This setup is designed for least privilege. It gives agents deploy capability without handing them unrestricted account control. If any older broad token is still active, rotate it after a successful preview or production deploy from the new pipeline; update the token in Cloudflare Dashboard > API Tokens now, and in GitHub Secrets only if GitHub Actions later becomes part of the flow. Revoke the old token immediately after the replacement is confirmed live.
