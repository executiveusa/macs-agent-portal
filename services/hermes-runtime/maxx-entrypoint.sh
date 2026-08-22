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

# MAXX owns a small named set of MCP stanzas. Merge those product-managed
# stanzas without replacing provider defaults or customer-local settings.
# Optional remote connectors remain parked unless their credential exists.
python - "$DATA_DIR/config.yaml" "$SEED_DIR/profile/config.yaml" <<'PY'
import os
import sys
import tempfile
import yaml

current_path, seed_path = sys.argv[1:3]
if os.path.exists(current_path):
    with open(current_path, encoding="utf-8") as handle:
        current = yaml.safe_load(handle) or {}
else:
    current = {}
with open(seed_path, encoding="utf-8") as handle:
    seed = yaml.safe_load(handle) or {}
if not isinstance(current, dict) or not isinstance(seed, dict):
    raise SystemExit("Hermes config must be a YAML mapping")

seed_servers = seed.get("mcp_servers") or {}
if not isinstance(seed_servers, dict):
    raise SystemExit("Seed mcp_servers config must be a mapping")
servers = current.setdefault("mcp_servers", {})
if not isinstance(servers, dict):
    raise SystemExit("Existing mcp_servers config must be a mapping")

managed = {
    "maxx-control-plane": None,
    "composio": "COMPOSIO_CONSUMER_KEY",
    "latitude": "LATITUDE_API_KEY",
    "agentmail": "AGENTMAIL_API_KEY",
}
for name, env_name in managed.items():
    stanza = seed_servers.get(name)
    if not isinstance(stanza, dict):
        raise SystemExit(f"Seed config is missing managed {name} MCP stanza")
    stanza = dict(stanza)
    stanza["enabled"] = True if env_name is None else bool(os.getenv(env_name, "").strip())
    servers[name] = stanza

# Keep MAXX's tested loop hard-stop floor even when an existing runtime config
# predates this seed. Customer settings outside the managed keys are preserved.
seed_guardrails = seed.get("tool_loop_guardrails")
if isinstance(seed_guardrails, dict):
    current["tool_loop_guardrails"] = seed_guardrails

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
