# ⚙️ MC Properties Manager

> **Blueprint Extension for Pterodactyl Panel**
> Gerencie o `server.properties` do seu servidor Minecraft Java diretamente pelo painel, com uma interface bonita e organizada.

---

## ✨ Funcionalidades

| Feature | Descrição |
|---------|-----------|
| 🎮 **Interface Inteligente** | Toggles para booleanos, dropdowns para enums (dificuldade, gamemode), campos numéricos e de texto para cada tipo de propriedade |
| 📂 **6 Categorias** | General · Gameplay · World · Performance · Network · Advanced |
| 💾 **Leitura & Escrita Real** | Lê e escreve o `server.properties` via Wings API — sem edição manual de arquivos |
| ⚠️ **Avisos de Restart** | Propriedades que requerem reinicialização são marcadas visualmente |
| 🔒 **Permissões Nativas** | Respeita as permissões do Pterodactyl — sem configuração extra |
| 🚀 **Auto-Installer** | Script `install.sh` com menu interativo colorido para instalar/remover com um comando |
| 🎨 **UI Bonita** | Design escuro com gradientes, animações suaves, toast notifications e estados de loading |

---

## 📋 Propriedades Suportadas

### 🌐 General (6 props)
`motd` · `server-name` · `server-port` · `online-mode` · `white-list` · `enforce-whitelist`

### 🎮 Gameplay (10 props)
`gamemode` · `difficulty` · `hardcore` · `pvp` · `spawn-protection` · `allow-flight` · `allow-nether` · `spawn-animals` · `spawn-monsters` · `spawn-npcs`

### 🌍 World (8 props)
`level-name` · `level-seed` · `level-type` · `generate-structures` · `view-distance` · `simulation-distance` · `max-world-size` · `max-build-height`

### ⚡ Performance (6 props)
`max-players` · `max-tick-time` · `network-compression-threshold` · `entity-broadcast-range-percentage` · `sync-chunk-writes` · `use-native-transport`

### 🔗 Network (7 props)
`server-ip` · `enable-status` · `enable-query` · `query.port` · `enable-rcon` · `rcon.port` · `rcon.password`

### 🔧 Advanced (8+ props)
`enable-command-block` · `force-gamemode` · `function-permission-level` · `op-permission-level` · `player-idle-timeout` · `log-ips` · `resource-pack` · `resource-pack-sha1` · `require-resource-pack` · `resource-pack-prompt`

---

## 🚀 Instalação

### Método 1 — Auto-Installer (Recomendado)

```bash
# 1. Gere o pacote .blueprint
bash build.sh

# 2. Execute o instalador interativo
sudo bash install.sh
```

O menu do auto-installer permite:
- **[1] Instalar** a extensão
- **[2] Remover** a extensão
- **[3] Verificar status**
- **[4] Reparar/Reconstruir frontend**

### Método 2 — Manual via Blueprint CLI

```bash
# 1. Gere o pacote
bash build.sh

# 2. Copie para o diretório do Pterodactyl
cp mcproperties.blueprint /var/www/pterodactyl/

# 3. Instale via Blueprint
cd /var/www/pterodactyl
blueprint -install mcproperties
```

### Método 3 — Instalação Direta em Desenvolvimento

Se você já tem o Blueprint configurado e está desenvolvendo:

```bash
# Copie os arquivos para o diretório de desenvolvimento do Blueprint
cp -r . /var/www/pterodactyl/

# Construa o frontend
cd /var/www/pterodactyl
blueprint -build
```

---

## 🗑️ Remoção

```bash
# Via auto-installer
sudo bash install.sh --remove

# Ou manualmente
cd /var/www/pterodactyl
blueprint -remove mcproperties
```

---

## 📁 Estrutura do Projeto

```
mcproperties/
├── conf.yml                              # Manifesto da extensão Blueprint
├── icon.svg                              # Ícone (64×64, Minecraft grass block + gear)
├── admin/
│   ├── view.blade.php                    # Página de admin (escura, glassmorphism)
│   └── controller.php                    # Controller PHP do admin
├── dashboard/
│   └── components/
│       ├── Components.yml               # Injeta rota "Properties" no dashboard
│       └── McPropertiesManager.tsx      # Componente React principal
├── data/
│   └── private/
│       └── .gitkeep                     # Diretório privado da extensão
├── install.sh                           # Auto-installer com menu interativo
├── build.sh                             # Script de empacotamento .blueprint
└── README.md                            # Esta documentação
```

---

## 🔧 Requisitos

| Componente | Versão mínima |
|-----------|--------------|
| Pterodactyl Panel | 1.x |
| Blueprint Framework | beta-2026-01+ |
| Wings | 1.x |
| Jogo | Minecraft Java Edition (qualquer versão) |

---

## 🎮 Como Usar (para o usuário final)

1. Acesse seu servidor Minecraft Java no painel Pterodactyl
2. Clique na nova aba **"Properties"** no menu de navegação do servidor
3. Navegue pelas categorias (**General**, **Gameplay**, **World**, **Performance**, **Network**, **Advanced**)
4. Edite as propriedades desejadas:
   - **Toggle** para valores `true/false`
   - **Dropdown** para gamemode, difficulty, level-type
   - **Campo numérico** para ports, distâncias, timeouts
   - **Campo de texto** para MOTD, seeds, URLs
5. Clique em **"💾 Salvar Propriedades"**
6. **Reinicie o servidor** para aplicar as mudanças (propriedades que requerem restart são marcadas com `⚠ restart`)

---

## ⚙️ Detalhes Técnicos

### Como o arquivo é lido/escrito

A extensão usa a API client do Pterodactyl (Wings) para:
- **Leitura**: `GET /api/client/servers/{uuid}/files/contents?file=/server.properties`
- **Escrita**: `POST /api/client/servers/{uuid}/files/write?file=/server.properties`

Os comentários e a ordem das linhas originais do `server.properties` são **preservados**. Apenas os valores alterados são atualizados.

### Arquitetura

```
[React Component]
      │
      ├─ fetchProperties() ──► GET /api/client/servers/{uuid}/files/contents
      │                            └─► parseProperties(text) → Record<key, value>
      │
      └─ handleSave() ────────► serializeProperties(original, values)
                                    └─► POST /api/client/servers/{uuid}/files/write
```

### Componente React

O componente `McPropertiesManager.tsx` é injetado no dashboard como uma nova rota `/properties` via `Components.yml`. Ele usa:
- `ServerContext.useStoreState` para obter o UUID do servidor
- `http` (cliente HTTP do Pterodactyl) para as chamadas à API
- Estado local React para gerenciar valores e UI

---

## 📄 Licença

MIT License — livre para uso pessoal e comercial.

---

## 🤝 Contribuição

PRs são bem-vindos! Para reportar bugs ou sugerir melhorias, abra uma issue.

---

*Desenvolvido para o ecossistema Blueprint Framework — a plataforma de extensões do Pterodactyl.*
