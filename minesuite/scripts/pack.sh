#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IDENTIFIER="$(awk -F"'" '/identifier:/ {print $2; exit}' "$ROOT/conf.yml")"
OUT="${1:-$ROOT/../${IDENTIFIER}.blueprint}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$TMP"
cp -a "$ROOT"/. "$TMP"/
rm -rf "$TMP/.git" "$TMP/.dist" "$TMP/node_modules" "$TMP/scripts"
rm -f "$TMP"/*.blueprint

(
  cd "$TMP"
  zip -qr "$OUT" .
)

echo "Packed: $OUT"
