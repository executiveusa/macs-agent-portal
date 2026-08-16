#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STATE_DIR="${MAXX_FLYWHEEL_STATE_DIR:-/var/lib/maxx-flywheel}"

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
revision="$(cat "$previous/revision.txt")"
provider="$(awk -F= '$1=="provider" {print $2}' "$previous/plan.txt")"
profile="$(awk -F= '$1=="profile" {print $2}' "$previous/plan.txt")"
domain="$(awk -F= '$1=="domain" {print $2}' "$previous/plan.txt")"
env_snapshot="$previous/maxx.env.snapshot"

if [[ -z "$revision" || -z "$domain" || ! -f "$env_snapshot" ]]; then
  echo "Previous Flywheel evidence is incomplete; refusing destructive guesswork." >&2
  exit 1
fi

echo "Rolling MAXX back to revision $revision from $previous"
git -C "$REPO_ROOT" fetch --prune origin
git -C "$REPO_ROOT" cat-file -e "${revision}^{commit}"
git -C "$REPO_ROOT" checkout --detach "$revision"

MAXX_PROVIDER="${provider:-unknown}" \
MAXX_PROFILE="${profile:-business}" \
MAXX_DOMAIN="$domain" \
MAXX_ENV_FILE="$env_snapshot" \
MAXX_FLYWHEEL_STATE_DIR="$STATE_DIR" \
  "$REPO_ROOT/deploy/flywheel/deploy.sh"
