#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="${MAXX_HERMES_DATA_DIR:-$SCRIPT_DIR/.runtime/hermes}"

mkdir -p "$DATA_DIR/skills/agent-maxx" "$DATA_DIR/sessions" "$DATA_DIR/memories" "$DATA_DIR/cron" "$DATA_DIR/logs" "$DATA_DIR/home"

# Seed canonical product identity/config only when absent so customer/runtime
# customization survives image and repository updates.
if [[ ! -f "$DATA_DIR/SOUL.md" ]]; then
  cp "$SCRIPT_DIR/profile/SOUL.md" "$DATA_DIR/SOUL.md"
fi
if [[ ! -f "$DATA_DIR/config.yaml" ]]; then
  cp "$SCRIPT_DIR/profile/config.yaml" "$DATA_DIR/config.yaml"
fi
cp "$SCRIPT_DIR/profile/skills/agent-maxx/SKILL.md" "$DATA_DIR/skills/agent-maxx/SKILL.md"

if [[ -z "${MAXX_HERMES_API_KEY:-}" ]]; then
  echo "MAXX_HERMES_API_KEY must be supplied by the deployment secret store." >&2
  exit 1
fi

export MAXX_HERMES_DATA_DIR="$DATA_DIR"
docker compose -f "$SCRIPT_DIR/docker-compose.yml" up -d --pull always

echo "MAXX Hermes started with isolated state at $DATA_DIR"
echo "Verify: curl http://127.0.0.1:${MAXX_HERMES_BIND_PORT:-8642}/health"
