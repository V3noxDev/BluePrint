#!/usr/bin/env bash
set -euo pipefail

EXTENSION_IDENTIFIER="serverproperties"
EXTENSION_NAME="Minecraft Properties Manager"
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PACKAGE_PATH="${ROOT_DIR}/${EXTENSION_IDENTIFIER}.blueprint"

bold="$(printf '\033[1m')"
blue="$(printf '\033[34m')"
green="$(printf '\033[32m')"
yellow="$(printf '\033[33m')"
red="$(printf '\033[31m')"
reset="$(printf '\033[0m')"

print_header() {
  clear || true
  printf '%s\n' "${blue}${bold}"
  printf ' __  __ _                            __ _     \n'
  printf '|  \\/  (_)_ __   ___  ___ _ __ __ _ / _| |_   \n'
  printf '| |\\/| | | `_ \\ / _ \\/ __| `__/ _` | |_| __|  \n'
  printf '| |  | | | | | |  __/ (__| | | (_| |  _| |_   \n'
  printf '|_|  |_|_|_| |_|\\___|\\___|_|  \\__,_|_|  \\__|  \n'
  printf '%s\n' "${reset}"
  printf '%s%s%s - Blueprint addon installer\n\n' "${bold}" "${EXTENSION_NAME}" "${reset}"
}

pause() {
  printf '\nPressione ENTER para continuar...'
  read -r _
}

detect_panel_dir() {
  if [[ -f "${PWD}/artisan" && -d "${PWD}/.blueprint" ]]; then
    printf '%s' "${PWD}"
    return
  fi

  if [[ -f "/var/www/pterodactyl/artisan" ]]; then
    printf '%s' "/var/www/pterodactyl"
    return
  fi

  printf '%s' "/var/www/pterodactyl"
}

ask_panel_dir() {
  local default_panel
  default_panel="$(detect_panel_dir)"
  printf 'Diretorio do Pterodactyl [%s]: ' "${default_panel}" >&2
  read -r panel_dir
  panel_dir="${panel_dir:-$default_panel}"

  if [[ ! -d "${panel_dir}" ]]; then
    printf '%sDiretorio nao existe:%s %s\n' "${red}" "${reset}" "${panel_dir}" >&2
    return 1
  fi

  if [[ ! -f "${panel_dir}/artisan" ]]; then
    printf '%sNao parece ser um panel Pterodactyl:%s %s\n' "${red}" "${reset}" "${panel_dir}" >&2
    return 1
  fi

  printf '%s' "${panel_dir}"
}

require_blueprint() {
  if ! command -v blueprint >/dev/null 2>&1; then
    printf '%sBlueprint CLI nao encontrado.%s Instale o Blueprint antes de usar este instalador.\n' "${red}" "${reset}" >&2
    return 1
  fi
}

require_python() {
  if ! command -v python3 >/dev/null 2>&1; then
    printf '%spython3 nao encontrado.%s Ele e usado apenas para empacotar o arquivo .blueprint.\n' "${red}" "${reset}" >&2
    return 1
  fi
}

ensure_scripts_are_executable() {
  chmod +x "${ROOT_DIR}/data/install.sh" \
    "${ROOT_DIR}/data/update.sh" \
    "${ROOT_DIR}/data/remove.sh" \
    "${ROOT_DIR}/data/export.sh" \
    "${ROOT_DIR}/installer.sh"
}

build_package() {
  require_python
  ensure_scripts_are_executable

  python3 - "${ROOT_DIR}" "${PACKAGE_PATH}" <<'PY'
import os
import sys
import zipfile

root, package_path = sys.argv[1], sys.argv[2]
files = [
    "conf.yml",
    "controller.php",
    "view.blade.php",
    "admin.css",
    "README.md",
    "public/icon.svg",
    "data/install.sh",
    "data/update.sh",
    "data/remove.sh",
    "data/export.sh",
]

missing = [path for path in files if not os.path.isfile(os.path.join(root, path))]
if missing:
    raise SystemExit("Missing required files: " + ", ".join(missing))

with zipfile.ZipFile(package_path, "w", zipfile.ZIP_DEFLATED) as archive:
    for relative_path in files:
        full_path = os.path.join(root, relative_path)
        stat = os.stat(full_path)
        info = zipfile.ZipInfo(relative_path)
        info.external_attr = (stat.st_mode & 0o777) << 16
        with open(full_path, "rb") as handle:
            archive.writestr(info, handle.read())
PY

  printf '%sPacote criado:%s %s\n' "${green}" "${reset}" "${PACKAGE_PATH}"
}

