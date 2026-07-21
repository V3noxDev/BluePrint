#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${1:-"$ROOT/dist"}"
OUTPUT="$OUTPUT_DIR/craftproperties.blueprint"

required=(
    "conf.yml"
    "craftproperties.svg"
    "admin/view.blade.php"
    "admin/admin.css"
    "components/Components.yml"
    "components/ServerProperties.tsx"
    "components/lib/catalog.ts"
    "components/lib/properties.ts"
    "components/styles.ts"
    "components/tsconfig.json"
    "data/install.sh"
    "data/update.sh"
    "data/remove.sh"
)

for file in "${required[@]}"; do
    if [[ ! -f "$ROOT/$file" ]]; then
        printf 'Erro: arquivo obrigatório ausente: %s\n' "$file" >&2
        exit 1
    fi
done

if ! command -v zip >/dev/null 2>&1; then
    printf 'Erro: instale o pacote "zip" para gerar a extensão.\n' >&2
    exit 1
fi

mkdir -p "$OUTPUT_DIR"
rm -f "$OUTPUT"

(
    cd "$ROOT"
    zip -q -r "$OUTPUT" \
        conf.yml \
        craftproperties.svg \
        admin \
        components \
        data \
        -x '*/.DS_Store' '*/node_modules/*' '*/.dist/*'
)

zip -T "$OUTPUT" >/dev/null
printf 'Pacote criado: %s\n' "$OUTPUT"
