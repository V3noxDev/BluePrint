{{-- Admin page fragment — do NOT @extends layouts.admin (Blueprint gear overlay) --}}

<div class="bv-admin">
    <div class="bv-admin__header">
        <div>
            <h3 class="bv-admin__title">Bedrock Version Manager</h3>
            <p class="bv-admin__subtitle">
                Gerencia versões Stable e Preview do Bedrock Dedicated Server e atualiza a variável
                <code>BEDROCK_VERSION</code>.
            </p>
        </div>
        <span class="bv-admin__badge">v1.0.0</span>
    </div>

    <div class="bv-admin__grid">
        <div class="bv-admin__card">
            <div class="bv-admin__label">Stable em cache</div>
            <div class="bv-admin__value">{{ $stats['stable'] ?? 0 }}</div>
        </div>
        <div class="bv-admin__card">
            <div class="bv-admin__label">Preview em cache</div>
            <div class="bv-admin__value">{{ $stats['preview'] ?? 0 }}</div>
        </div>
        <div class="bv-admin__card">
            <div class="bv-admin__label">Última sincronização</div>
            <div class="bv-admin__value bv-admin__value--sm">{{ $last_sync }}</div>
        </div>
    </div>

    <form action="{{ $root }}" method="POST" class="bv-admin__form">
        {{ csrf_field() }}
        <input type="hidden" name="_method" value="PATCH">

        <div class="bv-admin__card bv-admin__card--wide">
            <label class="bv-admin__toggle">
                <input type="checkbox" name="auto_sync" value="1" {{ $auto_sync ? 'checked' : '' }}>
                <span>Sincronização automática pela API oficial</span>
            </label>

            <label class="bv-admin__toggle" style="margin-top:12px;">
                <input type="checkbox" name="force_sync" value="1">
                <span>Sincronizar agora (ao salvar)</span>
            </label>

            <p class="bv-admin__hint">
                Use a <strong>engrenagem do Blueprint</strong> nesta página para liberar a rota apenas nos eggs Bedrock.
                Rota: <code>/server/{id}/minecraft/bedrock-version</code>
            </p>

            <button type="submit" class="bv-admin__btn">Salvar</button>
        </div>
    </form>
</div>
