#!/bin/bash
set -e

echo "[bedrockversions] Removendo extensão..."
# Tabela bedrock_versions é removida pela migration down se o admin rodar migrate:rollback
# Não apagamos automaticamente para preservar o histórico de versões.
echo "[bedrockversions] Remoção concluída."
