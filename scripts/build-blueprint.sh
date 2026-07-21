#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IDENTIFIER="minecraftproperties"
OUTPUT_DIR="$ROOT_DIR/dist"
OUTPUT_FILE="$OUTPUT_DIR/$IDENTIFIER.blueprint"

mkdir -p "$OUTPUT_DIR"
rm -f "$OUTPUT_FILE"

cd "$ROOT_DIR"

FILES=(
    conf.yml
    app
    routes
    resources
    README.md
)

if command -v zip >/dev/null 2>&1; then
    zip -qr "$OUTPUT_FILE" "${FILES[@]}"
else
    python3 - "$OUTPUT_FILE" "${FILES[@]}" <<'PY'
import os
import sys
import zipfile

output = sys.argv[1]
inputs = sys.argv[2:]

with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
    for item in inputs:
        if os.path.isdir(item):
            for root, _, files in os.walk(item):
                for name in files:
                    path = os.path.join(root, name)
                    archive.write(path, path)
        elif os.path.isfile(item):
            archive.write(item, item)
PY
fi

printf 'Built %s\n' "$OUTPUT_FILE"
