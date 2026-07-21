#!/usr/bin/env bash

set -euo pipefail

echo "[mcserverprops] Preparando export do pacote Blueprint..."

for script in install.sh remove.sh export.sh; do
  if [ -f "$BLUEPRINT_TMP/data/$script" ]; then
    chmod +x "$BLUEPRINT_TMP/data/$script"
  fi
done

echo "[mcserverprops] Export pronto para empacotamento."
