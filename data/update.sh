#!/usr/bin/env bash
set -euo pipefail

identifier="${EXTENSION_IDENTIFIER:-serverproperties}"
version="${EXTENSION_VERSION:-unknown}"

echo "[${identifier}] Updating Minecraft Properties Manager to ${version}"
echo "[${identifier}] Blueprint will refresh bound files and rebuild assets when needed."
