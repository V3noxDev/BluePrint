# MC Manager — Blueprint Extension

Extensão **Blueprint** para Pterodactyl com:

- Editor visual do `server.properties` (Minecraft Java)
- Instalador / removedor de plugins via **Modrinth**
- Sistema de seleção (instalar versão / remover vários JARs)
- Painel admin com toggles e paths configuráveis
- UI client moderna (teal/emerald, glass panels)

Target Blueprint: `beta-2026-06`

## Instalação

1. Empacote a extensão (na pasta do projeto):

```bash
# Cria o arquivo .blueprint (zip renomeado)
zip -r mcmanager.blueprint . \
  -x "*.git*" \
  -x "*.blueprint" \
  -x "node_modules/*"
```

2. No painel com Blueprint instalado:

```bash
cd /var/www/pterodactyl
blueprint -install /caminho/para/mcmanager.blueprint
```

Ou, em modo developer:

```bash
# Copie o conteúdo desta pasta para .blueprint/dev
blueprint -build
```

3. Abra um servidor Minecraft Java → aba **MC Manager**.

> Dica: em Admin → Extensions → Blueprint você pode limitar a rota a eggs específicos (Paper, Purpur, Spigot, etc.).

## Funcionalidades

### server.properties
- Categorias: Geral, Gameplay, Mundo, Performance, Rede
- Toggles, selects e inputs tipados
- Preserva comentários e ordem do arquivo ao salvar
- Properties extras do arquivo também aparecem para edição

### Addons
- Lista JARs em `/plugins`
- Seleção múltipla + remoção em lote
- Busca Modrinth (plugins) filtrada por loaders configuráveis
- Instalação da versão escolhida direto no servidor via Wings

## API (client)

Prefixo: `/api/client/extensions/mcmanager/{server}`

| Method | Path | Descrição |
|--------|------|-----------|
| GET | `/config` | Configuração da extensão |
| GET | `/properties` | Lê server.properties |
| PUT | `/properties` | Salva properties |
| GET | `/addons/installed` | Lista JARs instalados |
| GET | `/addons/search` | Busca Modrinth |
| GET | `/addons/versions/{projectId}` | Versões do projeto |
| POST | `/addons/install` | Instala JAR |
| POST | `/addons/remove` | Remove JARs selecionados |

## Estrutura

```
conf.yml
admin/                  # Página admin + CSS
app/                    # Controllers (properties + addons)
components/             # React (Components.yml + UI)
routes/client.php       # Rotas client API
migrations/             # Defaults no banco
public/icon.svg
dashboard.css
```

## Requisitos

- Pterodactyl Panel + Wings
- Blueprint (`beta-2026-06` ou compatível)
- Servidor Minecraft Java com `server.properties` e pasta `plugins`

## Licença

MIT — V3noxDev
