#!/usr/bin/env bash
set -euo pipefail

DATA_DIR="${HERMES_HOME:-/opt/data}"
SEED_DIR="/opt/maxx-seed"
CONTEXT_DIR="$DATA_DIR/product-context"
PUP_PROFILES=("chief-pup" "superdoer" "business-pup")

mkdir -p "$DATA_DIR/skills" "$DATA_DIR/sessions" "$DATA_DIR/memories" "$DATA_DIR/cron" "$DATA_DIR/logs" "$DATA_DIR/home" "$CONTEXT_DIR" "$DATA_DIR/profiles"

# Identity/config become customer/runtime state after first boot. Do not erase
# onboarding changes during image upgrades.
if [[ ! -f "$DATA_DIR/SOUL.md" ]]; then
  cp "$SEED_DIR/profile/SOUL.md" "$DATA_DIR/SOUL.md"
fi
if [[ ! -f "$DATA_DIR/config.yaml" ]]; then
  cp "$SEED_DIR/profile/config.yaml" "$DATA_DIR/config.yaml"
else
  # MAXX owns its control-plane MCP stanza and the local Pup multiplex contract.
  # Merge those managed fields into customer config without replacing provider
  # defaults, customer MCP servers, or unrelated local settings. Write atomically.
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

managed_mcp = (seed.get("mcp_servers") or {}).get("maxx-control-plane")
if not isinstance(managed_mcp, dict):
    raise SystemExit("Seed config is missing managed maxx-control-plane MCP stanza")
servers = current.setdefault("mcp_servers", {})
if not isinstance(servers, dict):
    raise SystemExit("Existing mcp_servers config must be a mapping")
servers["maxx-control-plane"] = managed_mcp

seed_gateway = seed.get("gateway") or {}
gateway = current.setdefault("gateway", {})
if not isinstance(gateway, dict):
    raise SystemExit("Existing gateway config must be a mapping")
gateway["multiplex_profiles"] = True
gateway["multiplex_profile_allowlist"] = list(seed_gateway.get("multiplex_profile_allowlist") or [])

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

# Bot Mode's useful primitive is the Hermes profile. MAXX exposes those profiles
# to Stacy as Pups. Create the bounded local roster once, then keep each profile's
# identity current without replacing its memory, sessions, or customer state.
if command -v hermes >/dev/null 2>&1; then
  for profile in "${PUP_PROFILES[@]}"; do
    profile_dir="$DATA_DIR/profiles/$profile"
    case "$profile" in
      chief-pup)
        description="Coordinates MAXX work, priorities, proof, and bounded Pup handoffs."
        ;;
      superdoer)
        description="Produces concrete internal work, drafts, research, follow-up prep, and verifiable deliverables."
        ;;
      business-pup)
        description="Moves an owner-supplied business or offer toward revenue, delivery, retention, and sensible automation."
        ;;
    esac

    if [[ ! -d "$profile_dir" ]]; then
      hermes profile create "$profile" --clone-from default --no-alias --description "$description"
    else
      # Description is routing metadata, not customer memory. Keep it aligned
      # with the product role while preserving the rest of the profile.
      hermes profile describe "$profile" --text "$description" >/dev/null 2>&1 || true
    fi

    mkdir -p "$profile_dir"
    cp "$SEED_DIR/profile/pups/$profile/SOUL.md" "$profile_dir/SOUL.md"

    # The shared listener authenticates secondary profile prefixes against the
    # target profile's API_SERVER_KEY. Derive a stable per-profile bridge key
    # from the deployment's master API key so MAXX gets isolation without a
    # separate secret-management burden for every Pup.
    profile_key="$(derive_profile_key "$profile")"
    if [[ -n "$profile_key" ]]; then
      set_env_value "$profile_dir/.env" "API_SERVER_KEY" "$profile_key"
    fi
    # Secondary profiles are served by the default multiplex listener and must
    # not bind their own api_server port.
    set_env_value "$profile_dir/.env" "API_SERVER_ENABLED" "false"
  done
else
  echo "MAXX warning: hermes CLI not found; Pup profiles were not provisioned" >&2
fi

exec /opt/hermes/docker/entrypoint-dispatch.sh "$@"
