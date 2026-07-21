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

MINEFLOW_VALIDATION_TMP="$TMP" php <<'PHP'
<?php

require getenv('MINEFLOW_VALIDATION_TMP') . '/app/Services/ServerPropertiesService.php';

$class = 'Pterodactyl\\BlueprintFramework\\Extensions\\mineflow\\Services\\ServerPropertiesService';
$service = new $class();
$source = "# Preservar comentário\r\nmotd=Antigo\r\npvp=true\r\ncustom=value\r\n";
$updated = $service->update($source, ['motd' => 'Novo', 'max-players' => '30'], ['pvp']);
$parsed = $service->parse($updated);

if (
    !str_contains($updated, "# Preservar comentário\r\n")
    || str_contains($updated, 'pvp=')
    || ($parsed['motd'] ?? null) !== 'Novo'
    || ($parsed['max-players'] ?? null) !== '30'
    || ($parsed['custom'] ?? null) !== 'value'
) {
    fwrite(STDERR, "Erro: teste do editor de server.properties falhou.\n");
    exit(1);
}
PHP

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

if grep -R --line-number --fixed-strings '[identifier]' \
  "$ROOT/conf.yml" "$ROOT/app" "$ROOT/routes" "$ROOT/resources" >/dev/null; then
  echo "Erro: placeholder de template não substituído." >&2
  exit 1
fi

echo "Validação estrutural e sintática concluída."
