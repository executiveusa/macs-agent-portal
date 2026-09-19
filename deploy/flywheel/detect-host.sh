#!/usr/bin/env bash
set -euo pipefail

provider="${MAXX_PROVIDER:-unknown}"
virtualization="unknown"
panel="none"
os_id="unknown"
os_version="unknown"

if [[ -r /etc/os-release ]]; then
  # shellcheck disable=SC1091
  source /etc/os-release
  os_id="${ID:-unknown}"
  os_version="${VERSION_ID:-unknown}"
fi

if command -v systemd-detect-virt >/dev/null 2>&1; then
  virtualization="$(systemd-detect-virt 2>/dev/null || true)"
  [[ -n "$virtualization" ]] || virtualization="none"
fi

if [[ -d /usr/local/cpanel || -x /usr/local/cpanel/cpanel ]]; then
  panel="cpanel-whm"
fi

hostname_text="$(hostname -f 2>/dev/null || hostname 2>/dev/null || true)"
dmi_vendor=""
if [[ -r /sys/class/dmi/id/sys_vendor ]]; then
  dmi_vendor="$(tr '[:upper:]' '[:lower:]' < /sys/class/dmi/id/sys_vendor)"
fi

# Provider inference is intentionally conservative. Explicit MAXX_PROVIDER wins.
if [[ "$provider" == "unknown" ]]; then
  lower_host="$(printf '%s' "$hostname_text" | tr '[:upper:]' '[:lower:]')"
  if [[ "$lower_host" == *"hstgr"* || "$lower_host" == *"hostinger"* || "$dmi_vendor" == *"hostinger"* ]]; then
    provider="hostinger"
  elif [[ "$lower_host" == *"bluehost"* || "$dmi_vendor" == *"bluehost"* ]]; then
    provider="bluehost"
  fi
fi

has_docker=false
has_compose=false
has_git=false
has_curl=false
command -v docker >/dev/null 2>&1 && has_docker=true
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  has_compose=true
fi
command -v git >/dev/null 2>&1 && has_git=true
command -v curl >/dev/null 2>&1 && has_curl=true

cat <<EOF
provider=$provider
os_id=$os_id
os_version=$os_version
virtualization=$virtualization
panel=$panel
hostname=$hostname_text
docker=$has_docker
compose=$has_compose
git=$has_git
curl=$has_curl
EOF
