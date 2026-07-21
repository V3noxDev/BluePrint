#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/minehub"
DIST_DIR="$ROOT_DIR/dist"
OUTPUT="$DIST_DIR/minehub.blueprint"

if ! command -v zip >/dev/null 2>&1; then
    echo "Erro: o comando 'zip' é necessário para gerar o pacote." >&2
    exit 1
fi

mkdir -p "$DIST_DIR"
rm -f "$OUTPUT"

(
    cd "$SOURCE_DIR"
    zip -q -r "$OUTPUT" . \
        -x "*.DS_Store" \
        -x "*/node_modules/*" \
        -x "*/.dist/*"
)

echo "Pacote criado em: $OUTPUT"
