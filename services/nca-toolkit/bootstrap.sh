#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="${NCA_TOOLKIT_SOURCE_DIR:-$SCRIPT_DIR/.runtime/source}"
UPSTREAM="https://github.com/stephengpope/no-code-architects-toolkit.git"
COMMIT="d9bb5679e203e6b5d3b3c2b9ab848a289c645024"

if [[ -z "${NCA_TOOLKIT_API_KEY:-}" ]]; then
  echo "NCA_TOOLKIT_API_KEY is required in the deployment secret store." >&2
  exit 1
fi

if [[ ! -d "$RUNTIME_DIR/.git" ]]; then
  rm -rf "$RUNTIME_DIR"
  git clone --filter=blob:none "$UPSTREAM" "$RUNTIME_DIR"
fi

git -C "$RUNTIME_DIR" fetch origin "$COMMIT" --depth=1
git -C "$RUNTIME_DIR" checkout --detach "$COMMIT"

docker build -t maxx-nca-toolkit:"${COMMIT:0:12}" "$RUNTIME_DIR"
docker rm -f maxx-nca-toolkit >/dev/null 2>&1 || true

docker run -d \
  --name maxx-nca-toolkit \
  --restart unless-stopped \
  -p "${NCA_TOOLKIT_BIND_PORT:-8080}:8080" \
  -e API_KEY="$NCA_TOOLKIT_API_KEY" \
  -e LOCAL_STORAGE_PATH=/tmp \
  -e MAX_QUEUE_LENGTH="${NCA_MAX_QUEUE_LENGTH:-10}" \
  -e GUNICORN_WORKERS="${NCA_GUNICORN_WORKERS:-2}" \
  -e GUNICORN_TIMEOUT="${NCA_GUNICORN_TIMEOUT:-600}" \
  maxx-nca-toolkit:"${COMMIT:0:12}"

echo "NCA Toolkit edge started from pinned commit $COMMIT"
echo "Test with the authenticated /v1/toolkit/test endpoint before enabling media skills."
