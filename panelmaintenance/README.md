# Panel Maintenance — Blueprint Extension

Modo de manutenção do painel Pterodactyl com página **503 personalizada em português** — ative e desative pelo admin, sem SSH.

## Recursos

- Ativar/desativar com um clique (equivalente a `php artisan down` / `up`)
- Página de manutenção moderna em PT-BR
- Links para Site, Loja e Discord
- Token de bypass para admins acessarem o painel durante manutenção
- Configurável: título, mensagem, marca, URLs e tempo de retry

## Padrões BlackHosting

- Site: https://blackhosting.com.br
- Loja: https://financeiro.blackhosting.com.br
- Discord: https://discord.gg/blackhosting

## Instalação

```bash
cp -r panelmaintenance /var/www/pterodactyl/.blueprint/dev/
cd /var/www/pterodactyl
blueprint -build
blueprint -install panelmaintenance.blueprint
```

## Uso

1. **Admin → Extensions → Panel Maintenance**
2. Ajuste título, mensagem e links
3. Clique em **Ativar manutenção**
4. Copie o **link de bypass** para acessar o painel enquanto os usuários veem a página 503
5. Quando terminar, clique em **Desativar manutenção**

## Bypass

Durante a manutenção, acesse:

```
https://seu-painel.com/SEU-TOKEN-SECRETO
```

Um cookie será salvo e você poderá usar o painel normalmente.

## Licença

MIT
