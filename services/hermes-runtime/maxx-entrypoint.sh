#!/usr/bin/env bash
set -euo pipefail

DATA_DIR="${HERMES_HOME:-/opt/data}"
SEED_DIR="/opt/maxx-seed"
CONTEXT_DIR="$DATA_DIR/product-context"

mkdir -p "$DATA_DIR/skills" "$DATA_DIR/sessions" "$DATA_DIR/memories" "$DATA_DIR/cron" "$DATA_DIR/logs" "$DATA_DIR/home" "$CONTEXT_DIR"

# Identity/config become customer/runtime state after first boot. Do not erase
# onboarding changes during image upgrades.
if [[ ! -f "$DATA_DIR/SOUL.md" ]]; then
  cp "$SEED_DIR/profile/SOUL.md" "$DATA_DIR/SOUL.md"
fi
if [[ ! -f "$DATA_DIR/config.yaml" ]]; then
  cp "$SEED_DIR/profile/config.yaml" "$DATA_DIR/config.yaml"
fi

# Product skills and reusable specialist skills are versioned product code.
# Overlay them into the isolated MAXX skill directory without deleting
# customer-local/upstream skills that may also exist there.
cp -R "$SEED_DIR/profile/skills/." "$DATA_DIR/skills/"
if [[ -d "$SEED_DIR/repo-skills" ]]; then
  cp -R "$SEED_DIR/repo-skills/." "$DATA_DIR/skills/"
fi

# ICM contracts track the tested image and are read progressively by skills.
rm -rf "$CONTEXT_DIR/icm"
mkdir -p "$CONTEXT_DIR/icm"
cp "$SEED_DIR/CONTEXT.md" "$CONTEXT_DIR/CONTEXT.md"
cp -R "$SEED_DIR/icm/maxx" "$CONTEXT_DIR/icm/maxx"

exec /opt/hermes/docker/entrypoint-dispatch.sh "$@"
