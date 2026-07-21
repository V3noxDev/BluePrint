# MineSuite

Extensão **Blueprint** (Pterodactyl) para Minecraft Java com:

1. **Editor visual de `server.properties`** — categorias, busca, toggles e validação
2. **Instalador de addons** — seleção múltipla para instalar e remover plugins/mods

Alvo Blueprint: `beta-2026-01`

## Instalação

1. Instale o [Blueprint](https://blueprint.zip) no painel
2. Copie `minesuite.blueprint` para a raiz do painel (`/var/www/pterodactyl`)
3. Instale:

```bash
cd /var/www/pterodactyl
blueprint -install minesuite
```

4. No painel do servidor, abra a aba **MineSuite**

## Desenvolvimento

```bash
# No painel com developer mode ativo:
cp -r minesuite /var/www/pterodactyl/.blueprint/dev
blueprint -build
```

Empacotar para distribuição:

```bash
./scripts/pack.sh
# gera ../minesuite.blueprint
```

## Uso

### Propriedades

- Carrega `/server.properties` via Wings
- Edita por categoria (Geral, Mundo, Rede, Segurança, Performance, Resource Pack)
- Preserva comentários e ordem ao salvar
- Reinicie o servidor após salvar

### Addons

- Catálogo padrão com plugins populares (LuckPerms, EssentialsX, WorldEdit, ViaVersion, etc.)
- Seleção múltipla → **Instalar selecionados** (baixa do Modrinth)
- Detecta jars instalados em `/plugins`
- Remoção segura apenas de caminhos `/plugins/*.jar` e `/mods/*.jar`

### Admin

Em `/admin/extensions/minesuite`:

- Ativar/desativar a extensão
- Loader padrão (paper, purpur, fabric…)
- Editar o catálogo JSON de addons

## Estrutura

```
minesuite/
├── conf.yml
├── admin/                 # painel admin
├── app/                   # controllers PHP
├── routes/web.php         # /extensions/minesuite/*
├── dashboard/
│   ├── dashboard.css
│   └── components/        # React + Components.yml
└── data/private/addons.json
```

## Permissões

| Ação | Permissão Pterodactyl |
|------|------------------------|
| Ler properties | `file.read-content` |
| Salvar properties | `file.update` |
| Instalar addons | `file.create` |
| Remover addons | `file.delete` |
| Listar jars | `file.read` |

## Notas

- Feito para **Minecraft Java** (Paper/Spigot/Purpur e loaders Modrinth)
- Downloads passam pelo backend do painel (não expõe tokens no browser)
- Após instalar/remover jars, reinicie o servidor para carregar as mudanças
