# Admin Infra

Blueprint addon que transforma o painel administrativo do Pterodactyl num tema escuro profissional — preto, branco e acentos configuráveis — com foco em **infraestrutura**: nodes, allocations, criação de servidores e tabelas de dados.

## O que muda

- **Tema escuro global** no admin (sidebar, header, boxes, tabelas, modais, formulários, Select2)
- **Página About do node** com gráficos de RAM e disco:
  - Configurado no node
  - Limite com overallocation
  - Alocado nos servidores (painel)
  - **Uso real no node** (soma via Wings — não por container)
- **Alocações e Servidores** em abas na parte inferior do About (sem ir nas abas de cima)
- Remove o card **Total de Servidores** do About
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
- Wings conectado para exibir uso real de RAM/disco

## Estrutura

```
admininfra/
├── conf.yml
├── admin/
│   ├── wrapper.blade.php   # injeta CSS variables + node-view.js
│   ├── admin.css           # tema global + node dashboard
│   ├── controller.php
│   └── view.blade.php
├── app/
│   ├── NodeInfraService.php
│   └── NodeInfraController.php
├── routes/web.php          # API /extensions/admininfra/nodes/{id}/stats
├── public/node-view.js
├── data/icon.svg
├── install.sh
└── remove.sh
```
