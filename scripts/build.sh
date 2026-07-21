#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$ROOT/dist"
OUTPUT="$DIST/mineflow.blueprint"

command -v zip >/dev/null 2>&1 || {
  echo "Erro: o comando zip não está instalado." >&2
  exit 1
}

rm -rf "$DIST"
mkdir -p "$DIST"

(
  cd "$ROOT"
  zip -X -q -r "$OUTPUT" \
    conf.yml \
    app \
    routes \
    resources \
    LICENSE \
    -x "*/.DS_Store" "*/Thumbs.db"
)

if ! unzip -tq "$OUTPUT" >/dev/null; then
  echo "Erro: o arquivo gerado não é um ZIP válido." >&2
  exit 1
fi

echo "Blueprint criado em: $OUTPUT"
sha256sum "$OUTPUT"
