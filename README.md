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
- Stable + Preview via API oficial
- PocketMine marcado como “Em breve”
- Atualiza `BEDROCK_VERSION`
