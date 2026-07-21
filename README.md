# MineHub para Pterodactyl

Extensão Blueprint com interface em português para gerenciar servidores Minecraft Java.

O MineHub oferece:

- pesquisa de plugins e mods no catálogo Modrinth;
- seleção por versão do Minecraft e loader;
- instalação direta de arquivos `.jar` nas pastas `/plugins` ou `/mods`;
- listagem, ativação, desativação e remoção de addons instalados;
- editor visual do `server.properties`, dividido por categorias;
- modo avançado para editar o arquivo completo;
- preservação de comentários, propriedades desconhecidas e finais de linha;
- configurações globais no painel administrativo;
- respeito às permissões nativas de arquivos dos subusuários.

## Compatibilidade

- Blueprint `beta-2026-06`;
- Pterodactyl compatível com essa versão do Blueprint, incluindo a linha 1.14;
- Minecraft Java com servidor que utilize `server.properties`;
- plugins: Paper, Purpur, Spigot, Bukkit e Folia;
- mods: Fabric, Forge, NeoForge e Quilt.

## Instalação

1. Baixe `dist/minehub.blueprint`.
2. Copie o arquivo para a raiz do painel Pterodactyl, normalmente `/var/www/pterodactyl`.
3. Execute:

    ```bash
    blueprint -install minehub
    ```

4. No painel administrativo, abra **Extensions → MineHub** e selecione os recursos desejados.
5. Nas permissões da extensão no Blueprint, limite a rota aos eggs de Minecraft.

Para remover a extensão do painel:

```bash
blueprint -remove minehub
```

A remoção da extensão não apaga plugins, mods ou o `server.properties` dos servidores.

## Permissões de subusuário

O MineHub usa a API oficial do Pterodactyl. Cada ação exige a permissão correspondente:

| Recurso                                  | Permissão           |
| ---------------------------------------- | ------------------- |
| Listar addons                            | `file.read`         |
| Abrir `server.properties`                | `file.read-content` |
| Instalar addon                           | `file.create`       |
| Ativar, desativar ou salvar propriedades | `file.update`       |
| Remover addon                            | `file.delete`       |

## Desenvolvimento

O código-fonte da extensão fica em `minehub/`. Para gerar um pacote instalável:

```bash
chmod +x scripts/build.sh
./scripts/build.sh
```

O arquivo será criado em `dist/minehub.blueprint`. Em um painel de desenvolvimento com o
modo Developer do Blueprint ativado, a pasta também pode ser copiada para `.blueprint/dev`
e aplicada com:

```bash
blueprint -build
```

## Segurança

- O frontend nunca recebe credenciais administrativas.
- Instalação, leitura, edição e remoção passam pelos endpoints autenticados do Pterodactyl.
- O backend consulta somente a API oficial do Modrinth.
- URLs de download retornadas pelo catálogo são restritas ao CDN HTTPS do Modrinth.
- O editor sanitiza quebras de linha em valores do modo visual para impedir a criação acidental
  de propriedades adicionais.
