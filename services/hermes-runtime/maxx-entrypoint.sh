#!/usr/bin/env bash
set -euo pipefail

DATA_DIR="${HERMES_HOME:-/opt/data}"
SEED_DIR="/opt/maxx-seed"
CONTEXT_DIR="$DATA_DIR/product-context"
PUP_PROFILES=("chief-pup" "superdoer" "business-pup")

mkdir -p "$DATA_DIR/skills" "$DATA_DIR/sessions" "$DATA_DIR/memories" "$DATA_DIR/cron" "$DATA_DIR/logs" "$DATA_DIR/home" "$CONTEXT_DIR" "$DATA_DIR/profiles"

if [[ ! -f "$DATA_DIR/SOUL.md" ]]; then
  cp "$SEED_DIR/profile/SOUL.md" "$DATA_DIR/SOUL.md"
fi

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
servers = current.setdefault("mcp_servers", {})
if not isinstance(seed_servers, dict) or not isinstance(servers, dict):
    raise SystemExit("mcp_servers config must be a mapping")
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

seed_gateway = seed.get("gateway") or {}
gateway = current.setdefault("gateway", {})
if not isinstance(gateway, dict):
    raise SystemExit("Existing gateway config must be a mapping")
gateway["multiplex_profiles"] = True
gateway["multiplex_profile_allowlist"] = list(seed_gateway.get("multiplex_profile_allowlist") or [])

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

if [[ -d "$SEED_DIR/repo-skills" ]]; then
  cp -R "$SEED_DIR/repo-skills/." "$DATA_DIR/skills/"
fi
if [[ -d "$SEED_DIR/maxx-specialist-skills" ]]; then
  cp -R "$SEED_DIR/maxx-specialist-skills/." "$DATA_DIR/skills/"
fi
cp -R "$SEED_DIR/profile/skills/." "$DATA_DIR/skills/"

rm -rf "$CONTEXT_DIR/icm"
mkdir -p "$CONTEXT_DIR/icm"
cp "$SEED_DIR/CONTEXT.md" "$CONTEXT_DIR/CONTEXT.md"
cp -R "$SEED_DIR/icm/maxx" "$CONTEXT_DIR/icm/maxx"

set_env_value() {
  local env_file="$1"
  local key="$2"
  local value="$3"
  python - "$env_file" "$key" "$value" <<'PY'
import os
import sys
path, key, value = sys.argv[1:4]
rows = []
if os.path.exists(path):
    with open(path, encoding="utf-8") as handle:
        rows = handle.read().splitlines()
updated = []
written = False
for row in rows:
    if row.startswith(f"{key}="):
        if not written:
            updated.append(f"{key}={value}")
            written = True
    else:
        updated.append(row)
if not written:
    updated.append(f"{key}={value}")
with open(path, "w", encoding="utf-8") as handle:
    handle.write("\n".join(updated).rstrip() + "\n")
PY
}

derive_profile_key() {
  local profile="$1"
  if [[ -z "${API_SERVER_KEY:-}" ]]; then
    echo ""
    return
  fi
  python - "$API_SERVER_KEY" "$profile" <<'PY'
import hashlib
import hmac
import sys
master, profile = sys.argv[1:3]
print(hmac.new(master.encode(), f"maxx-hermes-profile:{profile}".encode(), hashlib.sha256).hexdigest())
PY
}

if command -v hermes >/dev/null 2>&1; then
  for profile in "${PUP_PROFILES[@]}"; do
    profile_dir="$DATA_DIR/profiles/$profile"
    case "$profile" in
      chief-pup) description="Coordinates MAXX work, priorities, proof, and bounded Pup handoffs." ;;
      superdoer) description="Produces concrete internal work, drafts, research, follow-up prep, and verifiable deliverables." ;;
      business-pup) description="Moves an owner-supplied business or offer toward revenue, delivery, retention, and sensible automation." ;;
    esac

    if [[ ! -d "$profile_dir" ]]; then
      hermes profile create "$profile" --clone-from default --no-alias --description "$description"
    else
      hermes profile describe "$profile" --text "$description" >/dev/null 2>&1 || true
    fi

    mkdir -p "$profile_dir"
    cp "$SEED_DIR/profile/pups/$profile/SOUL.md" "$profile_dir/SOUL.md"
    profile_key="$(derive_profile_key "$profile")"
    if [[ -n "$profile_key" ]]; then
      set_env_value "$profile_dir/.env" "API_SERVER_KEY" "$profile_key"
    fi
    set_env_value "$profile_dir/.env" "API_SERVER_ENABLED" "false"
  done
else
  echo "MAXX warning: hermes CLI not found; Pup profiles were not provisioned" >&2
fi

exec /opt/hermes/docker/entrypoint-dispatch.sh "$@"
