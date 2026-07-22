#!/bin/bash
set -e

PANEL="${PTERODACTYL_DIRECTORY:-/var/www/pterodactyl}"
cd "$PANEL" || exit 1

if php artisan | grep -q "up"; then
  if [ -f storage/framework/down ]; then
    php artisan up 2>/dev/null || true
    echo "[panelmaintenance] Modo de manutenção desativado."
  fi
fi

rm -f storage/framework/panelmaintenance.json storage/framework/panelmaintenance-settings.json 2>/dev/null || true
echo "[panelmaintenance] Removido."
