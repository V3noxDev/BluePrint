# MC Plugins

Blueprint addon para gerenciar **plugins Minecraft** (Paper / Spigot / Purpur).

## URL

```
/server/{id}/minecraft/plugins
```

## Provedores

| Provedor | API Key | Observação |
|----------|---------|------------|
| **Modrinth** | Não precisa | Padrão ao abrir o painel |
| **Hangar** | Não precisa | Repositório oficial PaperMC |
| **SpigotMC** | Não precisa | Busca via API pública Spigot/Spiget |
| **CurseForge** | Obrigatória | Sem key: aviso igual ao MC Modpacks |

## O que faz

- **Buscar Plugins** — catálogo em 4 provedores
- **Gerenciar Plugins** — lista jars em `/plugins`, atualizar e remover
- Detalhes com Descrição / Versões
- Instalação real: baixa o `.jar` para `/plugins`
- Interface 100% em português

## API Key CurseForge (opcional para outros provedores)

1. [console.curseforge.com](https://console.curseforge.com/)
2. Admin → Extensions → **MC Plugins** → salvar key
3. Sem key no CurseForge: o painel mostra *“Não encontramos nenhum plugin”* nesse provedor

## Entrega de arquivos ao Wings

Ordem de tentativa na instalação:

1. **Pull remoto** — Wings baixa da URL do provedor (rápido quando funciona)
2. **Download via painel** — PHP baixa e envia com `putContent` (fallback automático)

Funciona mesmo com `api.disable_remote_download: true` no Wings — o fallback via painel não depende de pull remoto.

### Config Wings recomendada

```yaml
# /etc/pterodactyl/config.yml
api:
  disable_remote_download: false   # opcional — pull direto fica mais rápido
  upload_limit: 100                # suficiente para plugins .jar
```

Reinicie o Wings após alterar: `systemctl restart wings`

## Instalação

```bash
cp -r mcplugins /var/www/pterodactyl/.blueprint/dev/
cd /var/www/pterodactyl
blueprint -build
blueprint -install mcplugins.blueprint
php artisan migrate --force
php artisan cache:clear
```

## Licença

MIT
