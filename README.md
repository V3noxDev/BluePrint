# Minecraft Properties Manager

Addon Blueprint para Pterodactyl que adiciona uma tela bonita no Admin para editar o arquivo `/server.properties` de servidores Minecraft Java.

## Recursos

- Seletor de servidores com busca por nome, UUID, node, nest ou egg.
- Prioriza servidores com nest/egg contendo "Minecraft".
- Editor visual para propriedades comuns (`motd`, `max-players`, `gamemode`, `difficulty`, `pvp`, `online-mode`, `server-port`, RCON, Query e outras).
- Editor bruto do arquivo real para manter comentarios e propriedades customizadas.
- Backup automatico antes de salvar quando o arquivo original pode ser lido: `server.properties.blueprint-backup-YYYYmmdd-His`.
- Scripts Blueprint de `install`, `update`, `remove` e `export`.
- `installer.sh` com menu para instalar, remover, empacotar ou aplicar em modo desenvolvedor.

## Compatibilidade

- Pterodactyl Panel 1.11.x.
- Wings 1.11.x.
- Blueprint mais recente documentado em `blueprint.zip` (`target: alpha-NLM`).

O addon usa o `DaemonFileRepository` do Pterodactyl para ler e escrever no Wings. Ele nao acessa diretamente o disco do node.

## Instalacao rapida com menu

No servidor do panel:

```bash
chmod +x installer.sh
./installer.sh
```

Escolha uma opcao:

1. Instalar addon
2. Remover addon
3. Criar pacote `.blueprint`
4. Aplicar em modo desenvolvedor (`.blueprint/dev` + `blueprint -build`)
5. Sair

O instalador detecta `/var/www/pterodactyl`, permite escolher outro caminho, gera `serverproperties.blueprint`, copia para o panel e executa:

```bash
blueprint -install serverproperties.blueprint
```

## Instalacao manual

Se preferir instalar manualmente:

```bash
python3 - <<'PY'
import os, zipfile
files = [
    "conf.yml", "controller.php", "view.blade.php", "admin.css", "README.md",
    "public/icon.svg",
    "data/install.sh", "data/update.sh", "data/remove.sh", "data/export.sh",
]
with zipfile.ZipFile("serverproperties.blueprint", "w", zipfile.ZIP_DEFLATED) as archive:
    for path in files:
        info = zipfile.ZipInfo(path)
        info.external_attr = (os.stat(path).st_mode & 0o777) << 16
        archive.writestr(info, open(path, "rb").read())
PY

cp serverproperties.blueprint /var/www/pterodactyl/
cd /var/www/pterodactyl
blueprint -install serverproperties.blueprint
```

Depois acesse:

```text
Admin > Extensions > Minecraft Properties Manager
```

## Remocao

Com o menu:

```bash
./installer.sh
```

Escolha `Remover addon`.

Ou manualmente:

```bash
cd /var/www/pterodactyl
blueprint -remove serverproperties
```

Backups criados dentro dos servidores nao sao apagados na remocao.

## Estrutura

```text
conf.yml            Manifesto Blueprint
controller.php      Controller admin do addon
view.blade.php      Interface Blade
admin.css           Visual da tela admin
public/icon.svg     Icone do addon
data/*.sh           Scripts chamados pelo Blueprint
installer.sh        Instalador interativo
```

## Notas de seguranca

- O addon exige permissao de administrador no panel.
- Cria backup antes de sobrescrever `/server.properties` quando o arquivo original pode ser lido.
- Valida tamanho pelo limite `pterodactyl.files.max_edit_size`.
- Rejeita conteudo com byte nulo.
- Nao altera arquivos core do Pterodactyl fora dos bindings oficiais do Blueprint.