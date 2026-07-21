#!/usr/bin/env bash
#
# ─────────────────────────────────────────────────────────────────────────────
#  MC Properties — Auto Instalador
#  Instalador interativo de addons Blueprint para Pterodactyl.
#
#  Recursos:
#    • Detecta o diretório do Pterodactyl e o Blueprint automaticamente
#    • Instala o Blueprint Framework (última versão) caso não exista
#    • Instala / atualiza o addon MC Properties
#    • Remove qualquer extensão Blueprint com menu de seleção
#    • Empacota o addon em um arquivo .blueprint
#
#  Uso:  sudo bash installer.sh
# ─────────────────────────────────────────────────────────────────────────────

ADDON_ID="mcproperties"
ADDON_NAME="MC Properties"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_PTERO="/var/www/pterodactyl"
PTERO_DIR=""

# ── Cores ────────────────────────────────────────────────────────────────────
if [ -t 1 ]; then
  C_RESET=$'\033[0m';  C_BOLD=$'\033[1m';   C_DIM=$'\033[2m'
  C_GREEN=$'\033[38;5;42m'; C_RED=$'\033[38;5;203m'; C_YELLOW=$'\033[38;5;220m'
  C_BLUE=$'\033[38;5;75m';  C_CYAN=$'\033[38;5;51m'; C_GRAY=$'\033[38;5;245m'
else
  C_RESET=""; C_BOLD=""; C_DIM=""; C_GREEN=""; C_RED=""; C_YELLOW=""; C_BLUE=""; C_CYAN=""; C_GRAY=""
fi

ok()    { echo -e "  ${C_GREEN}✔${C_RESET} $1"; }
err()   { echo -e "  ${C_RED}✘${C_RESET} $1"; }
warn()  { echo -e "  ${C_YELLOW}⚠${C_RESET} $1"; }
info()  { echo -e "  ${C_BLUE}➜${C_RESET} $1"; }
title() { echo -e "\n${C_BOLD}${C_CYAN}── $1 ${C_RESET}${C_DIM}$(printf '─%.0s' $(seq 1 $((60 - ${#1}))))${C_RESET}"; }

pause() { echo; read -rp "  Pressione ENTER para voltar ao menu... " _; }

banner() {
  clear
  echo -e "${C_GREEN}${C_BOLD}"
  cat <<'EOF'
   ███╗   ███╗ ██████╗    ██████╗ ██████╗  ██████╗ ██████╗ ███████╗
   ████╗ ████║██╔════╝    ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██╔════╝
   ██╔████╔██║██║         ██████╔╝██████╔╝██║   ██║██████╔╝███████╗
   ██║╚██╔╝██║██║         ██╔═══╝ ██╔══██╗██║   ██║██╔═══╝ ╚════██║
   ██║ ╚═╝ ██║╚██████╗    ██║     ██║  ██║╚██████╔╝██║     ███████║
   ╚═╝     ╚═╝ ╚═════╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚══════╝
EOF
  echo -e "${C_RESET}"
  echo -e "   ${C_BOLD}${ADDON_NAME}${C_RESET} ${C_GRAY}— Auto Instalador de Addons Blueprint (Pterodactyl)${C_RESET}"
  echo -e "   ${C_GRAY}Editor de server.properties para Minecraft Java${C_RESET}"
  echo
}

# ── Checagens básicas ────────────────────────────────────────────────────────
require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    err "Este instalador precisa ser executado como root."
    info "Tente novamente com: ${C_BOLD}sudo bash installer.sh${C_RESET}"
    exit 1
  fi
}

detect_ptero() {
  if [ -n "$PTERO_DIR" ] && [ -f "$PTERO_DIR/config/app.php" ]; then
    return 0
  fi
  if [ -f "$DEFAULT_PTERO/config/app.php" ]; then
    PTERO_DIR="$DEFAULT_PTERO"
    return 0
  fi
  warn "Painel Pterodactyl não encontrado em ${C_BOLD}${DEFAULT_PTERO}${C_RESET}."
  while true; do
    read -rp "  Informe o caminho do Pterodactyl (ou 'q' para sair): " answer
    [ "$answer" = "q" ] && exit 0
    if [ -f "$answer/config/app.php" ]; then
      PTERO_DIR="$answer"
      return 0
    fi
    err "Não achei um painel Pterodactyl em '$answer'. Tente de novo."
  done
}

