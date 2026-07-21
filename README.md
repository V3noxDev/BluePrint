# Blueprint Addon - Minecraft `server.properties` Manager

Projeto pronto para criar e distribuir um addon no ecossistema **Blueprint (Pterodactyl)** com:

- instalador automatico com menu de selecao;
- fluxo de instalar/remover addon (`blueprint -install` / `blueprint -remove`);
- gerenciador de `server.properties` para servidores Minecraft Java;
- presets rapidos (survival, minigames, hardcore);
- snippet de configuracao de Egg para Pterodactyl moderno.

## Estrutura

- `blueprint-addon/`: fonte da extensao Blueprint
- `scripts/auto-installer.sh`: menu principal para instalar/remover e abrir o wizard
- `scripts/mc-server-properties-manager.sh`: gerenciador de `server.properties`
- `scripts/build-blueprint-package.sh`: gera pacote `.blueprint`
- `examples/pterodactyl/egg-config-server-properties.json`: exemplo de parser para Egg

## Requisitos

- Linux com Bash 4+
- `zip` e `unzip`
- Blueprint instalado no painel Pterodactyl
- Acesso ao diretório do painel (padrao: `/var/www/pterodactyl`)

## Como usar

1. Gere o pacote:

```bash
./scripts/build-blueprint-package.sh
```

2. Rode o instalador com menu:

```bash
./scripts/auto-installer.sh
```

3. No menu voce pode:
   - instalar o addon Blueprint;
   - remover o addon Blueprint;
   - abrir wizard para editar `server.properties`;
   - aplicar presets rapidamente.

## Compatibilidade Blueprint

O `conf.yml` desta extensao foi configurado para:

- `target: stable-2025-04`

Se seu Blueprint estiver em outra versao, ajuste esse campo antes de empacotar.

## Observacao importante (Pterodactyl Egg)

No Pterodactyl, valores de `server.properties` podem ser sobrescritos pelo `config.files.find` do Egg.
Use o arquivo de exemplo em `examples/pterodactyl/egg-config-server-properties.json` para alinhar essa sincronizacao.