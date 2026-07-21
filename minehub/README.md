# MineHub — Blueprint Extension

Editor visual de `server.properties` para servidores Minecraft Java no Pterodactyl, no estilo Configs.

## URL

```
/server/{id}/minecraft/properties
```

## Funcionalidades

- Dropdown do arquivo (`server.properties`)
- Busca em tempo real
- Botão **Save**
- Grid de 2 colunas com cards
- Labels em UPPERCASE
- Toggle azul para booleans
- Input para strings/números
- Leitura e escrita via Wings API

## Requisitos

- Blueprint `beta-2026-06`+
- Pterodactyl Panel v1.12.x
- Node.js v20.x+
- Servidor Minecraft Java

## Instalação

```bash
cp -r minehub /var/www/pterodactyl/.blueprint/dev/
cd /var/www/pterodactyl
blueprint -build
```

Ou:

```bash
blueprint -export minehub
blueprint -install minehub.blueprint
```

## Estrutura

```
minehub/
├── conf.yml
├── admin/
├── app/
│   ├── ServerPropertiesController.php
│   └── ServerPropertiesService.php
├── routes/client.php
└── components/
    ├── Components.yml
    ├── dashboard.css
    └── sections/
        ├── MinecraftPropertiesSection.tsx
        └── ServerPropertiesEditor.tsx
```

## API

| Método | Endpoint |
|--------|----------|
| `GET` | `/api/client/extensions/minehub/servers/{server}/properties` |
| `POST` | `/api/client/extensions/minehub/servers/{server}/properties` |

## Licença

MIT
