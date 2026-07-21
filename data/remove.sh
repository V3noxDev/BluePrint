#!/usr/bin/env bash

set -euo pipefail

echo "[mcserverprops] Limpando cache privado da extensao..."

if [ -d ".blueprint/extensions/mcserverprops/private/cache" ]; then
  rm -rf ".blueprint/extensions/mcserverprops/private/cache"
fi

echo "[mcserverprops] Remocao finalizada."
