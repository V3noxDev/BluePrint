{{--
  Admin Infra — NÃO usar @extends (Blueprint envolve + engrenagem de eggs).
--}}

<div class="ai-admin">
    <div class="ai-admin__header">
        <div>
            <h3 class="ai-admin__title">Admin Infra</h3>
            <p class="ai-admin__subtitle">
                Tema escuro e melhorias de UX para infraestrutura — nodes, allocations,
                criação de servidores e tabelas administrativas.
            </p>
        </div>
        <span class="ai-admin__version">v1.2.0</span>
    </div>

    @if(session('success'))
        <div class="ai-admin__alert ai-admin__alert--ok">{{ session('success') }}</div>
    @endif

    <div class="ai-admin__grid">
        <div class="ai-admin__card ai-admin__card--wide">
            <div class="ai-admin__card-title">Aparência</div>
            <form action="" method="POST" class="ai-admin__form">
                <div class="ai-admin__preview" id="ai-color-preview">
                    <div class="ai-admin__preview-bar" style="background: {{ $accent_color }}"></div>
                    <div class="ai-admin__preview-row">
                        <span class="ai-admin__preview-chip" style="background: {{ $accent_color }}">Botão</span>
                        <span class="ai-admin__preview-text">Pré-visualização da cor de destaque</span>
                    </div>
                </div>

                <label class="ai-admin__label" for="accent_color">Cor de destaque</label>
                <div class="ai-admin__color-row">
                    <input
                        type="color"
                        id="accent_color_picker"
                        value="{{ $accent_color }}"
                        oninput="aiAdminSyncColor(this.value)"
                    />
                    <input
                        type="text"
                        name="accent_color"
                        id="accent_color"
                        class="ai-admin__input"
                        value="{{ $accent_color }}"
                        pattern="^#[0-9A-Fa-f]{6}$"
                        placeholder="#3b82f6"
                        oninput="aiAdminSyncColor(this.value)"
                    />
                </div>
                <p class="ai-admin__hint">
                    Sidebar, links, abas ativas e gráficos do node usam esta cor.
                </p>

                <label class="ai-admin__check">
                    <input
                        type="checkbox"
                        name="compact_mode"
                        value="1"
                        {{ $compact_mode ? 'checked' : '' }}
                    />
                    Modo compacto (tabelas com menos padding)
                </label>

                {{ csrf_field() }}
                <button type="submit" name="_method" value="PATCH" class="ai-admin__btn">
                    Salvar configurações
                </button>
            </form>
        </div>

        <div class="ai-admin__card">
            <div class="ai-admin__card-title">Recursos</div>
            <ul class="ai-admin__features">
                <li><span class="ai-admin__feature-dot"></span> Tema escuro em todo o admin</li>
                <li><span class="ai-admin__feature-dot"></span> Gráficos de RAM e disco no node</li>
                <li><span class="ai-admin__feature-dot"></span> Alocações e servidores em abas inferiores</li>
                <li><span class="ai-admin__feature-dot"></span> IPs e portas em fonte monoespaçada</li>
            </ul>
        </div>

        <div class="ai-admin__card">
            <div class="ai-admin__card-title">Como aplicar</div>
            <ol class="ai-admin__steps">
                <li>Salve as configurações acima.</li>
                <li>Recarregue qualquer página do <strong>Admin</strong> (F5).</li>
                <li>Abra um node em <strong>About</strong> para ver os gráficos.</li>
            </ol>
            <p class="ai-admin__hint">
                Não altera o dashboard do cliente — apenas a área administrativa.
            </p>
        </div>
    </div>
</div>

<script>
    function aiAdminSyncColor(hex) {
        if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
        var bar = document.querySelector('.ai-admin__preview-bar');
        var chip = document.querySelector('.ai-admin__preview-chip');
        var picker = document.getElementById('accent_color_picker');
        var input = document.getElementById('accent_color');
        if (bar) bar.style.background = hex;
        if (chip) chip.style.background = hex;
        if (picker && picker.value !== hex) picker.value = hex;
        if (input && input.value !== hex) input.value = hex;
    }
</script>
