# Template Installer

Addon Blueprint inspirado no [SourceXchange Template Installer](https://www.sourcexchange.net/products/template-installer) — permite criar templates com variáveis e steps de instalação automática nos servidores.

## Funcionalidades

### Admin (`/admin/extensions/templates`)
- CRUD de templates (nome, ícone, categoria, descrição, senha)
- Variáveis com regras de validação Laravel
- Steps de instalação:
  - Write / Replace / Append / Prepend
  - Create Folder, Pull File, Unzip
  - Move, Move Files from Folder, Delete
  - Power Action (start/stop/restart/kill)
- Importar / Exportar JSON
- Referência de variáveis do servidor (`$server`, `$egg`, `$nest`, `$request`, `$follow_redirects`)

### Cliente (`/server/{id}/minecraft/templates`)
- Lista de templates por categoria
- Painel lateral + detalhes (estilo SourceXchange)
- Formulário de variáveis (portas, boolean, texto)
- Proteção por senha
- Confirmação antes de instalar

## Instalação

```bash
blueprint -build
blueprint -install templates.blueprint
```

## Variáveis em steps

Use `{{ $variavel }}` nos caminhos e conteúdos:

```
plugins/Geyser-{{ $geyser_type }}.jar
```

Variáveis do servidor:

```
{{ $server['allocation']['port'] }}
{{ $server['user']['username'] }}
```

## Exemplo GeyserMC

Arquivo pronto em `templates/data/geysermc.json`.

**Admin → Template Installer → Importar JSON** e cole o conteúdo do arquivo.

- **Ação:** pull
- **File:** plugins/Geyser-Spigot.jar
- **Content:** https://download.geysermc.org/...

## Compatibilidade

- Blueprint `beta-2026-06`
- Pterodactyl 1.x
