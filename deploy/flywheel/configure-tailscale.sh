#!/usr/bin/env bash
set -euo pipefail

# Optional private service/admin networking. Public MAXX customer ingress remains
# the Flywheel's Caddy/cPanel path; this script does not enable Funnel or expose
# Hermes/media services to the public internet.

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Tailscale setup requires root on the VPS." >&2
  exit 1
fi

AUTH_KEY="${MAXX_TAILSCALE_AUTH_KEY:-}"
HOSTNAME="${MAXX_TAILSCALE_HOSTNAME:-maxx-vps}"
TAGS="${MAXX_TAILSCALE_TAGS:-}"
ENABLE_SSH="${MAXX_TAILSCALE_SSH:-false}"

if [[ -z "$AUTH_KEY" ]]; then
  echo "MAXX_TAILSCALE_AUTH_KEY is not set; private networking remains disabled."
  exit 0
fi

if ! command -v tailscale >/dev/null 2>&1; then
  if ! command -v curl >/dev/null 2>&1; then
    echo "curl is required to install Tailscale." >&2
    exit 1
  fi
  curl -fsSL https://tailscale.com/install.sh | sh
fi

args=(up --auth-key="$AUTH_KEY" --hostname="$HOSTNAME")
if [[ -n "$TAGS" ]]; then
  args+=(--advertise-tags="$TAGS")
fi
if [[ "$ENABLE_SSH" == "true" ]]; then
  args+=(--ssh)
fi

tailscale "${args[@]}"

# Never print the auth key. Record only non-secret node state.
tailscale status --self || tailscale status
