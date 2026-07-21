#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/minecontrol"
OUT="$ROOT/minecontrol.blueprint"
TMP="$(mktemp -d)"

cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

mkdir -p "$TMP/stage"
cp -a "$SRC/." "$TMP/stage/"

# Match Blueprint export exclusions
find "$TMP/stage" -type d -name '.git' -prune -exec rm -rf {} + 2>/dev/null || true
find "$TMP/stage" -type d -name '.dist' -prune -exec rm -rf {} + 2>/dev/null || true
find "$TMP/stage" -type f -name '.gitkeep' -delete 2>/dev/null || true
find "$TMP/stage" -type f -name '*.blueprint' -delete 2>/dev/null || true

cd "$TMP/stage"
rm -f "$OUT"
zip -qr "$OUT" .

echo "Created $OUT"
ls -lh "$OUT"
