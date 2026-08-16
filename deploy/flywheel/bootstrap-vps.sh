#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Flywheel bootstrap requires root on a VPS/dedicated host." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/detect-host.sh"

if [[ -r /etc/os-release ]]; then
  # shellcheck disable=SC1091
  source /etc/os-release
else
  echo "Cannot identify Linux distribution; refusing to guess package-manager commands." >&2
  exit 1
fi

install_base_apt() {
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl git gnupg
}

install_docker_apt() {
  install_base_apt
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL "https://download.docker.com/linux/${ID}/gpg" -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  arch="$(dpkg --print-architecture)"
  codename="${VERSION_CODENAME:-}"
  if [[ -z "$codename" ]]; then
    echo "VERSION_CODENAME is missing; cannot configure Docker apt repository safely." >&2
    exit 1
  fi
  echo "deb [arch=${arch} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/${ID} ${codename} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
}

install_docker_dnf() {
  dnf -y install ca-certificates curl git dnf-plugins-core
  if [[ ! -f /etc/yum.repos.d/docker-ce.repo ]]; then
    dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
  fi
  dnf -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
}

if ! command -v git >/dev/null 2>&1 || ! command -v curl >/dev/null 2>&1; then
  case "${ID:-}" in
    ubuntu|debian) install_base_apt ;;
    almalinux|rocky|centos|rhel) dnf -y install ca-certificates curl git ;;
    *) echo "Unsupported distro for automatic bootstrap: ${ID:-unknown}. Install git, curl, Docker Engine and Docker Compose manually, then rerun." >&2; exit 1 ;;
  esac
fi

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  case "${ID:-}" in
    ubuntu|debian) install_docker_apt ;;
    almalinux|rocky|centos|rhel) install_docker_dnf ;;
    *) echo "Unsupported distro for automatic Docker installation: ${ID:-unknown}." >&2; exit 1 ;;
  esac
fi

systemctl enable --now docker

echo "Flywheel VPS bootstrap complete."
docker --version
docker compose version
