#!/usr/bin/env bash
#
# Empacota o addon em um arquivo mcproperties.blueprint pronto para
# distribuição/instalação (blueprint -install mcproperties).
#
# Uso: bash build.sh

set -e

ADDON_ID="mcproperties"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$SCRIPT_DIR/$ADDON_ID"
OUTPUT="$SCRIPT_DIR/${ADDON_ID}.blueprint"

if [ ! -f "$SOURCE_DIR/conf.yml" ]; then
  echo "erro: conf.yml não encontrado em $SOURCE_DIR" >&2
  exit 1
fi

command -v zip >/dev/null 2>&1 || { echo "erro: instale o 'zip' primeiro (apt install -y zip)" >&2; exit 1; }

rm -f "$OUTPUT"
(cd "$SOURCE_DIR" && zip -r -q "$OUTPUT" . -x '*.DS_Store')

echo "pacote gerado: $OUTPUT"
echo
echo "para instalar:"
echo "  1. copie o arquivo para o diretório do painel:  cp ${ADDON_ID}.blueprint /var/www/pterodactyl/"
echo "  2. rode:  cd /var/www/pterodactyl && blueprint -install ${ADDON_ID}"
