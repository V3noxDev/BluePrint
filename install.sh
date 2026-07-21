#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IDENTIFIER="minecraftproperties"
BLUEPRINT_FILE="$ROOT_DIR/dist/$IDENTIFIER.blueprint"
DEFAULT_PANEL_ROOT="/var/www/pterodactyl"

GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
RESET="\033[0m"

print_header() {
    clear || true
    printf "${CYAN}"
    printf "============================================================\n"
    printf " Minecraft Properties Blueprint Installer\n"
    printf " Install, update, remove and build the addon package\n"
    printf "============================================================\n"
    printf "${RESET}\n"
}

detect_panel_root() {
    if [[ -f "$DEFAULT_PANEL_ROOT/artisan" ]]; then
        printf "%s" "$DEFAULT_PANEL_ROOT"
        return
    fi

    printf "%s" "$DEFAULT_PANEL_ROOT"
}

prompt_panel_root() {
    local detected
    detected="$(detect_panel_root)"
    read -r -p "Pterodactyl panel root [$detected]: " PANEL_ROOT
    PANEL_ROOT="${PANEL_ROOT:-$detected}"

    if [[ ! -d "$PANEL_ROOT" ]]; then
        printf "${RED}Directory not found: %s${RESET}\n" "$PANEL_ROOT"
        exit 1
    fi
}

need_blueprint_cli() {
    if ! command -v blueprint >/dev/null 2>&1; then
        printf "${RED}Blueprint CLI was not found in PATH.${RESET}\n"
        printf "Install Blueprint first, then run this installer again.\n"
        exit 1
    fi
}

run_privileged() {
    if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
        "$@"
    else
        sudo "$@"
    fi
}

build_package() {
    printf "${YELLOW}Building .blueprint package...${RESET}\n"
    bash "$ROOT_DIR/scripts/build-blueprint.sh"
}

copy_package() {
    if [[ ! -f "$BLUEPRINT_FILE" ]]; then
        build_package
    fi

    printf "${YELLOW}Copying package to %s...${RESET}\n" "$PANEL_ROOT"
    run_privileged cp "$BLUEPRINT_FILE" "$PANEL_ROOT/$IDENTIFIER.blueprint"
}

install_addon() {
    need_blueprint_cli
    prompt_panel_root
    build_package
    copy_package

    printf "${YELLOW}Installing or updating %s through Blueprint...${RESET}\n" "$IDENTIFIER"
    cd "$PANEL_ROOT"
    run_privileged blueprint -install "$IDENTIFIER"
    printf "${GREEN}Done. Open a Minecraft Java server and click MC Properties.${RESET}\n"
}

remove_addon() {
    need_blueprint_cli
    prompt_panel_root

    printf "${YELLOW}Removing %s through Blueprint...${RESET}\n" "$IDENTIFIER"
    cd "$PANEL_ROOT"
    run_privileged blueprint -remove "$IDENTIFIER"
    printf "${GREEN}Removed.${RESET}\n"
}

show_status() {
    prompt_panel_root

    printf "${CYAN}Package:${RESET} %s\n" "$BLUEPRINT_FILE"
    if [[ -f "$BLUEPRINT_FILE" ]]; then
        ls -lh "$BLUEPRINT_FILE"
    else
        printf "${YELLOW}Package has not been built yet.${RESET}\n"
    fi

    printf "${CYAN}Panel root:${RESET} %s\n" "$PANEL_ROOT"
    if [[ -f "$PANEL_ROOT/$IDENTIFIER.blueprint" ]]; then
        ls -lh "$PANEL_ROOT/$IDENTIFIER.blueprint"
    else
        printf "${YELLOW}Package is not copied to the panel root.${RESET}\n"
    fi
}

menu() {
    while true; do
        print_header
        printf "1) Build package only\n"
        printf "2) Install or update addon\n"
        printf "3) Remove addon\n"
        printf "4) Show status\n"
        printf "5) Exit\n\n"
        read -r -p "Choose an option: " choice

        case "$choice" in
            1) build_package ;;
            2) install_addon ;;
            3) remove_addon ;;
            4) show_status ;;
            5) exit 0 ;;
            *) printf "${RED}Invalid option.${RESET}\n" ;;
        esac

        printf "\n"
        read -r -p "Press enter to continue..."
    done
}

case "${1:-}" in
    --build) build_package ;;
    --install) install_addon ;;
    --remove) remove_addon ;;
    --status) show_status ;;
    --help|-h)
        printf "Usage: ./install.sh [--build|--install|--remove|--status]\n"
        ;;
    *) menu ;;
esac
