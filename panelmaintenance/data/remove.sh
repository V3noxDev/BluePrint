#!/bin/bash
set -e

PANEL="${PTERODACTYL_DIRECTORY:-/var/www/pterodactyl}"
TARGET="$PANEL/resources/views/errors/503.blade.php"
BACKUP="$TARGET.backup.panelmaintenance"

if [ -f "$BACKUP" ]; then
    cp "$BACKUP" "$TARGET"
    rm -f "$BACKUP"
    echo "[panelmaintenance] 503.blade.php restaurado."
elif grep -q "panelmaintenance" "$TARGET" 2>/dev/null; then
    rm -f "$TARGET"
    echo "[panelmaintenance] 503.blade.php removido."
fi

if php "$PANEL/artisan" about >/dev/null 2>&1; then
    php "$PANEL/artisan" up 2>/dev/null || true
fi

rm -f "$PANEL/storage/framework/panelmaintenance.json" 2>/dev/null || true
echo "[panelmaintenance] Removido."
