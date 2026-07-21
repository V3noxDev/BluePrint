#!/usr/bin/env bash

set -euo pipefail

echo "[mcserverprops] Finalizando instalacao Blueprint..."

if [ -d ".blueprint/extensions/mcserverprops/private" ]; then
  mkdir -p ".blueprint/extensions/mcserverprops/private/cache"
fi

echo "[mcserverprops] Instale concluido."
