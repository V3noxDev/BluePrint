# Bedrock Version Manager

Blueprint addon para seleção profissional de versões do **Minecraft Bedrock Dedicated Server**.

## URL

```
/server/{id}/minecraft/bedrock-version
```

## O que faz

- Importa o catálogo completo via [Bedrock-OSS/BDS-Versions](https://github.com/Bedrock-OSS/BDS-Versions)
- Detecta builds novas pela API oficial da Mojang
- Agrupa **versão Minecraft** (3 segmentos) e **builds** (4º segmento / hotfix)
- Labels **RELEASE** e **PREVIEW**
- Atualiza a variável de startup `BEDROCK_VERSION`
- UI no estilo Versions (software → versão → modal de build)
- Detecção automática de servidor Bedrock (egg / variável / imagem)

## Versão vs Build

No BDS, o pacote usa 4 números — exemplo: `1.26.33.2`

| Parte | Significado | Exemplo |
|-------|-------------|---------|
| `1.26.33` | Versão Minecraft (card na UI) | Release 1.26.33 |
| `.2` | Build / republicação hotfix | Build #2 |

Quando a Mojang corrige um erro na mesma versão do jogo, publica uma build nova
(`1.26.33.1` → `1.26.33.2`). O card continua o mesmo; o modal deixa escolher a build.

## Requisitos

- Blueprint `beta-2026-06`+
- Egg Bedrock com variável `BEDROCK_VERSION`
- Imagem sugerida: `ghcr.io/ptero-eggs/yolks:debian`

## Instalação

```bash
cp -r bedrockversions /var/www/pterodactyl/.blueprint/dev/
cd /var/www/pterodactyl
blueprint -build
# ou
blueprint -export bedrockversions
blueprint -install bedrockversions.blueprint
```

Depois:

1. Admin → Extensions → **Bedrock Version Manager**
2. Engrenagem do Blueprint → liberar só nos eggs Bedrock
3. (Opcional) Rodar `php artisan bedrockversions:sync`

## Atualização

```bash
blueprint -install bedrockversions.blueprint
php artisan migrate
php artisan bedrockversions:sync
```

## Desinstalação

```bash
blueprint -remove bedrockversions
```

## API do addon

| Método | Endpoint |
|--------|----------|
| `GET` | `/api/client/extensions/bedrockversions/servers/{server}/versions` |
| `POST` | `/api/client/extensions/bedrockversions/servers/{server}/versions/sync` |
| `POST` | `/api/client/extensions/bedrockversions/servers/{server}/versions/install` |

Body do install:

```json
{
  "channel": "stable",
  "version": "1.26.33.2",
  "wipe": false,
  "accept_eula": false,
  "restart": true
}
```

`wipe` e `accept_eula` são opcionais. Sem wipe o egg só dá replace nos arquivos da build.
Com `accept_eula: true` o addon grava `eula.txt` com `eula=true`.

## Fontes de versões

1. **Catálogo completo** — [Bedrock-OSS/BDS-Versions](https://github.com/Bedrock-OSS/BDS-Versions)
2. **Metadados por build** — `linux/{versão}.json` (build_id, data, download_url)
3. **Mojang (latest)** — API oficial para detectar pacotes novos imediatamente

## Estrutura

```
bedrockversions/
├── conf.yml
├── admin/
├── app/
├── routes/client.php
├── components/
├── console/
├── database/migrations/
└── data/
```

## Licença

MIT
