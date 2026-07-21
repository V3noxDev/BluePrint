#!/usr/bin/env bash
#
# ─────────────────────────────────────────────────────────────────────────────
#  MC Properties — Auto Installer
#  Addon Blueprint para Pterodactyl: editor visual do server.properties
#
#  Uso:
#    bash installer.sh                  # menu interativo
#    bash installer.sh install         # instala/atualiza direto
#    bash installer.sh remove          # remove direto
#    bash installer.sh status          # mostra o status
#
#  Variáveis opcionais:
#    PTERO_DIR=/var/www/pterodactyl    # diretório do painel
# ─────────────────────────────────────────────────────────────────────────────

set -o pipefail

ADDON_ID="mcproperties"
ADDON_NAME="MC Properties"
REPO="V3noxDev/BluePrint"
REPO_BRANCH="main"
PTERO_DIR="${PTERO_DIR:-/var/www/pterodactyl}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]:-$0}")" &>/dev/null && pwd)"

# ── Cores ────────────────────────────────────────────────────────────────────
if [[ -t 1 ]]; then
  C_RESET=$'\033[0m';  C_BOLD=$'\033[1m';   C_DIM=$'\033[2m'
  C_GREEN=$'\033[38;5;42m'; C_RED=$'\033[38;5;203m'; C_YELLOW=$'\033[38;5;220m'
  C_CYAN=$'\033[38;5;51m';  C_GRAY=$'\033[38;5;245m'
else
  C_RESET=""; C_BOLD=""; C_DIM=""; C_GREEN=""; C_RED=""; C_YELLOW=""; C_CYAN=""; C_GRAY=""
fi

ok()    { echo -e "  ${C_GREEN}✔${C_RESET} $*"; }
err()   { echo -e "  ${C_RED}✘${C_RESET} $*"; }
warn()  { echo -e "  ${C_YELLOW}⚠${C_RESET} $*"; }
info()  { echo -e "  ${C_CYAN}➜${C_RESET} $*"; }
line()  { echo -e "${C_GRAY}  ────────────────────────────────────────────────────────────${C_RESET}"; }

banner() {
  clear 2>/dev/null || true
  echo -e "${C_GREEN}${C_BOLD}"
  cat <<'EOF'
   __  __  ____   ____                            _   _
  |  \/  |/ ___| |  _ \ _ __ ___  _ __   ___ _ __| |_(_) ___  ___
  | |\/| | |     | |_) | '__/ _ \| '_ \ / _ \ '__| __| |/ _ \/ __|
  | |  | | |___  |  __/| | | (_) | |_) |  __/ |  | |_| |  __/\__ \
  |_|  |_|\____| |_|   |_|  \___/| .__/ \___|_|   \__|_|\___||___/
                                 |_|
EOF
  echo -e "${C_RESET}"
  echo -e "  ${C_BOLD}Editor visual do server.properties para Pterodactyl${C_RESET}"
  echo -e "  ${C_GRAY}Blueprint Framework • by V3noxDev${C_RESET}"
  echo ""
}

require_root() {
  if [[ "$(id -u)" -ne 0 ]]; then
    err "Este instalador precisa ser executado como ${C_BOLD}root${C_RESET} (ou com sudo)."
    exit 1
  fi
}

# ── Checagens ────────────────────────────────────────────────────────────────
panel_exists()     { [[ -f "${PTERO_DIR}/artisan" ]]; }
blueprint_exists() { [[ -f "${PTERO_DIR}/blueprint.sh" ]] || command -v blueprint &>/dev/null; }

blueprint_cmd() {
  if command -v blueprint &>/dev/null; then
    (cd "${PTERO_DIR}" && blueprint "$@")
  else
    (cd "${PTERO_DIR}" && bash blueprint.sh "$@")
  fi
}

addon_installed() {
  [[ -d "${PTERO_DIR}/.blueprint/extensions/${ADDON_ID}" ]]
}

