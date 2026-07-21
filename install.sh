#!/usr/bin/env bash
#
# install.sh — interactive installer / manager for the MC Properties Editor
#              Blueprint extension for Pterodactyl.
#
# Run this from the extension's source directory ON your panel machine:
#     sudo bash install.sh
#
# It provides a menu to install, update, remove or (re)package the extension.

set -uo pipefail

# ----------------------------------------------------------------------------
#  Config & colors
# ----------------------------------------------------------------------------
IDENTIFIER="mcproperties"
NAME="MC Properties Editor"
DEFAULT_PANEL="/var/www/pterodactyl"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -t 1 ]; then
  BOLD="$(printf '\033[1m')"; DIM="$(printf '\033[2m')"; RESET="$(printf '\033[0m')"
  GREEN="$(printf '\033[38;5;42m')"; RED="$(printf '\033[38;5;196m')"
  YELLOW="$(printf '\033[38;5;220m')"; CYAN="$(printf '\033[38;5;51m')"
  GREY="$(printf '\033[38;5;245m')"
else
  BOLD=""; DIM=""; RESET=""; GREEN=""; RED=""; YELLOW=""; CYAN=""; GREY=""
fi

ok()    { echo "${GREEN}✔${RESET} $*"; }
err()   { echo "${RED}✘${RESET} $*" >&2; }
warn()  { echo "${YELLOW}!${RESET} $*"; }
info()  { echo "${CYAN}➜${RESET} $*"; }

PANEL_DIR="${PTERODACTYL_DIR:-$DEFAULT_PANEL}"

# ----------------------------------------------------------------------------
#  Banner
# ----------------------------------------------------------------------------
banner() {
  clear 2>/dev/null || true
  echo "${GREEN}${BOLD}"
  cat <<'EOF'
   __  __  ___   ___                          _   _
  |  \/  |/ __| | _ \_ _ ___ _ __  ___ _ _ __| |_(_)___ ___
  | |\/| | (__  |  _/ '_/ _ \ '_ \/ -_) '_/ _|  _| / -_|_-<
  |_|  |_|\___| |_| |_| \___/ .__/\___|_| \__|\__|_\___/__/
                            |_|   Blueprint Extension
EOF
  echo "${RESET}"
  echo "  ${DIM}A no-code server.properties editor for Minecraft: Java Edition${RESET}"
  echo "  ${DIM}Panel directory:${RESET} ${BOLD}${PANEL_DIR}${RESET}"
  echo
}

# ----------------------------------------------------------------------------
#  Environment checks
# ----------------------------------------------------------------------------
check_panel() {
  if [ ! -d "$PANEL_DIR" ]; then
    err "Pterodactyl directory not found at '${PANEL_DIR}'."
    read -rp "  Enter the path to your Pterodactyl installation: " input
    if [ -n "$input" ] && [ -d "$input" ]; then
      PANEL_DIR="$input"
      ok "Using panel directory: ${PANEL_DIR}"
    else
      err "Invalid directory. Aborting."
      return 1
    fi
  fi
  return 0
}

check_blueprint() {
  if ! command -v blueprint >/dev/null 2>&1; then
    err "The 'blueprint' command was not found."
    echo "  Blueprint must be installed on your panel first."
    echo "  See: ${CYAN}https://blueprint.zip${RESET}"
    return 1
  fi
  return 0
}

ensure_package() {
  # Make sure a .blueprint package exists, building it if source is present.
  local pkg="${SCRIPT_DIR}/${IDENTIFIER}.blueprint"
  if [ -f "${SCRIPT_DIR}/conf.yml" ]; then
    info "Source detected — building a fresh package..."
    if bash "${SCRIPT_DIR}/build.sh" >/dev/null 2>&1; then
      ok "Package built."
    else
      warn "Automatic build failed; will use existing package if available."
    fi
  fi
  if [ ! -f "$pkg" ]; then
    err "No '${IDENTIFIER}.blueprint' package found in ${SCRIPT_DIR}."
    return 1
  fi
  PACKAGE_PATH="$pkg"
  return 0
}

# ----------------------------------------------------------------------------
#  Actions
# ----------------------------------------------------------------------------
do_install() {
  check_panel || return
  check_blueprint || return
  ensure_package || return

  info "Copying package into panel directory..."
  cp -f "$PACKAGE_PATH" "${PANEL_DIR}/${IDENTIFIER}.blueprint"

  info "Installing '${NAME}' via Blueprint..."
  ( cd "$PANEL_DIR" && blueprint -install "$IDENTIFIER" )
  local code=$?
  if [ $code -eq 0 ]; then
    ok "${NAME} installed successfully!"
    echo "  The ${BOLD}Properties${RESET} tab is now available inside each server."
  else
    err "Installation failed (exit code ${code}). Check the output above."
  fi
}

do_update() {
  check_panel || return
  check_blueprint || return
  ensure_package || return

  info "Copying updated package into panel directory..."
  cp -f "$PACKAGE_PATH" "${PANEL_DIR}/${IDENTIFIER}.blueprint"

  info "Updating '${NAME}'..."
  # `blueprint -install` also handles updates/reinstalls of an existing extension.
  ( cd "$PANEL_DIR" && blueprint -install "$IDENTIFIER" )
  local code=$?
  if [ $code -eq 0 ]; then
    ok "${NAME} updated successfully!"
  else
    err "Update failed (exit code ${code})."
  fi
}

do_remove() {
  check_panel || return
  check_blueprint || return

  echo
  read -rp "  ${YELLOW}Are you sure you want to remove ${NAME}? [y/N]:${RESET} " confirm
  case "${confirm,,}" in
    y|yes)
      info "Removing '${NAME}'..."
      ( cd "$PANEL_DIR" && blueprint -remove "$IDENTIFIER" )
      local code=$?
      if [ $code -eq 0 ]; then
        ok "${NAME} removed."
      else
        err "Removal failed (exit code ${code})."
      fi
      ;;
    *)
      warn "Cancelled."
      ;;
  esac
}

do_package() {
  ensure_package || return
  ok "Package ready: ${PACKAGE_PATH}"
}

# ----------------------------------------------------------------------------
#  Menu loop
# ----------------------------------------------------------------------------
pause() { echo; read -rp "  ${DIM}Press Enter to return to the menu...${RESET}" _; }

menu() {
  while true; do
    banner
    echo "  ${BOLD}What would you like to do?${RESET}"
    echo
    echo "   ${GREEN}1${RESET}) Install         ${GREY}— install the extension onto your panel${RESET}"
    echo "   ${CYAN}2${RESET}) Update          ${GREY}— rebuild & reinstall the latest version${RESET}"
    echo "   ${RED}3${RESET}) Remove          ${GREY}— uninstall the extension${RESET}"
    echo "   ${YELLOW}4${RESET}) Build package   ${GREY}— create the .blueprint file only${RESET}"
    echo "   ${GREY}5${RESET}) Change panel path"
    echo "   ${GREY}0${RESET}) Exit"
    echo
    read -rp "  ${BOLD}Select an option [0-5]:${RESET} " choice
    echo
    case "$choice" in
      1) do_install; pause ;;
      2) do_update; pause ;;
      3) do_remove; pause ;;
      4) do_package; pause ;;
      5)
        read -rp "  Enter path to Pterodactyl installation: " newpath
        [ -n "$newpath" ] && PANEL_DIR="$newpath"
        ok "Panel directory set to: ${PANEL_DIR}"
        pause
        ;;
      0|q|Q) echo "  ${DIM}Goodbye!${RESET}"; exit 0 ;;
      *) warn "Invalid option: '${choice}'"; pause ;;
    esac
  done
}

menu
