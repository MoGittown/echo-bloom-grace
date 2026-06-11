#!/usr/bin/env bash
# Einmal: npx supabase login
# Dann: ./scripts/deploy-supabase-local.sh
set -euo pipefail
cd "$(dirname "$0")/.."

npx supabase link --project-ref pstfazamjmpcywgtkoyt
npx supabase db push
npx supabase functions deploy branding-admin --project-ref pstfazamjmpcywgtkoyt

echo ""
echo "✅ Supabase deploy fertig."
echo "Admin: https://kuechenready.de/admin"
echo "Passwort nach Migration: Kuechenready2026! (im Admin ändern)"
