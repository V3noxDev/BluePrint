#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║         MC Properties Manager — Blueprint Extension Auto-Installer          ║
# ║              Pterodactyl Panel · Blueprint Framework · v1.0.0               ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
#
# Usage:  bash install.sh
# Requires: Blueprint already installed on Pterodactyl, root/sudo access.

set -euo pipefail

# ── Colors & Styles ──────────────────────────────────────────────────────────
RED='\033[0;31m';    LRED='\033[1;31m'
GREEN='\033[0;32m';  LGREEN='\033[1;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m';   LBLUE='\033[1;34m'
PURPLE='\033[0;35m'; LPURPLE='\033[1;35m'
CYAN='\033[0;36m';   LCYAN='\033[1;36m'
WHITE='\033[1;37m';  GRAY='\033[0;37m'
BOLD='\033[1m';      DIM='\033[2m';  ITALIC='\033[3m'
RESET='\033[0m'

# ── Constants ────────────────────────────────────────────────────────────────
EXTENSION_ID="mcproperties"
EXTENSION_NAME="MC Properties Manager"
EXTENSION_VERSION="1.0.0"
BLUEPRINT_FILE="${EXTENSION_ID}.blueprint"
PTERO_DIR="/var/www/pterodactyl"
LOG_FILE="/tmp/${EXTENSION_ID}-installer.log"

# ── Helpers ──────────────────────────────────────────────────────────────────
banner() {
    clear
    echo -e "${BOLD}"
    echo -e "${GREEN}  ███╗   ███╗ ██████╗    ██████╗ ██████╗  ██████╗ ██████╗ ███████╗"
    echo -e "${GREEN}  ████╗ ████║██╔════╝    ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██╔════╝"
    echo -e "${LGREEN}  ██╔████╔██║██║         ██████╔╝██████╔╝██║   ██║██████╔╝███████╗"
    echo -e "${LGREEN}  ██║╚██╔╝██║██║         ██╔═══╝ ██╔══██╗██║   ██║██╔═══╝ ╚════██║"
    echo -e "${CYAN}  ██║ ╚═╝ ██║╚██████╗    ██║     ██║  ██║╚██████╔╝██║     ███████║"
    echo -e "${CYAN}  ╚═╝     ╚═╝ ╚═════╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚══════╝"
    echo -e "${RESET}"
    echo -e "${DIM}${GRAY}                 ┌──────────────────────────────────────┐${RESET}"
    echo -e "${DIM}${GRAY}                 │  ${WHITE}MC Properties Manager${GRAY} · ${CYAN}Blueprint${GRAY}   │${RESET}"
    echo -e "${DIM}${GRAY}                 │  ${GRAY}v${EXTENSION_VERSION} · Pterodactyl Panel Extension  │${RESET}"
    echo -e "${DIM}${GRAY}                 └──────────────────────────────────────┘${RESET}"
    echo ""
}

section() { echo -e "\n${BOLD}${LBLUE}══ ${WHITE}$1${LBLUE} ══${RESET}"; }
step()    { echo -e "  ${CYAN}›${RESET} $1"; }
ok()      { echo -e "  ${GREEN}✓${RESET} ${LGREEN}$1${RESET}"; }
warn()    { echo -e "  ${YELLOW}⚠${RESET}  $1"; }
fail()    { echo -e "  ${LRED}✗${RESET} ${RED}$1${RESET}"; }
info()    { echo -e "  ${LBLUE}ℹ${RESET} ${GRAY}$1${RESET}"; }
hr()      { echo -e "${DIM}${GRAY}  ─────────────────────────────────────────────────${RESET}"; }

pause()   { echo -e "\n  ${DIM}Pressione ${WHITE}[Enter]${DIM} para continuar...${RESET}"; read -r _; }

