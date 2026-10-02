#!/usr/bin/env bash
# Genera el PDF del informe con Chrome headless, a partir del sitio local o del export.
# Uso: bash scripts/build-report-pdf.sh [slug] [url_base]
#   p. ej. bash scripts/build-report-pdf.sh 2026-t3 http://127.0.0.1:3003
set -euo pipefail
SLUG="${1:-2026-t3}"
BASE="${2:-http://127.0.0.1:3003}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/informes/OPE-informe-$(echo "$SLUG" | tr 't' 'T').pdf"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
mkdir -p "$ROOT/public/informes"
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=20000 \
  --print-to-pdf="$OUT" "$BASE/informes/$SLUG/?print=1" 2>/dev/null
echo "OK → $OUT"
