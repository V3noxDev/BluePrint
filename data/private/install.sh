#!/bin/bash
# Runs automatically when the extension is installed via `blueprint -install`.

echo ""
echo "  ┌─────────────────────────────────────────────┐"
echo "  │  Properties Editor  ·  v${EXTENSION_VERSION:-1.0.0}"
echo "  └─────────────────────────────────────────────┘"
echo "  Installed on panel: ${PTERODACTYL_DIRECTORY:-unknown}"
echo "  Blueprint engine:   ${ENGINE:-unknown} (${BLUEPRINT_VERSION:-?})"
echo ""
echo "  A new 'Properties' tab is now available on every server page."
echo "  Open a Minecraft: Java server and start editing server.properties."
echo ""

exit 0
