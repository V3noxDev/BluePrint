#!/usr/bin/env bash
# ============================================================
#  BluePrint Store — Auto Installer
#  Interface interativa para instalar / remover / atualizar
#  extensões Blueprint neste repositório em um painel
#  Pterodactyl (com Blueprint já instalado).
# ============================================================

set -u

# ---------- Cores / helpers ------------------------------------------------
if [[ -t 1 ]]; then
    C_RESET=$'\033[0m'
    C_DIM=$'\033[2m'
    C_BOLD=$'\033[1m'
    C_GREEN=$'\033[38;5;42m'
    C_RED=$'\033[38;5;203m'
    C_YELLOW=$'\033[38;5;220m'
    C_BLUE=$'\033[38;5;75m'
    C_MAGENTA=$'\033[38;5;177m'
    C_GRAY=$'\033[38;5;244m'
else
    C_RESET="" C_DIM="" C_BOLD="" C_GREEN="" C_RED="" C_YELLOW="" C_BLUE="" C_MAGENTA="" C_GRAY=""
fi

log()      { printf "%s[i]%s %s\n" "$C_BLUE"   "$C_RESET" "$*"; }
ok()       { printf "%s[✓]%s %s\n" "$C_GREEN"  "$C_RESET" "$*"; }
warn()     { printf "%s[!]%s %s\n" "$C_YELLOW" "$C_RESET" "$*"; }
err()      { printf "%s[x]%s %s\n" "$C_RED"    "$C_RESET" "$*" 1>&2; }
hr()       { printf "%s────────────────────────────────────────────────────────%s\n" "$C_GRAY" "$C_RESET"; }

banner() {
    clear
    printf "\n"
    printf "  %s██████╗ ██╗     ██╗   ██╗███████╗██████╗ ██████╗ ██╗███╗   ██╗████████╗%s\n" "$C_GREEN" "$C_RESET"
    printf "  %s██╔══██╗██║     ██║   ██║██╔════╝██╔══██╗██╔══██╗██║████╗  ██║╚══██╔══╝%s\n" "$C_GREEN" "$C_RESET"
    printf "  %s██████╔╝██║     ██║   ██║█████╗  ██████╔╝██████╔╝██║██╔██╗ ██║   ██║   %s\n" "$C_GREEN" "$C_RESET"
    printf "  %s██╔══██╗██║     ██║   ██║██╔══╝  ██╔═══╝ ██╔══██╗██║██║╚██╗██║   ██║   %s\n" "$C_GREEN" "$C_RESET"
    printf "  %s██████╔╝███████╗╚██████╔╝███████╗██║     ██║  ██║██║██║ ╚████║   ██║   %s\n" "$C_GREEN" "$C_RESET"
    printf "  %s╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝   ╚═╝   %s\n" "$C_GREEN" "$C_RESET"
    printf "\n"
    printf "  %sBluePrint Store — Auto Installer for Pterodactyl extensions%s\n" "$C_BOLD" "$C_RESET"
    printf "  %shttps://github.com/BluePrintStore%s\n" "$C_GRAY" "$C_RESET"
    printf "\n"
}

# ---------- Configuração ---------------------------------------------------
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADDONS_DIR="$REPO_ROOT/addons"
DIST_DIR="$REPO_ROOT/dist"
PANEL_DIR="${PTERODACTYL_DIRECTORY:-/var/www/pterodactyl}"
DIALOG=""

use_tui() {
    if command -v whiptail >/dev/null 2>&1; then
        DIALOG="whiptail"
        return 0
    fi
    if command -v dialog >/dev/null 2>&1; then
        DIALOG="dialog"
        return 0
    fi
    return 1
}

# ---------- Pré-checagens ---------------------------------------------------
require_root() {
    if [[ $EUID -ne 0 ]]; then
        warn "Este script normalmente precisa de sudo para acessar $PANEL_DIR."
        warn "Continuando mesmo assim; comandos podem falhar sem permissão."
    fi
}

