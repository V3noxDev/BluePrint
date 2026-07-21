# Minecraft Properties — Blueprint

Extensão visual para editar o `server.properties` de servidores Minecraft Java diretamente no Pterodactyl.

Compatibilidade pesquisada e usada no desenvolvimento:

- Blueprint Framework `beta-2026-06`
- Pterodactyl Panel `1.14.1`
- Minecraft Java (Vanilla, Paper, Purpur, Spigot, Fabric, Forge e derivados que usam `server.properties`)

## Recursos

- Interface moderna, responsiva e em português.
- Mais de 40 opções organizadas em Geral, Jogabilidade, Mundo, Jogadores, Desempenho e Avançado.
- Presets para Survival, servidor privado, Criativo, Hardcore e desempenho.
- Busca por nome, chave ou descrição.
- Validação de números, limites e opções sensíveis.
- Editor avançado do arquivo completo.
- Preserva comentários, formatação não alterada e configurações desconhecidas.
- Indicador de mudanças, recarregar e descartar.
- Respeita as permissões de subusuário do Pterodactyl.
- Não precisa de banco de dados, API externa ou credenciais.

## Instalação

O pacote pronto está em `dist/serverproperties.blueprint`.

1. Instale o [Blueprint Framework](https://blueprint.zip/guides/admin/install) no painel.
2. Envie `serverproperties.blueprint` para a raiz do Pterodactyl, normalmente `/var/www/pterodactyl`.
3. Execute:

```bash
cd /var/www/pterodactyl
blueprint -install serverproperties
```

Depois, abra um servidor e use a aba **Minecraft Properties**.

Se a aba não deve aparecer em todos os eggs, altere a seleção de eggs na página administrativa da extensão no Blueprint.

## Permissões

Proprietários e administradores têm acesso automaticamente. Um subusuário precisa de:

| Permissão | Finalidade |
| --- | --- |
| `file.read-content` | Abrir o `server.properties` |
| `file.create` | Autorizar a API de escrita do Pterodactyl |
| `file.update` | Autorizar a edição de um arquivo existente |

O endpoint de escrita do Pterodactyl 1.14.1 verifica `file.create`, enquanto o editor oficial também verifica `file.update`; por isso a extensão exige as duas para salvar.

## Remoção

```bash
cd /var/www/pterodactyl
blueprint -remove serverproperties
```

A remoção exclui somente a extensão. Nenhum `server.properties` é alterado ou removido.

## Gerar o pacote

Requer Node.js 22+, Bash, `zip` e `sha256sum`:

```bash
chmod +x scripts/build.sh
./scripts/build.sh
```

O script valida a estrutura e cria `dist/serverproperties.blueprint`, que é um ZIP compatível com o instalador do Blueprint.

## Desenvolvimento no Blueprint

No painel de desenvolvimento:

```bash
blueprint -init
# copie os arquivos deste repositório para .blueprint/dev
blueprint -dist
blueprint -build
blueprint -export
```

O Blueprint compila os componentes React/TypeScript junto com o frontend do Pterodactyl. Não existe um bundle npm separado para esta extensão.

## Segurança e comportamento

- O frontend usa somente os endpoints autenticados de arquivos do próprio Pterodactyl.
- O arquivo acessado é fixo em `/server.properties`.
- Portas e alocações não são editadas pela extensão.
- Alterações só são enviadas quando o usuário clica em **Salvar configurações**.
- A maioria das opções exige reiniciar o servidor.
- O modo avançado permite qualquer conteúdo; revise-o antes de salvar.

## Estrutura

```text
admin/view.blade.php                    Página administrativa
assets/icon.svg                         Ícone da extensão
components/Components.yml               Registro da rota Blueprint
components/lib/properties.ts             Parser sem perdas
components/lib/schema.ts                 Campos, limites e presets
components/sections/PropertiesManager.tsx Interface do cliente
conf.yml                                 Manifesto Blueprint
scripts/build.sh                         Empacotador
tests/properties.test.ts                 Testes do parser
```