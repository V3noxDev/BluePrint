# Astra MC Suite for Blueprint

Extensao Blueprint para o Pterodactyl focada em **Minecraft Java**, com visual premium e dois modulos principais:

- **Instalador de addons**
  - busca projetos no **Modrinth**
  - filtros por **tipo**, **loader** e **versao**
  - instalacao manual por **URL direta**
  - listagem e **remocao** de arquivos em `plugins`, `mods`, `resourcepacks`, `world/datapacks` e `config`
- **Editor de `server.properties`**
  - interface visual para as propriedades mais usadas
  - editor bruto para configuracoes avancadas
  - backup automatico em `server.properties.bak`
  - merge preservando comentarios e ordem do arquivo no modo visual

## Estrutura do projeto

```text
.
├── app/
│   ├── MinecraftSuiteController.php
│   └── ServerPropertiesEditor.php
├── resources/
│   ├── icon.svg
│   ├── scripts/
│   │   └── components/
│   │       ├── Components.yml
│   │       └── server/
│   │           └── minecraftsuite/
│   │               └── MinecraftSuiteContainer.tsx
│   └── views/
│       └── view.blade.php
├── routes/
│   └── web.php
├── conf.yml
└── package-blueprint.sh
```

## Compatibilidade

- **Blueprint target:** `beta-2026-01`
- **Painel:** Pterodactyl com Blueprint instalado
- **Foco:** servidores **Minecraft Java**

> O target foi alinhado com exemplos publicos recentes do ecossistema Blueprint.

## Como empacotar

Use o script abaixo para gerar o arquivo final:

```bash
chmod +x package-blueprint.sh
./package-blueprint.sh
```

Isso gera:

```text
minecraftsuite.blueprint
```

## Como instalar no painel

1. Envie `minecraftsuite.blueprint` para a raiz do Pterodactyl.
2. Entre via SSH no diretorio do painel.
3. Rode:

```bash
blueprint -i minecraftsuite.blueprint
```

## Rotas da extensao

As rotas web registradas pela extensao sao:

- `GET /extensions/minecraftsuite/properties`
- `PATCH /extensions/minecraftsuite/properties`
- `GET /extensions/minecraftsuite/addons`
- `POST /extensions/minecraftsuite/addons/install`
- `DELETE /extensions/minecraftsuite/addons/remove`

## Observacoes de implementacao

- A instalacao de addons usa o `DaemonFileRepository::pull()` para baixar direto pelo Wings.
- A remocao usa `DaemonFileRepository::deleteFiles()`.
- A leitura e gravacao do `server.properties` usam `getContent()` e `putContent()`.
- O editor visual faz merge das chaves estruturadas no arquivo atual; o editor bruto sobrescreve o conteudo inteiro.

## Ajustes que voce pode querer depois

- integrar outros catalogos alem do Modrinth
- adicionar autenticacao para downloads premium
- criar tela admin com presets proprios por empresa
- adicionar mais campos no editor visual do `server.properties`