#!/usr/bin/env bash
# =============================================================================
#  MC Hub — package this extension into a .blueprint archive that admins can
#  install with `blueprint -install mchub.blueprint`.
#
#  Requires: zip.
#  Usage:    ./build.sh              # produces ./mchub.blueprint
#            ./build.sh --clean      # removes build artifacts and exits
# =============================================================================
set -Eeuo pipefail

IDENTIFIER="mchub"
OUT="${IDENTIFIER}.blueprint"

here() { cd "$(dirname "${BASH_SOURCE[0]}")" && pwd; }
cd "$(here)"

if [[ "${1:-}" == "--clean" ]]; then
  rm -f "${OUT}"
  echo "Removed ${OUT}"
  exit 0
fi

if ! command -v zip >/dev/null 2>&1; then
  echo "error: 'zip' is required." >&2
  exit 1
fi

# List of files that ship in the packaged extension.
INCLUDE=(
  conf.yml
  icon.svg
  README.md
  LICENSE
  admin
  components
  private
  public
)

rm -f "${OUT}"
zip -qr "${OUT}" "${INCLUDE[@]}" \
  -x "*.DS_Store" "*/node_modules/*" "*/.git/*" "*/.idea/*"

echo "Built ${OUT}"
echo ""
echo "Install with:"
echo "  mv ${OUT} \$PTERODACTYL_DIRECTORY/${OUT}"
echo "  cd \$PTERODACTYL_DIRECTORY"
echo "  blueprint -install ${IDENTIFIER}"
