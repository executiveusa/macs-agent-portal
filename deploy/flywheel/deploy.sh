#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${MAXX_ENV_FILE:-$REPO_ROOT/deploy/maxx/.env}"
PROFILE="${MAXX_PROFILE:-business}"
PROVIDER="${MAXX_PROVIDER:-unknown}"
DOMAIN="${MAXX_DOMAIN:-}"
EDGE_COMPOSE="$SCRIPT_DIR/compose.edge.yml"
BASE_INSTALLER="$REPO_ROOT/deploy/maxx/install.sh"
VERIFY_SCRIPT="$REPO_ROOT/deploy/maxx/verify.sh"
STATE_DIR="${MAXX_FLYWHEEL_STATE_DIR:-/var/lib/maxx-flywheel}"

case "$PROFILE" in
  runtime|business|builder) ;;
  *) echo "Unsupported MAXX profile: $PROFILE (expected runtime, business, or builder)" >&2; exit 1 ;;
esac

if [[ -z "$DOMAIN" ]]; then
  echo "MAXX_DOMAIN is required, for example maxx.example.com." >&2
  exit 1
fi
if [[ ! -f "$ENV_FILE" ]]; then
  echo "MAXX environment file not found: $ENV_FILE" >&2
  exit 1
fi

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Flywheel deployment requires root so it can preserve host state and configure ingress." >&2
  exit 1
fi

install -d -m 0700 "$STATE_DIR"
run_id="$(date -u +%Y%m%dT%H%M%SZ)-$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || echo unknown)"
run_dir="$STATE_DIR/runs/$run_id"
install -d -m 0700 "$run_dir"

# PRESERVE: capture host/revision/container state before mutation.
"$SCRIPT_DIR/detect-host.sh" | tee "$run_dir/host.txt"
git -C "$REPO_ROOT" rev-parse HEAD > "$run_dir/revision.txt" 2>/dev/null || true
docker ps --format '{{.Names}}\t{{.Image}}\t{{.Status}}' > "$run_dir/docker-before.txt" 2>/dev/null || true
cp -a "$ENV_FILE" "$run_dir/maxx.env.snapshot"
chmod 0600 "$run_dir/maxx.env.snapshot"

# Load public configuration for validation only; do not echo secret values.
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

PUBLIC_URL="https://${DOMAIN}"
if [[ "${CONTROL_TOWER_ALLOWED_ORIGINS:-}" != *"$PUBLIC_URL"* ]]; then
  echo "CONTROL_TOWER_ALLOWED_ORIGINS must include $PUBLIC_URL before deployment." >&2
  exit 1
fi
if [[ -z "${VITE_SUPABASE_URL:-}" || -z "${VITE_SUPABASE_PUBLISHABLE_KEY:-}" ]]; then
  echo "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required for the VPS-hosted frontend." >&2
  exit 1
fi

panel="$(awk -F= '$1=="panel" {print $2}' "$run_dir/host.txt")"
detected_provider="$(awk -F= '$1=="provider" {print $2}' "$run_dir/host.txt")"
if [[ "$PROVIDER" == "unknown" && -n "$detected_provider" ]]; then
  PROVIDER="$detected_provider"
fi

export MAXX_PUBLIC_URL="$PUBLIC_URL"
export MAXX_COMPOSE_EXTRA="$EDGE_COMPOSE"

if [[ "$panel" == "cpanel-whm" ]]; then
  # Bluehost/cPanel-safe mode: do not steal Apache/NGINX ports 80/443.
  export MAXX_EDGE_SITE=":80"
  export MAXX_EDGE_HTTP_BIND="127.0.0.1:8788"
  export MAXX_EDGE_HTTPS_BIND="127.0.0.1:8789"
  ingress_mode="cpanel-proxy"
else
  # Hostinger Docker VPS and generic clean VPS mode: Caddy owns public ingress.
  if command -v ss >/dev/null 2>&1; then
    if ss -ltn '( sport = :80 or sport = :443 )' 2>/dev/null | tail -n +2 | grep -q .; then
      echo "Ports 80/443 are already in use and no supported cPanel adapter was detected. Refusing to disrupt the current web server." >&2
      exit 1
    fi
  fi
  export MAXX_EDGE_SITE="$DOMAIN"
  export MAXX_EDGE_HTTP_BIND="80"
  export MAXX_EDGE_HTTPS_BIND="443"
  ingress_mode="direct-caddy"
fi

printf '%s\n' "provider=$PROVIDER" "profile=$PROFILE" "domain=$DOMAIN" "ingress=$ingress_mode" > "$run_dir/plan.txt"

# OPTIONAL PRIVATE NETWORK: only activates when an auth key was deliberately
# supplied in the deployment secret file. It never replaces public customer
# ingress and does not use Tailscale Funnel.
if [[ -n "${MAXX_TAILSCALE_AUTH_KEY:-}" ]]; then
  bash "$SCRIPT_DIR/configure-tailscale.sh" > "$run_dir/tailscale.txt" 2>&1
else
  echo "disabled" > "$run_dir/tailscale.txt"
fi

# PROVE/PREFLIGHT: render Compose before starting anything.
docker compose --env-file "$ENV_FILE" \
  -f "$REPO_ROOT/services/maxx-control-plane/compose.coolify.yml" \
  -f "$EDGE_COMPOSE" config >/dev/null

# EXECUTE: reuse the canonical pinned-Hermes installer with only the edge overlay added.
MAXX_ENV_FILE="$ENV_FILE" MAXX_COMPOSE_EXTRA="$EDGE_COMPOSE" "$BASE_INSTALLER"

if [[ "$ingress_mode" == "cpanel-proxy" ]]; then
  MAXX_DOMAIN="$DOMAIN" MAXX_CPANEL_UPSTREAM="http://127.0.0.1:8788" "$SCRIPT_DIR/configure-cpanel-proxy.sh"
fi

# VERIFY: local container path first, then public edge.
docker compose --env-file "$ENV_FILE" \
  -f "$REPO_ROOT/services/maxx-control-plane/compose.coolify.yml" \
  -f "$EDGE_COMPOSE" ps > "$run_dir/docker-after.txt"

curl -fsS --max-time 15 "$PUBLIC_URL/health/live" | tee "$run_dir/public-health.json" >/dev/null
curl -fsS --max-time 15 "$PUBLIC_URL/" | head -c 512 > "$run_dir/public-root.sample"

# The existing verifier performs constrained API/security checks when the env exposes the required URL/key.
if [[ -x "$VERIFY_SCRIPT" ]]; then
  MAXX_API_URL="$PUBLIC_URL" "$VERIFY_SCRIPT" > "$run_dir/verify.txt" 2>&1 || {
    echo "Core deployment is up but MAXX verification failed. Evidence: $run_dir/verify.txt" >&2
    exit 1
  }
fi

ln -sfn "$run_dir" "$STATE_DIR/current"
echo "MAXX Flywheel deployment VERIFIED"
echo "provider=$PROVIDER"
echo "profile=$PROFILE"
echo "public_url=$PUBLIC_URL"
echo "evidence=$run_dir"
