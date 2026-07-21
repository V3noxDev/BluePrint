# Bedrock Version Manager

Blueprint addon para seleção de versões do **Minecraft Bedrock Dedicated Server**.

## URL

```
/server/{id}/minecraft/bedrock-version
```

## O que faz

- Consulta a API oficial da Mojang
- Filtra **Stable** (`serverBedrockLinux`) e **Preview** (`serverBedrockPreviewLinux`)
- Extrai a versão da URL e mantém histórico em cache (banco)
- Atualiza a variável de startup `BEDROCK_VERSION`
- UI no estilo Versions (cards + modal Instalar)
- **PocketMine-MP** aparece como “Em breve”
- Detecção automática de servidor Bedrock (egg / variável / imagem)

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
3. (Opcional) Salvar com “Sincronizar agora”

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

## API do addon (própria)

A extensão expõe uma API client que:

1. Consulta a API oficial Mojang
2. Extrai versões das URLs
3. Verifica disponibilidade do download
4. Agrupa em `RELEASE` / `PREVIEW` com builds
5. Cacheia no banco (mantém histórico)

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
  "accept_eula": true,
  "restart": true
}
```

## Fonte oficial

```
https://net-secondary.web.minecraft-services.net/api/v1.0/download/links
```

Download Stable:

```
https://www.minecraft.net/bedrockdedicatedserver/bin-linux/bedrock-server-{VERSION}.zip
```

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
