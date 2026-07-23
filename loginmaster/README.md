# Login Master

Extensão Blueprint para Pterodactyl que melhora a **interface de login** e adiciona **Cloudflare Turnstile** com validação **server-side** — proteção real contra bots, brute-force e tentativas de burlar o captcha só no frontend.

## Recursos

- **Cloudflare Turnstile** configurável no admin (Site Key, Secret Key, tema)
- **Validação no servidor** via middleware PHP (`VerifyLoginMasterTurnstile`)
- Proteção em **login** e **recuperação de senha**
- **Honeypot** invisível anti-bot
- Desativa o **reCAPTCHA nativo** do painel para evitar conflito/bypass
- **Interface moderna**: cabeçalho com marca, gradiente, cor de destaque configurável
- Widget Turnstile **invisível** (mesmo fluxo do reCAPTCHA do Pterodactyl)

## Segurança

| Camada | Proteção |
|--------|----------|
| Frontend | Widget Turnstile + honeypot |
| Backend | Middleware valida token na API Cloudflare antes do login |
| Rotas | `recaptcha` substituído por `loginmaster.turnstile` em `/auth/login` e `/auth/password` |
| Fail-closed | Com Turnstile ativo e chaves configuradas, POST sem token válido → HTTP 400 |

A Secret Key **nunca** é exposta ao navegador. Apenas a Site Key é servida em `/extensions/loginmaster/config`.

## Instalação

```bash
cd /var/www/pterodactyl
cp -r loginmaster .blueprint/dev/
blueprint -build
blueprint -install loginmaster.blueprint
php artisan migrate --force
php artisan cache:clear
```

## Configuração

1. Admin → **Extensions** → **Login Master**
2. Crie um site em [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)
3. Cole **Site Key** e **Secret Key**
4. Ative **Turnstile ativo** e salve
5. Rode `blueprint -build` se a interface não atualizar

### Opções

| Campo | Descrição |
|-------|-----------|
| Turnstile ativo | Liga/desliga proteção |
| Proteger login | Exige token no POST `/auth/login` |
| Proteger recuperação | Exige token no POST `/auth/password` |
| Desativar reCAPTCHA nativo | Evita widget duplicado e bypass pelo middleware antigo |
| Honeypot | Campo oculto; bots preenchem → bloqueio |
| Interface | Marca, texto, cor, estilo de fundo |

## Deploy / atualização

Após alterar TSX ou CSS:

```bash
blueprint -build
php artisan cache:clear
```

## Desinstalação

O `remove.sh` restaura backups de:

- `app/Http/Kernel.php`
- `routes/auth.php`
- `LoginContainer.tsx`, `ForgotPasswordContainer.tsx`, `LoginFormContainer.tsx`

## Versão

**1.0.0** — target Blueprint `beta-2026-06`