detect_panel() {
  if panel_exists; then return 0; fi
  warn "Painel não encontrado em ${C_BOLD}${PTERO_DIR}${C_RESET}."
  read -rp "  Informe o diretório do Pterodactyl: " answer
  [[ -n "$answer" ]] && PTERO_DIR="$answer"
  if ! panel_exists; then
    err "Nenhuma instalação do Pterodactyl encontrada em ${PTERO_DIR}."
    return 1
  fi
}

check_deps() {
  local missing=()
  for dep in curl unzip zip; do
    command -v "$dep" &>/dev/null || missing+=("$dep")
  done
  if [[ ${#missing[@]} -gt 0 ]]; then
    warn "Dependências ausentes: ${C_BOLD}${missing[*]}${C_RESET}"
    read -rp "  Deseja instalá-las agora? [S/n]: " answer
    if [[ ! "$answer" =~ ^[Nn] ]]; then
      if command -v apt-get &>/dev/null; then
        apt-get update -qq && apt-get install -y -qq "${missing[@]}"
      elif command -v dnf &>/dev/null; then
        dnf install -y -q "${missing[@]}"
      elif command -v yum &>/dev/null; then
        yum install -y -q "${missing[@]}"
      else
        err "Gerenciador de pacotes não suportado. Instale manualmente: ${missing[*]}"
        return 1
      fi
      ok "Dependências instaladas."
    else
      return 1
    fi
  fi
}

# ── Origem dos arquivos do addon ─────────────────────────────────────────────
get_source() {
  # Preferência: arquivos locais (repositório clonado ao lado do script).
  if [[ -f "${SCRIPT_DIR}/${ADDON_ID}/conf.yml" ]]; then
    SOURCE_DIR="${SCRIPT_DIR}/${ADDON_ID}"
    info "Usando arquivos locais: ${C_DIM}${SOURCE_DIR}${C_RESET}"
    return 0
  fi

  info "Baixando ${ADDON_NAME} do GitHub (${REPO}@${REPO_BRANCH})..."
  local tmp
  tmp="$(mktemp -d)"
  if ! curl -fsSL "https://github.com/${REPO}/archive/refs/heads/${REPO_BRANCH}.tar.gz" | tar -xz -C "$tmp" --strip-components=1; then
    err "Falha ao baixar o repositório. Verifique sua conexão."
    rm -rf "$tmp"
    return 1
  fi
  if [[ ! -f "${tmp}/${ADDON_ID}/conf.yml" ]]; then
    err "Arquivos do addon não encontrados no repositório."
    rm -rf "$tmp"
    return 1
  fi
  SOURCE_DIR="${tmp}/${ADDON_ID}"
  ok "Download concluído."
}

package_addon() {
  # Empacota o diretório do addon em um arquivo .blueprint (zip).
  local out="${PTERO_DIR}/${ADDON_ID}.blueprint"
  rm -f "$out"
  info "Empacotando ${ADDON_ID}.blueprint..."
  (cd "$SOURCE_DIR" && zip -qr "$out" . -x '.git/*' '.dist/*') || { err "Falha ao empacotar o addon."; return 1; }
  ok "Pacote criado: ${C_DIM}${out}${C_RESET}"
}

# ── Ações ────────────────────────────────────────────────────────────────────
do_install() {
  echo ""
  line
  echo -e "  ${C_BOLD}Instalar / Atualizar ${ADDON_NAME}${C_RESET}"
  line

  detect_panel || return 1
  check_deps || return 1

  if ! blueprint_exists; then
    err "O Blueprint Framework não está instalado no painel."
    info "Use a opção ${C_BOLD}5${C_RESET} do menu para instalá-lo primeiro."
    return 1
  fi

  if addon_installed; then
    info "${ADDON_NAME} já está instalado — será ${C_BOLD}atualizado${C_RESET}."
  fi

  get_source || return 1
  package_addon || return 1

  info "Executando ${C_BOLD}blueprint -install ${ADDON_ID}${C_RESET} (isso pode demorar alguns minutos)..."
  echo ""
  if blueprint_cmd -install "${ADDON_ID}"; then
    echo ""
    ok "${C_BOLD}${ADDON_NAME} instalado com sucesso!${C_RESET}"
    info "Próximo passo: em ${C_DIM}Admin > Extensions > Blueprint${C_RESET}, habilite a rota"
    info "\"Properties\" nos seus eggs de Minecraft Java (rotas por egg)."
  else
    echo ""
    err "A instalação falhou. Rode ${C_BOLD}blueprint -debug 80${C_RESET} para ver os logs."
    return 1
  fi
}

do_remove() {
  echo ""
  line
  echo -e "  ${C_BOLD}Remover ${ADDON_NAME}${C_RESET}"
  line

  detect_panel || return 1

  if ! blueprint_exists; then
    err "O Blueprint Framework não está instalado — nada para remover."
    return 1
  fi
  if ! addon_installed; then
    warn "${ADDON_NAME} não está instalado neste painel."
    return 0
  fi

  echo ""
  read -rp "  Tem certeza que deseja remover o ${ADDON_NAME}? [s/N]: " answer
  if [[ ! "$answer" =~ ^[Ss] ]]; then
    info "Remoção cancelada."
    return 0
  fi

  echo ""
  if blueprint_cmd -remove "${ADDON_ID}"; then
    rm -f "${PTERO_DIR}/${ADDON_ID}.blueprint"
    echo ""
    ok "${ADDON_NAME} removido com sucesso."
  else
    echo ""
    err "A remoção falhou. Rode ${C_BOLD}blueprint -debug 80${C_RESET} para ver os logs."
    return 1
  fi
}

do_status() {
  echo ""
  line
  echo -e "  ${C_BOLD}Status${C_RESET}"
  line

  if panel_exists; then
    ok "Pterodactyl encontrado em ${C_DIM}${PTERO_DIR}${C_RESET}"
  else
    err "Pterodactyl NÃO encontrado em ${C_DIM}${PTERO_DIR}${C_RESET}"
    return 0
  fi

  if blueprint_exists; then
    local version
    version="$(cat "${PTERO_DIR}/.blueprint/extensions/blueprint/private/version" 2>/dev/null || echo 'desconhecida')"
    ok "Blueprint Framework instalado ${C_GRAY}(versão: ${version})${C_RESET}"
  else
    err "Blueprint Framework NÃO instalado"
  fi

  if addon_installed; then
    ok "${ADDON_NAME} está ${C_GREEN}${C_BOLD}instalado${C_RESET}"
  else
    warn "${ADDON_NAME} ${C_BOLD}não${C_RESET} está instalado"
  fi
}

do_export() {
  echo ""
  line
  echo -e "  ${C_BOLD}Exportar ${ADDON_ID}.blueprint${C_RESET}"
  line

  check_deps || return 1
  get_source || return 1

  local out="${SCRIPT_DIR}/${ADDON_ID}.blueprint"
  rm -f "$out"
  (cd "$SOURCE_DIR" && zip -qr "$out" . -x '.git/*' '.dist/*') || { err "Falha ao empacotar."; return 1; }
  ok "Arquivo exportado: ${C_BOLD}${out}${C_RESET}"
  info "Você pode enviá-lo para qualquer painel e instalar com ${C_DIM}blueprint -install ${ADDON_ID}${C_RESET}."
}

do_install_blueprint() {
  echo ""
  line
  echo -e "  ${C_BOLD}Instalar Blueprint Framework${C_RESET}"
  line

  detect_panel || return 1
  check_deps || return 1

  if blueprint_exists; then
    ok "O Blueprint já está instalado."
    read -rp "  Deseja reinstalar/atualizar mesmo assim? [s/N]: " answer
    [[ ! "$answer" =~ ^[Ss] ]] && return 0
  fi

  if ! command -v node &>/dev/null; then
    warn "Node.js não encontrado. O Blueprint requer Node.js 20+."
    info "Instale com: ${C_DIM}curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs${C_RESET}"
    return 1
  fi
  if ! command -v yarn &>/dev/null; then
    info "Instalando yarn..."
    npm install -g yarn &>/dev/null || { err "Falha ao instalar o yarn."; return 1; }
  fi

  info "Baixando a última release do Blueprint..."
  local url
  url="$(curl -fsSL https://api.github.com/repos/BlueprintFramework/framework/releases/latest | grep -o '"browser_download_url": *"[^"]*release.zip"' | grep -o 'https[^"]*')"
  if [[ -z "$url" ]]; then
    err "Não foi possível resolver a URL da release."
    return 1
  fi

  (
    cd "${PTERO_DIR}" || exit 1
    curl -fsSL -o release.zip "$url" || exit 1
    unzip -o -q release.zip || exit 1
    rm -f release.zip
    chmod +x blueprint.sh
  ) || { err "Falha ao baixar/extrair a release."; return 1; }

  info "Executando o instalador oficial do Blueprint..."
  echo ""
  if (cd "${PTERO_DIR}" && bash blueprint.sh); then
    echo ""
    ok "Blueprint Framework instalado!"
  else
    echo ""
    err "A instalação do Blueprint falhou. Consulte ${C_DIM}https://blueprint.zip${C_RESET}."
    return 1
  fi
}

pause() {
  echo ""
  read -rp "  Pressione ENTER para voltar ao menu..." _
}

# ── Menu ─────────────────────────────────────────────────────────────────────
menu() {
  while true; do
    banner

    # status resumido no topo do menu
    if panel_exists; then
      if addon_installed; then
        echo -e "  Status: ${C_GREEN}●${C_RESET} ${ADDON_NAME} ${C_GREEN}instalado${C_RESET} ${C_GRAY}(${PTERO_DIR})${C_RESET}"
      elif blueprint_exists; then
        echo -e "  Status: ${C_YELLOW}●${C_RESET} Blueprint pronto, addon ${C_YELLOW}não instalado${C_RESET} ${C_GRAY}(${PTERO_DIR})${C_RESET}"
      else
        echo -e "  Status: ${C_RED}●${C_RESET} Blueprint ${C_RED}não instalado${C_RESET} ${C_GRAY}(${PTERO_DIR})${C_RESET}"
      fi
    else
      echo -e "  Status: ${C_RED}●${C_RESET} Painel não encontrado em ${C_GRAY}${PTERO_DIR}${C_RESET}"
    fi

    echo ""
    line
    echo -e "   ${C_GREEN}${C_BOLD}1${C_RESET}) Instalar / Atualizar ${ADDON_NAME}"
    echo -e "   ${C_RED}${C_BOLD}2${C_RESET}) Remover ${ADDON_NAME}"
    echo -e "   ${C_CYAN}${C_BOLD}3${C_RESET}) Ver status da instalação"
    echo -e "   ${C_CYAN}${C_BOLD}4${C_RESET}) Exportar arquivo .blueprint"
    echo -e "   ${C_YELLOW}${C_BOLD}5${C_RESET}) Instalar Blueprint Framework"
    echo -e "   ${C_GRAY}${C_BOLD}0${C_RESET}) Sair"
    line
    echo ""
    read -rp "  Escolha uma opção: " choice

    case "$choice" in
      1) do_install; pause ;;
      2) do_remove; pause ;;
      3) do_status; pause ;;
      4) do_export; pause ;;
      5) do_install_blueprint; pause ;;
      0) echo ""; info "Até mais! 👋"; echo ""; exit 0 ;;
      *) warn "Opção inválida."; sleep 1 ;;
    esac
  done
}

# ── Entrada ──────────────────────────────────────────────────────────────────
require_root

case "${1:-}" in
  install) banner; do_install ;;
  remove)  banner; do_remove ;;
  status)  banner; do_status ;;
  export)  banner; do_export ;;
  *)       menu ;;
esac
