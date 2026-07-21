#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_SCRIPT="$SCRIPT_DIR/build-blueprint-package.sh"
MANAGER_SCRIPT="$SCRIPT_DIR/mc-server-properties-manager.sh"
CONF_FILE="$REPO_ROOT/blueprint-addon/conf.yml"
DEFAULT_PANEL_DIR="/var/www/pterodactyl"

if [[ -t 1 ]]; then
  C_RESET="$(printf '\033[0m')"
  C_BLUE="$(printf '\033[34m')"
  C_GREEN="$(printf '\033[32m')"
  C_YELLOW="$(printf '\033[33m')"
  C_RED="$(printf '\033[31m')"
else
  C_RESET=""
  C_BLUE=""
  C_GREEN=""
  C_YELLOW=""
  C_RED=""
fi

print_header() {
  printf "%s\n" "============================================================"
  printf "%sBlueprint Auto Installer - Minecraft Addon%s\n" "$C_BLUE" "$C_RESET"
  printf "%s\n" "============================================================"
}

log_info() {
  printf "%s[INFO]%s %s\n" "$C_BLUE" "$C_RESET" "$1"
}

log_ok() {
  printf "%s[OK]%s %s\n" "$C_GREEN" "$C_RESET" "$1"
}

log_warn() {
  printf "%s[WARN]%s %s\n" "$C_YELLOW" "$C_RESET" "$1"
}

log_err() {
  printf "%s[ERR]%s %s\n" "$C_RED" "$C_RESET" "$1" >&2
}

read_identifier() {
  awk -F': ' '/identifier:/ {gsub(/"/, "", $2); print $2; exit}' "$CONF_FILE"
}

ensure_blueprint_cli() {
  if ! command -v blueprint >/dev/null 2>&1; then
    log_err "Comando 'blueprint' nao encontrado no PATH."
    log_info "Instale o Blueprint no painel antes de usar este instalador."
    exit 1
  fi
}

prompt_panel_dir() {
  local panel_dir
  read -r -p "Diretorio do painel Pterodactyl [$DEFAULT_PANEL_DIR]: " panel_dir
  panel_dir="${panel_dir:-$DEFAULT_PANEL_DIR}"

  if [[ ! -d "$panel_dir" ]]; then
    log_err "Diretorio invalido: $panel_dir"
    exit 1
  fi

  printf "%s" "$panel_dir"
}

build_package() {
  "$BUILD_SCRIPT" --path-only
}

install_addon() {
  local panel_dir
  local package_path
  local package_name
  local identifier

  ensure_blueprint_cli
  panel_dir="$(prompt_panel_dir)"
  package_path="$(build_package)"
  package_name="$(basename "$package_path")"
  identifier="$(read_identifier)"

  cp "$package_path" "$panel_dir/$package_name"
  log_info "Pacote copiado para: $panel_dir/$package_name"

  (
    cd "$panel_dir"
    blueprint -install "$identifier"
  )

  log_ok "Addon instalado com sucesso: $identifier"
}

remove_addon() {
  local panel_dir
  local identifier

  ensure_blueprint_cli
  panel_dir="$(prompt_panel_dir)"
  identifier="$(read_identifier)"

  (
    cd "$panel_dir"
    blueprint -remove "$identifier"
  )

  log_ok "Addon removido com sucesso: $identifier"
}

open_wizard() {
  local target_file
  read -r -p "Caminho do server.properties: " target_file
  if [[ -z "$target_file" ]]; then
    log_warn "Caminho vazio."
    return 0
  fi
  "$MANAGER_SCRIPT" wizard --file "$target_file"
}

apply_preset() {
  local target_file
  local preset
  read -r -p "Caminho do server.properties: " target_file
  read -r -p "Preset [survival|minigames|hardcore]: " preset
  if [[ -z "$target_file" || -z "$preset" ]]; then
    log_warn "Parametros incompletos."
    return 0
  fi
  "$MANAGER_SCRIPT" profile --file "$target_file" --name "$preset"
}

show_egg_snippet() {
  local snippet_file="$REPO_ROOT/examples/pterodactyl/egg-config-server-properties.json"

  if [[ ! -f "$snippet_file" ]]; then
    log_warn "Snippet nao encontrado: $snippet_file"
    return 0
  fi

  printf "\n"
  log_info "Snippet recomendado para config.files do Egg:"
  printf "%s\n" "------------------------------------------------------------"
  cat "$snippet_file"
  printf "%s\n" "------------------------------------------------------------"
}

main_menu() {
  local option

  while true; do
    print_header
    printf "%s\n" "[1] Instalar addon Blueprint"
    printf "%s\n" "[2] Remover addon Blueprint"
    printf "%s\n" "[3] Abrir wizard de server.properties"
    printf "%s\n" "[4] Aplicar preset rapido"
    printf "%s\n" "[5] Exibir snippet de Egg (Pterodactyl)"
    printf "%s\n" "[0] Sair"
    printf "\n"
    read -r -p "Escolha uma opcao: " option

    case "$option" in
      1)
        install_addon
        ;;
      2)
        remove_addon
        ;;
      3)
        open_wizard
        ;;
      4)
        apply_preset
        ;;
      5)
        show_egg_snippet
        ;;
      0)
        log_info "Finalizado."
        break
        ;;
      *)
        log_warn "Opcao invalida."
        ;;
    esac

    printf "\n"
    read -r -p "Pressione ENTER para continuar..."
    printf "\n"
  done
}

main_menu
