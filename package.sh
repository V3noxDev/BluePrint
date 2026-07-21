#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="${1:-$ROOT/mcmanager.blueprint}"

rm -f "$OUT"
(
  cd "$ROOT"
  zip -r "$OUT" . \
    -x "*.git*" \
    -x "*.blueprint" \
    -x "node_modules/*" \
    -x "package.sh" \
    -x ".gitignore"
)

echo "Created: $OUT"
ls -lh "$OUT"