blueprint_installed() {
  [ -f "$PTERO_DIR/blueprint.sh" ] && command -v blueprint >/dev/null 2>&1
}

blueprint_version() {
  if blueprint_installed; then
    (cd "$PTERO_DIR" && blueprint -v 2>/dev/null | tr -d '[:space:]') || echo "?"
  else
    echo "-"
  fi
}

addon_installed() {
  [ -d "$PTERO_DIR/.blueprint/extensions/$1" ]
}

list_installed_extensions() {
  if [ -d "$PTERO_DIR/.blueprint/extensions" ]; then
    find "$PTERO_DIR/.blueprint/extensions" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' 2>/dev/null \
      | grep -v '^blueprint$' | sort
  fi
}

# ── Instalação do Blueprint Framework ────────────────────────────────────────
install_blueprint() {
  title "Instalar Blueprint Framework"

  if blueprint_installed; then
    ok "Blueprint já está instalado (versão $(blueprint_version))."
    read -rp "  Deseja reinstalar/atualizar mesmo assim? [s/N]: " confirm
    [[ ! "$confirm" =~ ^[sSyY]$ ]] && return 0
  fi

  info "Instalando dependências do sistema (curl, wget, zip, unzip, git, gnupg)..."
  if command -v apt >/dev/null 2>&1; then
    apt update -y >/dev/null 2>&1
    apt install -y ca-certificates curl git gnupg unzip wget zip >/dev/null 2>&1 || {
      err "Falha ao instalar dependências via apt."; return 1; }
  else
    warn "Gerenciador 'apt' não encontrado. Instale manualmente: curl git gnupg unzip wget zip"
  fi

  node_major="$(node -v 2>/dev/null | sed 's/[^0-9.]//g' | cut -d. -f1)"
  if [ -z "$node_major" ] || [ "${node_major:-0}" -lt 22 ]; then
    info "Instalando Node.js 22.x (necessário para o Blueprint)..."
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
    apt update -y >/dev/null 2>&1
    apt install -y nodejs || { err "Falha ao instalar o Node.js."; return 1; }
  fi
  ok "Node.js $(node -v) disponível."

  if ! command -v yarn >/dev/null 2>&1; then
    info "Instalando Yarn..."
    npm install -g yarn >/dev/null 2>&1 || { err "Falha ao instalar o Yarn."; return 1; }
  fi
  ok "Yarn $(yarn -v 2>/dev/null) disponível."

  info "Baixando a última release do Blueprint..."
  wget -q "https://github.com/BlueprintFramework/framework/releases/latest/download/release.zip" -O "$PTERO_DIR/release.zip" \
    || { err "Falha ao baixar o release.zip do Blueprint."; return 1; }
  (cd "$PTERO_DIR" && unzip -o -q release.zip && rm -f release.zip) || { err "Falha ao extrair o Blueprint."; return 1; }
  ok "Arquivos do Blueprint extraídos em $PTERO_DIR."

  if [ ! -f "$PTERO_DIR/.blueprintrc" ]; then
    info "Criando .blueprintrc padrão (www-data)..."
    printf 'WEBUSER="www-data";\nOWNERSHIP="www-data:www-data";\nUSERSHELL="/bin/bash";\n' > "$PTERO_DIR/.blueprintrc"
  fi

  info "Instalando dependências do painel (yarn install)... isso pode demorar."
  (cd "$PTERO_DIR" && yarn install >/dev/null 2>&1) || warn "yarn install retornou avisos — verifique se algo falhou."

  info "Executando blueprint.sh (primeira instalação)..."
  chmod +x "$PTERO_DIR/blueprint.sh"
  (cd "$PTERO_DIR" && bash blueprint.sh) || { err "A instalação do Blueprint falhou."; return 1; }

  ok "Blueprint Framework instalado com sucesso!"
}

