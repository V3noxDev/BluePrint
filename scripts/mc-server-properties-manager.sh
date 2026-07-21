#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="$(basename "$0")"
BACKUP_DIR_NAME=".mcprops-backups"

if [[ -t 1 ]]; then
  C_RESET="$(printf '\033[0m')"
  C_BLUE="$(printf '\033[34m')"
  C_GREEN="$(printf '\033[32m')"
  C_YELLOW="$(printf '\033[33m')"
  C_RED="$(printf '\033[31m')"
else
  C_RESET=""
  C_BLUE=""
  C_GREEN=""
  C_YELLOW=""
  C_RED=""
fi

print_banner() {
  printf "%s\n" "============================================================"
  printf "%sMinecraft Java - server.properties manager%s\n" "$C_BLUE" "$C_RESET"
  printf "%s\n" "============================================================"
}

log_info() {
  printf "%s[INFO]%s %s\n" "$C_BLUE" "$C_RESET" "$1"
}

log_ok() {
  printf "%s[OK]%s %s\n" "$C_GREEN" "$C_RESET" "$1"
}

log_warn() {
  printf "%s[WARN]%s %s\n" "$C_YELLOW" "$C_RESET" "$1"
}

log_err() {
  printf "%s[ERR]%s %s\n" "$C_RED" "$C_RESET" "$1" >&2
}

usage() {
  cat <<EOF
Usage:
  $SCRIPT_NAME wizard --file <path>
  $SCRIPT_NAME show --file <path>
  $SCRIPT_NAME set --file <path> --key <key> --value <value>
  $SCRIPT_NAME remove --file <path> --key <key>
  $SCRIPT_NAME profile --file <path> --name <survival|minigames|hardcore>
  $SCRIPT_NAME list-backups --file <path>
  $SCRIPT_NAME restore --file <path> --backup <backup-file>

Examples:
  $SCRIPT_NAME wizard --file /home/container/server.properties
  $SCRIPT_NAME set --file /home/container/server.properties --key max-players --value 80
  $SCRIPT_NAME profile --file /home/container/server.properties --name survival
EOF
}

require_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    log_err "Arquivo nao encontrado: $file"
    exit 1
  fi
}

backup_file() {
  local file="$1"
  local parent_dir
  local backup_dir
  local stamp
  local backup_path

  parent_dir="$(dirname "$file")"
  backup_dir="$parent_dir/$BACKUP_DIR_NAME"
  stamp="$(date +%Y%m%d-%H%M%S)-$RANDOM"

  mkdir -p "$backup_dir"
  backup_path="$backup_dir/server.properties.$stamp.bak"
  cp "$file" "$backup_path"
  log_ok "Backup criado: $backup_path"
}

set_property() {
  local file="$1"
  local key="$2"
  local value="$3"
  local tmp

  tmp="$(mktemp)"
  awk -v target="$key" -v replacement="$value" '
    BEGIN { found = 0 }
    {
      pos = index($0, "=")
      if (pos > 0) {
        current = substr($0, 1, pos - 1)
        if (current == target) {
          print target "=" replacement
          found = 1
          next
        }
      }
      print
    }
    END {
      if (found == 0) {
        print target "=" replacement
      }
    }
  ' "$file" > "$tmp"
  mv "$tmp" "$file"
}

remove_property() {
  local file="$1"
  local key="$2"
  local tmp

  tmp="$(mktemp)"
  awk -v target="$key" '
    {
      pos = index($0, "=")
      if (pos > 0) {
        current = substr($0, 1, pos - 1)
        if (current == target) {
          next
        }
      }
      print
    }
  ' "$file" > "$tmp"
  mv "$tmp" "$file"
}

read_property() {
  local file="$1"
  local key="$2"

  awk -v target="$key" '
    {
      if ($0 ~ /^[[:space:]]*#/) {
        next
      }
      pos = index($0, "=")
      if (pos > 0) {
        current = substr($0, 1, pos - 1)
        if (current == target) {
          print substr($0, pos + 1)
          found = 1
          exit
        }
      }
    }
    END {
      if (found != 1) {
        exit 1
      }
    }
  ' "$file"
}

