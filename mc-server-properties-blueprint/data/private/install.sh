#!/usr/bin/env bash

set -euo pipefail

echo "[mcproperties] Iniciando instalação da extensão ${EXTENSION_IDENTIFIER:-mcproperties}..."

if [ -z "${PTERODACTYL_DIRECTORY:-}" ]; then
  echo "[mcproperties] Aviso: PTERODACTYL_DIRECTORY não foi fornecido."
else
  echo "[mcproperties] Diretório do painel detectado: ${PTERODACTYL_DIRECTORY}"
fi

echo "[mcproperties] Instalação concluída."
