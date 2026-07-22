# MC Plugins

Blueprint addon para gerenciar **plugins Minecraft** (Paper / Spigot / Purpur) via **Modrinth** e **CurseForge**.

## URL

```
/server/{id}/minecraft/plugins
```

## O que faz

- **Buscar Plugins** — catálogo **Modrinth** (sem API Key) e **CurseForge** (com API Key)
- **Gerenciar Plugins** — lista jars em `/plugins`, atualizar e remover
- Detalhes com Descrição / Versões
- Instalação real: baixa o `.jar` para `/plugins`
- Interface 100% em português

## Provedores

| Provedor | API Key | Observação |
|----------|---------|------------|
| **Modrinth** | Não precisa | Padrão ao abrir o painel |
| **CurseForge** | Obrigatória | Bukkit Plugins via CurseForge for Studios |

## API Key CurseForge (opcional para Modrinth)

1. [console.curseforge.com](https://console.curseforge.com/)
2. Admin → Extensions → **MC Plugins** → salvar key
3. Sem key no CurseForge: use o provedor **Modrinth** ou configure a key para buscar no CurseForge

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
| `GET` | `/api/client/extensions/mcplugins/servers/{server}/plugins?provider=modrinth\|curseforge` |
| `GET` | `/api/client/extensions/mcplugins/servers/{server}/plugins/installed` |
| `GET` | `/api/client/extensions/mcplugins/servers/{server}/plugins/{id}?provider=...` |
| `GET` | `/api/client/extensions/mcplugins/servers/{server}/plugins/{id}/files?provider=...` |
| `POST` | `/api/client/extensions/mcplugins/servers/{server}/plugins/install` |
| `POST` | `/api/client/extensions/mcplugins/servers/{server}/plugins/update` |
| `POST` | `/api/client/extensions/mcplugins/servers/{server}/plugins/remove` |

Corpo de install/update: `{ "provider": "modrinth"|"curseforge", "plugin_id": "...", "file_id": "..." }`

## Licença

MIT
