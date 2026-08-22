#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${MAXX_ENV_FILE:-$SCRIPT_DIR/.env}"
COMPOSE_FILE="$REPO_ROOT/services/maxx-control-plane/compose.coolify.yml"
HERMES_BUILD="$REPO_ROOT/services/hermes-runtime/build-pinned-image.sh"
SECOND_BRAIN_SEED="$SCRIPT_DIR/seed-second-brain-vault.sh"

for command in docker git python; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Missing required command: $command" >&2
    exit 1
  fi
done

docker compose version >/dev/null

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing MAXX environment file: $ENV_FILE" >&2
  echo "Copy deploy/maxx/.env.example to a secret file outside Git and fill the required values." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

required=(
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  STACY_ALLOWED_EMAILS
  CONTROL_TOWER_ALLOWED_ORIGINS
  MAXX_API_KEY
  MAXX_HERMES_API_KEY
  NCA_TOOLKIT_API_KEY
  MAXX_SANDBOX_KEY
)
for name in "${required[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "Required deployment secret/config is missing: $name" >&2
    exit 1
  fi
done

LOCKED_COMMIT="$(python - "$REPO_ROOT/services/hermes-runtime/UPSTREAM.lock" <<'PY'
import json,sys
with open(sys.argv[1], encoding='utf-8') as handle:
    print(json.load(handle)['commit'])
PY
)"
export MAXX_HERMES_IMAGE="${MAXX_HERMES_IMAGE:-maxx-hermes:${LOCKED_COMMIT:0:12}}"

compose_args=(-f "$COMPOSE_FILE")
if [[ -n "${MAXX_COMPOSE_EXTRA:-}" ]]; then
  IFS=':' read -r -a extra_compose_files <<< "$MAXX_COMPOSE_EXTRA"
  for extra_file in "${extra_compose_files[@]}"; do
    if [[ ! -f "$extra_file" ]]; then
      echo "MAXX compose overlay does not exist: $extra_file" >&2
      exit 1
    fi
    compose_args+=(-f "$extra_file")
  done
fi

MAXX_HERMES_IMAGE="$MAXX_HERMES_IMAGE" "$HERMES_BUILD"

echo "Starting Agent MAXX stack with pinned Hermes image $MAXX_HERMES_IMAGE"
docker compose --env-file "$ENV_FILE" "${compose_args[@]}" up -d --build --remove-orphans

echo "Waiting for MAXX control plane readiness..."
for attempt in $(seq 1 40); do
  if docker compose --env-file "$ENV_FILE" "${compose_args[@]}" exec -T maxx-control-plane \
    wget -qO- http://127.0.0.1:8787/health/ready >/dev/null 2>&1; then
    MAXX_ENV_FILE="$ENV_FILE" MAXX_COMPOSE_EXTRA="${MAXX_COMPOSE_EXTRA:-}" bash "$SECOND_BRAIN_SEED" >/dev/null
    echo "Agent MAXX backend is ready."
    echo "Hermes revision: $LOCKED_COMMIT"
    echo "Second-brain vault: seeded"
    exit 0
  fi
  sleep 3
done

echo "MAXX did not become ready within the expected window." >&2
docker compose --env-file "$ENV_FILE" "${compose_args[@]}" ps >&2 || true
exit 1
