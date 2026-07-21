#!/usr/bin/env bash

set -euo pipefail

ADDON_IDENTIFIER="mcproperties"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
EXTENSION_SOURCE="${SCRIPT_DIR}/mc-server-properties-blueprint"

COLOR_RESET="\033[0m"
COLOR_TITLE="\033[1;36m"
COLOR_SUCCESS="\033[1;32m"
COLOR_WARN="\033[1;33m"
COLOR_ERROR="\033[1;31m"

PTERODACTYL_DIRECTORY="${PTERODACTYL_DIRECTORY:-}"

print_line() {
  printf '%s\n' "------------------------------------------------------------"
}

info() {
  printf "${COLOR_TITLE}%s${COLOR_RESET}\n" "$1"
}

ok() {
  printf "${COLOR_SUCCESS}%s${COLOR_RESET}\n" "$1"
}

warn() {
  printf "${COLOR_WARN}%s${COLOR_RESET}\n" "$1"
}

fail() {
  printf "${COLOR_ERROR}%s${COLOR_RESET}\n" "$1" >&2
}

require_blueprint() {
  if ! command -v blueprint >/dev/null 2>&1; then
    fail "Comando 'blueprint' não encontrado. Instale o Blueprint antes."
    exit 1
  fi
}

resolve_default_panel_dir() {
  if [ -n "${PTERODACTYL_DIRECTORY}" ] && [ -d "${PTERODACTYL_DIRECTORY}" ]; then
    printf '%s' "${PTERODACTYL_DIRECTORY}"
    return
  fi

  if [ -d "/var/www/pterodactyl" ]; then
    printf '%s' "/var/www/pterodactyl"
    return
  fi

  if [ -d "/srv/pterodactyl" ]; then
    printf '%s' "/srv/pterodactyl"
    return
  fi

  printf '%s' ""
}

ensure_panel_dir() {
  local default_dir
  default_dir="$(resolve_default_panel_dir)"

  if [ -n "${default_dir}" ]; then
    read -r -p "Diretório do painel [${default_dir}]: " user_input
    PTERODACTYL_DIRECTORY="${user_input:-${default_dir}}"
  else
    read -r -p "Diretório do painel Pterodactyl: " user_input
    PTERODACTYL_DIRECTORY="${user_input}"
  fi

  if [ -z "${PTERODACTYL_DIRECTORY}" ] || [ ! -d "${PTERODACTYL_DIRECTORY}" ]; then
    fail "Diretório inválido: ${PTERODACTYL_DIRECTORY:-<vazio>}"
    return 1
  fi

  if [ ! -f "${PTERODACTYL_DIRECTORY}/artisan" ]; then
    warn "Não encontrei artisan em ${PTERODACTYL_DIRECTORY}. Continue apenas se tiver certeza."
  fi

  export PTERODACTYL_DIRECTORY
  return 0
}

run_blueprint() {
  local args=("$@")
  (
    cd "${PTERODACTYL_DIRECTORY}"
    blueprint "${args[@]}"
  )
}

sync_source_to_dev() {
  local dev_dir="${PTERODACTYL_DIRECTORY}/.blueprint/dev"

  if [ ! -d "${EXTENSION_SOURCE}" ]; then
    fail "Fonte da extensão não encontrada em ${EXTENSION_SOURCE}"
    return 1
  fi

  mkdir -p "${dev_dir}"
  rm -rf "${dev_dir:?}/"*
  cp -a "${EXTENSION_SOURCE}/." "${dev_dir}/"

  if [ -d "${dev_dir}/data/private" ]; then
    chmod +x "${dev_dir}/data/private/"*.sh 2>/dev/null || true
  fi
}

install_or_update_from_source() {
  info "Sincronizando extensão para .blueprint/dev..."
  sync_source_to_dev
  ok "Arquivos sincronizados."

  info "Aplicando extensão no painel com blueprint -build..."
  run_blueprint -build
  ok "Extensão aplicada com sucesso."
}

build_package() {
  info "Exportando pacote .blueprint..."
  run_blueprint -export
  ok "Pacote exportado no diretório do painel."
}

install_package_file() {
  local package_path=""
  read -r -p "Caminho do arquivo .blueprint: " package_path

  if [ -z "${package_path}" ] || [ ! -f "${package_path}" ]; then
    fail "Arquivo não encontrado: ${package_path:-<vazio>}"
    return 1
  fi

  local package_name
  package_name="$(basename -- "${package_path}")"
  local package_identifier="${package_name%.blueprint}"

  if [ "${package_path}" != "${PTERODACTYL_DIRECTORY}/${package_name}" ]; then
    cp "${package_path}" "${PTERODACTYL_DIRECTORY}/${package_name}"
  fi

  info "Instalando ${package_name}..."
  run_blueprint -install "${package_identifier}"
  ok "Pacote instalado."
}

remove_extension() {
  info "Removendo extensão ${ADDON_IDENTIFIER}..."
  run_blueprint -remove "${ADDON_IDENTIFIER}"
  ok "Extensão removida."
}

rebuild_panel_assets() {
  info "Rebuild de assets com blueprint -build..."
  run_blueprint -build
  ok "Rebuild concluído."
}

print_header() {
  clear || true
  print_line
  printf "${COLOR_TITLE}%s${COLOR_RESET}\n" " Minecraft Properties Studio - Auto Installer "
  print_line
  printf "Add-on: %s\n" "${ADDON_IDENTIFIER}"
  printf "Fonte:  %s\n" "${EXTENSION_SOURCE}"
  printf "Painel: %s\n" "${PTERODACTYL_DIRECTORY:-não definido}"
  print_line
}

menu_loop() {
  while true; do
    print_header
    cat <<'EOF'
[1] Instalar / atualizar addon (a partir do código-fonte)
[2] Exportar pacote .blueprint
[3] Instalar addon via arquivo .blueprint
[4] Remover addon
[5] Rebuild de assets (blueprint -build)
[6] Alterar diretório do painel
[0] Sair
EOF

    read -r -p "Selecione uma opção: " option
    print_line

    case "${option}" in
      1) install_or_update_from_source ;;
      2) build_package ;;
      3) install_package_file ;;
      4) remove_extension ;;
      5) rebuild_panel_assets ;;
      6) ensure_panel_dir ;;
      0) break ;;
      *) warn "Opção inválida." ;;
    esac

    print_line
    read -r -p "Pressione ENTER para continuar..." _
  done
}

main() {
  require_blueprint
  ensure_panel_dir
  menu_loop
}

main "$@"
