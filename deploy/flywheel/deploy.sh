#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${MAXX_ENV_FILE:-$REPO_ROOT/deploy/maxx/.env}"
PROFILE="${MAXX_PROFILE:-business}"
PROVIDER="${MAXX_PROVIDER:-unknown}"
DOMAIN="${MAXX_DOMAIN:-}"
TOPOLOGY="${MAXX_DEPLOY_TOPOLOGY:-auto}"
EDGE_COMPOSE="$SCRIPT_DIR/compose.edge.yml"
SPLIT_COMPOSE="$SCRIPT_DIR/compose.split.yml"
BASE_INSTALLER="$REPO_ROOT/deploy/maxx/install.sh"
VERIFY_SCRIPT="$REPO_ROOT/deploy/maxx/verify.sh"
STATE_DIR="${MAXX_FLYWHEEL_STATE_DIR:-/var/lib/maxx-flywheel}"

case "$PROFILE" in
  runtime|business|builder) ;;
  *) echo "Unsupported MAXX profile: $PROFILE (expected runtime, business, or builder)" >&2; exit 1 ;;
esac

case "$TOPOLOGY" in
  auto|cloudflare-split|vps-edge|cpanel-proxy) ;;
  *) echo "Unsupported topology: $TOPOLOGY (expected auto, cloudflare-split, vps-edge, or cpanel-proxy)" >&2; exit 1 ;;
esac

if [[ -z "$DOMAIN" ]]; then
  echo "MAXX_DOMAIN is required, for example maxx.example.com or api.maxx.example.com." >&2
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
install -d -m 0700 "$STATE_DIR/runs"
run_id="$(date -u +%Y%m%dT%H%M%SZ)-$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || echo unknown)"
run_dir="$STATE_DIR/runs/$run_id"
install -d -m 0700 "$run_dir"

# PRESERVE: capture host/revision/container state before mutation.
"$SCRIPT_DIR/detect-host.sh" | tee "$run_dir/host.txt"
git -C "$REPO_ROOT" rev-parse HEAD > "$run_dir/revision.txt" 2>/dev/null || true
docker ps --format '{{.Names}}\t{{.Image}}\t{{.Status}}' > "$run_dir/docker-before.txt" 2>/dev/null || true

# Hardened evidence capture: record metadata and sha256 fingerprint without storing plaintext secrets
if command -v python3 >/dev/null 2>&1; then
  PY_BIN="python3"
else
  PY_BIN="python"
fi

"$PY_BIN" - "$ENV_FILE" "$run_dir/secrets-manifest.json" <<'PY'
import sys, json, hashlib, os, stat

env_path = sys.argv[1]
out_path = sys.argv[2]

keys = []
with open(env_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()
    for line in content.splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k = line.split('=', 1)[0].strip()
            if k:
                keys.append(k)

try:
    file_stat = os.stat(env_path)
    file_mode = oct(stat.S_IMODE(file_stat.st_mode))
except Exception:
    file_mode = "unknown"

sha256 = hashlib.sha256(content.encode('utf-8')).hexdigest()

manifest = {
    "source_path": env_path,
    "file_mode": file_mode,
    "sha256_fingerprint": sha256,
    "variables_count": len(keys),
    "variables_present": sorted(list(set(keys)))
}

with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2)
PY

# Load public configuration for validation only; do not echo secret values.
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

panel="$(awk -F= '$1=="panel" {print $2}' "$run_dir/host.txt")"
detected_provider="$(awk -F= '$1=="provider" {print $2}' "$run_dir/host.txt")"
if [[ "$PROVIDER" == "unknown" && -n "$detected_provider" ]]; then
  PROVIDER="$detected_provider"
fi

# Determine topology
if [[ "$TOPOLOGY" == "cloudflare-split" ]]; then
  ingress_mode="cloudflare-split"
elif [[ "$TOPOLOGY" == "cpanel-proxy" || "$panel" == "cpanel-whm" ]]; then
  ingress_mode="cpanel-proxy"
elif [[ "$TOPOLOGY" == "vps-edge" ]]; then
  ingress_mode="direct-caddy"
else
  # Auto-detection
  if command -v ss >/dev/null 2>&1 && ss -ltn '( sport = :80 or sport = :443 )' 2>/dev/null | tail -n +2 | grep -q .; then
    ingress_mode="cloudflare-split"
  else
    ingress_mode="direct-caddy"
  fi
fi

if [[ "$ingress_mode" == "cloudflare-split" ]]; then
  export MAXX_CONTROL_PLANE_BIND="127.0.0.1:${MAXX_LOCAL_PORT:-8788}"
  export MAXX_COMPOSE_EXTRA="$SPLIT_COMPOSE"
  PUBLIC_URL="${MAXX_API_URL:-https://${DOMAIN}}"
  LOCAL_URL="http://127.0.0.1:${MAXX_LOCAL_PORT:-8788}"
