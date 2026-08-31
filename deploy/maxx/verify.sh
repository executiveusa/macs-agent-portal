#!/usr/bin/env bash
set -euo pipefail

API="${MAXX_API_URL:-http://127.0.0.1:8788}"
KEY="${MAXX_API_KEY:-}"
EVENT_KEY="${MAXX_EVENT_INGEST_KEY:-}"
HERMES_TOOL_KEY="${MAXX_HERMES_TOOL_KEY:-}"
API="${API%/}"

echo "=========================================="
echo "Agent MAXX Production Verification Suite"
echo "Target API: $API"
echo "=========================================="

json_get() {
  python3 -c "
import json, sys
try:
    payload = json.load(sys.stdin)
    path = sys.argv[1].split('.')
    val = payload
    for p in path:
        if isinstance(val, dict):
            val = val.get(p)
        elif isinstance(val, list) and p.isdigit():
            val = val[int(p)]
        else:
            val = None
            break
    print(val if val is not None else '')
except Exception:
    print('')
" "$1"
}

echo "[1/8] Checking /health/live"
LIVE="$(curl -fsS --max-time 10 "$API/health/live")"
printf '%s\n' "$LIVE"
LIVE_STATUS="$(printf '%s' "$LIVE" | json_get status)"
if [[ "$LIVE_STATUS" != "live" && "$LIVE_STATUS" != "ok" && "$LIVE_STATUS" != "alive" ]]; then
  echo "MAXX /health/live did not return expected status. Got: $LIVE_STATUS" >&2
  exit 1
fi

echo "[2/8] Checking /health/ready"
READY="$(curl -fsS --max-time 10 "$API/health/ready")"
printf '%s\n' "$READY"
READY_STATUS="$(printf '%s' "$READY" | json_get status)"
if [[ "$READY_STATUS" != "ready" && "$READY_STATUS" != "ok" ]]; then
  echo "MAXX /health/ready did not return ready status. Got: $READY_STATUS" >&2
  exit 1
fi

echo "[3/8] Checking unauthorized chat rejection (401)"
CODE="$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$API/v1/chat" \
  -H 'content-type: application/json' \
  --data '{"message":"unauthorized test"}')"
if [[ "$CODE" != "401" ]]; then
  echo "Expected 401 for unauthorized /v1/chat, got $CODE" >&2
  exit 1
fi
echo "Unauthorized request successfully rejected (HTTP 401)"

if [[ -n "$KEY" ]]; then
  echo "[4/8] Checking authenticated normal chat"
  NORMAL="$(curl -fsS --max-time 30 -X POST "$API/v1/chat" \
    -H 'content-type: application/json' \
    -H "x-maxx-api-key: $KEY" \
    --data '{"message":"Reply with a short confirmation that Agent MAXX 006 is online."}')"
  printf '%s\n' "$NORMAL"
  TEXT="$(printf '%s' "$NORMAL" | json_get response)"
  if [[ -z "$TEXT" ]]; then
    TEXT="$(printf '%s' "$NORMAL" | json_get text)"
  fi
  if [[ -z "$TEXT" ]]; then
    echo "Empty or invalid response from normal chat" >&2
    exit 1
  fi

  echo "[5/8] Checking authenticated MAXX Mode (POWER)"
  POWER="$(curl -fsS --max-time 30 -X POST "$API/v1/chat" \
    -H 'content-type: application/json' \
    -H "x-maxx-api-key: $KEY" \
    --data '{"message":"[[MAXX_MODE:POWER]]\nConfirm production governance boundary."}')"
  printf '%s\n' "$POWER"
  POWER_TEXT="$(printf '%s' "$POWER" | json_get response)"
  if [[ -z "$POWER_TEXT" ]]; then
    POWER_TEXT="$(printf '%s' "$POWER" | json_get text)"
  fi
  if [[ -z "$POWER_TEXT" ]]; then
    echo "Empty or invalid response from MAXX Mode chat" >&2
    exit 1
  fi
else
  echo "[4/8] Skipping authenticated chat (MAXX_API_KEY not supplied to verifier)"
  echo "[5/8] Skipping MAXX Mode chat"
fi

if [[ -n "$HERMES_TOOL_KEY" ]]; then
  echo "[6/8] Checking Hermes Tool Bridge & Pups Directory"
  PUPS="$(curl -fsS --max-time 10 -X GET "$API/v1/pups" \
    -H "x-maxx-hermes-tool-key: $HERMES_TOOL_KEY")"
  printf '%s\n' "$PUPS"

  echo "[7/8] Checking Workflows & Refinements API"
  WORKFLOWS="$(curl -fsS --max-time 10 -X GET "$API/v1/workflows" \
    -H "x-maxx-hermes-tool-key: $HERMES_TOOL_KEY")"
  printf '%s\n' "$WORKFLOWS"
else
  echo "[6/8] Skipping Pups Tool check (MAXX_HERMES_TOOL_KEY not supplied)"
  echo "[7/8] Skipping Workflows check"
fi

if [[ -n "$EVENT_KEY" ]]; then
  echo "[8/8] Checking Event Bridge Idempotency & Replay Protection"
  TEST_EVENT_ID="verify-$(date +%s)-$$"
  FIRST_EVENT="$(curl -fsS --max-time 15 -X POST "$API/v1/events" \
    -H 'content-type: application/json' \
    -H "x-maxx-event-key: $EVENT_KEY" \
    --data "{\"eventId\":\"$TEST_EVENT_ID\",\"source\":\"verify-suite\",\"type\":\"maxx.verify.proof\",\"summary\":\"Flywheel smoke test event\"}")"
  printf 'First Event Delivery: %s\n' "$FIRST_EVENT"
  DUP1="$(printf '%s' "$FIRST_EVENT" | json_get duplicate)"
  if [[ "$DUP1" != "False" && "$DUP1" != "false" ]]; then
    echo "Expected duplicate=false on first event delivery, got $DUP1" >&2
    exit 1
  fi

  SECOND_EVENT="$(curl -fsS --max-time 15 -X POST "$API/v1/events" \
    -H 'content-type: application/json' \
    -H "x-maxx-event-key: $EVENT_KEY" \
    --data "{\"eventId\":\"$TEST_EVENT_ID\",\"source\":\"verify-suite\",\"type\":\"maxx.verify.proof\",\"summary\":\"Flywheel smoke test event\"}")"
  printf 'Second Event Delivery: %s\n' "$SECOND_EVENT"
  DUP2="$(printf '%s' "$SECOND_EVENT" | json_get duplicate)"
  if [[ "$DUP2" != "True" && "$DUP2" != "true" ]]; then
    echo "Expected duplicate=true on replay event delivery, got $DUP2" >&2
    exit 1
  fi
  echo "Event idempotency successfully verified (first=accepted, replay=suppressed)"
else
  echo "[8/8] Skipping Event Bridge Idempotency check (MAXX_EVENT_INGEST_KEY not supplied)"
fi

echo "=========================================="
echo "Agent MAXX Production Verification: PASS"
echo "=========================================="
