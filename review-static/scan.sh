#!/usr/bin/env bash
# Static safety scan for the ZIVO Travel Review build.
# Fails (exit 1) if any mutation-capable code, network target, or secret is present.
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
fail=0
scan() { # <label> <grep-args...>
  local label="$1"; shift
  local hits
  hits=$(grep -rInE "$@" "$DIR" --include='*.html' --include='*.js' --include='*.css' 2>/dev/null \
        | grep -v 'scan.sh' || true)
  if [ -n "$hits" ]; then echo "FAIL [$label]:"; echo "$hits" | sed 's/^/    /'; fail=1
  else echo "PASS [$label]"; fi
}

echo "== ZIVO Travel Review — static safety scan =="
# 1. Network egress (match real invocations, not prose)
scan "network-fetch"      'fetch *\(|new (WebSocket|XMLHttpRequest|EventSource)|(WebSocket|XMLHttpRequest|EventSource) *\(|sendBeacon *\(|importScripts *\(|import *\('
# 2. Network targets (real hosts / external URLs)
scan "network-target"     'https?://[a-z0-9.-]+|\.supabase\.co|\.workers\.dev|wss?://'
# 3. Supabase / DB mutation surface
scan "db-mutation"        'supabase|createClient|\.rpc\(|\.insert\(|\.update\(|\.delete\(|\.upsert\(|\.from\(|\.channel\(|\.auth\.'
# 4. Provider / booking / message / location mutation verbs (as calls)
scan "provider-mutation"  'paymentIntents|checkout\.sessions|stripe|authorize\.net|createBooking|createReservation|sendMessage|updateLocation'
# 5. Secrets
scan "secret"             'eyJ[A-Za-z0-9_-]{6,}\.|sk_(live|test)_|pk_(live|test)_|whsec_|sb_secret_|service_role|SERVICE_ROLE_KEY|Bearer [A-Za-z0-9]'
# 6. Source maps
scan "source-map"         'sourceMappingURL'
[ -n "$(find "$DIR" -name '*.map' 2>/dev/null)" ] && { echo "FAIL [source-map-file]: .map present"; fail=1; } || echo "PASS [source-map-file]"

echo "=============================================="
[ "$fail" = 0 ] && echo "RESULT: ALL SCANS PASS" || echo "RESULT: SCAN FAILED"
exit $fail
