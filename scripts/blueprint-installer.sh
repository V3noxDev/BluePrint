#!/usr/bin/env bash

set -euo pipefail

IDENTIFIER="mcserverprops"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_PANEL_DIR="${PANEL_DIR:-/var/www/pterodactyl}"
DEFAULT_PACKAGE="$SCRIPT_DIR/../dist/${IDENTIFIER}.blueprint"

blue="\033[1;34m"
green="\033[1;32m"
yellow="\033[1;33m"
red="\033[1;31m"
reset="\033[0m"

print_banner() {
  printf "\n${blue}=============================================${reset}\n"
  printf "${blue} MC Server Properties Pro - Installer Menu ${reset}\n"
  printf "${blue}=============================================${reset}\n\n"
}

info() {
  printf "${blue}[info]${reset} %s\n" "$1"
}

success() {
  printf "${green}[ok]${reset} %s\n" "$1"
}

warn() {
  printf "${yellow}[warn]${reset} %s\n" "$1"
}

fail() {
  printf "${red}[erro]${reset} %s\n" "$1" >&2
  exit 1
}

ask_value() {
  local prompt="$1"
  local default_value="$2"
  local value=""

  read -r -p "$prompt [$default_value]: " value
  if [ -z "$value" ]; then
    value="$default_value"
  fi

  printf "%s" "$value"
}

require_command() {
  local command_name="$1"
  command -v "$command_name" >/dev/null 2>&1 || fail "Comando obrigatorio nao encontrado: $command_name"
}

run_in_panel() {
  local panel_dir="$1"
  shift

  [ -d "$panel_dir" ] || fail "Diretorio do painel nao encontrado: $panel_dir"
  (
    cd "$panel_dir"
    "$@"
  )
}

install_from_package() {
  require_command blueprint

  local panel_dir package_path
  panel_dir="$(ask_value "Diretorio do painel Pterodactyl" "$DEFAULT_PANEL_DIR")"
  package_path="$(ask_value "Caminho do pacote .blueprint" "$DEFAULT_PACKAGE")"

  [ -f "$package_path" ] || fail "Pacote nao encontrado em: $package_path"

  info "Copiando pacote para o painel..."
  cp "$package_path" "$panel_dir/"

  info "Executando blueprint -install $IDENTIFIER"
  run_in_panel "$panel_dir" blueprint -install "$IDENTIFIER"

  success "Addon instalado com sucesso."
}

remove_addon() {
  require_command blueprint

  local panel_dir
  panel_dir="$(ask_value "Diretorio do painel Pterodactyl" "$DEFAULT_PANEL_DIR")"

  info "Executando blueprint -remove $IDENTIFIER"
  run_in_panel "$panel_dir" blueprint -remove "$IDENTIFIER"

  success "Addon removido com sucesso."
}

export_package() {
  require_command blueprint

  local panel_dir
  panel_dir="$(ask_value "Diretorio do painel Pterodactyl (modo dev)" "$DEFAULT_PANEL_DIR")"

  info "Executando blueprint -export dentro do painel..."
  run_in_panel "$panel_dir" blueprint -export

  success "Export executado. Verifique o arquivo ${IDENTIFIER}.blueprint no diretorio do painel."
}

rebuild_extension() {
  require_command blueprint

  local panel_dir
  panel_dir="$(ask_value "Diretorio do painel Pterodactyl" "$DEFAULT_PANEL_DIR")"

  info "Executando blueprint -build"
  run_in_panel "$panel_dir" blueprint -build

  success "Build do Blueprint concluido."
}

show_help() {
  cat <<'EOF'
1) Instalar addon
   - Copia um arquivo mcserverprops.blueprint para o diretorio do painel
   - Executa blueprint -install mcserverprops

2) Remover addon
   - Executa blueprint -remove mcserverprops

3) Exportar pacote
   - Executa blueprint -export no painel em modo dev

4) Rebuild
   - Executa blueprint -build para aplicar mudancas locais

Requisitos:
   - Blueprint instalado no painel
   - Permissao para gravar no diretorio do painel
   - Pacote .blueprint exportado quando for instalar por arquivo
EOF
}

menu_loop() {
  while true; do
    print_banner
    printf "1) Instalar addon\n"
    printf "2) Remover addon\n"
    printf "3) Exportar pacote .blueprint\n"
    printf "4) Rebuild local do Blueprint\n"
    printf "5) Ajuda rapida\n"
    printf "0) Sair\n\n"

    read -r -p "Escolha uma opcao: " option

    case "$option" in
      1) install_from_package ;;
      2) remove_addon ;;
      3) export_package ;;
      4) rebuild_extension ;;
      5) show_help ;;
      0) exit 0 ;;
      *) warn "Opcao invalida." ;;
    esac

    printf "\n"
    read -r -p "Pressione Enter para continuar..." _
  done
}

menu_loop
