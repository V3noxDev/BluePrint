#!/usr/bin/env bash
set -euo pipefail

printf '\033[1;36m[CraftProperties]\033[0m Instalando versão %s para Blueprint %s...\n' \
    "${EXTENSION_VERSION:-desconhecida}" "${BLUEPRINT_VERSION:-desconhecida}"
printf '\033[1;32m[CraftProperties]\033[0m Componentes registrados. Nenhum arquivo do painel foi sobrescrito.\n'
