# Panel Maintenance — Blueprint Extension

Página de manutenção do painel Pterodactyl **igual ao estilo da foto** — cone laranja, título em português e botões Discord / Site / Loja.

## Recursos

- Funciona com `php artisan down` via SSH
- Ativar/desativar pelo **Admin → Extensions → Panel Maintenance**
- Página 503 em PT-BR (título laranja em **breve!**)
- Links padrão BlackHosting já configurados
- Token de bypass para admins

## Instalação

```bash
cp -r panelmaintenance /var/www/pterodactyl/.blueprint/dev/
cd /var/www/pterodactyl
blueprint -build
blueprint -install panelmaintenance.blueprint
```

## Via SSH (VPS)

```bash
cd /var/www/pterodactyl

# Ativar manutenção (mostra a página personalizada)
php artisan down

# Com bypass para você acessar o painel:
php artisan down --secret=blackhosting
# Acesse: https://seu-painel.com/blackhosting

# Desativar
php artisan up
```

## Via Admin

1. **Admin → Extensions → Panel Maintenance**
2. Ajuste textos e links se quiser
3. **Ativar manutenção** / **Desativar manutenção**

## Links padrão

| Botão | URL |
|-------|-----|
| Site | https://blackhosting.com.br |
| Loja | https://financeiro.blackhosting.com.br |
| Discord | https://discord.gg/blackhosting |

## Licença

MIT
