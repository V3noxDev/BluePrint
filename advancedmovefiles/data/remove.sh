#!/bin/bash
set -e

PANEL="${PTERODACTYL_DIRECTORY:-/var/www/pterodactyl}"
TARGET="$PANEL/resources/scripts/components/server/files/RenameFileModal.tsx"
BACKUP="$PANEL/resources/scripts/components/server/files/RenameFileModal.tsx.backup.advancedmovefiles"

if [ -f "$BACKUP" ]; then
  cp "$BACKUP" "$TARGET"
  rm -f "$BACKUP"
  echo "[advancedmovefiles] RenameFileModal restaurado."
elif grep -q "advancedmovefiles" "$TARGET" 2>/dev/null; then
  echo "[advancedmovefiles] Backup não encontrado — restaure manualmente o RenameFileModal.tsx do Pterodactyl."
  exit 1
else
  echo "[advancedmovefiles] Nada para remover."
fi
