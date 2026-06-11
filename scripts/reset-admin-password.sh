#!/usr/bin/env bash
# Setzt das Studio-Admin-Passwort über die Edge Function (nach Deploy).
set -euo pipefail

NEW_PASSWORD="${1:-Kuechenready2026!}"
RESET_KEY="${ADMIN_RESET_KEY:-kuechenready-reset-v1}"
SUPABASE_URL="${SUPABASE_URL:-https://pstfazamjmpcywgtkoyt.supabase.co}"
ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzdGZhemFtam1wY3l3Z3Rrb3l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NDE2NzUsImV4cCI6MjA4NDIxNzY3NX0.Y--lvlqqF8Vs0eUwwnbPoVmZJ9kWmnZk2j-qIANaTaI}"

RESP="$(curl -fsSL -X POST "${SUPABASE_URL}/functions/v1/branding-admin" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"reset-password\",\"resetKey\":\"${RESET_KEY}\",\"newPassword\":\"${NEW_PASSWORD}\"}")"

echo "$RESP"
echo "$RESP" | grep -q '"success":true'
echo "✅ Passwort gesetzt: ${NEW_PASSWORD}"