elif [[ "$ingress_mode" == "cpanel-proxy" ]]; then
  export MAXX_EDGE_SITE=":80"
  export MAXX_EDGE_HTTP_BIND="127.0.0.1:8788"
  export MAXX_EDGE_HTTPS_BIND="127.0.0.1:8789"
  export MAXX_PUBLIC_URL="https://${DOMAIN}"
  export MAXX_COMPOSE_EXTRA="$EDGE_COMPOSE"
  PUBLIC_URL="https://${DOMAIN}"
  LOCAL_URL="http://127.0.0.1:8788"
else
  # direct-caddy: owns public 80/443
  if command -v ss >/dev/null 2>&1; then
    if ss -ltn '( sport = :80 or sport = :443 )' 2>/dev/null | tail -n +2 | grep -q .; then
      echo "Ports 80/443 are already in use and cloudflare-split or cpanel-proxy mode was not selected. Refusing to disrupt existing server." >&2
      exit 1
    fi
  fi
  export MAXX_EDGE_SITE="$DOMAIN"
  export MAXX_EDGE_HTTP_BIND="80"
  export MAXX_EDGE_HTTPS_BIND="443"
  export MAXX_PUBLIC_URL="https://${DOMAIN}"
  export MAXX_COMPOSE_EXTRA="$EDGE_COMPOSE"
  PUBLIC_URL="https://${DOMAIN}"
  LOCAL_URL="http://127.0.0.1:80"
fi

printf '%s\n' "provider=$PROVIDER" "profile=$PROFILE" "domain=$DOMAIN" "topology=$TOPOLOGY" "ingress=$ingress_mode" > "$run_dir/plan.txt"

# Pinned Hermes image tag
LOCKED_COMMIT="$("$PY_BIN" - "$REPO_ROOT/services/hermes-runtime/UPSTREAM.lock" <<'PY'
import json,sys
with open(sys.argv[1], encoding='utf-8') as handle:
    print(json.load(handle)['commit'])
PY
)"
export MAXX_HERMES_IMAGE="${MAXX_HERMES_IMAGE:-maxx-hermes:${LOCKED_COMMIT:0:12}}"

# Optional private network
if [[ -n "${MAXX_TAILSCALE_AUTH_KEY:-}" ]]; then
  bash "$SCRIPT_DIR/configure-tailscale.sh" > "$run_dir/tailscale.txt" 2>&1
else
  echo "disabled" > "$run_dir/tailscale.txt"
fi

# PROVE/PREFLIGHT: render Compose before starting anything.
docker compose --env-file "$ENV_FILE" \
  -f "$REPO_ROOT/services/maxx-control-plane/compose.coolify.yml" \
  -f "$MAXX_COMPOSE_EXTRA" config >/dev/null

# EXECUTE: canonical pinned installer
MAXX_ENV_FILE="$ENV_FILE" MAXX_COMPOSE_EXTRA="$MAXX_COMPOSE_EXTRA" MAXX_HERMES_IMAGE="$MAXX_HERMES_IMAGE" "$BASE_INSTALLER"

if [[ "$ingress_mode" == "cpanel-proxy" ]]; then
  MAXX_DOMAIN="$DOMAIN" MAXX_CPANEL_UPSTREAM="http://127.0.0.1:8788" "$SCRIPT_DIR/configure-cpanel-proxy.sh"
fi

# VERIFY
docker compose --env-file "$ENV_FILE" \
  -f "$REPO_ROOT/services/maxx-control-plane/compose.coolify.yml" \
  -f "$MAXX_COMPOSE_EXTRA" ps > "$run_dir/docker-after.txt"

# Local health verification
curl -fsS --max-time 15 "$LOCAL_URL/health/live" | tee "$run_dir/health-live.json" >/dev/null
curl -fsS --max-time 15 "$LOCAL_URL/health/ready" | tee "$run_dir/health-ready.json" >/dev/null

# Public health verification if accessible
if curl -fsS --max-time 5 "$PUBLIC_URL/health/live" > "$run_dir/public-health.json" 2>/dev/null; then
  echo "Public health endpoint verified: $PUBLIC_URL/health/live"
else
  echo "Public health check via $PUBLIC_URL bypassed or tunneling in progress" > "$run_dir/public-health.txt"
fi

# Run comprehensive verifier
if [[ -x "$VERIFY_SCRIPT" ]]; then
  MAXX_API_URL="$LOCAL_URL" MAXX_PUBLIC_URL="$PUBLIC_URL" "$VERIFY_SCRIPT" > "$run_dir/verify.txt" 2>&1 || {
    echo "Core deployment is up but MAXX verification failed. Evidence: $run_dir/verify.txt" >&2
    exit 1
  }
fi

ln -sfn "$run_dir" "$STATE_DIR/current"
echo "MAXX Flywheel deployment VERIFIED"
echo "provider=$PROVIDER"
echo "profile=$PROFILE"
echo "ingress=$ingress_mode"
echo "public_url=$PUBLIC_URL"
echo "local_url=$LOCAL_URL"
echo "evidence=$run_dir"
