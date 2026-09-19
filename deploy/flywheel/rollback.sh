#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STATE_DIR="${MAXX_FLYWHEEL_STATE_DIR:-/var/lib/maxx-flywheel}"
ENV_FILE="${MAXX_ENV_FILE:-/opt/maxx/secrets/maxx.env}"

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Flywheel rollback requires root." >&2
  exit 1
fi

mapfile -t runs < <(find "$STATE_DIR/runs" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' 2>/dev/null | sort -nr | awk '{print $2}')
if (( ${#runs[@]} < 2 )); then
  echo "No previous Flywheel run is available for rollback." >&2
  exit 1
fi

previous="${runs[1]}"
revision="$(cat "$previous/revision.txt" 2>/dev/null || echo "")"
provider="$(awk -F= '$1=="provider" {print $2}' "$previous/plan.txt" 2>/dev/null || echo "unknown")"
profile="$(awk -F= '$1=="profile" {print $2}' "$previous/plan.txt" 2>/dev/null || echo "business")"
domain="$(awk -F= '$1=="domain" {print $2}' "$previous/plan.txt" 2>/dev/null || echo "")"
topology="$(awk -F= '$1=="topology" {print $2}' "$previous/plan.txt" 2>/dev/null || echo "auto")"

if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f "$REPO_ROOT/deploy/maxx/.env" ]]; then
    ENV_FILE="$REPO_ROOT/deploy/maxx/.env"
  else
    echo "MAXX environment file not found at $ENV_FILE for rollback." >&2
    exit 1
  fi
fi

if [[ -z "$revision" || -z "$domain" ]]; then
  echo "Previous Flywheel evidence is incomplete; refusing destructive guesswork." >&2
  exit 1
fi

echo "Rolling MAXX back to revision $revision from run $previous"
git -C "$REPO_ROOT" fetch --prune origin
git -C "$REPO_ROOT" cat-file -e "${revision}^{commit}"
git -C "$REPO_ROOT" checkout --detach "$revision"

MAXX_PROVIDER="${provider:-unknown}" \
MAXX_PROFILE="${profile:-business}" \
MAXX_DOMAIN="$domain" \
MAXX_DEPLOY_TOPOLOGY="$topology" \
MAXX_ENV_FILE="$ENV_FILE" \
MAXX_FLYWHEEL_STATE_DIR="$STATE_DIR" \
  "$REPO_ROOT/deploy/flywheel/deploy.sh"
