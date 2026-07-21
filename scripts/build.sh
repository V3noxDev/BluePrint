#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT="$ROOT/dist/serverproperties.blueprint"
STAGING="$(mktemp -d)"

cleanup() {
    rm -rf "$STAGING"
}
trap cleanup EXIT

node "$ROOT/scripts/validate.mjs"

mkdir -p "$STAGING/admin" "$STAGING/assets" "$STAGING/components/lib" "$STAGING/components/sections"
cp "$ROOT/conf.yml" "$STAGING/conf.yml"
cp "$ROOT/admin/view.blade.php" "$STAGING/admin/view.blade.php"
cp "$ROOT/assets/icon.svg" "$STAGING/assets/icon.svg"
cp "$ROOT/components/Components.yml" "$STAGING/components/Components.yml"
cp "$ROOT/components/tsconfig.json" "$STAGING/components/tsconfig.json"
cp "$ROOT/components/lib/properties.ts" "$STAGING/components/lib/properties.ts"
cp "$ROOT/components/lib/schema.ts" "$STAGING/components/lib/schema.ts"
cp "$ROOT/components/sections/PropertiesManager.tsx" "$STAGING/components/sections/PropertiesManager.tsx"

mkdir -p "$ROOT/dist"
rm -f "$OUTPUT"
(
    cd "$STAGING"
    zip -q -r "$OUTPUT" .
)

echo "Pacote criado: $OUTPUT"
sha256sum "$OUTPUT"
