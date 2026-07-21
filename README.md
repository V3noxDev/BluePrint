<div align="center">

# ⛏️ MC Properties

**Editor visual do `server.properties` para Pterodactyl — feito com Blueprint Framework**

Edite MOTD, gamemode, dificuldade, whitelist, view-distance e mais de 60 propriedades
do seu servidor Minecraft Java direto do painel, com uma interface bonita e moderna.

![Blueprint](https://img.shields.io/badge/Blueprint-beta--2026--06-10b981?style=for-the-badge)
![Pterodactyl](https://img.shields.io/badge/Pterodactyl-1.11%2B-0e4688?style=for-the-badge)
![Versão](https://img.shields.io/badge/vers%C3%A3o-1.0.0-34d399?style=for-the-badge)
![Licença](https://img.shields.io/badge/uso-livre-9aa5b1?style=for-the-badge)

</div>

---

## ✨ Recursos

| | Recurso | Descrição |
|---|---|---|
| 🎛️ | **Editor visual** | Mais de 60 propriedades catalogadas com toggles, selects e campos numéricos validados |
| 🗂️ | **Categorias** | Geral, Mundo, Jogadores, Rede, Resource Pack, Segurança & RCON, Avançado e Outros |
| 🔎 | **Busca instantânea** | Encontre qualquer propriedade pelo nome, chave ou descrição |
| 🛡️ | **Proteção de propriedades críticas** | `server-port`, `server-ip`, RCON e `level-name` ficam bloqueados por padrão (o Pterodactyl gerencia isso) |
| 📝 | **Editor raw opcional** | Usuários avançados podem editar o arquivo diretamente, com um clique |
| 🔄 | **Reinício em um clique** | Depois de salvar, reinicie o servidor direto da página |
| 🔐 | **Permissões nativas** | Respeita as permissões de subusuário do Pterodactyl (`file.read`, `file.update`, `control.restart`) |
| 🥚 | **Rotas por egg** | Ative a página apenas nos eggs de Minecraft Java (Vanilla, Paper, Purpur, Forge, Fabric...) |
| 💬 | **Preserva comentários** | O editor mantém os comentários e a ordem original do seu `server.properties` |
| ⚙️ | **Painel admin completo** | Configure tudo em `Admin › Extensions › MC Properties` |

---

## 🚀 Instalação

### Método 1 — Auto instalador (recomendado)

O instalador tem um menu interativo com opções de **instalar, atualizar, remover, ver status e exportar**:

```bash
curl -fsSL https://raw.githubusercontent.com/V3noxDev/BluePrint/main/installer.sh -o installer.sh
sudo bash installer.sh
```

```
   __  __  ____   ____                            _   _
  |  \/  |/ ___| |  _ \ _ __ ___  _ __   ___ _ __| |_(_) ___  ___
  | |\/| | |     | |_) | '__/ _ \| '_ \ / _ \ '__| __| |/ _ \/ __|
  | |  | | |___  |  __/| | | (_) | |_) |  __/ |  | |_| |  __/\__ \
  |_|  |_|\____| |_|   |_|  \___/| .__/ \___|_|   \__|_|\___||___/
                                 |_|

  Status: ● Blueprint pronto, addon não instalado (/var/www/pterodactyl)

   1) Instalar / Atualizar MC Properties
   2) Remover MC Properties
   3) Ver status da instalação
   4) Exportar arquivo .blueprint
   5) Instalar Blueprint Framework
   0) Sair
```

Também dá para usar sem menu:

```bash
sudo bash installer.sh install   # instala ou atualiza
sudo bash installer.sh remove    # remove
sudo bash installer.sh status    # mostra o status
```

> Se o seu painel não estiver em `/var/www/pterodactyl`, rode com `sudo PTERO_DIR=/caminho/do/painel bash installer.sh`.

### Método 2 — Manual

1. Baixe/clone este repositório e gere o pacote:

```bash
sudo bash installer.sh export
```

2. Envie o arquivo `mcproperties.blueprint` para a raiz do seu painel (ex: `/var/www/pterodactyl`);
3. Instale com o Blueprint:

```bash
cd /var/www/pterodactyl
blueprint -install mcproperties
```

---

## 🥚 Ativando nos servidores

A página **Properties** é uma rota por egg — você escolhe onde ela aparece:

1. Acesse `Admin › Extensions › Blueprint`;
2. Abra o gerenciamento de **rotas por egg** (*egg-specific routes*);
3. Habilite a rota **Properties** nos seus eggs de **Minecraft Java**;
4. Pronto! A aba aparece na navegação dos servidores desses eggs.

---

## ⚙️ Configurações (página admin)

Em `Admin › Extensions › MC Properties` você controla:

| Opção | Padrão | Descrição |
|---|---|---|
| **Permitir propriedades críticas** | ❌ Desativado | Libera a edição de `server-port`, `server-ip`, RCON, `level-name`... |
| **Editor raw** | ✅ Ativado | Permite alternar para edição em texto puro |
| **Ocultar propriedades desconhecidas** | ❌ Desativado | Esconde chaves fora do catálogo (adicionadas por forks/plugins) |
| **Caminho do arquivo** | `/server.properties` | Caminho do arquivo relativo à raiz do servidor |

---

## 🧩 Requisitos

- Pterodactyl Panel `1.11+`
- [Blueprint Framework](https://blueprint.zip) `beta-2026-06` (ou compatível) — o instalador oferece instalá-lo pra você
- Servidores Minecraft **Java Edition** (Vanilla, Paper, Purpur, Spigot, Forge, Fabric, etc.)

## 🗑️ Remoção

```bash
sudo bash installer.sh remove
# ou manualmente:
cd /var/www/pterodactyl && blueprint -remove mcproperties
```

A remoção desfaz todas as alterações no painel — sem sobras.

---

## 📁 Estrutura do addon

```
mcproperties/
├── conf.yml                        # Manifesto da extensão (Blueprint)
├── assets/icon.svg                 # Ícone da extensão
├── admin/
│   ├── view.blade.php              # Página admin (visual premium)
│   └── controller.php              # Controller admin (salva as configurações)
├── app/
│   └── SettingsController.php      # API client: expõe as configs ao frontend
├── routes/
│   └── client.php                  # /api/client/extensions/mcproperties/settings
└── dashboard/components/
    ├── Components.yml              # Registra a rota "Properties" nos servidores
    └── mcproperties/
        ├── PropertiesPage.tsx      # Página principal (React)
        ├── PropertyCard.tsx        # Card de cada propriedade
        ├── catalog.ts              # Catálogo com 60+ propriedades documentadas
        ├── parser.ts               # Parser que preserva comentários e ordem
        └── styles.ts               # Estilos (styled-components)
```

<div align="center">

Feito com 💚 usando o [Blueprint Framework](https://blueprint.zip)

</div>
