#!/bin/bash
set -e

CATALOG_DIR="${PTERODACTYL_DIRECTORY}/.blueprint/extensions/${EXTENSION_IDENTIFIER}/private"
mkdir -p "$CATALOG_DIR"

if [ ! -f "$CATALOG_DIR/catalog.json" ]; then
  cp "${PTERODACTYL_DIRECTORY}/.blueprint/extensions/${EXTENSION_IDENTIFIER}/private/default-catalog.json" \
     "$CATALOG_DIR/catalog.json" 2>/dev/null || true
fi

echo "[MineHub] Catálogo de addons inicializado."