copy_package_to_panel() {
  local panel_dir="$1"
  local target="${panel_dir}/${EXTENSION_IDENTIFIER}.blueprint"

  if [[ -w "${panel_dir}" ]]; then
    cp "${PACKAGE_PATH}" "${target}"
  else
    sudo cp "${PACKAGE_PATH}" "${target}"
  fi

  printf '%sPacote copiado:%s %s\n' "${green}" "${reset}" "${target}"
}

run_blueprint_in_panel() {
  local panel_dir="$1"
  shift

  if [[ -w "${panel_dir}" ]]; then
    (cd "${panel_dir}" && blueprint "$@")
  else
    (cd "${panel_dir}" && sudo blueprint "$@")
  fi
}

install_addon() {
  require_blueprint
  local panel_dir
  panel_dir="$(ask_panel_dir)"

  build_package
  copy_package_to_panel "${panel_dir}"

  printf '%sInstalando addon via Blueprint...%s\n' "${yellow}" "${reset}"
  run_blueprint_in_panel "${panel_dir}" -install "${EXTENSION_IDENTIFIER}.blueprint"
  printf '%sInstalacao concluida.%s Abra Admin > Extensions > %s.\n' "${green}" "${reset}" "${EXTENSION_NAME}"
}

remove_addon() {
  require_blueprint
  local panel_dir
  panel_dir="$(ask_panel_dir)"

  printf '%sRemovendo addon via Blueprint...%s\n' "${yellow}" "${reset}"
  run_blueprint_in_panel "${panel_dir}" -remove "${EXTENSION_IDENTIFIER}"
  printf '%sRemocao concluida.%s Backups nos servidores nao sao apagados.\n' "${green}" "${reset}"
}

developer_build() {
  require_blueprint
  local panel_dir
  panel_dir="$(ask_panel_dir)"

  if [[ ! -d "${panel_dir}/.blueprint" ]]; then
    printf '%sBlueprint nao parece estar instalado em:%s %s\n' "${red}" "${reset}" "${panel_dir}" >&2
    return 1
  fi

  printf '%sCopiando arquivos para .blueprint/dev...%s\n' "${yellow}" "${reset}"
  if [[ -w "${panel_dir}/.blueprint" ]]; then
    mkdir -p "${panel_dir}/.blueprint/dev"
    cp -R "${ROOT_DIR}/conf.yml" "${ROOT_DIR}/controller.php" "${ROOT_DIR}/view.blade.php" "${ROOT_DIR}/admin.css" "${ROOT_DIR}/README.md" "${ROOT_DIR}/data" "${ROOT_DIR}/public" "${panel_dir}/.blueprint/dev/"
  else
    sudo mkdir -p "${panel_dir}/.blueprint/dev"
    sudo cp -R "${ROOT_DIR}/conf.yml" "${ROOT_DIR}/controller.php" "${ROOT_DIR}/view.blade.php" "${ROOT_DIR}/admin.css" "${ROOT_DIR}/README.md" "${ROOT_DIR}/data" "${ROOT_DIR}/public" "${panel_dir}/.blueprint/dev/"
  fi

  printf '%sExecutando blueprint -build...%s\n' "${yellow}" "${reset}"
  run_blueprint_in_panel "${panel_dir}" -build
  printf '%sBuild de desenvolvimento concluido.%s\n' "${green}" "${reset}"
}

while true; do
  print_header
  printf '1) Instalar addon\n'
  printf '2) Remover addon\n'
  printf '3) Criar pacote .blueprint\n'
  printf '4) Aplicar em modo desenvolvedor (.blueprint/dev + blueprint -build)\n'
  printf '5) Sair\n\n'
  printf 'Selecione uma opcao: '
  read -r option

  case "${option}" in
    1) install_addon; pause ;;
    2) remove_addon; pause ;;
    3) build_package; pause ;;
    4) developer_build; pause ;;
    5) exit 0 ;;
    *) printf '%sOpcao invalida.%s\n' "${red}" "${reset}"; pause ;;
  esac
done
