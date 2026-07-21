{{--
  Conteúdo da página admin do Bedrock Version Manager.
  NÃO usar @extends — o Blueprint envolve esta view e inclui a engrenagem
  de permissões/eggs automaticamente.
--}}

<div class="bv-admin">
    <div class="bv-admin__header">
        <div>
            <h3 class="bv-admin__title">Bedrock Version Manager</h3>
            <p class="bv-admin__subtitle">
                Seletor de versões do <code>Bedrock Dedicated Server</code> — Stable, Preview e
                variável <code>BEDROCK_VERSION</code>.
            </p>
        </div>
        <span class="bv-admin__version">v1.2.0</span>
    </div>

    <div class="bv-admin__grid">
        <div class="bv-admin__card">
            <div class="bv-admin__card-title">Como usar</div>
            <ol class="bv-admin__steps">
                <li>Clique na <strong>engrenagem</strong> no canto desta página (configurações do Blueprint).</li>
                <li>Selecione os <strong>eggs Bedrock</strong> em que a aba Versions deve aparecer.</li>
                <li>No servidor, acesse <code>/server/{id}/minecraft/bedrock-version</code>.</li>
            </ol>
        </div>

        <div class="bv-admin__card">
            <div class="bv-admin__card-title">Recursos</div>
            <ul class="bv-admin__list">
                <li>Busca automática na API oficial da Mojang</li>
                <li>Detecta versões novas e marca só a mais recente como <strong>Latest</strong></li>
                <li>Mantém histórico e ordena do mais novo ao mais antigo</li>
                <li>Stable + Preview (PocketMine em breve)</li>
                <li>Atualiza a variável <code>BEDROCK_VERSION</code></li>
            </ul>
        </div>

        <div class="bv-admin__card">
            <div class="bv-admin__card-title">Stable em cache</div>
            <div class="bv-admin__stat">{{ $stats['stable'] ?? 0 }}</div>
            <div class="bv-admin__stat-sub">
                Latest: <code>{{ $stats['latest_stable'] ?? '—' }}</code>
            </div>
        </div>

        <div class="bv-admin__card">
            <div class="bv-admin__card-title">Preview em cache</div>
            <div class="bv-admin__stat">{{ $stats['preview'] ?? 0 }}</div>
            <div class="bv-admin__stat-sub">
                Latest: <code>{{ $stats['latest_preview'] ?? '—' }}</code>
            </div>
        </div>

        <div class="bv-admin__card bv-admin__card--wide">
            <div class="bv-admin__card-title">Rota do painel</div>
            <div class="bv-admin__route">
                <code>/server/{id}/minecraft/bedrock-version</code>
            </div>
            <p class="bv-admin__hint">
                A lista atualiza sozinha (a cada ~30 min). Não precisa de botão de refresh.
                Última sincronização: <strong>{{ $last_sync }}</strong>.
                Para limitar a eggs Bedrock, use a <strong>engrenagem do Blueprint</strong> nesta página.
            </p>
        </div>
    </div>
</div>
