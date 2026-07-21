# MineHub — Blueprint Extension

Editor visual de `server.properties` para Minecraft Java no Pterodactyl.

## URL

```
/server/{id}/minecraft/properties
```

## Recursos

- Mostra **apenas** propriedades que existem no `server.properties` do servidor
- Labels em **português**
- Detecta automaticamente `true`/`false` (toggle) vs texto
- Busca + botão Salvar
- Card verde de confirmação ao salvar
- Restrito a eggs via **engrenagem do Blueprint** (igual às outras extensões)

## Instalação

```bash
cp -r minehub /var/www/pterodactyl/.blueprint/dev/
cd /var/www/pterodactyl
blueprint -build
```

## Configurar eggs

1. Admin → Extensions → **MineHub**
2. Clique na **engrenagem** (configurações do Blueprint)
3. Selecione os eggs (Paper, Spigot, Vanilla, etc.)

## API

| Método | Endpoint |
|--------|----------|
| `GET` | `/api/client/extensions/minehub/servers/{server}/properties` |
| `POST` | `/api/client/extensions/minehub/servers/{server}/properties` |

## Licença

MIT
