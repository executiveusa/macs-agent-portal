#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${MAXX_ENV_FILE:-$SCRIPT_DIR/.env}"
COMPOSE_FILE="$REPO_ROOT/services/maxx-control-plane/compose.coolify.yml"

compose_args=(-f "$COMPOSE_FILE")
if [[ -n "${MAXX_COMPOSE_EXTRA:-}" ]]; then
  IFS=':' read -r -a extra_compose_files <<< "$MAXX_COMPOSE_EXTRA"
  for extra_file in "${extra_compose_files[@]}"; do
    [[ -f "$extra_file" ]] || { echo "MAXX compose overlay does not exist: $extra_file" >&2; exit 1; }
    compose_args+=(-f "$extra_file")
  done
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing MAXX environment file: $ENV_FILE" >&2
  exit 1
fi

# MAXX's second brain remains the durable authority. This vault is an
# Obsidian-compatible human-readable working surface on the same persistent
# maxx-icm volume, not a second source of truth.
docker compose --env-file "$ENV_FILE" "${compose_args[@]}" exec -T maxx-control-plane sh -lc '
  set -eu
  vault=/data/maxx/second-brain/stacy-vault
  mkdir -p \
    "$vault/.obsidian" \
    "$vault/00-Inbox" \
    "$vault/10-People" \
    "$vault/20-Companies" \
    "$vault/30-Projects" \
    "$vault/40-Meetings" \
    "$vault/50-Decisions" \
    "$vault/60-Playbooks" \
    "$vault/70-Reference" \
    "$vault/90-Archive"

  if [ ! -f "$vault/HOME.md" ]; then
    cat > "$vault/HOME.md" <<"EOF"
# Stacy · MAXX Second Brain

This is the human-readable working vault for Agent MAXX.

MAXX should keep this surface simple and useful:

- [[00-Inbox/README|Inbox]] — uncategorized notes and captured ideas
- [[10-People/README|People]] — important people and relationship context
- [[20-Companies/README|Companies]] — businesses, clients, partners, vendors
- [[30-Projects/README|Projects]] — active outcomes and project notes
- [[40-Meetings/README|Meetings]] — meeting notes, commitments, follow-ups
- [[50-Decisions/README|Decisions]] — durable decisions and why they were made
- [[60-Playbooks/README|Playbooks]] — repeatable operating procedures
- [[70-Reference/README|Reference]] — useful durable reference material
- [[90-Archive/README|Archive]] — inactive material

Imported source bundles remain immutable outside this working vault. Curated notes should preserve provenance when a claim materially affects a decision.
EOF
  fi

  for dir in 00-Inbox 10-People 20-Companies 30-Projects 40-Meetings 50-Decisions 60-Playbooks 70-Reference 90-Archive; do
    if [ ! -f "$vault/$dir/README.md" ]; then
      title=$(printf "%s" "$dir" | sed "s/^[0-9][0-9]-//")
      printf "# %s\n\nManaged by Agent MAXX.\n" "$title" > "$vault/$dir/README.md"
    fi
  done

  if [ ! -f "$vault/.obsidian/app.json" ]; then
    printf "%s\n" "{\"alwaysUpdateLinks\":true,\"showUnsupportedFiles\":true}" > "$vault/.obsidian/app.json"
  fi

  chmod -R u+rwX,go-rwx "$vault"
  printf "%s\n" "$vault"
'
