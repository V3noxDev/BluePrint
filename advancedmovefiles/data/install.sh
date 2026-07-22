#!/bin/bash
set -e

PANEL="${PTERODACTYL_DIRECTORY:-/var/www/pterodactyl}"
TARGET="$PANEL/resources/scripts/components/server/files/RenameFileModal.tsx"
BACKUP="$PANEL/resources/scripts/components/server/files/RenameFileModal.tsx.backup.advancedmovefiles"
STUB='import AdvancedRenameFileModal from '\''@blueprint/extensions/advancedmovefiles/elements/AdvancedRenameFileModal'\'';

export default AdvancedRenameFileModal;
'

if [ ! -f "$TARGET" ]; then
  echo "[advancedmovefiles] RenameFileModal.tsx não encontrado em $TARGET"
  exit 1
fi

if grep -q "advancedmovefiles" "$TARGET" 2>/dev/null; then
  echo "[advancedmovefiles] Patch já aplicado."
  exit 0
fi

cp "$TARGET" "$BACKUP"
printf '%s\n' "$STUB" > "$TARGET"
echo "[advancedmovefiles] RenameFileModal substituído. Rode: blueprint -build"
