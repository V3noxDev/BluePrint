{{--
  Admin Infra — NÃO usar @extends (Blueprint envolve + engrenagem de eggs).
--}}

<div class="ai-admin">
    <div class="ai-admin__header">
        <div>
            <h3 class="ai-admin__title">Admin Infra</h3>
            <p class="ai-admin__subtitle">
                Tema escuro para o painel administrativo — nodes, allocations, criação de servidores
                e demais telas de infraestrutura com melhor contraste e legibilidade.
            </p>
        </div>
        <span class="ai-admin__version">v1.1.0</span>
    </div>

    @if(session('success'))
        <div class="ai-admin__alert ai-admin__alert--ok">{{ session('success') }}</div>
    @endif

    <div class="ai-admin__grid">
        <div class="ai-admin__card ai-admin__card--wide">
            <div class="ai-admin__card-title">Aparência</div>
            <form action="" method="POST" class="ai-admin__form">
                <label class="ai-admin__label" for="accent_color">Cor de destaque</label>
                <div class="ai-admin__color-row">
                    <input
                        type="color"
                        id="accent_color_picker"
                        value="{{ $accent_color }}"
                        oninput="document.getElementById('accent_color').value = this.value"
                    />
                    <input
                        type="text"
                        name="accent_color"
                        id="accent_color"
                        class="ai-admin__input"
                        value="{{ $accent_color }}"
                        pattern="^#[0-9A-Fa-f]{6}$"
                        placeholder="#3b82f6"
                    />
                </div>
                <p class="ai-admin__hint">
                    Usada em botões, links, abas ativas e destaques de nodes/allocations.
                </p>

                <label class="ai-admin__check">
                    <input
                        type="checkbox"
                        name="compact_mode"
                        value="1"
                        {{ $compact_mode ? 'checked' : '' }}
                    />
                    Tabelas compactas (melhor para muitas allocations)
                </label>

                {{ csrf_field() }}
                <button type="submit" name="_method" value="PATCH" class="ai-admin__btn">
                    Salvar configurações
                </button>
            </form>
        </div>

        <div class="ai-admin__card">
            <div class="ai-admin__card-title">O que melhora</div>
            <ul class="ai-admin__list">
                <li>Sidebar e header em preto/cinza escuro</li>
                <li>Gráficos de RAM e disco no About do node</li>
                <li>Alocações e servidores em abas na parte inferior</li>
                <li>Cards, modais e formulários com alto contraste</li>
                <li>Portas e IPs em fonte monoespaçada</li>
            </ul>
        </div>

        <div class="ai-admin__card">
            <div class="ai-admin__card-title">Instalação</div>
            <ol class="ai-admin__steps">
                <li>Salve as configurações acima.</li>
                <li>Recarregue qualquer página do <strong>Admin</strong> (F5).</li>
                <li>O tema aplica em todo o painel automaticamente.</li>
            </ol>
            <p class="ai-admin__hint">
                Não altera o dashboard do cliente — apenas a área administrativa.
            </p>
        </div>
    </div>
</div>
