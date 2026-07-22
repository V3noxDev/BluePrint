# Admin Infra

Blueprint addon que transforma o painel administrativo do Pterodactyl num tema escuro profissional — preto, branco e acentos configuráveis — com foco em **infraestrutura**: nodes, allocations, criação de servidores e tabelas de dados.

## O que muda

- **Tema escuro global** no admin (sidebar, header, boxes, tabelas, modais, formulários, Select2)
- **Melhor legibilidade** em páginas de nodes, allocations e wizard de criar servidor
- **Cor de destaque** personalizável (padrão: azul `#3b82f6`)
- **Modo compacto** opcional para painéis com muitas linhas/tabelas

## Instalação

```bash
blueprint -build
blueprint -install admininfra.blueprint
```

## Configuração

Em **Admin → Extensions → Admin Infra**:

| Opção | Descrição |
|-------|-----------|
| Cor de destaque | Cor principal (botões, links, item ativo da sidebar) |
| Modo compacto | Reduz padding em tabelas e cards |

## Compatibilidade

- Blueprint `beta-2026-06`
- Pterodactyl 1.x (AdminLTE)

## Estrutura

```
admininfra/
├── conf.yml
├── admin/
│   ├── wrapper.blade.php   # injeta CSS variables + classe compact
│   ├── admin.css           # tema global
│   ├── controller.php
│   └── view.blade.php
├── data/icon.svg
├── install.sh
└── remove.sh
```
