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

## Wings e download

1. Tenta **pull direto no Wings** (quando suportado)
2. Se falhar, o painel PHP baixa da CurseForge e envia ao servidor
3. Arquivos grandes (>8 MB) usam **curl** no servidor PHP — instale `curl` se ainda não tiver
4. O Wings precisa estar **online** para receber arquivos e descompactar o zip

## Requisitos

- Blueprint `beta-2026-06`+
- Eggs Forge / NeoForge (liberar na engrenagem do Blueprint)
- CurseForge API Key
- `curl` no host PHP (upload de server packs grandes)

## Instalação

```bash
cp -r mcmodpack /var/www/pterodactyl/.blueprint/dev/
cd /var/www/pterodactyl
blueprint -build
# ou
blueprint -export mcmodpack
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