show_core_values() {
  local file="$1"
  local keys=(
    "motd"
    "gamemode"
    "difficulty"
    "hardcore"
    "pvp"
    "online-mode"
    "max-players"
    "view-distance"
    "simulation-distance"
    "spawn-protection"
    "allow-flight"
  )
  local key
  local value

  printf "%s\n" "----------------- Configuracoes importantes -----------------"
  for key in "${keys[@]}"; do
    if value="$(read_property "$file" "$key" 2>/dev/null)"; then
      printf "%-22s = %s\n" "$key" "$value"
    else
      printf "%-22s = (nao definido)\n" "$key"
    fi
  done
  printf "%s\n" "--------------------------------------------------------------"
}

apply_profile() {
  local file="$1"
  local profile="$2"
  local key
  local value
  declare -A map=()

  case "$profile" in
    survival)
      map=(
        ["motd"]="A Minecraft Survival Server"
        ["gamemode"]="survival"
        ["difficulty"]="normal"
        ["hardcore"]="false"
        ["pvp"]="true"
        ["online-mode"]="true"
        ["max-players"]="40"
        ["view-distance"]="10"
        ["simulation-distance"]="10"
        ["spawn-protection"]="16"
        ["allow-flight"]="false"
      )
      ;;
    minigames)
      map=(
        ["motd"]="A Minecraft Minigames Network"
        ["gamemode"]="adventure"
        ["difficulty"]="easy"
        ["hardcore"]="false"
        ["pvp"]="true"
        ["online-mode"]="true"
        ["max-players"]="120"
        ["view-distance"]="8"
        ["simulation-distance"]="6"
        ["spawn-protection"]="0"
        ["allow-flight"]="true"
      )
      ;;
    hardcore)
      map=(
        ["motd"]="A Hardcore Minecraft Experience"
        ["gamemode"]="survival"
        ["difficulty"]="hard"
        ["hardcore"]="true"
        ["pvp"]="true"
        ["online-mode"]="true"
        ["max-players"]="20"
        ["view-distance"]="10"
        ["simulation-distance"]="10"
        ["spawn-protection"]="0"
        ["allow-flight"]="false"
      )
      ;;
    *)
      log_err "Perfil invalido: $profile"
      log_info "Perfis validos: survival, minigames, hardcore"
      exit 1
      ;;
  esac

  backup_file "$file"
  for key in "${!map[@]}"; do
    value="${map[$key]}"
    set_property "$file" "$key" "$value"
  done
  log_ok "Perfil aplicado com sucesso: $profile"
}

list_backups() {
  local file="$1"
  local backup_dir

  backup_dir="$(dirname "$file")/$BACKUP_DIR_NAME"
  if [[ ! -d "$backup_dir" ]]; then
    log_warn "Nenhum backup encontrado."
    return 0
  fi

  log_info "Backups disponiveis em: $backup_dir"
  ls -1 "$backup_dir"
}

restore_backup() {
  local file="$1"
  local backup_file_path="$2"

  if [[ ! -f "$backup_file_path" ]]; then
    log_err "Backup nao encontrado: $backup_file_path"
    exit 1
  fi

  cp "$backup_file_path" "$file"
  log_ok "Backup restaurado para: $file"
}