log()     { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"; }

require_root() {
    if [[ "$EUID" -ne 0 ]]; then
        fail "Este script precisa ser executado como root."
        info "Use: ${BOLD}sudo bash install.sh${RESET}"
        exit 1
    fi
}

check_ptero_dir() {
    if [[ ! -d "$PTERO_DIR" ]]; then
        fail "Diretório do Pterodactyl não encontrado em: ${BOLD}$PTERO_DIR${RESET}"
        info "Se o seu painel está em outro caminho, edite a variável PTERO_DIR neste script."
        exit 1
    fi
}

check_blueprint() {
    if ! command -v blueprint &>/dev/null; then
        fail "Blueprint não encontrado no PATH."
        info "Instale o Blueprint antes de continuar: ${ITALIC}https://blueprint.zip/docs${RESET}"
        exit 1
    fi
    local bp_version
    bp_version=$(blueprint -v 2>/dev/null || echo "desconhecida")
    ok "Blueprint detectado (versão: ${BOLD}$bp_version${RESET})"
}

find_blueprint_file() {
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    # Search: next to install.sh, then current dir, then /tmp
    for loc in "$script_dir/$BLUEPRINT_FILE" "$(pwd)/$BLUEPRINT_FILE" "/tmp/$BLUEPRINT_FILE"; do
        if [[ -f "$loc" ]]; then
            echo "$loc"
            return 0
        fi
    done
    echo ""
}

# ── Install ──────────────────────────────────────────────────────────────────
do_install() {
    section "Instalação de Extensão"

    local bp_file
    bp_file=$(find_blueprint_file)

    if [[ -z "$bp_file" ]]; then
        warn "Arquivo ${BOLD}${BLUEPRINT_FILE}${RESET} não encontrado automaticamente."
        echo ""
        echo -e "  ${GRAY}Informe o caminho completo para o arquivo ${BOLD}.blueprint${RESET}${GRAY}:${RESET}"
        echo -e "  ${DIM}(ex: /home/user/mcproperties.blueprint)${RESET}"
        echo -ne "  ${CYAN}›${RESET} "
        read -r bp_file
        if [[ ! -f "$bp_file" ]]; then
            fail "Arquivo não encontrado: $bp_file"
            pause; return 1
        fi
    fi

    ok "Arquivo encontrado: ${BOLD}$bp_file${RESET}"
    hr

    # Check if already installed
    if blueprint -list 2>/dev/null | grep -q "^${EXTENSION_ID}$"; then
        warn "A extensão ${BOLD}${EXTENSION_NAME}${RESET} já está instalada."
        echo ""
        echo -e "  Deseja reinstalar? ${BOLD}[s/N]${RESET} "
        read -r -n1 confirm
        echo ""
        [[ "$confirm" =~ ^[sS]$ ]] || { info "Instalação cancelada."; pause; return 0; }

        step "Removendo versão anterior..."
        cd "$PTERO_DIR" || exit 1
        blueprint -remove "$EXTENSION_ID" >>"$LOG_FILE" 2>&1 && ok "Versão anterior removida." || warn "Não foi possível remover versão anterior. Continuando..."
    fi

    step "Copiando ${BOLD}${BLUEPRINT_FILE}${RESET} para ${BOLD}${PTERO_DIR}${RESET}..."
    cp "$bp_file" "${PTERO_DIR}/${BLUEPRINT_FILE}" || { fail "Erro ao copiar arquivo."; pause; return 1; }
    ok "Arquivo copiado."

    step "Executando Blueprint installer..."
    echo ""
    cd "$PTERO_DIR" || exit 1

    if blueprint -install "$EXTENSION_ID" 2>&1 | tee -a "$LOG_FILE" | grep -E "success|error|Error|warning" --color=never; then
        echo ""
        ok "Extensão instalada com sucesso! 🎉"
    else
        # Blueprint might have succeeded even if grep found nothing — check list
        if blueprint -list 2>/dev/null | grep -q "^${EXTENSION_ID}$"; then
            echo ""
            ok "Extensão instalada com sucesso! 🎉"
        else
            fail "A instalação pode ter falhado. Verifique os logs em: $LOG_FILE"
        fi
    fi

    hr
    section "Próximos Passos"
    info "1. Abra o painel Pterodactyl como admin"
    info "2. Vá em ${BOLD}Admin > Extensions${RESET} e confirme que ${BOLD}MC Properties Manager${RESET} aparece como ativo"
    info "3. Acesse qualquer servidor Minecraft Java"
    info "4. Clique na nova aba ${BOLD}\"Properties\"${RESET} no menu do servidor"
    echo ""
    pause
}

# ── Remove ───────────────────────────────────────────────────────────────────
do_remove() {
    section "Remoção de Extensão"

    # Check if installed
    if ! blueprint -list 2>/dev/null | grep -q "^${EXTENSION_ID}$"; then
        warn "${BOLD}${EXTENSION_NAME}${RESET} não está instalada ou não foi encontrada."
        pause; return 0
    fi

    warn "Você está prestes a remover a extensão ${BOLD}${EXTENSION_NAME}${RESET}."
    echo -e "  ${GRAY}Isso removerá a aba 'Properties' de todos os servidores.${RESET}"
    echo ""
    echo -ne "  ${RED}Confirmar remoção? ${BOLD}[s/N]${RESET} "
    read -r -n1 confirm
    echo ""
    [[ "$confirm" =~ ^[sS]$ ]] || { info "Remoção cancelada."; pause; return 0; }

    step "Removendo ${BOLD}${EXTENSION_NAME}${RESET}..."
    cd "$PTERO_DIR" || exit 1

    if blueprint -remove "$EXTENSION_ID" 2>&1 | tee -a "$LOG_FILE"; then
        ok "Extensão removida com sucesso."
    else
        fail "Erro durante a remoção. Verifique: $LOG_FILE"
    fi

    pause
}

# ── Status ───────────────────────────────────────────────────────────────────
do_status() {
    section "Status da Extensão"

    check_ptero_dir
    check_blueprint

    echo ""
    if blueprint -list 2>/dev/null | grep -q "^${EXTENSION_ID}$"; then
        echo -e "  Status:    ${LGREEN}${BOLD}● INSTALADA${RESET}"
    else
        echo -e "  Status:    ${GRAY}○ não instalada${RESET}"
    fi

    echo -e "  ID:        ${BOLD}${EXTENSION_ID}${RESET}"
    echo -e "  Nome:      ${BOLD}${EXTENSION_NAME}${RESET}"
    echo -e "  Versão:    ${BOLD}${EXTENSION_VERSION}${RESET}"
    echo -e "  Ptero dir: ${BOLD}${PTERO_DIR}${RESET}"

    local bp_ver
    bp_ver=$(blueprint -v 2>/dev/null || echo "desconhecida")
    echo -e "  Blueprint: ${BOLD}${bp_ver}${RESET}"

    echo ""
    hr
    info "Log do instalador: ${BOLD}$LOG_FILE${RESET}"

    pause
}

# ── Repair / Rebuild ──────────────────────────────────────────────────────────
do_repair() {
    section "Reparar / Reconstruir Frontend"

    warn "Esta opção reconstrói o frontend do Pterodactyl (pode demorar)."
    echo -ne "  Confirmar? ${BOLD}[s/N]${RESET} "
    read -r -n1 confirm
    echo ""
    [[ "$confirm" =~ ^[sS]$ ]] || { info "Cancelado."; pause; return 0; }

    step "Reconstruindo frontend..."
    cd "$PTERO_DIR" || exit 1

    if blueprint -build 2>&1 | tee -a "$LOG_FILE"; then
        ok "Frontend reconstruído com sucesso."
    else
        fail "Erro na reconstrução. Verifique: $LOG_FILE"
    fi

    pause
}

# ── Main Menu ─────────────────────────────────────────────────────────────────
main_menu() {
    while true; do
        banner

        echo -e "${BOLD}${WHITE}  Selecione uma opção:${RESET}"
        echo ""
        echo -e "  ${LGREEN}[1]${RESET}  ${BOLD}Instalar${RESET}  ${DIM}— instala ou reinstala a extensão${RESET}"
        echo -e "  ${LRED}[2]${RESET}  ${BOLD}Remover${RESET}   ${DIM}— remove a extensão do painel${RESET}"
        echo -e "  ${LCYAN}[3]${RESET}  ${BOLD}Status${RESET}    ${DIM}— verifica se a extensão está instalada${RESET}"
        echo -e "  ${LPURPLE}[4]${RESET}  ${BOLD}Reparar${RESET}   ${DIM}— reconstrói o frontend do Pterodactyl${RESET}"
        echo -e "  ${GRAY}[0]${RESET}  ${BOLD}Sair${RESET}"
        echo ""
        hr
        echo -ne "  ${CYAN}›${RESET} Opção: "
        read -r -n1 choice
        echo ""

        case "$choice" in
            1) require_root; check_ptero_dir; check_blueprint; do_install  ;;
            2) require_root; check_ptero_dir; check_blueprint; do_remove   ;;
            3)                                                  do_status   ;;
            4) require_root; check_ptero_dir; check_blueprint; do_repair   ;;
            0) echo -e "\n  ${GRAY}Saindo...${RESET}\n"; exit 0 ;;
            *) warn "Opção inválida. Tente novamente." ;;
        esac
    done
}

# ── Entry Point ───────────────────────────────────────────────────────────────
: > "$LOG_FILE"   # truncate/create log file
log "Installer started (user=$(whoami), args=$*)"

# Non-interactive mode: pass argument directly
case "${1:-}" in
    install|--install|-i) require_root; check_ptero_dir; check_blueprint; do_install; exit 0 ;;
    remove|--remove|-r)   require_root; check_ptero_dir; check_blueprint; do_remove;  exit 0 ;;
    status|--status|-s)                                                    do_status;  exit 0 ;;
    *)                    main_menu ;;
esac
