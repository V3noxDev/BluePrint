#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PANEL_DIR="${PTERODACTYL_DIRECTORY:-/var/www/pterodactyl}"
ACTION=""
ASSUME_YES=false

green='\033[1;32m'
cyan='\033[1;36m'
yellow='\033[1;33m'
red='\033[1;31m'
reset='\033[0m'

usage() {
    cat <<'EOF'
CraftProperties — instalador Blueprint

Uso:
  ./installer.sh                    Abre o menu interativo
  ./installer.sh --install          Instala ou atualiza
  ./installer.sh --remove           Remove a extensão
  ./installer.sh --status           Mostra o estado atual
  ./installer.sh --package          Gera dist/craftproperties.blueprint

Opções:
  --panel <diretório>               Padrão: /var/www/pterodactyl
  --yes                             Não pedir confirmação na remoção
  --help                            Exibe esta ajuda
EOF
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --install|--remove|--status|--package)
            ACTION="${1#--}"
            shift
            ;;
        --panel)
            if [[ $# -lt 2 ]]; then
                printf '%bErro: --panel exige um diretório.%b\n' "$red" "$reset" >&2
                exit 2
            fi
            PANEL_DIR="$2"
            shift 2
            ;;
        --yes)
            ASSUME_YES=true
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            printf '%bOpção desconhecida: %s%b\n' "$red" "$1" "$reset" >&2
            usage
            exit 2
            ;;
    esac
done

banner() {
    printf '\n%b╭──────────────────────────────────────────╮%b\n' "$cyan" "$reset"
    printf '%b│  CraftProperties · Blueprint Installer  │%b\n' "$cyan" "$reset"
    printf '%b╰──────────────────────────────────────────╯%b\n' "$cyan" "$reset"
    printf 'Painel: %s\n\n' "$PANEL_DIR"
}

require_panel() {
    if [[ ! -d "$PANEL_DIR" ]]; then
        printf '%bErro: diretório do Pterodactyl não encontrado: %s%b\n' "$red" "$PANEL_DIR" "$reset" >&2
        printf 'Use: %s --panel /caminho/do/pterodactyl\n' "$0" >&2
        exit 1
    fi

    if [[ ! -f "$PANEL_DIR/.blueprintrc" ]]; then
        printf '%bErro: Blueprint não parece configurado em %s.%b\n' "$red" "$PANEL_DIR" "$reset" >&2
        printf 'Instale o Blueprint beta-2026-06 ou mais recente antes de continuar.\n' >&2
        exit 1
    fi
}

run_blueprint() {
    if command -v blueprint >/dev/null 2>&1; then
        (cd "$PANEL_DIR" && blueprint "$@")
        return
    fi

    if [[ -f "$PANEL_DIR/blueprint.sh" ]]; then
        (cd "$PANEL_DIR" && bash ./blueprint.sh "$@")
        return
    fi

    printf '%bErro: comando Blueprint não encontrado.%b\n' "$red" "$reset" >&2
    exit 1
}

package_extension() {
    printf '%bGerando pacote da extensão...%b\n' "$cyan" "$reset"
    bash "$ROOT/scripts/package.sh"
}

install_extension() {
    require_panel

    local artifact="$ROOT/dist/craftproperties.blueprint"
    if [[ ! -f "$artifact" ]]; then
        package_extension
    fi

    printf '%bCopiando pacote para o painel...%b\n' "$cyan" "$reset"
    cp "$artifact" "$PANEL_DIR/craftproperties.blueprint"

    printf '%bInstalando ou atualizando CraftProperties...%b\n' "$cyan" "$reset"
    run_blueprint -install craftproperties
    printf '%bCraftProperties instalado com sucesso.%b\n' "$green" "$reset"
    printf 'Associe a rota /properties aos eggs de Minecraft em Admin → Extensions.\n'
}

remove_extension() {
    require_panel

    if [[ ! -d "$PANEL_DIR/.blueprint/extensions/craftproperties" ]]; then
        printf '%bCraftProperties não está instalado neste painel.%b\n' "$yellow" "$reset"
        return
    fi

    if [[ "$ASSUME_YES" != true ]]; then
        read -r -p 'Remover a extensão? Seus server.properties e backups serão mantidos. [s/N] ' answer
        if [[ ! "$answer" =~ ^[sSyY]$ ]]; then
            printf 'Operação cancelada.\n'
            return
        fi
    fi

    run_blueprint -remove craftproperties
    printf '%bExtensão removida. Arquivos dos servidores foram preservados.%b\n' "$green" "$reset"
}

show_status() {
    require_panel

    if [[ -d "$PANEL_DIR/.blueprint/extensions/craftproperties" ]]; then
        printf '%b● Instalado%b\n' "$green" "$reset"
        if [[ -f "$PANEL_DIR/.blueprint/extensions/craftproperties/conf.yml" ]]; then
            awk '/^[[:space:]]*version:/ { gsub(/["'\'' ]/, "", $2); print "Versão: " $2; exit }' \
                "$PANEL_DIR/.blueprint/extensions/craftproperties/conf.yml"
        fi
    else
        printf '%b○ Não instalado%b\n' "$yellow" "$reset"
    fi

    if [[ -f "$ROOT/dist/craftproperties.blueprint" ]]; then
        printf 'Pacote local: %s\n' "$ROOT/dist/craftproperties.blueprint"
    else
        printf 'Pacote local: ainda não gerado\n'
    fi
}

run_action() {
    case "$1" in
        install) install_extension ;;
        remove) remove_extension ;;
        status) show_status ;;
        package) package_extension ;;
        *) return 1 ;;
    esac
}

banner

if [[ -n "$ACTION" ]]; then
    run_action "$ACTION"
    exit 0
fi

while true; do
    printf '%b1)%b Instalar ou atualizar\n' "$green" "$reset"
    printf '%b2)%b Remover\n' "$red" "$reset"
    printf '%b3)%b Verificar status\n' "$cyan" "$reset"
    printf '%b4)%b Gerar pacote .blueprint\n' "$yellow" "$reset"
    printf '0) Sair\n\n'
    read -r -p 'Selecione uma opção: ' choice
    printf '\n'

    case "$choice" in
        1) install_extension ;;
        2) remove_extension ;;
        3) show_status ;;
        4) package_extension ;;
        0) printf 'Até mais.\n'; exit 0 ;;
        *) printf '%bSeleção inválida.%b\n' "$yellow" "$reset" ;;
    esac
    printf '\n'
done
