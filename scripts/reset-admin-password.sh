#!/usr/bin/env bash
# Setzt das Studio-Admin-Passwort über die Edge Function (nach Deploy).
#
# Erforderliche Umgebungsvariablen (keine Defaults aus Sicherheitsgründen):
#   ADMIN_RESET_KEY    – muss mit dem Supabase-Secret übereinstimmen
#   SUPABASE_URL       – z. B. https://<ref>.supabase.co
#   SUPABASE_ANON_KEY  – Anon-Key des Projekts
#
# Aufruf:
#   ADMIN_RESET_KEY=… SUPABASE_URL=… SUPABASE_ANON_KEY=… ./scripts/reset-admin-password.sh 'NeuesPasswort'
set -euo pipefail

NEW_PASSWORD="${1:-}"
: "${ADMIN_RESET_KEY:?ADMIN_RESET_KEY muss gesetzt sein}"
: "${SUPABASE_URL:?SUPABASE_URL muss gesetzt sein}"
: "${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY muss gesetzt sein}"

if [ -z "$NEW_PASSWORD" ]; then
  read -r -s -p "Neues Admin-Passwort: " NEW_PASSWORD
  echo
fi
if [ "${#NEW_PASSWORD}" -lt 8 ]; then
  echo "❌ Passwort muss mindestens 8 Zeichen haben." >&2
  exit 1
fi

RESP="$(curl -fsSL -X POST "${SUPABASE_URL}/functions/v1/branding-admin" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"reset-password\",\"resetKey\":\"${ADMIN_RESET_KEY}\",\"newPassword\":\"${NEW_PASSWORD}\"}")"

echo "$RESP"
echo "$RESP" | grep -q '"success":true'
echo "✅ Admin-Passwort wurde gesetzt."
