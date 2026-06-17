# Cloudflare Pages Pipeline

This repository now has a direct-upload Cloudflare Pages pipeline for `macs-agent-portal`.

## What was created

- Cloudflare Pages project: `macs-agent-portal`
- Pages URL: `https://macs-agent-portal.pages.dev`
- Current preview deployment: `https://zte-land-plane.macs-agent-portal.pages.dev`
- GitHub Actions workflow: [`.github/workflows/cloudflare-pages.yml`](../../.github/workflows/cloudflare-pages.yml)

## Required GitHub secrets

Set these repository secrets in GitHub:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Use a narrowly scoped token with:

- `Cloudflare Pages:Edit`
- access limited to the `721e9ac18d0752a0bdde88f21b49e5cf` account

## How the pipeline works

- `push` to `main` builds the app and deploys the production branch.
- `pull_request` builds the app and uploads a preview deployment for the branch.
- `workflow_dispatch` allows a manual redeploy from GitHub.

## Current deployment target

- Project: `macs-agent-portal`
- Account ID: `721e9ac18d0752a0bdde88f21b49e5cf`
- Build command: `npm run build`
- Output directory: `dist`

## Safety note

This setup is designed for least privilege. It gives agents deploy capability without handing them unrestricted account control. If any older broad token is still active, rotate it after the new pipeline is validated.
