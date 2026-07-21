# MC Server Properties Pro

Addon Blueprint para o Pterodactyl mais recente, focado em edicao de `server.properties` de servidores Minecraft Java com uma interface admin mais bonita, organizada e pronta para uso comercial.

## O que este projeto entrega

- addon Blueprint moderno com `conf.yml` no formato atual;
- pagina admin caprichada em Blade + CSS;
- seletor de servidor e caminho do arquivo;
- editor visual para propriedades comuns do Minecraft Java;
- editor raw para ajustes avancados;
- escrita real do arquivo via `DaemonFileRepository` do Pterodactyl/Wings;
- scripts de lifecycle do Blueprint:
  - `install.sh`
  - `remove.sh`
  - `export.sh`
- instalador interativo com menu:
  - `scripts/blueprint-installer.sh`

## Compatibilidade

- Blueprint target: `beta-2026-05`
- Pensado para paines Pterodactyl com Blueprint instalado
- Fluxo de arquivo alvo padrao: `server.properties`

## Estrutura

```text
.
|-- conf.yml
|-- admin/
|   |-- Controller.php
|   |-- admin.css
|   `-- view.blade.php
|-- app/
|   `-- Services/
|       `-- ServerPropertiesEditor.php
|-- data/
|   |-- export.sh
|   |-- install.sh
|   `-- remove.sh
`-- scripts/
    `-- blueprint-installer.sh
```

## Como funciona

### 1. Selecionar o servidor

Na pagina admin da extensao voce escolhe um servidor e o caminho do arquivo. O padrao e:

```bash
server.properties
```

### 2. Carregar o arquivo

O controller usa o repositorio interno do Pterodactyl para buscar o conteudo do arquivo no Wings:

- leitura: `getContent()`
- escrita: `putContent()`

### 3. Editar

Voce pode:

- editar campos comuns com UI rapida;
- ajustar o texto bruto no editor raw;
- salvar tudo direto no servidor selecionado.

Os campos visuais sao mesclados ao conteudo raw antes do salvamento, assim voce mantem flexibilidade para configuracoes nao mapeadas pela UI.

## Instalacao do addon

### Metodo oficial Blueprint

No painel Pterodactyl com Blueprint instalado:

```bash
blueprint -export
blueprint -install mcserverprops
```

### Remocao

```bash
blueprint -remove mcserverprops
```

## Instalador interativo

Este repositorio inclui um menu em bash:

```bash
chmod +x scripts/blueprint-installer.sh
./scripts/blueprint-installer.sh
```

Opcoes do menu:

1. instalar addon a partir de um `.blueprint`
2. remover addon
3. exportar pacote `.blueprint`
4. rebuild local do Blueprint
5. ajuda rapida

## Observacoes importantes

- O addon foi feito para servidores Minecraft Java.
- A escrita do arquivo depende do painel conseguir acessar o Wings do servidor.
- Se o caminho do arquivo estiver errado ou o Wings negar a operacao, a extensao mostra erro na admin page.
- O fluxo usa a infraestrutura do proprio Pterodactyl, sem gambiarras de FTP externo.

## Ideias para proxima versao

- filtro automatico para listar apenas servidores de egg Minecraft Java;
- backup automatico de `server.properties` antes de salvar;
- presets por tipo de servidor;
- suporte a edicao por usuario dentro do dashboard client com components React do Blueprint.