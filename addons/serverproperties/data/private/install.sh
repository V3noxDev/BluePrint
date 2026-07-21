#!/bin/bash
# install.sh — executado pelo Blueprint durante a instalação da extensão.

echo ""
echo "  ╭──────────────────────────────────────────────╮"
echo "  │  Server Properties para Pterodactyl          │"
echo "  │  Extensão instalada com sucesso!             │"
echo "  ╰──────────────────────────────────────────────╯"
echo ""
echo "  ▸ Identificador: $EXTENSION_IDENTIFIER"
echo "  ▸ Versão:        $EXTENSION_VERSION"
echo "  ▸ Alvo:          $EXTENSION_TARGET"
echo "  ▸ Diretório:     $PTERODACTYL_DIRECTORY"
echo ""
echo "  Acesse um servidor Java na aba \"Properties\" para começar."
echo ""
