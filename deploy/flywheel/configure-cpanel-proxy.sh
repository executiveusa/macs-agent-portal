#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${MAXX_DOMAIN:?MAXX_DOMAIN is required}"
UPSTREAM="${MAXX_CPANEL_UPSTREAM:-http://127.0.0.1:8788}"
CPANEL_USER="${MAXX_CPANEL_USER:-}"

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "cPanel proxy configuration requires root." >&2
  exit 1
fi

if [[ ! -x /usr/local/cpanel/scripts/rebuildhttpdconf || ! -x /usr/local/cpanel/scripts/restartsrv_httpd ]]; then
  echo "cPanel Apache management scripts are unavailable; refusing to edit web-server configuration." >&2
  exit 1
fi

if [[ -z "$CPANEL_USER" && -x /scripts/whoowns ]]; then
  CPANEL_USER="$(/scripts/whoowns "$DOMAIN" 2>/dev/null || true)"
fi
if [[ -z "$CPANEL_USER" && -x /usr/local/cpanel/scripts/whoowns ]]; then
  CPANEL_USER="$(/usr/local/cpanel/scripts/whoowns "$DOMAIN" 2>/dev/null || true)"
fi
if [[ -z "$CPANEL_USER" ]]; then
  echo "Cannot determine the cPanel owner for $DOMAIN. Set MAXX_CPANEL_USER explicitly." >&2
  exit 1
fi

if command -v httpd >/dev/null 2>&1 && ! httpd -M 2>/dev/null | grep -q 'proxy_module'; then
  echo "Apache mod_proxy is not enabled. Enable it through supported cPanel/EasyApache tooling before deploying MAXX." >&2
  exit 1
fi

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
for mode in std ssl; do
  dir="/etc/apache2/conf.d/userdata/${mode}/2_4/${CPANEL_USER}/${DOMAIN}"
  file="${dir}/maxx-flywheel.conf"
  install -d -m 0755 "$dir"
  if [[ -f "$file" ]]; then
    cp -a "$file" "${file}.bak-${stamp}"
  fi

  forwarded_proto="http"
  [[ "$mode" == "ssl" ]] && forwarded_proto="https"

  cat > "$file" <<EOF
<IfModule proxy_module>
  ProxyPreserveHost On
  ProxyPass /.well-known/acme-challenge/ !
  ProxyPass / ${UPSTREAM}/ retry=0 timeout=600
  ProxyPassReverse / ${UPSTREAM}/
  <IfModule headers_module>
    RequestHeader set X-Forwarded-Proto "${forwarded_proto}"
  </IfModule>
</IfModule>
EOF
  chmod 0644 "$file"
done

/usr/local/cpanel/scripts/rebuildhttpdconf
/usr/local/cpanel/scripts/restartsrv_httpd

echo "cPanel proxy configured for ${DOMAIN} -> ${UPSTREAM}"
