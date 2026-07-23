<div class="lm-admin">
    <div class="lm-admin__header">
        <div>
            <h3 class="lm-admin__title">Login Master</h3>
            <p class="lm-admin__subtitle">
                Cloudflare Turnstile no login, interface moderna e validação <strong>server-side</strong>
                — impossível burlar só desativando JavaScript.
            </p>
        </div>
        <span class="lm-admin__version">v1.0.0</span>
    </div>

    @if(session('success'))
        <div class="lm-admin__alert lm-admin__alert--ok">{{ session('success') }}</div>
    @endif
    @if(session('error'))
        <div class="lm-admin__alert lm-admin__alert--error">{{ session('error') }}</div>
    @endif

    <div class="lm-admin__status {{ $configured ? 'is-ok' : 'is-warn' }}">
        <span class="lm-admin__status-dot"></span>
        <div>
            <strong>{{ $configured ? 'Proteção Turnstile ativa' : 'Configuração incompleta' }}</strong>
            <p>
                @if($configured)
                    Login e formulários protegidos com verificação Cloudflare no servidor.
                @else
                    Informe Site Key e Secret Key do
                    <a href="https://dash.cloudflare.com/?to=/:account/turnstile" target="_blank" rel="noreferrer">Cloudflare Turnstile</a>
                    e marque "Turnstile ativo".
                @endif
            </p>
        </div>
    </div>

    <form action="" method="POST" class="lm-admin__form">
        {{ csrf_field() }}

        <div class="lm-admin__grid">
            <div class="lm-admin__card lm-admin__card--wide">
                <div class="lm-admin__card-title">Cloudflare Turnstile</div>

                <label class="lm-admin__check">
                    <input type="checkbox" name="enabled" value="1" {{ $settings['enabled'] ? 'checked' : '' }}>
                    Turnstile ativo
                </label>

                <label class="lm-admin__label" for="site_key">Site Key (pública)</label>
                <input type="text" name="site_key" id="site_key" class="lm-admin__input"
                    value="{{ $settings['site_key'] }}" placeholder="0x..." autocomplete="off">

                <label class="lm-admin__label" for="secret_key">Secret Key (privada)</label>
                <input type="password" name="secret_key" id="secret_key" class="lm-admin__input"
                    value="" placeholder="{{ $secret_masked !== '' ? 'Salva: '.$secret_masked.' — deixe vazio para manter' : 'Cole a secret key' }}"
                    autocomplete="new-password">

                <label class="lm-admin__label" for="theme">Tema do widget</label>
                <select name="theme" id="theme" class="lm-admin__input">
                    @foreach(['auto' => 'Automático', 'light' => 'Claro', 'dark' => 'Escuro'] as $value => $label)
                        <option value="{{ $value }}" {{ $settings['theme'] === $value ? 'selected' : '' }}>{{ $label }}</option>
                    @endforeach
                </select>
            </div>

            <div class="lm-admin__card">
                <div class="lm-admin__card-title">Proteção (servidor)</div>

                <label class="lm-admin__check">
                    <input type="checkbox" name="protect_login" value="1" {{ $settings['protect_login'] ? 'checked' : '' }}>
                    Exigir Turnstile no login
                </label>
                <label class="lm-admin__check">
                    <input type="checkbox" name="protect_forgot" value="1" {{ $settings['protect_forgot'] ? 'checked' : '' }}>
                    Exigir Turnstile em "Esqueci a senha"
                </label>
                <label class="lm-admin__check">
                    <input type="checkbox" name="disable_native_recaptcha" value="1" {{ $settings['disable_native_recaptcha'] ? 'checked' : '' }}>
                    Desativar reCAPTCHA nativo do painel
                </label>
                <label class="lm-admin__check">
                    <input type="checkbox" name="honeypot_enabled" value="1" {{ $settings['honeypot_enabled'] ? 'checked' : '' }}>
                    Campo honeypot anti-bot (invisível)
                </label>
                <p class="lm-admin__hint">
                    A validação ocorre no PHP antes do login — tokens inválidos ou ausentes retornam HTTP 400.
                </p>
            </div>

            <div class="lm-admin__card lm-admin__card--wide">
                <div class="lm-admin__card-title">Interface de login</div>

                <div class="lm-admin__row">
                    <div>
                        <label class="lm-admin__label" for="brand_name">Nome da marca</label>
                        <input type="text" name="brand_name" id="brand_name" class="lm-admin__input"
                            value="{{ $settings['brand_name'] }}" required>
                    </div>
                    <div>
                        <label class="lm-admin__label" for="accent_color">Cor de destaque</label>
                        <input type="color" name="accent_color" id="accent_color" class="lm-admin__input lm-admin__input--color"
                            value="{{ $settings['accent_color'] }}" required>
                    </div>
                </div>

                <label class="lm-admin__label" for="welcome_text">Texto de boas-vindas</label>
                <input type="text" name="welcome_text" id="welcome_text" class="lm-admin__input"
                    value="{{ $settings['welcome_text'] }}" required maxlength="160">

                <label class="lm-admin__label" for="background_style">Estilo de fundo</label>
                <select name="background_style" id="background_style" class="lm-admin__input">
                    @foreach(['gradient' => 'Gradiente', 'solid' => 'Sólido', 'minimal' => 'Minimal'] as $value => $label)
                        <option value="{{ $value }}" {{ $settings['background_style'] === $value ? 'selected' : '' }}>{{ $label }}</option>
                    @endforeach
                </select>

                <label class="lm-admin__check">
                    <input type="checkbox" name="show_brand_header" value="1" {{ $settings['show_brand_header'] ? 'checked' : '' }}>
                    Mostrar cabeçalho com nome da marca na tela de login
                </label>
            </div>
        </div>

        <div class="lm-admin__actions">
            <button type="submit" name="_method" value="PATCH" class="lm-admin__btn">Salvar configurações</button>
        </div>
    </form>

    <div class="lm-admin__card lm-admin__card--wide lm-admin__deploy">
        <div class="lm-admin__card-title">Deploy</div>
        <pre class="lm-admin__code">cd /var/www/pterodactyl
cp -r loginmaster .blueprint/dev/
blueprint -build
blueprint -install loginmaster.blueprint
php artisan migrate --force
php artisan cache:clear</pre>
    </div>
</div>
