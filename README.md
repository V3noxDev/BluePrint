# Minecraft Properties Blueprint

Addon Blueprint para Pterodactyl que adiciona um editor bonito de `server.properties`
para servidores Minecraft Java.

## Recursos

- Rota no painel do servidor: `MC Properties`.
- Editor visual com busca, filtro por categoria e campos tipados.
- Presets prontos: Survival balanceado, Criativo, Hardcore e Performance.
- Modo raw avancado para editar o arquivo completo.
- Backup automatico em `/server.properties.blueprint.bak` antes de salvar.
- Chaves customizadas para propriedades novas ou especificas de versoes/modpacks.
- Tela admin com orientacoes e permissao configuravel pelo Blueprint.
- Instalador interativo para build, install/update, remove e status.

## Compatibilidade

- Pterodactyl Panel com Blueprint Framework.
- Target Blueprint: `beta-2026-01`.
- Servidores Minecraft Java que usam `/server.properties` na raiz do container.

> Dica: no admin do Blueprint, restrinja a rota deste addon para eggs de Minecraft
> Java. O addon tambem valida permissao de arquivo antes de ler/gravar.

## Estrutura

```text
.
├── conf.yml
├── install.sh
├── app/
│   └── MinecraftPropertiesController.php
├── routes/
│   └── client.php
├── resources/
│   ├── css/
│   ├── public/
│   ├── scripts/components/
│   └── views/
└── scripts/
    └── build-blueprint.sh
```

## Build do pacote

```bash
./install.sh --build
```

ou:

```bash
./scripts/build-blueprint.sh
```

O pacote sera criado em:

```text
dist/minecraftproperties.blueprint
```

## Instalacao interativa

Envie a pasta para o host do painel e rode:

```bash
chmod +x install.sh scripts/build-blueprint.sh
./install.sh
```

Menu disponivel:

1. Build package only
2. Install or update addon
3. Remove addon
4. Show status
5. Exit

## Instalacao manual

```bash
./scripts/build-blueprint.sh
cp dist/minecraftproperties.blueprint /var/www/pterodactyl/minecraftproperties.blueprint
cd /var/www/pterodactyl
blueprint -install minecraftproperties
```

## Remocao manual

```bash
cd /var/www/pterodactyl
blueprint -remove minecraftproperties
```

## API client criada pelo addon

As rotas ficam sob o prefixo do Blueprint:

```text
/api/client/extensions/minecraftproperties/servers/{server}/properties
```

- `GET /` carrega e interpreta o arquivo.
- `PATCH /` salva propriedades por chave/valor.
- `PUT /raw` salva o conteudo bruto.

## Permissoes

Podem usar o editor:

- dono do servidor;
- root admin;
- subuser com permissao de arquivo compativel (`file.read`, `file.read-content`
  ou `file.update`, dependendo da acao).

## Observacao importante

Salvar altera o arquivo no container via Wings. Algumas propriedades do Minecraft
so entram em vigor depois de reiniciar o servidor.