#!/usr/bin/env bash
set -euo pipefail

identifier="${EXTENSION_IDENTIFIER:-serverproperties}"
target="${PTERODACTYL_DIRECTORY:-/var/www/pterodactyl}"

echo "[${identifier}] Installing Minecraft Properties Manager"
echo "[${identifier}] Panel directory: ${target}"
echo "[${identifier}] No core panel files are patched. Blueprint handles the admin view, controller, CSS, and assets."
echo "[${identifier}] After installation, open Admin > Extensions > Minecraft Properties Manager."
