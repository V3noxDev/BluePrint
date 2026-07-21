#!/usr/bin/env bash
set -euo pipefail

identifier="${EXTENSION_IDENTIFIER:-serverproperties}"
root="${BLUEPRINT_TMP:-$(pwd)}"

if [[ ! -f "${root}/conf.yml" ]]; then
  root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"
fi

required_files=(
  "conf.yml"
  "controller.php"
  "view.blade.php"
  "admin.css"
  "public/icon.svg"
  "data/install.sh"
  "data/remove.sh"
  "data/update.sh"
)

echo "[${identifier}] Validating files before export"

for file in "${required_files[@]}"; do
  if [[ ! -f "${root}/${file}" ]]; then
    echo "[${identifier}] Missing required file: ${file}" >&2
    exit 1
  fi
done

echo "[${identifier}] Export validation passed"