detect_panel() {
    if [[ ! -d "$PANEL_DIR" ]]; then
        err "Diretório do painel não encontrado: $PANEL_DIR"
        err "Defina PTERODACTYL_DIRECTORY se o painel estiver em outro lugar."
        exit 1
    fi
    if [[ ! -f "$PANEL_DIR/artisan" ]]; then
        err "Não parece ser um painel Pterodactyl (artisan não encontrado em $PANEL_DIR)."
        exit 1
    fi
}

detect_blueprint() {
    if ! command -v blueprint >/dev/null 2>&1; then
        err "O CLI 'blueprint' não foi encontrado no PATH."
        err "Instale o Blueprint framework em: https://blueprint.zip"
        exit 1
    fi
}

# ---------- Detecta addons disponíveis -------------------------------------
list_addons() {
    local addons=()
    if [[ ! -d "$ADDONS_DIR" ]]; then return; fi
    for dir in "$ADDONS_DIR"/*/; do
        [[ -d "$dir" ]] || continue
        [[ -f "$dir/conf.yml" ]] || continue
        local identifier name description version
        identifier="$(grep -E '^\s*identifier:' "$dir/conf.yml" | head -n1 | sed -E "s/.*identifier:\s*['\"]?([^'\"]+)['\"]?.*/\1/")"
        name="$(grep -E '^\s*name:'         "$dir/conf.yml" | head -n1 | sed -E "s/.*name:\s*['\"]?([^'\"]+)['\"]?.*/\1/")"
        description="$(grep -E '^\s*description:' "$dir/conf.yml" | head -n1 | sed -E "s/.*description:\s*['\"]?([^'\"]+)['\"]?.*/\1/")"
        version="$(grep -E '^\s*version:'    "$dir/conf.yml" | head -n1 | sed -E "s/.*version:\s*['\"]?([^'\"]+)['\"]?.*/\1/")"
        [[ -z "$identifier" ]] && continue
        addons+=("$identifier|$name|$version|$description|$dir")
    done
    printf '%s\n' "${addons[@]}"
}

installed_extensions() {
    local db="$PANEL_DIR/.blueprint/extensions/blueprint/private/db/installed_extensions"
    [[ -f "$db" ]] || return
    tr ',' '\n' < "$db" | sed '/^\s*$/d'
}

is_installed() {
    local ident="$1"
    installed_extensions | grep -qx "$ident"
}

# ---------- Build de um .blueprint -----------------------------------------
build_blueprint() {
    local dir="$1"
    local identifier="$2"
    mkdir -p "$DIST_DIR"
    local target="$DIST_DIR/${identifier}.blueprint"
    log "Empacotando ${identifier} → $(basename "$target")"
    (cd "$dir" && zip -qr "$target" . -x '.git/*' '.dist/*' '*.DS_Store')
    ok "Pacote pronto: $target"
    echo "$target"
}

# ---------- Ações -----------------------------------------------------------
install_addon() {
    local identifier="$1"
    local dir="$2"
    banner
    hr
    log "Instalando extensão: ${C_BOLD}${identifier}${C_RESET}"
    hr
    local pkg
    pkg="$(build_blueprint "$dir" "$identifier" | tail -n1)"
    log "Copiando pacote para $PANEL_DIR"
    cp -f "$pkg" "$PANEL_DIR/"
    (cd "$PANEL_DIR" && blueprint -install "$identifier")
    local status=$?
    if [[ $status -eq 0 ]]; then
        ok "$identifier instalado com sucesso."
    else
        err "blueprint -install retornou código $status."
    fi
    pause_key
}

remove_addon() {
    local identifier="$1"
    banner
    hr
    log "Removendo extensão: ${C_BOLD}${identifier}${C_RESET}"
    hr
    (cd "$PANEL_DIR" && blueprint -remove "$identifier")
    local status=$?
    if [[ $status -eq 0 ]]; then
        ok "$identifier removido."
    else
        err "blueprint -remove retornou código $status."
    fi
    pause_key
}

