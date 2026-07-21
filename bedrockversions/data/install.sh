#!/bin/bash
set -e

PRIVATE="${PTERODACTYL_DIRECTORY}/.blueprint/extensions/${EXTENSION_IDENTIFIER}/private"
mkdir -p "$PRIVATE"

# Copy seed catalog into private storage if missing
if [ -f "$PRIVATE/seed-versions.json" ]; then
  echo "[bedrockversions] Seed já existe."
else
  # Blueprint copies data.directory contents into private; seed should already be there
  echo "[bedrockversions] Privado inicializado."
fi

echo "[bedrockversions] Instalado. Rode migrations se necessário: php artisan migrate"
