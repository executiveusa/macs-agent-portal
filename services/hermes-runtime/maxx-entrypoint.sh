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
else
  # MAXX owns only its named MCP stanza. Merge that one managed stanza into an
  # existing customer config without replacing provider defaults, other MCP
  # servers, or customer-local settings. PyYAML ships with the pinned Hermes
  # runtime; write atomically so a failed boot cannot truncate config.yaml.
  python - "$DATA_DIR/config.yaml" "$SEED_DIR/profile/config.yaml" <<'PY'
import os
import sys
import tempfile
import yaml

current_path, seed_path = sys.argv[1:3]
with open(current_path, encoding="utf-8") as handle:
    current = yaml.safe_load(handle) or {}
with open(seed_path, encoding="utf-8") as handle:
    seed = yaml.safe_load(handle) or {}
if not isinstance(current, dict) or not isinstance(seed, dict):
    raise SystemExit("Hermes config must be a YAML mapping")
managed = (seed.get("mcp_servers") or {}).get("maxx-control-plane")
if not isinstance(managed, dict):
    raise SystemExit("Seed config is missing managed maxx-control-plane MCP stanza")
servers = current.setdefault("mcp_servers", {})
if not isinstance(servers, dict):
    raise SystemExit("Existing mcp_servers config must be a mapping")
servers["maxx-control-plane"] = managed
fd, temp_path = tempfile.mkstemp(prefix="config.yaml.", dir=os.path.dirname(current_path), text=True)
try:
    with os.fdopen(fd, "w", encoding="utf-8") as handle:
        yaml.safe_dump(current, handle, sort_keys=False)
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temp_path, current_path)
finally:
    if os.path.exists(temp_path):
        os.unlink(temp_path)
PY
fi

# Skills are progressive-disclosure runtime knowledge. Preserve customer-local
# skills and overlay versioned product skills in authority order: generic repo
# skills, legacy specialist catalog, then current MAXX profile skills last.
if [[ -d "$SEED_DIR/repo-skills" ]]; then
  cp -R "$SEED_DIR/repo-skills/." "$DATA_DIR/skills/"
fi
if [[ -d "$SEED_DIR/maxx-specialist-skills" ]]; then
  cp -R "$SEED_DIR/maxx-specialist-skills/." "$DATA_DIR/skills/"
fi
cp -R "$SEED_DIR/profile/skills/." "$DATA_DIR/skills/"

# ICM contracts track the tested image and are read progressively by skills.
rm -rf "$CONTEXT_DIR/icm"
mkdir -p "$CONTEXT_DIR/icm"
cp "$SEED_DIR/CONTEXT.md" "$CONTEXT_DIR/CONTEXT.md"
cp -R "$SEED_DIR/icm/maxx" "$CONTEXT_DIR/icm/maxx"

exec /opt/hermes/docker/entrypoint-dispatch.sh "$@"
