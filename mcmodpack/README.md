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
- Instala o **server pack** quando existir
- Baixa os mods do `manifest.json`
- Wipe e EULA opcionais (não bloqueiam a instalação)
- UI em português no estilo Modpacks comercial

## API Key (obrigatória)

1. Crie uma chave em [console.curseforge.com](https://console.curseforge.com/)
2. Admin → Extensions → **MC Modpacks** → cole a key → Salvar
3. Sem key: o painel mostra *“Não encontramos nenhum modpack”*

## Wings

Para o download funcionar, no `config.yml` do Wings:

```yaml
api:
  disable_remote_download: false
```

Reinicie o Wings depois.

## Requisitos

- Blueprint `beta-2026-06`+
- Eggs Forge / NeoForge (liberar na engrenagem do Blueprint)
- CurseForge API Key

## Instalação

```bash
cp -r mcmodpack /var/www/pterodactyl/.blueprint/dev/
cd /var/www/pterodactyl
blueprint -build
# ou
blueprint -export mcmodpack
blueprint -install mcmodpack.blueprint
php artisan migrate
```

## API do addon

| Método | Endpoint |
|--------|----------|
| `GET` | `/api/client/extensions/mcmodpack/servers/{server}/modpacks` |
| `GET` | `/api/client/extensions/mcmodpack/servers/{server}/modpacks/{id}` |
| `GET` | `/api/client/extensions/mcmodpack/servers/{server}/modpacks/{id}/files` |
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
