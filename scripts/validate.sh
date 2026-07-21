#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

command -v php >/dev/null 2>&1 || {
  echo "Erro: PHP não está instalado." >&2
  exit 1
}

cp -R "$ROOT/app" "$ROOT/routes" "$TMP/"

python3 - "$TMP" <<'PY'
from pathlib import Path
import sys

root = Path(sys.argv[1])
namespace = r"Pterodactyl\BlueprintFramework\Extensions\mineflow"

for path in root.rglob("*.php"):
    path.write_text(path.read_text().replace("{appcontext}", namespace))
PY

while IFS= read -r -d '' file; do
  php -l "$file" >/dev/null
done < <(find "$TMP" -type f -name '*.php' -print0)

for path in \
  resources/icon.svg \
  resources/styles/admin.css \
  resources/views/admin.blade.php \
  resources/scripts/components/Components.yml \
  resources/scripts/components/server/MineFlow.tsx \
  routes/client.php
do
  test -e "$ROOT/$path" || {
    echo "Erro: arquivo obrigatório ausente: $path" >&2
    exit 1
  }
done

if grep -R --line-number --fixed-strings '[identifier]' "$ROOT" \
  --exclude-dir=.git --exclude-dir=dist >/dev/null; then
  echo "Erro: placeholder de template não substituído." >&2
  exit 1
fi

echo "Validação estrutural e sintática concluída."
