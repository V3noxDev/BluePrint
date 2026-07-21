#!/usr/bin/env bash
#
# Properties Editor — interactive installer for Pterodactyl + Blueprint.
#
# Provides a small menu to package, install, update, remove or inspect the
# extension on a panel that already has the Blueprint framework installed.
#
# Usage:
#   sudo bash installer.sh                 # interactive menu
#   PANEL=/var/www/pterodactyl bash installer.sh install
#   bash installer.sh remove
#
set -euo pipefail

IDENTIFIER="propertieseditor"
SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PANEL="${PANEL:-/var/www/pterodactyl}"

C_GREEN="\033[1;32m"; C_RED="\033[1;31m"; C_YEL="\033[1;33m"; C_BLU="\033[1;36m"; C_DIM="\033[2m"; C_RST="\033[0m"

banner() {
    echo -e "${C_GREEN}"
    echo "  ╔══════════════════════════════════════════════╗"
    echo "  ║           Properties Editor Installer         ║"
    echo "  ║        server.properties · Blueprint addon    ║"
    echo "  ╚══════════════════════════════════════════════╝"
    echo -e "${C_RST}${C_DIM}  Panel directory: ${PANEL}${C_RST}\n"
}

info()  { echo -e "${C_BLU}==>${C_RST} $*"; }
ok()    { echo -e "${C_GREEN}✓${C_RST} $*"; }
warn()  { echo -e "${C_YEL}!${C_RST} $*"; }
fail()  { echo -e "${C_RED}✗${C_RST} $*" >&2; }

require_panel() {
    if [[ ! -f "${PANEL}/artisan" ]]; then
        fail "No Pterodactyl install found at '${PANEL}'."
        echo -e "   Set the correct path with: ${C_DIM}PANEL=/path/to/pterodactyl bash installer.sh${C_RST}"
        exit 1
    fi
    if ! command -v blueprint >/dev/null 2>&1 && [[ ! -x "${PANEL}/blueprint.sh" ]]; then
        fail "The Blueprint framework does not seem to be installed on this panel."
        echo -e "   Install it first: ${C_DIM}https://blueprint.zip${C_RST}"
        exit 1
    fi
}

# Resolve the blueprint command (global binary or the panel-local script).
bp() {
    if command -v blueprint >/dev/null 2>&1; then
        ( cd "${PANEL}" && blueprint "$@" )
    else
        ( cd "${PANEL}" && bash ./blueprint.sh "$@" )
    fi
}

package() {
    local out="${SELF_DIR}/${IDENTIFIER}.blueprint"
    info "Packaging extension into ${IDENTIFIER}.blueprint ..."
    command -v zip >/dev/null 2>&1 || { fail "'zip' is required to package the extension."; exit 1; }
    rm -f "${out}"
    ( cd "${SELF_DIR}" && zip -rq "${out}" . \
        -x ".git/*" -x "*.blueprint" -x "installer.sh" -x "README.md" -x ".gitignore" )
    ok "Created ${out}"
    echo "${out}"
}

do_install() {
    require_panel
    local file; file="$(package | tail -n1)"
    info "Copying package to panel root ..."
    cp "${file}" "${PANEL}/${IDENTIFIER}.blueprint"
    info "Running Blueprint installer ..."
    bp -install "${IDENTIFIER}"
    ok "Properties Editor installed. Open any server → 'Properties' tab."
}

do_remove() {
    require_panel
    warn "This will remove the Properties Editor extension from the panel."
    bp -remove "${IDENTIFIER}"
    ok "Properties Editor removed."
}

do_query() {
    local file; file="$(package | tail -n1)"
    require_panel
    cp "${file}" "${PANEL}/${IDENTIFIER}.blueprint"
    bp -query "${IDENTIFIER}.blueprint"
}

do_export_only() {
    package >/dev/null
    ok "Package ready at ${SELF_DIR}/${IDENTIFIER}.blueprint (not installed)."
}

menu() {
    banner
    PS3=$'\n'"$(echo -e "${C_YEL}Select an option:${C_RST}") "
    local options=(
        "Install / update Properties Editor"
        "Remove Properties Editor"
        "Query package info"
        "Build .blueprint package only"
        "Quit"
    )
    select opt in "${options[@]}"; do
        case "${REPLY}" in
            1) do_install; break ;;
            2) do_remove; break ;;
            3) do_query; break ;;
            4) do_export_only; break ;;
            5|q|Q) echo "Bye!"; exit 0 ;;
            *) warn "Invalid choice: ${REPLY}" ;;
        esac
    done
}

case "${1:-menu}" in
    install|update) banner; do_install ;;
    remove|uninstall) banner; do_remove ;;
    query|info) banner; do_query ;;
    package|export|build) banner; do_export_only ;;
    menu|"") menu ;;
    *) echo "Usage: $0 [install|remove|query|package]"; exit 1 ;;
esac
