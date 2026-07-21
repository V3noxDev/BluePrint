# ⛏️ MC Properties

**Addon Blueprint (Pterodactyl) para editar o `server.properties` de servidores Minecraft Java direto do painel** — com editor visual de MOTD, categorias organizadas, busca instantânea e um auto-instalador interativo.

> Feito para a versão mais recente do Blueprint (`beta-2026-06`). Funciona nas anteriores também (o Blueprint apenas exibe um aviso de versão).

---

## ✨ Recursos

- 🎨 **Editor de MOTD com preview ao vivo** — paleta com as 16 cores do Minecraft (`§`), negrito, itálico, sublinhado, riscado, texto embaralhado (`§k` animado!) e suporte a 2 linhas. O preview imita a lista de servidores do jogo.
- 🗂️ **+60 propriedades catalogadas e traduzidas** — organizadas em categorias: Geral, Mundo, Jogadores, Rede, Desempenho, Resource Pack, RCON & Query e Avançado. Propriedades desconhecidas caem em "Outros" e continuam editáveis.
- 🔎 **Busca instantânea** — filtre por nome, chave ou descrição (ex.: `pvp`, `whitelist`, `view-distance`).
- 🎚️ **Controles inteligentes** — toggles para booleanos, dropdowns para enums (gamemode, dificuldade, level-type...), campos numéricos com limites e campo de senha oculto para `rcon.password`.
- 💾 **Barra de salvamento flutuante** — mostra quantas alterações estão pendentes, com botões **Salvar**, **Salvar & Reiniciar** e **Descartar**. Cada campo alterado ganha destaque e botão "desfazer".
- 🔒 **Seguro por padrão** — usa a API de arquivos nativa do Pterodactyl (`/files/contents` e `/files/write`), então as permissões de subusuários (`file.read` / `file.update`) são respeitadas automaticamente. Nenhuma rota extra sem autenticação.
- 🧠 **Preserva o arquivo** — comentários, ordem das linhas e caracteres unicode (`\uXXXX`) do `server.properties` são mantidos ao salvar.
- 🧭 **À prova de erro** — se o servidor nunca foi iniciado (sem `server.properties`), a página explica o que fazer em vez de quebrar.

---

## 📦 Instalação rápida (auto-instalador)

O repositório inclui um **instalador interativo** com menu de seleção que:

- detecta o Pterodactyl e o Blueprint automaticamente;
- instala o **Blueprint Framework** (com Node.js 22 + Yarn) se ainda não existir;
- instala/atualiza o **MC Properties**;
- **remove qualquer extensão** instalada, com menu de seleção;
- empacota o addon em `.blueprint`.

```bash
git clone https://github.com/V3noxDev/BluePrint.git
cd BluePrint
sudo bash installer.sh
```

Menu do instalador:

```
[1] Instalar / atualizar o MC Properties
[2] Remover uma extensão (menu de seleção)
[3] Instalar o Blueprint Framework
[4] Empacotar o addon (mcproperties.blueprint)
[5] Ver status do ambiente
[0] Sair
```

## 🔧 Instalação manual

Se preferir fazer na mão (o Blueprint precisa estar instalado — [guia oficial](https://blueprint.zip/guides/admin/install)):

```bash
# 1. Empacote o addon
bash build.sh

# 2. Copie o pacote para o diretório do painel
cp mcproperties.blueprint /var/www/pterodactyl/

# 3. Instale com o Blueprint
cd /var/www/pterodactyl
blueprint -install mcproperties
```

### Remover

```bash
cd /var/www/pterodactyl
blueprint -remove mcproperties
```

---

## 🖥️ Como usar (usuário final)

1. Abra um servidor **Minecraft Java** no painel.
2. Clique na aba **Propriedades** na navegação do servidor.
3. Edite o que quiser — MOTD, gamemode, dificuldade, whitelist, view-distance...
4. Clique em **Salvar** (ou **Salvar & Reiniciar** para aplicar na hora).

> 💡 **Dica de admin:** em `Admin → Extensions → Manage extensions` você pode escolher em quais *eggs* a aba "Propriedades" aparece. Recomendado limitar aos eggs de Minecraft Java para a aba não aparecer em servidores de outros jogos.

---

## 🗂️ Estrutura do projeto

```
├── installer.sh                  # Auto-instalador interativo (instala/remove/empacota)
├── build.sh                      # Empacota o addon em mcproperties.blueprint
└── mcproperties/                 # Código-fonte da extensão Blueprint
    ├── conf.yml                  # Configuração da extensão (identificador, alvos, binds)
    ├── icon.svg                  # Ícone exibido no painel admin
    ├── admin/
    │   └── view.blade.php        # Página administrativa (Admin → Extensions → MC Properties)
    └── components/               # Frontend React (dashboard do usuário)
        ├── Components.yml        # Registra a rota /server/<id>/mcproperties
        ├── tsconfig.json
        ├── pages/
        │   └── PropertiesPage.tsx    # Página principal do editor
        ├── elements/
        │   ├── MotdEditor.tsx        # Editor de MOTD com toolbar de cores/formatos
        │   ├── MotdPreview.tsx       # Preview estilo lista de servidores do jogo
        │   ├── Obfuscated.tsx        # Efeito §k (texto embaralhado) animado
        │   └── PropertyField.tsx     # Card de propriedade (toggle/select/número/texto)
        └── lib/
            ├── catalog.ts            # Catálogo PT-BR das propriedades do server.properties
            ├── properties.ts         # Parser/serializador .properties (preserva comentários)
            ├── minecraftText.ts      # Parser de códigos § para o preview
            └── api.ts                # Chamadas à API de arquivos/power do Pterodactyl
```

## ⚙️ Requisitos

| Componente | Versão |
| --- | --- |
| Pterodactyl Panel | 1.x |
| Blueprint Framework | `beta-2026-06` (alvo) — compatível com versões próximas |
| Node.js | 22.x+ (exigência do próprio Blueprint) |
| Yarn | qualquer versão estável |

## 🧑‍💻 Desenvolvimento

Com o [modo desenvolvedor do Blueprint](https://blueprint.zip/guides/dev/quickstart) ativado:

```bash
# copie o conteúdo de mcproperties/ para .blueprint/dev do seu painel
cp -r mcproperties/* /var/www/pterodactyl/.blueprint/dev/

# aplique as mudanças
cd /var/www/pterodactyl
blueprint -build

# quando terminar, exporte o pacote
blueprint -export
```

## 📄 Licença

Uso livre. Créditos são bem-vindos. 💚
