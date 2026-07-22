# Advanced Move Files — Blueprint Extension

Melhora a interface de **mover** e **renomear** arquivos no gerenciador do Pterodactyl — inspirado no [Advanced Move Files da SourceXchange](https://www.sourcexchange.net/products/advanced-move-files).

## Recursos

- Navegação por pastas dentro do modal (sem digitar `../`)
- Preview do destino antes de confirmar
- Criar pasta nova durante a movimentação
- Funciona no menu de contexto (**Mover** / **Renomear**) e na barra de ações em massa
- Suporte a mover vários arquivos/pastas de uma vez

## Instalação

```bash
cp -r advancedmovefiles /var/www/pterodactyl/.blueprint/dev/
cd /var/www/pterodactyl
blueprint -build
blueprint -install advancedmovefiles.blueprint
```

O script `install.sh` substitui o `RenameFileModal.tsx` do Pterodactyl pelo componente avançado (com backup automático).

## Desinstalação

```bash
blueprint -remove advancedmovefiles
blueprint -build
```

O `remove.sh` restaura o `RenameFileModal.tsx` original.

## Como usar

1. Abra **Arquivos** no servidor
2. Selecione um ou mais itens → **Mover** na barra inferior  
   **ou** use o menu ⋮ → **Mover** / **Renomear**
3. Navegue pelas pastas, crie uma nova se precisar, e confirme

## Licença

MIT
