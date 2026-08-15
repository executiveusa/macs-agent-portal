#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOCK="$SCRIPT_DIR/UPSTREAM.lock"
SOURCE_DIR="${MAXX_HERMES_SOURCE_DIR:-$SCRIPT_DIR/.runtime/upstream-source}"

read_lock() {
  python - "$LOCK" "$1" <<'PY'
import json,sys
with open(sys.argv[1], encoding="utf-8") as handle:
    value=json.load(handle)[sys.argv[2]]
print(value)
PY
}

UPSTREAM="$(read_lock upstream)"
COMMIT="$(read_lock commit)"
SHORT="${COMMIT:0:12}"
BASE_IMAGE="maxx-hermes-upstream:${SHORT}"
PRODUCT_IMAGE="${MAXX_HERMES_IMAGE:-maxx-hermes:${SHORT}}"

case "$COMMIT" in
  [0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]) ;;
  *) echo "UPSTREAM.lock commit must be a full 40-character git SHA" >&2; exit 1 ;;
esac

mkdir -p "$(dirname "$SOURCE_DIR")"
if [[ ! -d "$SOURCE_DIR/.git" ]]; then
  rm -rf "$SOURCE_DIR"
  git init -q "$SOURCE_DIR"
  git -C "$SOURCE_DIR" remote add origin "$UPSTREAM"
fi

CURRENT_ORIGIN="$(git -C "$SOURCE_DIR" remote get-url origin)"
if [[ "$CURRENT_ORIGIN" != "$UPSTREAM" ]]; then
  echo "Refusing unexpected Hermes source remote: $CURRENT_ORIGIN" >&2
  exit 1
fi

git -C "$SOURCE_DIR" fetch --depth=1 origin "$COMMIT"
git -C "$SOURCE_DIR" checkout --detach --force "$COMMIT"
ACTUAL="$(git -C "$SOURCE_DIR" rev-parse HEAD)"
if [[ "$ACTUAL" != "$COMMIT" ]]; then
  echo "Hermes checkout mismatch: expected $COMMIT, got $ACTUAL" >&2
  exit 1
fi

echo "Building reviewed Hermes base from $UPSTREAM@$COMMIT"
docker build \
  --build-arg "HERMES_GIT_SHA=$COMMIT" \
  --label "org.opencontainers.image.source=$UPSTREAM" \
  --label "org.opencontainers.image.revision=$COMMIT" \
  -t "$BASE_IMAGE" \
  "$SOURCE_DIR"

echo "Applying Agent MAXX product identity/ICM overlay"
docker build \
  --build-arg "HERMES_IMAGE=$BASE_IMAGE" \
  --label "ai.maxx.hermes.revision=$COMMIT" \
  -f "$SCRIPT_DIR/Dockerfile.maxx" \
  -t "$PRODUCT_IMAGE" \
  "$REPO_ROOT"

echo "MAXX_HERMES_IMAGE=$PRODUCT_IMAGE"
echo "MAXX_HERMES_UPSTREAM_SHA=$COMMIT"
