# Minecraft Properties Studio (Blueprint Extension)

Extensão Blueprint para Pterodactyl que adiciona uma página no painel do servidor para edição visual de `server.properties` (Minecraft Java).

## Recursos

- UI com busca de propriedades
- edição de valores sem abrir file manager
- botão de salvar direto no arquivo `/server.properties`
- preservação de comentários e linhas não reconhecidas

## Instalação em modo DEV

Copie esta pasta para:

```text
/var/www/pterodactyl/.blueprint/dev
```

Depois execute:

```bash
cd /var/www/pterodactyl
blueprint -build
```

## Empacotar em `.blueprint`

No diretório do painel:

```bash
blueprint -export
```

Isso gera `mcproperties.blueprint`, que pode ser instalado com:

```bash
blueprint -install mcproperties
```
