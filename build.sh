#!/usr/bin/env bash
#
# build.sh — package the extension into a distributable `.blueprint` file.
#
# A `.blueprint` file is simply a ZIP archive containing the extension's files
# with `conf.yml` at its root. This script produces `mcproperties.blueprint`
# in the repository root, ready to be installed with `blueprint -install`.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

IDENTIFIER="mcproperties"
OUTPUT="${IDENTIFIER}.blueprint"

# Files/dirs that make up the extension.
INCLUDE=(
  "conf.yml"
  "app"
  "routes"
  "resources"
  "README.md"
  "LICENSE"
)

if ! command -v zip >/dev/null 2>&1; then
  echo "Error: 'zip' is required but not installed. Install it with: apt-get install -y zip"
  exit 1
fi

echo "==> Packaging ${OUTPUT} ..."
rm -f "$OUTPUT"

# Only include paths that actually exist.
EXISTING=()
for path in "${INCLUDE[@]}"; do
  [ -e "$path" ] && EXISTING+=("$path")
done

zip -r -q "$OUTPUT" "${EXISTING[@]}" \
  -x "*.DS_Store" -x "*/.git/*" -x "*/node_modules/*"

echo "==> Done. Created: ${SCRIPT_DIR}/${OUTPUT}"
echo "    Install it with:  blueprint -install ${IDENTIFIER}"
