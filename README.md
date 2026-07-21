# CraftProperties

Editor visual e seguro de `server.properties` para Minecraft Java, feito como extensão do [Blueprint](https://blueprint.zip/) para Pterodactyl.

Compatibilidade de referência:

- Blueprint `beta-2026-06`
- Pterodactyl `1.14.x`
- Minecraft Java atual e propriedades legadas comuns

## Recursos

- Editor visual responsivo com busca e oito categorias.
- Mais de 70 propriedades documentadas em português.
- Campos tipados: seleções, toggles, números, senhas, textos e JSON.
- Presets para SMP, desempenho, criativo, servidor privado e hardcore.
- Validação de intervalos, UUID, SHA-1 e objetos JSON antes de salvar.
- Modo avançado para propriedades personalizadas e arquivo bruto.
- Preserva comentários, ordem, quebras de linha e opções desconhecidas.
- Backup automático em `/server.properties.craftproperties.bak`.
- Respeita as permissões nativas de conteúdo e gravação de arquivos.
- Sem banco de dados, telemetria ou serviços externos.

## Instalação automática

O instalador possui menu para instalar/atualizar, remover, consultar o status e gerar o pacote:

```bash
chmod +x installer.sh scripts/package.sh
./installer.sh --panel /var/www/pterodactyl
```

Também pode ser usado sem menu:

```bash
# Instalar ou atualizar
./installer.sh --install --panel /var/www/pterodactyl

# Consultar status
./installer.sh --status --panel /var/www/pterodactyl

# Remover sem apagar arquivos dos servidores
./installer.sh --remove --panel /var/www/pterodactyl
```

O Blueprint precisa estar instalado e configurado no painel. O instalador não baixa nem executa scripts remotos.

## Instalação manual

Gere o arquivo distribuível:

```bash
npm run package
```

Copie `dist/craftproperties.blueprint` para a raiz do Pterodactyl e execute:

```bash
cd /var/www/pterodactyl
blueprint -install craftproperties
```

No painel administrativo, abra **Extensions → CraftProperties → configurações do Blueprint** e associe a rota `/properties` aos eggs de Minecraft Java desejados.

Para remover:

```bash
blueprint -remove craftproperties
```

A remoção mantém todos os `server.properties` e backups.

## Permissões

| Permissão | Uso |
| --- | --- |
| `file.read-content` | Abrir o arquivo e carregar o backup no Pterodactyl 1.14 |
| `file.create` | Alterar, criar, salvar e gerar o backup no Pterodactyl 1.14 |
| `file.read` / `file.update` | Compatibilidade com versões anteriores do painel |

Subusuários sem permissão de gravação recebem uma interface somente leitura. As operações passam pela API oficial de arquivos do Pterodactyl; a extensão não acessa diretamente os volumes dos servidores.

## Segurança de gravação

Antes de sobrescrever o arquivo, a versão atual é gravada em `/server.properties.craftproperties.bak`. Se o backup falhar, a alteração principal também é interrompida. Valores inseridos pelo editor visual não podem adicionar uma segunda linha de propriedade, e chaves personalizadas aceitam somente letras, números, `.`, `_` e `-`.

As alterações normalmente exigem reinício do Minecraft. O editor avisa quando o servidor está em execução, mas não força o desligamento.

## Desenvolvimento

Para usar o fluxo de desenvolvimento do Blueprint:

```bash
cp -R . /var/www/pterodactyl/.blueprint/dev/
cd /var/www/pterodactyl
blueprint -build
```

Testes da lógica de leitura e gravação:

```bash
npm test
```

O projeto usa o suporte nativo do Node.js 22 para executar os testes TypeScript e não instala dependências próprias.

## Estrutura

```text
admin/                    página administrativa
components/               interface React e catálogo de propriedades
data/                     scripts de ciclo de vida do Blueprint
scripts/package.sh        gerador do arquivo .blueprint
installer.sh              instalador interativo
conf.yml                  manifesto da extensão
```

## Referências

- [Blueprint — Components.yml](https://blueprint.zip/docs/configs/componentsyml)
- [Blueprint — empacotamento](https://blueprint.zip/guides/dev/packaging)
- [Pterodactyl — API de arquivos](https://github.com/pterodactyl/panel)
- [Minecraft Wiki — server.properties](https://minecraft.wiki/w/Server.properties)

## Licença

MIT — V3noxDev.