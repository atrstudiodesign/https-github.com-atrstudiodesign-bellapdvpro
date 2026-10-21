#!/usr/bin/env bash
# Bella PDV Pro: local TWA project setup. Signing credentials are NEVER kept in Git.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-$ROOT/android-twa}"
echo "Checking production PWA..."
node "$ROOT/scripts/play-release-preflight.mjs"
if ! command -v bubblewrap >/dev/null 2>&1; then
  echo "Missing Bubblewrap. Run: npm install -g @bubblewrap/cli" >&2
  exit 2
fi
if [[ -e "$OUT/twa-manifest.json" ]]; then
  echo "TWA already initialized at $OUT — preserving config and signing key."
else
  mkdir -p "$OUT"
  echo "Interactive Bubblewrap init. App ID must be com.bellapdv.app; name Bella PDV Pro."
  bubblewrap init --manifest https://bellapdvpro.vercel.app/manifest.json --directory "$OUT"
fi
echo "Check Android generated project targetSdk >= 36 before Google Play submission."
echo "Confirm Play App Signing SHA256 and update production /.well-known/assetlinks.json accordingly."
echo "Build unsigned for local CI diagnostics only: (cd \"$OUT\" && bubblewrap build --skipSigning)"
echo "A signed app bundle requires your private upload keystore; do NOT commit it or any passwords."
