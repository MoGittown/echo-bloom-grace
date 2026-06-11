#!/usr/bin/env bash
# Einmal-Setup: GitHub-Login + Push main → triggert Actions-Deploy
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v gh >/dev/null 2>&1; then
  echo "Installiere GitHub CLI…"
  brew install gh
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "→ GitHub-Anmeldung (Browser öffnet sich)"
  gh auth login --hostname github.com --git-protocol ssh --web
fi

git remote set-url origin git@github.com:MoGittown/echo-bloom-grace.git

echo "→ Push auf main (startet Deploy-Workflow)"
git push -u origin main

echo ""
echo "✅ Push erfolgreich. Deploy-Status:"
echo "   https://github.com/MoGittown/echo-bloom-grace/actions"
echo "   Live nach grünem Haken: https://kuechenready.de/admin"
