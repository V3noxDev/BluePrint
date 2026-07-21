#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
EXTENSION_DIR="$REPO_ROOT/blueprint-addon"
DIST_DIR="$REPO_ROOT/dist"
CONF_FILE="$EXTENSION_DIR/conf.yml"
PATH_ONLY=false

if [[ "${1:-}" == "--path-only" ]]; then
  PATH_ONLY=true
fi

if [[ ! -d "$EXTENSION_DIR" ]]; then
  echo "[ERR] Diretorio da extensao nao encontrado: $EXTENSION_DIR" >&2
  exit 1
fi

if [[ ! -f "$CONF_FILE" ]]; then
  echo "[ERR] conf.yml nao encontrado em: $CONF_FILE" >&2
  exit 1
fi

if ! command -v zip >/dev/null 2>&1; then
  echo "[ERR] comando 'zip' nao encontrado. Instale o pacote zip." >&2
  exit 1
fi

identifier="$(awk -F': ' '/identifier:/ {gsub(/"/, "", $2); print $2; exit}' "$CONF_FILE")"
version="$(awk -F': ' '/version:/ {gsub(/"/, "", $2); print $2; exit}' "$CONF_FILE")"

if [[ -z "$identifier" || -z "$version" ]]; then
  echo "[ERR] Nao foi possivel ler identifier/version em conf.yml." >&2
  exit 1
fi

mkdir -p "$DIST_DIR"
output_file="$DIST_DIR/${identifier}-${version}.blueprint"

tmp_dir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

cp -R "$EXTENSION_DIR"/. "$tmp_dir"/

(
  cd "$tmp_dir"
  rm -rf .git .dist
  zip -r "$output_file" . >/dev/null
)

if $PATH_ONLY; then
  printf "%s\n" "$output_file"
else
  printf "[OK] Pacote gerado: %s\n" "$output_file"
fi
