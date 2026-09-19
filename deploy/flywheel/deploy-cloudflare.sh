#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${MAXX_ENV_FILE:-$REPO_ROOT/deploy/maxx/.env}"
PROFILE="${MAXX_PROFILE:-business}"
FRONTEND_URL="${MAXX_FRONTEND_URL:?set MAXX_FRONTEND_URL, e.g. https://maxx.example.com}"
API_URL="${MAXX_API_URL:?set MAXX_API_URL, e.g. https://api.maxx.example.com}"
STATE_DIR="${MAXX_FLYWHEEL_STATE_DIR:-/var/lib/maxx-flywheel}"
OVERLAY="$SCRIPT_DIR/compose.cloudflare.yml"
BASE_INSTALLER="$REPO_ROOT/deploy/maxx/install.sh"
VERIFY_SCRIPT="$REPO_ROOT/deploy/maxx/verify.sh"

case "$PROFILE" in
  runtime|business|builder) ;;
  *) echo "Unsupported MAXX profile: $PROFILE" >&2; exit 1 ;;
esac

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Cloudflare Flywheel deployment requires root." >&2
  exit 1
fi
if [[ ! -f "$ENV_FILE" ]]; then
  echo "MAXX environment file not found: $ENV_FILE" >&2
  exit 1
fi

install -d -m 0700 "$STATE_DIR/runs"
run_id="$(date -u +%Y%m%dT%H%M%SZ)-$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || echo unknown)"
run_dir="$STATE_DIR/runs/$run_id"
install -d -m 0700 "$run_dir"

# DETECT + PRESERVE without copying plaintext secrets into release evidence.
"$SCRIPT_DIR/detect-host.sh" | tee "$run_dir/host.txt"
git -C "$REPO_ROOT" rev-parse HEAD > "$run_dir/revision.txt" 2>/dev/null || true
docker ps --format '{{.Names}}\t{{.Image}}\t{{.Status}}' > "$run_dir/docker-before.txt" 2>/dev/null || true
stat -c 'secret_file=%n mode=%a owner=%U group=%G' "$ENV_FILE" > "$run_dir/secret-file-metadata.txt"
sha256sum "$ENV_FILE" | awk '{print "secret_file_sha256=" $1}' >> "$run_dir/secret-file-metadata.txt"

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ "${CONTROL_TOWER_ALLOWED_ORIGINS:-}" != *"$FRONTEND_URL"* ]]; then
  echo "CONTROL_TOWER_ALLOWED_ORIGINS must include $FRONTEND_URL" >&2
  exit 1
fi
if [[ -z "${CLOUDFLARE_TUNNEL_TOKEN:-}" ]]; then
  echo "CLOUDFLARE_TUNNEL_TOKEN is required for cloudflare-split deployment." >&2
  exit 1
fi
if [[ -z "${SUPABASE_URL:-}" || -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "Supabase server credentials are required." >&2
  exit 1
fi

printf '%s\n' \
  "profile=$PROFILE" \
  "topology=cloudflare-split" \
  "frontend_url=$FRONTEND_URL" \
  "api_url=$API_URL" \
  "runtime_public_ports=none" > "$run_dir/plan.txt"

# PROVE: compose must render before any container mutation.
docker compose --env-file "$ENV_FILE" \
  -f "$REPO_ROOT/services/maxx-control-plane/compose.coolify.yml" \
  -f "$OVERLAY" config >/dev/null

# DEPLOY: reuse the canonical pinned-Hermes installer.
MAXX_ENV_FILE="$ENV_FILE" MAXX_COMPOSE_EXTRA="$OVERLAY" "$BASE_INSTALLER"

docker compose --env-file "$ENV_FILE" \
  -f "$REPO_ROOT/services/maxx-control-plane/compose.coolify.yml" \
  -f "$OVERLAY" ps > "$run_dir/docker-after.txt"

# VERIFY the internal control plane from inside its own container first.
docker compose --env-file "$ENV_FILE" \
  -f "$REPO_ROOT/services/maxx-control-plane/compose.coolify.yml" \
  -f "$OVERLAY" exec -T maxx-control-plane \
  wget -qO- http://127.0.0.1:8787/health/live > "$run_dir/internal-health-live.json"

docker compose --env-file "$ENV_FILE" \
  -f "$REPO_ROOT/services/maxx-control-plane/compose.coolify.yml" \
  -f "$OVERLAY" exec -T maxx-control-plane \
  wget -qO- http://127.0.0.1:8787/health/ready > "$run_dir/internal-health-ready.json"

# Verify that cloudflared is actually present and still running.
docker compose --env-file "$ENV_FILE" \
  -f "$REPO_ROOT/services/maxx-control-plane/compose.coolify.yml" \
  -f "$OVERLAY" ps cloudflared | tee "$run_dir/cloudflared.txt" >/dev/null
if ! docker compose --env-file "$ENV_FILE" \
  -f "$REPO_ROOT/services/maxx-control-plane/compose.coolify.yml" \
  -f "$OVERLAY" ps --status running cloudflared | grep -q cloudflared; then
  echo "cloudflared is not running" >&2
  exit 1
fi

# Public API proof through Cloudflare Tunnel.
curl -fsS --max-time 20 "$API_URL/health/live" | tee "$run_dir/public-health-live.json" >/dev/null
curl -fsS --max-time 20 "$API_URL/health/ready" | tee "$run_dir/public-health-ready.json" >/dev/null

# Existing authenticated MAXX smoke verifier runs against the tunnel URL.
if [[ -x "$VERIFY_SCRIPT" ]]; then
  MAXX_API_URL="$API_URL" "$VERIFY_SCRIPT" > "$run_dir/verify.txt" 2>&1
fi

ln -sfn "$run_dir" "$STATE_DIR/current"
echo "MAXX cloudflare-split Flywheel SMOKE_PASS"
echo "profile=$PROFILE"
echo "frontend_url=$FRONTEND_URL"
echo "api_url=$API_URL"
echo "evidence=$run_dir"
echo "NOTE: full production VERIFIED still requires Pup delegation, approval, event-idempotency, scheduler, persistence, reboot, browser-worker, and rollback proof."
