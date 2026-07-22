<div class="pm-admin">
    <div class="pm-admin__header">
        <div>
            <h3 class="pm-admin__title">Panel Maintenance</h3>
            <p class="pm-admin__subtitle">
                Página 503 personalizada em português — ative pelo admin <strong>ou</strong> via SSH com <code>php artisan down</code>.
            </p>
        </div>
        <span class="pm-admin__version">v1.1.0</span>
    </div>

    @if(session('success'))
        <div class="pm-admin__alert pm-admin__alert--ok">{{ session('success') }}</div>
    @endif
    @if(session('error'))
        <div class="pm-admin__alert pm-admin__alert--error">{{ session('error') }}</div>
    @endif

    <div class="pm-admin__status {{ $is_down ? 'is-down' : 'is-up' }}">
        <span class="pm-admin__status-dot"></span>
        <div>
            <strong>{{ $is_down ? 'Painel em manutenção' : 'Painel online' }}</strong>
            <p>{{ $is_down ? 'Visitantes veem a página 503 personalizada.' : 'O painel está acessível normalmente.' }}</p>
        </div>
    </div>

    @if($is_down && $bypass_url)
        <div class="pm-admin__bypass">
            <div class="pm-admin__bypass-title">Link de bypass (admin)</div>
            <code class="pm-admin__bypass-url">{{ $bypass_url }}</code>
            <p class="pm-admin__hint">Acesse este link para entrar no painel durante a manutenção. Um cookie será salvo no navegador.</p>
        </div>
    @endif

    <form action="" method="POST" class="pm-admin__form">
        {{ csrf_field() }}

        <div class="pm-admin__grid">
            <div class="pm-admin__card pm-admin__card--wide">
                <div class="pm-admin__card-title">Página de manutenção</div>

                <label class="pm-admin__label" for="brand_name">Nome da marca</label>
                <input type="text" name="brand_name" id="brand_name" class="pm-admin__input"
                    value="{{ $settings['brand_name'] }}" required>

                <label class="pm-admin__label" for="title">Título da aba do navegador</label>
                <input type="text" name="title" id="title" class="pm-admin__input"
                    value="{{ $settings['title'] }}" required>

                <label class="pm-admin__label" for="headline_before">Título (parte 1)</label>
                <input type="text" name="headline_before" id="headline_before" class="pm-admin__input"
                    value="{{ $settings['headline_before'] }}" required>

                <label class="pm-admin__label" for="headline_highlight">Título destacado (laranja)</label>
                <input type="text" name="headline_highlight" id="headline_highlight" class="pm-admin__input"
                    value="{{ $settings['headline_highlight'] }}" required>

                <label class="pm-admin__label" for="message">Mensagem</label>
                <textarea name="message" id="message" class="pm-admin__textarea" rows="3" required>{{ $settings['message'] }}</textarea>

                <label class="pm-admin__label" for="retry_minutes">Tentar novamente em (minutos)</label>
                <input type="number" name="retry_minutes" id="retry_minutes" class="pm-admin__input"
                    value="{{ $settings['retry_minutes'] }}" min="1" max="10080" required>
            </div>

            <div class="pm-admin__card">
                <div class="pm-admin__card-title">Links (rodapé da página)</div>

                <label class="pm-admin__label" for="site_url">Site</label>
                <input type="url" name="site_url" id="site_url" class="pm-admin__input"
                    value="{{ $settings['site_url'] }}" required>

                <label class="pm-admin__label" for="store_url">Loja</label>
                <input type="url" name="store_url" id="store_url" class="pm-admin__input"
                    value="{{ $settings['store_url'] }}" required>

                <label class="pm-admin__label" for="discord_url">Discord</label>
                <input type="url" name="discord_url" id="discord_url" class="pm-admin__input"
                    value="{{ $settings['discord_url'] }}" required>
            </div>

            <div class="pm-admin__card">
                <div class="pm-admin__card-title">Bypass secreto</div>
                <label class="pm-admin__label" for="secret">Token (opcional)</label>
                <input type="text" name="secret" id="secret" class="pm-admin__input"
                    value="{{ $settings['secret'] }}" placeholder="Gerado automaticamente se vazio"
                    pattern="[a-zA-Z0-9\-_]*">
                <p class="pm-admin__hint">
                    Deixe vazio para gerar um token aleatório ao ativar.
                    Use apenas letras, números, hífen e underscore.
                </p>
            </div>
        </div>

        <div class="pm-admin__actions">
            <button type="submit" name="_method" value="PATCH" class="pm-admin__btn pm-admin__btn--muted" formaction="" formmethod="POST" onclick="document.getElementById('pm-action').value='save'">
                Salvar configurações
            </button>

            @if(!$is_down)
                <button type="submit" name="_method" value="PATCH" class="pm-admin__btn pm-admin__btn--warn" onclick="document.getElementById('pm-action').value='enable'">
                    Ativar manutenção
                </button>
            @else
                <button type="submit" name="_method" value="PATCH" class="pm-admin__btn pm-admin__btn--ok" onclick="document.getElementById('pm-action').value='disable'">
                    Desativar manutenção
                </button>
            @endif
        </div>

        <input type="hidden" name="action" id="pm-action" value="save">
    </form>
</div>
