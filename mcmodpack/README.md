# MC Modpacks

Blueprint addon para instalar **modpacks CurseForge** em servidores Minecraft (Forge / NeoForge / Fabric).

## URL

```
/server/{id}/minecraft/modpacks
```

## O que faz

- Busca modpacks na API oficial do CurseForge
- Filtros: loader, versão MC, ordenação, busca
- Página de detalhes (descrição + versões)
- Instala o **server pack** quando existir (ignora manifest nesse caso)
- Baixa os mods do `manifest.json` quando não há server pack
- Wipe e EULA opcionais (não bloqueiam a instalação)
- Barra de progresso com etapas Baixar / Descompactar, ETA e cancelamento
- UI em português no estilo Modpacks comercial

## API Key (obrigatória)

1. Crie uma chave em [console.curseforge.com](https://console.curseforge.com/)
2. Admin → Extensions → **MC Modpacks** → cole a key → Salvar
3. Sem key: o painel mostra *“Não encontramos nenhum modpack”*

## Como arquivos grandes chegam ao Wings

Ordem de tentativa para server packs (~1 GB):

1. **Pull direto** — Wings baixa da CurseForge (quando a CDN permite)
2. **Pull via painel** — painel baixa, Wings puxa do `APP_URL` (contorna `upload_limit`)
3. **Upload direto** — Guzzle stream ou curl (limitado pelo Wings)

### Limite de upload do Wings (importante)

O Wings tem `api.upload_limit` com **padrão 100 MB**. Upload direto de ATM10 (~1,18 GB) **sempre falha** sem aumentar o limite.

Para packs grandes, o addon usa **pull via proxy do painel**. Requisitos:

- `APP_URL` no `.env` deve ser a URL **pública** que o node Wings consegue acessar (não `localhost`)
- Node deve conseguir fazer HTTP GET ao painel na rota `/extensions/mcmodpack/pull/{token}`

Se pull via proxy também falhar, aumente no node:

```yaml
# /etc/pterodactyl/config.yml
api:
  upload_limit: 2048   # MB — ex.: 2 GB
```

Reinicie o Wings: `systemctl restart wings`

Se usar Nginx na frente do Wings, ajuste também `client_max_body_size`.

## Requisitos

- Blueprint `beta-2026-06`+
- Eggs Forge / NeoForge (liberar na engrenagem do Blueprint)
- CurseForge API Key
- `APP_URL` acessível pelo node (para packs grandes)
- `curl` no host PHP (fallback de upload)

## Instalação

```bash
cp -r mcmodpack /var/www/pterodactyl/.blueprint/dev/
cd /var/www/pterodactyl
blueprint -build
blueprint -install mcmodpack.blueprint
php artisan migrate --force
php artisan cache:clear
```

## API do addon

| Método | Endpoint |
|--------|----------|
| `GET` | `/api/client/extensions/mcmodpack/servers/{server}/modpacks` |
| `GET` | `/api/client/extensions/mcmodpack/servers/{server}/modpacks/{id}` |
| `GET` | `/api/client/extensions/mcmodpack/servers/{server}/modpacks/{id}/files` |
| `GET` | `/api/client/extensions/mcmodpack/servers/{server}/modpacks/install/status` |
| `POST` | `/api/client/extensions/mcmodpack/servers/{server}/modpacks/install/cancel` |
| `POST` | `/api/client/extensions/mcmodpack/servers/{server}/modpacks/install` |

Body do install:

```json
{
  "modpack_id": 123456,
  "file_id": 7890123,
  "wipe": false,
  "accept_eula": false
}
```

## Licença

MIT
