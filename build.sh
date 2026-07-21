#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# build.sh — Empacota a extensão em um arquivo .blueprint
#
# O arquivo .blueprint nada mais é do que um ZIP com a estrutura da extensão.
# Execute este script no diretório raiz do projeto para gerar o pacote pronto
# para distribuição ou instalação via Blueprint CLI.
#
# Uso: bash build.sh
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; RESET='\033[0m'; BOLD='\033[1m'

EXTENSION_ID="mcproperties"
OUTPUT_FILE="${EXTENSION_ID}.blueprint"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ok()   { echo -e "${GREEN}✓${RESET} $1"; }
step() { echo -e "${CYAN}›${RESET} $1"; }
fail() { echo -e "${RED}✗${RESET} $1"; exit 1; }

echo ""
echo -e "${BOLD}  MC Properties Manager — Build Script${RESET}"
echo -e "${CYAN}  ─────────────────────────────────────────${RESET}"
echo ""

cd "$SCRIPT_DIR"

# ── Validate required files ──────────────────────────────────────────────────
REQUIRED=(
    "conf.yml"
    "icon.svg"
    "admin/view.blade.php"
    "admin/controller.php"
    "dashboard/components/Components.yml"
    "dashboard/components/McPropertiesManager.tsx"
)

step "Verificando arquivos obrigatórios..."
for f in "${REQUIRED[@]}"; do
    if [[ ! -f "$SCRIPT_DIR/$f" ]]; then
        fail "Arquivo obrigatório não encontrado: $f"
    fi
done
ok "Todos os arquivos obrigatórios presentes."

# ── Ensure zip is available ──────────────────────────────────────────────────
if ! command -v zip &>/dev/null; then
    step "Instalando zip..."
    apt-get install -y zip &>/dev/null || yum install -y zip &>/dev/null || fail "Não foi possível instalar 'zip'. Instale manualmente."
fi

# ── Create the .blueprint package (ZIP) ─────────────────────────────────────
step "Empacotando extensão em ${BOLD}${OUTPUT_FILE}${RESET}..."

rm -f "$SCRIPT_DIR/$OUTPUT_FILE"

zip -r "$SCRIPT_DIR/$OUTPUT_FILE" \
    conf.yml \
    icon.svg \
    admin/ \
    dashboard/ \
    data/ \
    -x "*.DS_Store" -x "*__pycache__*" -x "*.git*" \
    2>/dev/null

ok "Arquivo gerado: ${BOLD}${SCRIPT_DIR}/${OUTPUT_FILE}${RESET}"

# ── Show file info ────────────────────────────────────────────────────────────
echo ""
FILE_SIZE=$(du -sh "$OUTPUT_FILE" | cut -f1)
FILE_COUNT=$(unzip -l "$OUTPUT_FILE" | tail -1 | awk '{print $2}')

echo -e "${CYAN}  ┌─────────────────────────────────────┐${RESET}"
echo -e "${CYAN}  │${RESET}  Pacote:   ${BOLD}${OUTPUT_FILE}${RESET}"
echo -e "${CYAN}  │${RESET}  Tamanho:  ${BOLD}${FILE_SIZE}${RESET}"
echo -e "${CYAN}  │${RESET}  Arquivos: ${BOLD}${FILE_COUNT}${RESET}"
echo -e "${CYAN}  └─────────────────────────────────────┘${RESET}"
echo ""

echo -e "${YELLOW}  Próximo passo — instalar no painel:${RESET}"
echo -e "  ${BOLD}cp ${OUTPUT_FILE} /var/www/pterodactyl/${RESET}"
echo -e "  ${BOLD}cd /var/www/pterodactyl && blueprint -install ${EXTENSION_ID}${RESET}"
echo ""
echo -e "  ${GREEN}Ou execute: ${BOLD}bash install.sh${RESET}"
echo ""
