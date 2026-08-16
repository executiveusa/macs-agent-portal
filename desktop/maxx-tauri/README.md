# Agent MAXX Windows Thin Client

This directory packages the existing server-hosted MAXX application as a Tauri 2 Windows shell. It is deliberately **not** an agent runtime.

## Boundary

- Pups, Hermes, ICM, schedules, approvals, browser workers, and secrets stay on the VPS.
- The desktop app contains no custom Rust commands, shell plugin, filesystem plugin, or local model runtime.
- Remote MAXX content is not granted a Tauri remote capability, so it receives no native API authority.
- The shell accepts only an HTTPS URL without embedded credentials.

## Build

Install current Windows Tauri prerequisites, then from this directory:

```powershell
npm install
$env:MAXX_DESKTOP_URL="https://maxx.example.com"
npm run build
```

`build.mjs` writes an ephemeral runtime config that changes only the main window URL and then invokes the pinned Tauri CLI. The checked-in fallback URL is intentionally invalid so an accidentally unconfigured build cannot silently connect somewhere else.

## Distribution

Tauri is configured for NSIS and MSI bundles. Code signing is a release-environment concern and should use the organization's protected signing identity; no certificate material belongs in this repository.

## Private networking

The Windows app does not require Tailscale for normal customer use. If an administrative workstation also joins the tailnet, configure Tailscale independently; do not put a tailnet auth key inside the MAXX desktop bundle.
