#!/usr/bin/env bash
# OEP — Compila para GitHub Pages y publica out/ en la rama gh-pages
# sin tocar el árbol de trabajo.
# Uso: bash scripts/deploy-gh-pages.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE="https://github.com/alfredosvaldo/oep-web-v3.git"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# GHPAGES=1 activa basePath/assetPrefix /oep-web-v3 (ver next.config.mjs)
(cd "$ROOT" && GHPAGES=1 npm run build)
touch "$ROOT/out/.nojekyll"   # evita que Jekyll descarte _next/ al publicar

git clone -q --no-hardlinks "$ROOT" "$TMP/repo"
cd "$TMP/repo"
git checkout -q --orphan gh-pages
git rm -rf -q .
cp -R "$ROOT/out/." .
git add -A
git commit -q -m "Sitio estático $(date +%F.%H%M) (build local)"
git remote set-url origin "$REMOTE"
git push -q -f origin gh-pages
echo "OK — gh-pages actualizada. Sitio: https://alfredosvaldo.github.io/oep-web-v3/"