wizard() {
  local file="$1"
  local option
  local key
  local value
  local backup_file_path
  local backup_dir

  require_file "$file"

  while true; do
    print_banner
    printf "Arquivo alvo: %s\n\n" "$file"
    show_core_values "$file"
    printf "%s\n" "[1] Aplicar preset: survival"
    printf "%s\n" "[2] Aplicar preset: minigames"
    printf "%s\n" "[3] Aplicar preset: hardcore"
    printf "%s\n" "[4] Definir chave (set key=value)"
    printf "%s\n" "[5] Remover chave"
    printf "%s\n" "[6] Listar backups"
    printf "%s\n" "[7] Restaurar backup"
    printf "%s\n" "[0] Sair"
    printf "\n"
    read -r -p "Escolha uma opcao: " option

    case "$option" in
      1)
        apply_profile "$file" "survival"
        ;;
      2)
        apply_profile "$file" "minigames"
        ;;
      3)
        apply_profile "$file" "hardcore"
        ;;
      4)
        read -r -p "Chave: " key
        read -r -p "Valor: " value
        if [[ -z "$key" ]]; then
          log_warn "Chave vazia, operacao cancelada."
        else
          backup_file "$file"
          set_property "$file" "$key" "$value"
          log_ok "Chave atualizada: $key=$value"
        fi
        ;;
      5)
        read -r -p "Chave para remover: " key
        if [[ -z "$key" ]]; then
          log_warn "Chave vazia, operacao cancelada."
        else
          backup_file "$file"
          remove_property "$file" "$key"
          log_ok "Chave removida: $key"
        fi
        ;;
      6)
        list_backups "$file"
        ;;
      7)
        backup_dir="$(dirname "$file")/$BACKUP_DIR_NAME"
        if [[ ! -d "$backup_dir" ]]; then
          log_warn "Nao ha backups para restaurar."
        else
          ls -1 "$backup_dir"
          read -r -p "Informe o caminho completo do backup: " backup_file_path
          restore_backup "$file" "$backup_file_path"
        fi
        ;;
      0)
        log_info "Encerrado."
        break
        ;;
      *)
        log_warn "Opcao invalida."
        ;;
    esac

    printf "\n"
    read -r -p "Pressione ENTER para continuar..."
    printf "\n"
  done
}

parse_required_arg() {
  local option_name="$1"
  local option_value="$2"

  if [[ -z "$option_value" ]]; then
    log_err "Parametro ausente para $option_name"
    usage
    exit 1
  fi
}

main() {
  if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    usage
    exit 0
  fi

  local command="${1:-wizard}"
  local file=""
  local key=""
  local value=""
  local profile=""
  local backup_file_path=""

  shift || true

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --file)
        file="${2:-}"
        parse_required_arg "--file" "$file"
        shift 2
        ;;
      --key)
        key="${2:-}"
        parse_required_arg "--key" "$key"
        shift 2
        ;;
      --value)
        value="${2:-}"
        parse_required_arg "--value" "$value"
        shift 2
        ;;
      --name)
        profile="${2:-}"
        parse_required_arg "--name" "$profile"
        shift 2
        ;;
      --backup)
        backup_file_path="${2:-}"
        parse_required_arg "--backup" "$backup_file_path"
        shift 2
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        log_err "Argumento invalido: $1"
        usage
        exit 1
        ;;
    esac
  done

  if [[ -z "$file" ]]; then
    read -r -p "Informe o caminho de server.properties: " file
  fi
  require_file "$file"

  case "$command" in
    wizard)
      wizard "$file"
      ;;
    show)
      print_banner
      show_core_values "$file"
      ;;
    set)
      if [[ -z "$key" || -z "$value" ]]; then
        log_err "Use set com --key e --value."
        usage
        exit 1
      fi
      backup_file "$file"
      set_property "$file" "$key" "$value"
      log_ok "Chave atualizada: $key=$value"
      ;;
    remove)
      if [[ -z "$key" ]]; then
        log_err "Use remove com --key."
        usage
        exit 1
      fi
      backup_file "$file"
      remove_property "$file" "$key"
      log_ok "Chave removida: $key"
      ;;
    profile)
      if [[ -z "$profile" ]]; then
        log_err "Use profile com --name <perfil>."
        usage
        exit 1
      fi
      apply_profile "$file" "$profile"
      ;;
    list-backups)
      list_backups "$file"
      ;;
    restore)
      if [[ -z "$backup_file_path" ]]; then
        log_err "Use restore com --backup <arquivo>."
        usage
        exit 1
      fi
      restore_backup "$file" "$backup_file_path"
      ;;
    *)
      log_err "Comando invalido: $command"
      usage
      exit 1
      ;;
  esac
}

main "$@"
