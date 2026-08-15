#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DATA_DIR="${MAXX_HERMES_DATA_DIR:-$SCRIPT_DIR/.runtime/hermes}"
CONTEXT_DIR="$DATA_DIR/product-context"

mkdir -p "$DATA_DIR/skills" "$DATA_DIR/sessions" "$DATA_DIR/memories" "$DATA_DIR/cron" "$DATA_DIR/logs" "$DATA_DIR/home" "$CONTEXT_DIR"

# Seed identity/config only when absent so an already-onboarded customer's
# runtime personality/config is not silently overwritten during upgrades.
if [[ ! -f "$DATA_DIR/SOUL.md" ]]; then
  cp "$SCRIPT_DIR/profile/SOUL.md" "$DATA_DIR/SOUL.md"
fi
if [[ ! -f "$DATA_DIR/config.yaml" ]]; then
  cp "$SCRIPT_DIR/profile/config.yaml" "$DATA_DIR/config.yaml"
fi

# Product skills and reusable repo skills are versioned code. Overlay them into
# the isolated MAXX skill directory without deleting customer-local skills.
cp -R "$SCRIPT_DIR/profile/skills/." "$DATA_DIR/skills/"
if [[ -d "$REPO_ROOT/skills" ]]; then
  cp -R "$REPO_ROOT/skills/." "$DATA_DIR/skills/"
fi

# ICM contracts are synced with the tested product revision.
cp "$REPO_ROOT/CONTEXT.md" "$CONTEXT_DIR/CONTEXT.md"
rm -rf "$CONTEXT_DIR/icm"
mkdir -p "$CONTEXT_DIR/icm"
cp -R "$REPO_ROOT/icm/maxx" "$CONTEXT_DIR/icm/maxx"

if [[ -z "${MAXX_HERMES_API_KEY:-}" ]]; then
  echo "MAXX_HERMES_API_KEY must be supplied by the deployment secret store." >&2
  exit 1
fi

if [[ -z "${MAXX_HERMES_IMAGE:-}" ]]; then
  LOCKED_COMMIT="$(python - "$SCRIPT_DIR/UPSTREAM.lock" <<'PY'
import json,sys
with open(sys.argv[1], encoding='utf-8') as handle:
    print(json.load(handle)['commit'])
PY
)"
  export MAXX_HERMES_IMAGE="maxx-hermes:${LOCKED_COMMIT:0:12}"
fi

# This is the only supported local bootstrap path: build Nous Hermes from the
# exact commit in UPSTREAM.lock, then apply the MAXX overlay.
MAXX_HERMES_IMAGE="$MAXX_HERMES_IMAGE" "$SCRIPT_DIR/build-pinned-image.sh"

export MAXX_HERMES_DATA_DIR="$DATA_DIR"
docker compose -f "$SCRIPT_DIR/docker-compose.yml" up -d --pull never

echo "MAXX Hermes started with isolated state at $DATA_DIR"
echo "Pinned image: $MAXX_HERMES_IMAGE"
echo "Product context synced to $CONTEXT_DIR"
echo "Verify: curl http://127.0.0.1:${MAXX_HERMES_BIND_PORT:-8642}/health"
