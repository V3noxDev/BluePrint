# MC Plugins

Blueprint addon para gerenciar **plugins Minecraft** (Paper / Spigot / Purpur) via **CurseForge API**.

## URL

```
/server/{id}/minecraft/plugins
```

## O que faz

- **Buscar Plugins** — catálogo CurseForge (Bukkit Plugins)
- **Gerenciar Plugins** — lista jars em `/plugins`, atualizar e remover
- Detalhes com Descrição / Versões (estilo Modrinth/Hangar/SpigotMC na UI)
- Instalação real: baixa o `.jar` para `/plugins`
- Interface 100% em português

> A interface menciona ecossistemas como Modrinth, Hangar e SpigotMC como referência de UX, mas o **catálogo e downloads usam a API do CurseForge**.

## API Key (obrigatória)

1. [console.curseforge.com](https://console.curseforge.com/)
2. Admin → Extensions → **MC Plugins** → salvar key
3. Sem key: *“Não encontramos nenhum plugin”*

## Wings

```yaml
api:
  disable_remote_download: false
```

## Instalação

```bash
cp -r mcplugins /var/www/pterodactyl/.blueprint/dev/
cd /var/www/pterodactyl
blueprint -build
blueprint -install mcplugins.blueprint
php artisan migrate
```

## API

| Método | Endpoint |
|--------|----------|
| `GET` | `/api/client/extensions/mcplugins/servers/{server}/plugins` |
| `GET` | `/api/client/extensions/mcplugins/servers/{server}/plugins/installed` |
| `GET` | `/api/client/extensions/mcplugins/servers/{server}/plugins/{id}` |
| `GET` | `/api/client/extensions/mcplugins/servers/{server}/plugins/{id}/files` |
| `POST` | `/api/client/extensions/mcplugins/servers/{server}/plugins/install` |
| `POST` | `/api/client/extensions/mcplugins/servers/{server}/plugins/update` |
| `POST` | `/api/client/extensions/mcplugins/servers/{server}/plugins/remove` |

## Licença

MIT
