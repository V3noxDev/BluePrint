<div align="center">

# 🧩 BluePrint Store

**Coleção de addons Blueprint para Pterodactyl + Auto-Installer interativo**

Um único repositório com extensões prontas para o [Blueprint Framework](https://blueprint.zip),
e um instalador em terminal que **detecta**, **instala**, **remove** e **atualiza**
seus addons com poucos toques.

![status](https://img.shields.io/badge/blueprint-stable--2025--04-3ecf8e?style=for-the-badge&labelColor=0f1520)
![license](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge&labelColor=0f1520)
![pterodactyl](https://img.shields.io/badge/pterodactyl-1.11.x-orange?style=for-the-badge&labelColor=0f1520)

</div>

---

## ✨ O que tem aqui?

### 🎮 Server Properties &nbsp;`serverproperties` &nbsp;·&nbsp; v1.0.0

Editor visual **completo** do `server.properties` para servidores **Minecraft: Java Edition**.
Deixe o `nano` de lado — cada propriedade oficial vira um input do tipo certo, com descrição em português.

- 🔍 **Busca inteligente** por nome, chave ou descrição
- 🗂️ **Categorias** (Geral, Jogo, Mundo, Rede, RCON, Recursos, Segurança, Performance)
- 🎚️ **Toggles** para booleans, **dropdowns** para enums (`gamemode`, `difficulty`, `level-type`…)
- 🔢 **Number inputs** com `min`/`max` corretos (`view-distance`, `max-players`, portas…)
- 🔒 Campo de senha para `rcon.password`
- 🧠 **Preserva** comentários, ordem original e chaves de plugins/mods (Paper, Purpur…)
- 💾 **Salvar** ou **Salvar & reiniciar** com um clique
- 🔗 Atalho automático na aba **Files** do servidor
- ⚙️ Página admin com título customizável, cor de destaque e toggle do atalho

Rota adicionada ao painel do servidor: **`/server/<id>/properties`**.

---

## 🚀 Instalação rápida

**Requisitos:** um servidor com Pterodactyl (`/var/www/pterodactyl`) e o
[Blueprint framework](https://blueprint.zip) já instalado (`blueprint -version`).

```bash
# 1. Clone este repositório
git clone https://github.com/BluePrintStore/blueprint-store.git
cd blueprint-store

# 2. Rode o instalador interativo
sudo ./installer.sh
```

O instalador abre um menu (usa `whiptail` ou `dialog` se disponível,
caso contrário mostra um menu em texto colorido) para instalar / remover
cada addon do repositório.

### ⚡ Ou, sem menu

```bash
# Empacota o(s) addon(s) em ./dist/*.blueprint
./build.sh

# Instala pelo CLI
sudo ./installer.sh install serverproperties

# Lista addons disponíveis no repo
./installer.sh list

# Vê os que já estão instalados no painel
sudo ./installer.sh status

# Remove
sudo ./installer.sh remove serverproperties
```

### 🐳 Blueprint em Docker?

Defina o caminho do painel antes de rodar:

```bash
export PTERODACTYL_DIRECTORY=/srv/pterodactyl
sudo -E ./installer.sh
```

---

## 🖼️ Preview do instalador

```
  ██████╗ ██╗     ██╗   ██╗███████╗██████╗ ██████╗ ██╗███╗   ██╗████████╗
  ██╔══██╗██║     ██║   ██║██╔════╝██╔══██╗██╔══██╗██║████╗  ██║╚══██╔══╝
  ██████╔╝██║     ██║   ██║█████╗  ██████╔╝██████╔╝██║██╔██╗ ██║   ██║   
  ╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝   ╚═╝   

  BluePrint Store — Auto Installer for Pterodactyl extensions
────────────────────────────────────────────────────────
  Extensões disponíveis
────────────────────────────────────────────────────────
   1) Server Properties        v1.0.0    ✓ instalado
        Editor visual e completo do server.properties…
────────────────────────────────────────────────────────
   i) Info do ambiente     q) Sair
────────────────────────────────────────────────────────
```

---

## 🧱 Estrutura do repositório

```
blueprint-store/
├── installer.sh                    # Menu interativo (whiptail/dialog + fallback)
├── build.sh                        # Empacota addons em .blueprint (zip)
├── dist/                           # (gerado) *.blueprint prontos p/ upload
└── addons/
    └── serverproperties/           # Addon Blueprint
        ├── conf.yml                # Metadados da extensão
        ├── icon.svg                # Ícone do painel admin
        ├── admin/
        │   ├── controller.php      # Config admin (título, cor, atalho)
        │   └── view.blade.php      # UI admin (Blade)
        ├── dashboard/
        │   ├── root.css            # Tema escopado (.sp-root)
        │   └── components/
        │       ├── Components.yml  # Registra rota + injeção
        │       ├── sections/
        │       │   ├── ServerPropertiesEditor.tsx
        │       │   ├── propertiesSchema.ts
        │       │   └── propertiesParser.ts
        │       └── elements/
        │           └── PropertiesShortcut.tsx
        └── data/
            └── private/
                ├── install.sh
                └── remove.sh
```

---

## 📦 Como o pacote `.blueprint` é gerado

Um arquivo `.blueprint` é apenas um **ZIP** com o conteúdo da pasta do addon
na raiz. O `build.sh` faz exatamente isso:

```bash
cd addons/serverproperties && zip -r ../../dist/serverproperties.blueprint .
```

O `installer.sh` executa esse passo para você e depois roda
`blueprint -install serverproperties` dentro do diretório do painel.

---

## 🧪 Testando o parser localmente

O parser/serializer do `server.properties` é o coração do editor e preserva
comentários, ordem e chaves desconhecidas. Rode o teste:

```bash
node - << 'EOF'
import('/workspace/addons/serverproperties/dashboard/components/sections/propertiesParser.ts')
EOF
```

*(no painel real, o TypeScript é compilado pelo Blueprint automaticamente
via `blueprint -install` / `blueprint -build`.)*

---

## 🧭 Roadmap

- [ ] Addon `PluginManager` — buscar/instalar plugins do Modrinth/Spigot
- [ ] Addon `PaperConfig` — mesmo editor visual para `paper-global.yml`
- [ ] Backup automático do `server.properties` antes de cada save
- [ ] Presets prontos (survival vanilla, minigames, creative flat…)

Sugestões? Abra uma issue. 💡

---

## 📜 Licença

MIT — sinta-se livre para adaptar, redistribuir e vender temas em cima disso.
Só peço para manter os créditos originais.

Pterodactyl® é marca registrada da Pterodactyl Software.
Este projeto não é afiliado à Pterodactyl nem ao Mojang/Microsoft.
