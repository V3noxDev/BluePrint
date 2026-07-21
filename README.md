# MineFlow

Extensão Blueprint para Pterodactyl que centraliza addons e configurações de servidores Minecraft Java em uma interface moderna.

Compatibilidade alvo:

- Blueprint `beta-2026-06`
- Pterodactyl `1.14.x`
- PHP `8.2+`
- Servidores Paper, Purpur, Spigot, Folia, Velocity, Fabric, Forge, NeoForge, Quilt e derivados

## Recursos

- catálogo de plugins e mods usando a API oficial do Modrinth;
- filtros por versão do Minecraft, loader e popularidade;
- seleção da versão antes de instalar;
- download somente do CDN permitido e validação SHA-512;
- instalação em `/plugins` ou `/mods`;
- listagem e remoção dos arquivos JAR instalados;
- editor visual das configurações mais usadas do `server.properties`;
- editor avançado para qualquer outra propriedade;
- preservação dos comentários e das propriedades não alteradas;
- interface responsiva integrada ao tema do Pterodactyl;
- permissões de subusuários e registros de atividade nativos.

## Instalação

1. Instale ou atualize o Blueprint no painel Pterodactyl.
2. Baixe `dist/mineflow.blueprint` deste repositório.
3. Envie o arquivo para a raiz do painel, normalmente `/var/www/pterodactyl`.
4. Execute:

```bash
cd /var/www/pterodactyl
blueprint -install mineflow.blueprint
```

5. No administrador do Blueprint, vincule a rota **MineFlow** somente aos eggs de Minecraft Java.

A nova aba aparecerá dentro de cada servidor compatível.

## Permissões

O proprietário e administradores possuem acesso automaticamente. Para subusuários:

| Ação | Permissão necessária |
| --- | --- |
| Abrir a extensão e listar addons | `file.read` |
| Ler `server.properties` | `file.read-content` |
| Instalar addons e salvar propriedades | `file.create` |
| Remover addons | `file.delete` |

O MineFlow não recebe chaves da API do usuário. As rotas usam a sessão ou a Client API do próprio Pterodactyl, passam por `AuthenticateServerAccess` e nunca aceitam uma URL arbitrária para download.

## Desenvolvimento

O código da extensão está na raiz deste repositório. Não existem dependências JavaScript extras: os componentes são compilados pelo próprio painel durante a instalação.

Validar PHP e estrutura:

```bash
./scripts/validate.sh
```

Gerar o pacote:

```bash
./scripts/build.sh
```

Para testar em um painel de desenvolvimento Blueprint, copie o projeto para `.blueprint/dev`, ative o modo de desenvolvedor e execute:

```bash
blueprint -build
```

## Limites e cuidados

- Cada arquivo do Modrinth pode ter no máximo 64 MiB.
- A remoção de um addon é permanente; faça backups.
- Reinicie o servidor depois de alterar addons ou propriedades.
- O MineFlow instala plugins e mods individuais. Instalação completa de modpacks não faz parte desta versão.
- Modrinth e Pterodactyl são projetos independentes e não são afiliados ao MineFlow.

## Licença

MIT. Consulte [LICENSE](LICENSE).