show_info() {
    banner
    hr
    printf " %sInformações do ambiente%s\n" "$C_BOLD" "$C_RESET"
    hr
    printf "  Painel:      %s\n" "$PANEL_DIR"
    printf "  Blueprint:   %s\n" "$(blueprint -version 2>/dev/null || echo 'não detectado')"
    printf "  Repo:        %s\n" "$REPO_ROOT"
    printf "  Extensões instaladas:\n"
    if installed_extensions | grep -q .; then
        installed_extensions | sed 's/^/    • /'
    else
        printf "    (nenhuma)\n"
    fi
    hr
    pause_key
}

pause_key() {
    printf "\n%sPressione ENTER para voltar…%s" "$C_GRAY" "$C_RESET"
    read -r _
}

# ---------- Menu TUI (whiptail/dialog) -------------------------------------
tui_menu() {
    local addons_raw
    addons_raw="$(list_addons)"
    if [[ -z "$addons_raw" ]]; then
        $DIALOG --title "BluePrint Store" --msgbox "Nenhum addon detectado em $ADDONS_DIR" 10 60
        return
    fi

    while true; do
        local menu_items=()
        while IFS='|' read -r ident name version desc dir; do
            [[ -z "$ident" ]] && continue
            local flag="✗"
            is_installed "$ident" && flag="✓"
            menu_items+=("$ident" "[$flag] $name — v$version")
        done <<< "$addons_raw"

        local choice
        choice=$($DIALOG --title "BluePrint Store — Addons" \
            --menu "Selecione uma extensão para gerenciar" 20 78 12 \
            "${menu_items[@]}" \
            "__info" "Ver informações do ambiente" \
            "__quit" "Sair" \
            3>&1 1>&2 2>&3) || return 0

        case "$choice" in
            __quit) return 0 ;;
            __info) show_info ;;
            *)
                local row addon_name addon_version addon_desc addon_dir
                row="$(echo "$addons_raw" | awk -F'|' -v k="$choice" '$1==k {print; exit}')"
                addon_name="$(echo "$row" | cut -d'|' -f2)"
                addon_version="$(echo "$row" | cut -d'|' -f3)"
                addon_desc="$(echo "$row" | cut -d'|' -f4)"
                addon_dir="$(echo "$row" | cut -d'|' -f5)"

                local action
                if is_installed "$choice"; then
                    action=$($DIALOG --title "$addon_name" \
                        --menu "$addon_desc\n\nStatus: INSTALADO (v$addon_version)" 16 72 6 \
                        "reinstall" "Reinstalar / atualizar" \
                        "remove"    "Remover" \
                        "back"      "Voltar" \
                        3>&1 1>&2 2>&3) || continue
                else
                    action=$($DIALOG --title "$addon_name" \
                        --menu "$addon_desc\n\nStatus: NÃO INSTALADO" 16 72 5 \
                        "install" "Instalar" \
                        "back"    "Voltar" \
                        3>&1 1>&2 2>&3) || continue
                fi

                case "$action" in
                    install|reinstall) install_addon "$choice" "$addon_dir" ;;
                    remove)            remove_addon  "$choice" ;;
                esac
                ;;
        esac
    done
}