# ── Empacotar o addon ────────────────────────────────────────────────────────
package_addon() {
  title "Empacotar ${ADDON_NAME} (.blueprint)"

  local source_dir="$SCRIPT_DIR/$ADDON_ID"
  if [ ! -f "$source_dir/conf.yml" ]; then
    err "Pasta do addon não encontrada em: $source_dir"
    return 1
  fi
  if ! command -v zip >/dev/null 2>&1; then
    info "Instalando 'zip'..."
    apt install -y zip >/dev/null 2>&1 || { err "Instale o 'zip' manualmente e tente de novo."; return 1; }
  fi

  local output="$SCRIPT_DIR/${ADDON_ID}.blueprint"
  rm -f "$output"
  (cd "$source_dir" && zip -r -q "$output" . -x '*.DS_Store' -x '*__pycache__*') || { err "Falha ao criar o pacote."; return 1; }
  ok "Pacote criado: ${C_BOLD}$output${C_RESET}"
}

# ── Instalar / atualizar o addon ─────────────────────────────────────────────
install_addon() {
  title "Instalar / atualizar ${ADDON_NAME}"

  if ! blueprint_installed; then
    warn "O Blueprint Framework ainda não está instalado neste painel."
    read -rp "  Deseja instalá-lo agora? [S/n]: " confirm
    if [[ "$confirm" =~ ^[nN]$ ]]; then
      err "Não é possível instalar addons sem o Blueprint."
      return 1
    fi
    install_blueprint || return 1
  fi

  # Usa um pacote pronto se existir, senão empacota a partir da pasta do addon.
  local package="$SCRIPT_DIR/${ADDON_ID}.blueprint"
  if [ ! -f "$package" ]; then
    package_addon || return 1
  fi

  if addon_installed "$ADDON_ID"; then
    info "${ADDON_NAME} já está instalado — o Blueprint fará a atualização."
  fi

  info "Copiando pacote para o diretório do painel..."
  cp -f "$package" "$PTERO_DIR/${ADDON_ID}.blueprint"

  info "Executando: blueprint -install ${ADDON_ID}"
  echo
  (cd "$PTERO_DIR" && blueprint -install "$ADDON_ID")
  local status_code=$?
  rm -f "$PTERO_DIR/${ADDON_ID}.blueprint"
  echo

  if [ $status_code -eq 0 ]; then
    ok "${ADDON_NAME} instalado com sucesso!"
    info "A aba ${C_BOLD}Propriedades${C_RESET} agora aparece nos servidores do painel."
    info "Dica: em Admin → Extensions → Manage dá para limitar a aba a eggs de Minecraft."
  else
    err "O comando blueprint retornou erro (código $status_code). Veja o log acima."
    return 1
  fi
}

