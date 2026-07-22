# BluePrint

Repositório com extensões Blueprint para Pterodactyl.

## Extensões

### [Server Properties](./serverprops/)

Editor visual de `server.properties` (PT-BR):

- URL: `/server/{id}/minecraft/properties`
- Só mostra propriedades existentes no arquivo
- Eggs configuráveis na engrenagem do Blueprint

### [Bedrock Version Manager](./bedrockversions/)

Seletor de versões do Bedrock Dedicated Server:

- URL: `/server/{id}/minecraft/bedrock-version`
- Catálogo BDS completo + builds hotfix
- Baixa o zip oficial via install do egg
- Atualiza `BEDROCK_VERSION`

### [MC Modpacks](./mcmodpack/)

Instalador de modpacks CurseForge (Forge / NeoForge / Fabric):

- URL: `/server/{id}/minecraft/modpacks`
- API Key configurável no admin
- Busca, detalhes, versões e install com server pack

### [MC Plugins](./mcplugins/)

Gerenciador de plugins CurseForge (Paper / Spigot / Purpur):

- URL: `/server/{id}/minecraft/plugins`
- Buscar Plugins + Gerenciar Plugins
- Instalar, atualizar e remover `.jar` em `/plugins`
