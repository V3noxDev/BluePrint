#!/usr/bin/env bash
set -euo pipefail

OUTPUT="minecraftsuite.blueprint"

rm -f "$OUTPUT"

zip -r "$OUTPUT" \
  app \
  resources \
  routes \
  conf.yml \
  README.md \
  -x "*.DS_Store" -x "__MACOSX/*"

echo "Pacote gerado em: $OUTPUT"
