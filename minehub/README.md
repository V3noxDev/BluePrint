# MineHub — Blueprint Extension para Pterodactyl

Extensão Blueprint premium para gerenciamento de servidores **Minecraft Java** no painel Pterodactyl.

## Funcionalidades

### ⚙️ Editor de Server Properties
- Interface visual categorizada (Geral, Gameplay, Mundo, Performance, Avançado)
- Toggles, selects e inputs para todas as propriedades principais
- Leitura e escrita direta no `server.properties` via Wings API
- Barra de salvamento com detecção de alterações

### 📦 Addon Manager (Auto-Installer)
- Catálogo de addons com instalação em um clique
- Sistema de seleção: instalar e remover addons
- Lista de addons instalados no servidor
- Busca e filtros no catálogo
- Download seguro com verificação de permissões

### 🛠️ Painel Admin
- UI moderna estilo premium (dark theme, cards, animações)
- Gerenciamento do catálogo de addons (adicionar, editar, remover)
- Ativar/desativar módulos (Properties, Addons)
- Configurar diretório de instalação (`/plugins`, `/mods`, etc.)
- Toggle de auto-instalação

## Requisitos

- [Blueprint](https://blueprint.zip) `beta-2026-06` ou superior
- Pterodactyl Panel v1.12.x
- Node.js v20.x+
- PHP 8.1+
- Servidor Minecraft Java (Paper, Spigot, Bukkit, etc.)

## Instalação

### 1. Empacotar a extensão

No diretório do Pterodactyl com Blueprint instalado e Developer Mode ativo:

```bash
# Copie a pasta minehub para .blueprint/dev/ ou use export
cd /var/www/pterodactyl
blueprint -export minehub
```

Ou instale diretamente em modo dev:

```bash
cp -r minehub .blueprint/dev/
cd .blueprint/dev
blueprint -build
```

### 2. Instalar no painel

```bash
cd /var/www/pterodactyl
blueprint -install minehub.blueprint
```

### 3. Configurar

1. Acesse **Admin → Extensions → MineHub**
2. Ative os módulos desejados
3. Configure o catálogo de addons
4. Salve as alterações

### 4. Usar no servidor

1. Acesse qualquer servidor Minecraft no painel
2. Clique em **Minecraft** na navegação
3. URLs disponíveis:
   - `/server/{id}/minecraft/properties` — Editor de server.properties
   - `/server/{id}/minecraft/addons` — Gerenciador de addons

## Estrutura do Projeto

```
minehub/
├── conf.yml                          # Configuração Blueprint
├── admin/
│   ├── controller.php                # Controller do painel admin
│   ├── view.blade.php                # Interface admin (Blade)
│   └── admin.css                     # Estilos do admin
├── app/
│   ├── ServerPropertiesController.php
│   ├── ServerPropertiesService.php
│   ├── AddonManagerController.php
│   └── AddonCatalogService.php
├── routes/
│   ├── client.php                    # API client (autenticada)
│   └── web.php                       # Rotas web
├── components/
│   ├── Components.yml                # Registro de componentes React
│   ├── dashboard.css                 # Estilos do dashboard
│   ├── tsconfig.json
│   └── sections/
│       ├── MineHubSection.tsx        # Página principal
│       ├── ServerPropertiesEditor.tsx
│       └── AddonManager.tsx
└── data/
    ├── default-catalog.json          # Catálogo padrão de addons
    ├── icon.svg
    └── install.sh                    # Script de instalação
```

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/client/extensions/minehub/servers/{server}/properties` | Ler server.properties |
| `POST` | `/api/client/extensions/minehub/servers/{server}/properties` | Salvar server.properties |
| `GET` | `/api/client/extensions/minehub/servers/{server}/addons/catalog` | Listar catálogo |
| `POST` | `/api/client/extensions/minehub/servers/{server}/addons/install` | Instalar addon |
| `DELETE` | `/api/client/extensions/minehub/servers/{server}/addons/{filename}` | Remover addon |

## Desenvolvimento

```bash
# Ativar developer mode no admin: Extensions → Blueprint → developer = true
blueprint -init   # ou copie para .blueprint/dev/
blueprint -build  # Aplicar alterações
```

## Licença

MIT
