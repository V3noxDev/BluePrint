#!/bin/bash
set -e

PRIVATE="${PTERODACTYL_DIRECTORY}/.blueprint/extensions/${EXTENSION_IDENTIFIER}/private"
mkdir -p "$PRIVATE"

if [ -f "$PRIVATE/seed-versions.json" ]; then
  echo "[bedrockversions] Seed já existe."
else
  echo "[bedrockversions] Privado inicializado."
fi

if [ -n "$PTERODACTYL_DIRECTORY" ] && [ -f "$PTERODACTYL_DIRECTORY/artisan" ]; then
  echo "[bedrockversions] Executando migrations…"
  php "$PTERODACTYL_DIRECTORY/artisan" migrate --force --no-interaction || true
fi

echo "[bedrockversions] Instalado."