# ---------- Menu texto puro (fallback) -------------------------------------
plain_menu() {
    local addons_raw
    addons_raw="$(list_addons)"
    if [[ -z "$addons_raw" ]]; then
        err "Nenhum addon em $ADDONS_DIR"
        exit 1
    fi

    while true; do
        banner
        hr
        printf " %sExtensões disponíveis%s\n" "$C_BOLD" "$C_RESET"
        hr
        local i=1
        local -a idents=() dirs=()
        while IFS='|' read -r ident name version desc dir; do
            [[ -z "$ident" ]] && continue
            local flag_color="$C_RED" flag="✗ não instalado"
            if is_installed "$ident"; then flag_color="$C_GREEN"; flag="✓ instalado"; fi
            printf "  %s%2d)%s %s%-24s%s %sv%-8s%s %s%s%s\n" \
                "$C_BOLD" "$i" "$C_RESET" \
                "$C_MAGENTA" "$name" "$C_RESET" \
                "$C_GRAY" "$version" "$C_RESET" \
                "$flag_color" "$flag" "$C_RESET"
            printf "        %s%s%s\n" "$C_GRAY" "$desc" "$C_RESET"
            idents+=("$ident"); dirs+=("$dir")
            i=$((i+1))
        done <<< "$addons_raw"
        hr
        printf "  %si)%s Info do ambiente     %sq)%s Sair\n" "$C_BOLD" "$C_RESET" "$C_BOLD" "$C_RESET"
        hr
        printf "\n Escolha uma opção: "
        local choice; read -r choice
        case "$choice" in
            q|Q) exit 0 ;;
            i|I) show_info ;;
            ''|*[!0-9]*) warn "Opção inválida."; sleep 1 ;;
            *)
                local idx=$((choice-1))
                if (( idx < 0 || idx >= ${#idents[@]} )); then
                    warn "Índice fora do intervalo."; sleep 1; continue
                fi
                local ident="${idents[$idx]}" dir="${dirs[$idx]}"
                printf "\n"
                if is_installed "$ident"; then
                    printf " Ação: [%s1)%s Reinstalar/Atualizar]  [%s2)%s Remover]  [%s3)%s Voltar]: " \
                        "$C_BOLD" "$C_RESET" "$C_BOLD" "$C_RESET" "$C_BOLD" "$C_RESET"
                    local a; read -r a
                    case "$a" in
                        1) install_addon "$ident" "$dir" ;;
                        2) remove_addon  "$ident" ;;
                        *) ;;
                    esac
                else
                    printf " Ação: [%s1)%s Instalar]  [%s2)%s Voltar]: " \
                        "$C_BOLD" "$C_RESET" "$C_BOLD" "$C_RESET"
                    local a; read -r a
                    case "$a" in
                        1) install_addon "$ident" "$dir" ;;
                        *) ;;
                    esac
                fi
                ;;
        esac
    done
}

# ---------- CLI -------------------------------------------------------------
usage() {
    cat <<EOF
Uso: $0 [comando]

Comandos:
  (sem args)        Abre menu interativo
  list              Lista addons disponíveis neste repositório
  status            Mostra addons instalados no painel
  install <id>      Instala/atualiza um addon pelo identifier
  remove <id>       Remove um addon pelo identifier
  build <id>        Só empacota o .blueprint em ./dist/
  info              Mostra informações do ambiente

Variáveis:
  PTERODACTYL_DIRECTORY  Path do painel (default: /var/www/pterodactyl)
EOF
}

main() {
    if [[ ${1:-} == "-h" || ${1:-} == "--help" ]]; then usage; exit 0; fi

    if [[ ${1:-} == "list" ]]; then
        list_addons | awk -F'|' '{printf "  %-24s v%-8s %s\n", $1, $3, $4}'
        exit 0
    fi

    require_root

    if [[ ${1:-} == "build" ]]; then
        detect_panel_soft() { :; } # sem exigir painel para só empacotar
        local id="${2:-}"; [[ -z "$id" ]] && { err "Uso: $0 build <identifier>"; exit 1; }
        local dir="$ADDONS_DIR/$id"
        [[ -d "$dir" ]] || { err "Addon '$id' não encontrado em $ADDONS_DIR"; exit 1; }
        build_blueprint "$dir" "$id"
        exit $?
    fi

    detect_panel
    detect_blueprint

    case "${1:-}" in
        ""|menu)
            if use_tui; then tui_menu; else plain_menu; fi
            ;;
        status)
            log "Extensões instaladas:"; installed_extensions | sed 's/^/  • /'
            ;;
        info) show_info ;;
        install)
            local id="${2:-}"; [[ -z "$id" ]] && { err "Uso: $0 install <identifier>"; exit 1; }
            local dir="$ADDONS_DIR/$id"
            [[ -d "$dir" ]] || { err "Addon '$id' não encontrado"; exit 1; }
            install_addon "$id" "$dir"
            ;;
        remove)
            local id="${2:-}"; [[ -z "$id" ]] && { err "Uso: $0 remove <identifier>"; exit 1; }
            remove_addon "$id"
            ;;
        *) usage; exit 1 ;;
    esac
}

main "$@"
