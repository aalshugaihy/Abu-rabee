#!/usr/bin/env bash
# End-to-end smoke test for a deployed Abu-Rabee instance.
#
# Usage:
#   scripts/check-deploy.sh https://abu-rabee-api.onrender.com https://abu-rabee-client.onrender.com
#
# Walks the public surface of the platform and reports anything that's not
# the expected 200/204/401. Exits non-zero on the first hard failure so the
# script is safe to drop into CI as a post-deploy gate.

set -euo pipefail

API="${1:-${ABU_RABEE_API:-}}"
CLIENT="${2:-${ABU_RABEE_CLIENT:-}}"

if [ -z "$API" ] || [ -z "$CLIENT" ]; then
  echo "Usage: $0 <api-url> <client-url>" >&2
  echo "  e.g. $0 https://abu-rabee-api.onrender.com https://abu-rabee-client.onrender.com" >&2
  exit 2
fi

API="${API%/}"
CLIENT="${CLIENT%/}"

# ---- helpers ----------------------------------------------------------------
PASS=0
FAIL=0

check() {
  local name="$1"
  local expected="$2"
  local got="$3"
  if [ "$got" = "$expected" ]; then
    printf "  ✓ %-40s %s\n" "$name" "$got"
    PASS=$((PASS + 1))
  else
    printf "  ✗ %-40s expected %s, got %s\n" "$name" "$expected" "$got"
    FAIL=$((FAIL + 1))
  fi
}

http_status() {
  curl -s -o /dev/null -w "%{http_code}" --max-time 60 "$@"
}

# ---- API ---------------------------------------------------------------------
echo "→ API at $API"
check "GET  /health"                    "200" "$(http_status "$API/health")"
check "GET  /ready"                     "200" "$(http_status "$API/ready")"
check "GET  /api/openapi.json"          "200" "$(http_status "$API/api/openapi.json")"
check "GET  /api/docs/"                 "200" "$(http_status "$API/api/docs/")"
check "GET  /api/auth/me (no cookie)"   "401" "$(http_status "$API/api/auth/me")"

# ---- Auth: try the seeded admin --------------------------------------------
echo "→ Auth: signing in as admin@aburabee.gov"
LOGIN=$(http_status -H "Content-Type: application/json" \
  -X POST -d '{"email":"admin@aburabee.gov","password":"admin1234"}' \
  -c /tmp/abu-rabee-cookie.txt \
  "$API/api/auth/login")
check "POST /api/auth/login"            "200" "$LOGIN"

if [ "$LOGIN" = "200" ]; then
  check "GET  /api/auth/me (with cookie)"  "200" "$(http_status -b /tmp/abu-rabee-cookie.txt "$API/api/auth/me")"
  check "GET  /api/committees"             "200" "$(http_status -b /tmp/abu-rabee-cookie.txt "$API/api/committees")"
  check "GET  /api/tasks"                  "200" "$(http_status -b /tmp/abu-rabee-cookie.txt "$API/api/tasks")"
  check "POST /api/auth/refresh"           "200" "$(http_status -X POST -b /tmp/abu-rabee-cookie.txt "$API/api/auth/refresh")"
fi

# ---- CORS preflight (catches CLIENT_ORIGIN mismatches) ---------------------
echo "→ CORS preflight from $CLIENT"
ALLOW=$(curl -s -i -X OPTIONS \
  -H "Origin: $CLIENT" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  "$API/api/auth/login" \
  | tr -d '\r' | grep -i '^access-control-allow-origin:' | awk '{print $2}')
if [ "$ALLOW" = "$CLIENT" ]; then
  printf "  ✓ %-40s %s\n" "Allow-Origin matches client URL" "$ALLOW"
  PASS=$((PASS + 1))
else
  printf "  ✗ %-40s expected %s, got '%s'\n" "Allow-Origin matches client URL" "$CLIENT" "$ALLOW"
  echo "    → fix: set CLIENT_ORIGIN=$CLIENT on abu-rabee-api in Render"
  FAIL=$((FAIL + 1))
fi

# ---- Static frontend --------------------------------------------------------
echo "→ Static site at $CLIENT"
check "GET  / (index.html)"             "200" "$(http_status "$CLIENT/")"
check "GET  /app (SPA fallback)"        "200" "$(http_status "$CLIENT/app")"

# ---- Summary ----------------------------------------------------------------
echo
if [ "$FAIL" = "0" ]; then
  echo "✅  All $PASS checks passed."
  exit 0
fi
echo "❌  $FAIL check(s) failed, $PASS passed."
exit 1
