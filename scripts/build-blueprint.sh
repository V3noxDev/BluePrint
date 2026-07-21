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

if command -v python3 >/dev/null 2>&1; then
    python3 - "$OUTPUT_FILE" "${FILES[@]}" <<'PY'
import os
import sys
import zipfile

output = sys.argv[1]
inputs = sys.argv[2:]
fixed_timestamp = (2026, 1, 1, 0, 0, 0)

with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
    paths = []
    for item in sorted(inputs):
        if os.path.isdir(item):
            for root, dirs, files in os.walk(item):
                dirs.sort()
                for name in sorted(files):
                    paths.append(os.path.join(root, name))
        elif os.path.isfile(item):
            paths.append(item)

    for path in paths:
        info = zipfile.ZipInfo(path, fixed_timestamp)
        mode = os.stat(path).st_mode & 0o777
        info.external_attr = mode << 16
        with open(path, "rb") as handle:
            archive.writestr(info, handle.read(), zipfile.ZIP_DEFLATED)
PY
else
    zip -X -qr "$OUTPUT_FILE" "${FILES[@]}"
fi

printf 'Built %s\n' "$OUTPUT_FILE"