# ── Remover extensões (menu de seleção) ──────────────────────────────────────
remove_addon_menu() {
  title "Remover extensão Blueprint"

  if ! blueprint_installed; then
    err "O Blueprint não está instalado — não há extensões para remover."
    return 1
  fi

  mapfile -t extensions < <(list_installed_extensions)
  if [ ${#extensions[@]} -eq 0 ]; then
    warn "Nenhuma extensão instalada foi encontrada."
    return 0
  fi

  echo -e "  ${C_GRAY}Extensões instaladas:${C_RESET}\n"
  local i=1
  for ext in "${extensions[@]}"; do
    if [ "$ext" = "$ADDON_ID" ]; then
      echo -e "   ${C_BOLD}[$i]${C_RESET} $ext ${C_GREEN}(este addon)${C_RESET}"
    else
      echo -e "   ${C_BOLD}[$i]${C_RESET} $ext"
    fi
    i=$((i + 1))
  done
  echo -e "   ${C_BOLD}[0]${C_RESET} Cancelar\n"

  local choice
  read -rp "  Qual extensão deseja remover? " choice
  [[ ! "$choice" =~ ^[0-9]+$ ]] && { err "Opção inválida."; return 1; }
  [ "$choice" -eq 0 ] && return 0
  [ "$choice" -gt ${#extensions[@]} ] && { err "Opção inválida."; return 1; }

  local target="${extensions[$((choice - 1))]}"
  echo
  warn "A extensão ${C_BOLD}${target}${C_RESET} será removida do painel."
  read -rp "  Confirma a remoção? [s/N]: " confirm
  [[ ! "$confirm" =~ ^[sSyY]$ ]] && { info "Remoção cancelada."; return 0; }

  echo
  (cd "$PTERO_DIR" && blueprint -remove "$target")
  if [ $? -eq 0 ]; then
    ok "Extensão ${target} removida com sucesso!"
  else
    err "Falha ao remover a extensão ${target}. Veja o log acima."
    return 1
  fi
}

# ── Status ───────────────────────────────────────────────────────────────────
show_status() {
  title "Status do ambiente"

  info "Painel Pterodactyl: ${C_BOLD}${PTERO_DIR}${C_RESET}"

  if blueprint_installed; then
    ok "Blueprint Framework: instalado (versão $(blueprint_version))"
  else
    err "Blueprint Framework: não instalado"
  fi

  if addon_installed "$ADDON_ID"; then
    ok "${ADDON_NAME}: instalado"
  else
    err "${ADDON_NAME}: não instalado"
  fi

  mapfile -t extensions < <(list_installed_extensions)
  echo
  info "Extensões instaladas (${#extensions[@]}):"
  if [ ${#extensions[@]} -eq 0 ]; then
    echo -e "     ${C_GRAY}nenhuma${C_RESET}"
  else
    for ext in "${extensions[@]}"; do
      echo -e "     ${C_GRAY}•${C_RESET} $ext"
    done
  fi
}

# ── Menu principal ───────────────────────────────────────────────────────────
main_menu() {
  while true; do
    banner

    local bp_status addon_status
    if blueprint_installed; then
      bp_status="${C_GREEN}instalado ($(blueprint_version))${C_RESET}"
    else
      bp_status="${C_RED}não instalado${C_RESET}"
    fi
    if addon_installed "$ADDON_ID"; then
      addon_status="${C_GREEN}instalado${C_RESET}"
    else
      addon_status="${C_RED}não instalado${C_RESET}"
    fi

    echo -e "   ${C_GRAY}Painel:${C_RESET} $PTERO_DIR"
    echo -e "   ${C_GRAY}Blueprint:${C_RESET} $bp_status   ${C_GRAY}${ADDON_NAME}:${C_RESET} $addon_status"
    echo
    echo -e "   ${C_BOLD}[1]${C_RESET} ${C_GREEN}Instalar / atualizar${C_RESET} o ${ADDON_NAME}"
    echo -e "   ${C_BOLD}[2]${C_RESET} ${C_RED}Remover${C_RESET} uma extensão (menu de seleção)"
    echo -e "   ${C_BOLD}[3]${C_RESET} Instalar o ${C_CYAN}Blueprint Framework${C_RESET}"
    echo -e "   ${C_BOLD}[4]${C_RESET} Empacotar o addon (${ADDON_ID}.blueprint)"
    echo -e "   ${C_BOLD}[5]${C_RESET} Ver status do ambiente"
    echo -e "   ${C_BOLD}[0]${C_RESET} Sair"
    echo

    local choice
    read -rp "  Escolha uma opção: " choice
    case "$choice" in
      1) install_addon; pause ;;
      2) remove_addon_menu; pause ;;
      3) install_blueprint; pause ;;
      4) package_addon; pause ;;
      5) show_status; pause ;;
      0) echo -e "\n  ${C_GREEN}Até mais!${C_RESET}\n"; exit 0 ;;
      *) err "Opção inválida."; sleep 1 ;;
    esac
  done
}

# ── Início ───────────────────────────────────────────────────────────────────
require_root
banner
detect_ptero
main_menu
