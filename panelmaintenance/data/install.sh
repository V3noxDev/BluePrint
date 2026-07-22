#!/bin/bash
set -e

PANEL="${PTERODACTYL_DIRECTORY:-/var/www/pterodactyl}"
ERRORS_DIR="$PANEL/resources/views/errors"
TARGET="$ERRORS_DIR/503.blade.php"
BACKUP="$TARGET.backup.panelmaintenance"
STUB="@include('blueprint.extensions.panelmaintenance.503')"

mkdir -p "$ERRORS_DIR"

if grep -q "panelmaintenance" "$TARGET" 2>/dev/null; then
    echo "[panelmaintenance] Página 503 já instalada."
    exit 0
fi

if [ -f "$TARGET" ]; then
    cp "$TARGET" "$BACKUP"
    echo "[panelmaintenance] Backup: $BACKUP"
fi

printf '%s\n' "$STUB" > "$TARGET"
echo "[panelmaintenance] Instalado."
echo "[panelmaintenance] SSH: php artisan down   |   php artisan up"
echo "[panelmaintenance] Admin: Extensions → Panel Maintenance"
