# Admin Infra

Blueprint addon que transforma o painel administrativo do Pterodactyl num tema escuro profissional — preto, branco e acentos configuráveis — com foco em **infraestrutura**: nodes, allocations, criação de servidores e tabelas de dados.

## O que muda

- **Tema escuro global** no admin (sidebar, header, boxes, tabelas, modais, formulários, Select2, SweetAlert)
- **Página About do node** reorganizada:
  - Card **Recursos & uso** em largura total com gráficos de RAM e disco
  - Barras com rótulo: limite, alocado, uso real, configurado
  - Skeleton de carregamento e badge de status Wings
- **Gerenciamento** em abas inferiores: Alocações | Servidores (iframe embed)
- Remove **Total de Servidores** do About
- **Pré-visualização de cor** na página de configuração
- **Modo compacto** opcional

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
