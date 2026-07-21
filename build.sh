#!/usr/bin/env bash
# build.sh — Empacota todos os addons em ./dist/*.blueprint
# Uso:
#   ./build.sh              (empacota todos)
#   ./build.sh <identifier> (empacota apenas um)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADDONS_DIR="$ROOT/addons"
DIST_DIR="$ROOT/dist"

mkdir -p "$DIST_DIR"

if ! command -v zip >/dev/null 2>&1; then
    echo "Instale o pacote 'zip' antes de rodar este script." >&2
    exit 1
fi

build_one() {
    local dir="$1"
    local identifier
    identifier="$(grep -E '^\s*identifier:' "$dir/conf.yml" | head -n1 \
                 | sed -E "s/.*identifier:\s*['\"]?([^'\"]+)['\"]?.*/\1/")"
    if [[ -z "$identifier" ]]; then
        echo "  ! Ignorando $(basename "$dir"): sem identifier em conf.yml"
        return
    fi
    local target="$DIST_DIR/${identifier}.blueprint"
    rm -f "$target"
    (cd "$dir" && zip -qr "$target" . -x '.git/*' '.dist/*' '*.DS_Store')
    printf "  ✓ %-24s → %s\n" "$identifier" "$target"
}

filter="${1:-}"

echo "Empacotando addons..."
found=0
for dir in "$ADDONS_DIR"/*/; do
    [[ -f "$dir/conf.yml" ]] || continue
    if [[ -n "$filter" ]]; then
        id="$(grep -E '^\s*identifier:' "$dir/conf.yml" | head -n1 \
              | sed -E "s/.*identifier:\s*['\"]?([^'\"]+)['\"]?.*/\1/")"
        [[ "$id" == "$filter" ]] || continue
    fi
    build_one "$dir"
    found=$((found+1))
done

if (( found == 0 )); then
    echo "Nenhum addon encontrado."; exit 1
fi
echo "Pronto — $found pacote(s) em $DIST_DIR/"
