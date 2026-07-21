# Blueprint Addon - Minecraft Properties Studio

Addon Blueprint para **Pterodactyl** com:

- interface visual para editar `server.properties` de servidores Minecraft Java;
- layout moderno (estilo marketplace/addon profissional);
- instalador automático em menu para **instalar, atualizar, remover e exportar**.

## Estrutura

```text
.
├── auto-installer.sh
└── mc-server-properties-blueprint/
    ├── conf.yml
    ├── admin/
    ├── assets/
    ├── dashboard/
    │   ├── components/
    │   └── styles/
    └── data/private/
```

## Como usar (rápido)

1. Envie este repositório para sua máquina onde está o Pterodactyl + Blueprint.
2. Dê permissão:

```bash
chmod +x auto-installer.sh
```

3. Rode o instalador:

```bash
./auto-installer.sh
```

4. No menu, use:
   - **[1]** para instalar/atualizar a extensão via `.blueprint/dev` + `blueprint -build`
   - **[2]** para exportar o arquivo `.blueprint`
   - **[4]** para remover o addon com `blueprint -remove mcproperties`

## Rota no painel do cliente

Depois de instalado, abra um servidor Minecraft Java e acesse:

- aba **Properties Studio** (rota de servidor via `Components.yml`)

Lá você pode:

- buscar propriedade;
- editar chave/valor;
- criar/remover propriedades;
- salvar em `/server.properties`.

## Compatibilidade

- Pterodactyl Panel 1.x + Blueprint framework
- alvo configurado em `conf.yml`: `stable-2025-04`

> Se sua versão do Blueprint for diferente, atualize `info.target` em `conf.yml` para combinar com seu ambiente.