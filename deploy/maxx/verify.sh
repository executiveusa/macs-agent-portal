#!/usr/bin/env bash
set -euo pipefail

API="${MAXX_API_URL:?set MAXX_API_URL, e.g. https://maxx-api.example.com}"
KEY="${MAXX_API_KEY:?set MAXX_API_KEY}"
API="${API%/}"

json_field() {
  python - "$1" <<'PY'
import json,sys
payload=json.load(sys.stdin)
path=sys.argv[1].split('.')
value=payload
for part in path:
    value=value[part]
print(value)
PY
}

echo "[1/4] readiness"
READY="$(curl -fsS "$API/health/ready")"
printf '%s\n' "$READY"

STATUS="$(printf '%s' "$READY" | python -c 'import json,sys; print(json.load(sys.stdin).get("status", ""))')"
if [[ "$STATUS" != "ready" ]]; then
  echo "MAXX is not ready; refusing to continue smoke test." >&2
  exit 1
fi

echo "[2/4] unauthorized chat must fail"
CODE="$(curl -sS -o /tmp/maxx-unauth.json -w '%{http_code}' -X POST "$API/v1/chat" -H 'content-type: application/json' --data '{"message":"status check"}')"
if [[ "$CODE" != "401" ]]; then
  echo "Expected 401 without credentials, got $CODE" >&2
  cat /tmp/maxx-unauth.json >&2 || true
  exit 1
fi

echo "[3/4] authenticated normal chat"
NORMAL="$(curl -fsS -X POST "$API/v1/chat" \
  -H 'content-type: application/json' \
  -H "x-maxx-api-key: $KEY" \
  --data '{"message":"Reply with a short status sentence confirming you are Agent MAXX 006."}')"
printf '%s\n' "$NORMAL"
printf '%s' "$NORMAL" | python -c 'import json,sys; d=json.load(sys.stdin); assert str(d.get("text", "")).strip(), "empty MAXX response"'

echo "[4/4] authenticated MAXX Mode"
POWER="$(curl -fsS -X POST "$API/v1/chat" \
  -H 'content-type: application/json' \
  -H "x-maxx-api-key: $KEY" \
  --data '{"message":"[[MAXX_MODE:POWER]]\nState one assumption you would verify before changing production infrastructure."}')"
printf '%s\n' "$POWER"
printf '%s' "$POWER" | python -c 'import json,sys; d=json.load(sys.stdin); assert str(d.get("text", "")).strip(), "empty MAXX Mode response"'

echo "MAXX runtime smoke PASS"
