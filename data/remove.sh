#!/usr/bin/env bash
set -euo pipefail

identifier="${EXTENSION_IDENTIFIER:-serverproperties}"

echo "[${identifier}] Removing Minecraft Properties Manager"
echo "[${identifier}] Server-side backups named server.properties.blueprint-backup-* are intentionally kept inside game servers."
echo "[${identifier}] Remove those backups manually from the Pterodactyl file manager if you no longer need them."
