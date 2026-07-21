@php
    $propertyMap = collect($properties)->keyBy('key');
    $allocation = $selectedServer?->allocation;
    $allocationPort = $allocation?->port;
    $allocationAddress = $allocation ? (($allocation->ip_alias ?: $allocation->ip) . ':' . $allocation->port) : null;
@endphp

<div class="spm-page">
    <div class="spm-hero">
        <div>
            <span class="spm-pill">Blueprint Addon</span>
            <h1>Minecraft Properties Manager</h1>
            <p>Edite o <code>{{ $filePath }}</code> dos servidores Minecraft Java direto pelo admin do Pterodactyl, com backup automatico antes de salvar.</p>
        </div>
        <div class="spm-hero-card">
            <span>Limite do editor</span>
            <strong>{{ number_format($maxFileSize / 1024 / 1024, 2) }} MB</strong>
        </div>
    </div>

    @if (session('success'))
        <div class="spm-alert spm-alert-success">{{ session('success') }}</div>
    @endif

    @if ($errors->any())
        <div class="spm-alert spm-alert-danger">
            <strong>Revise os campos abaixo:</strong>
            <ul>
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    @if ($readError)
        <div class="spm-alert spm-alert-warning">{{ $readError }}</div>
    @endif

    <div class="spm-layout">
        <aside class="spm-panel spm-sidebar">
            <div class="spm-panel-heading">
                <div>
                    <span class="spm-kicker">Selecao</span>
                    <h2>Servidores</h2>
                </div>
                <span class="spm-count">{{ $servers->count() }}</span>
            </div>

            <form method="GET" action="{{ $root }}" class="spm-search">
                <input type="text" name="search" value="{{ $search }}" placeholder="Buscar por nome, UUID, node, nest ou egg">
                @if ($selectedServer)
                    <input type="hidden" name="server_id" value="{{ $selectedServer->id }}">
                @endif
                <button type="submit">Buscar</button>
            </form>

            <div class="spm-server-list">
                @forelse ($servers as $server)
                    @php
                        $serverAllocation = $server->allocation;
                        $serverAddress = $serverAllocation ? (($serverAllocation->ip_alias ?: $serverAllocation->ip) . ':' . $serverAllocation->port) : 'sem allocation';
                        $active = $selectedServer && $selectedServer->id === $server->id;
                    @endphp
                    <a class="spm-server {{ $active ? 'is-active' : '' }}" href="{{ $root }}?{{ http_build_query(['server_id' => $server->id, 'search' => $search]) }}">
                        <span class="spm-server-name">{{ $server->name }}</span>
                        <span class="spm-server-meta">
                            {{ $server->egg?->name ?? 'Egg desconhecido' }} &bull; {{ $serverAddress }}
                        </span>
                    </a>
                @empty
                    <div class="spm-empty">Nenhum servidor encontrado.</div>
                @endforelse
            </div>
        </aside>

        <main class="spm-main">
            @if (!$selectedServer)
                <section class="spm-panel spm-empty-state">
                    <span class="spm-kicker">Comece aqui</span>
                    <h2>Escolha um servidor Minecraft</h2>
                    <p>O addon mostra servidores de eggs/nests Minecraft primeiro. Se o painel nao tiver esse nome no egg, use a busca para localizar qualquer servidor.</p>
                    <div class="spm-steps">
                        <span>1. Selecione o servidor</span>
                        <span>2. Ajuste as opcoes</span>
                        <span>3. Salve com backup automatico</span>
                    </div>
                </section>
            @else
                <section class="spm-panel spm-selected">
                    <div>
                        <span class="spm-kicker">Servidor selecionado</span>
                        <h2>{{ $selectedServer->name }}</h2>
                        <p>
                            {{ $selectedServer->nest?->name ?? 'Nest desconhecido' }} /
                            {{ $selectedServer->egg?->name ?? 'Egg desconhecido' }}
                            @if ($allocationAddress)
                                &bull; {{ $allocationAddress }}
                            @endif
                        </p>
                    </div>
                    @if ($allocationPort)
                        <button type="button" class="spm-mini-button" data-copy-port="{{ $allocationPort }}">Usar porta {{ $allocationPort }}</button>
                    @endif
                </section>

                <form method="POST" action="{{ $root }}" id="spm-editor-form">
                    @csrf
                    <input type="hidden" name="server_id" value="{{ $selectedServer->id }}">

                    <section class="spm-panel">
                        <div class="spm-panel-heading">
                            <div>
                                <span class="spm-kicker">Atalhos visuais</span>
                                <h2>Propriedades comuns</h2>
                            </div>
                            <span class="spm-save-hint">Sincroniza com o editor abaixo</span>
                        </div>

                        <div class="spm-settings-grid">
                            @foreach ($knownSettings as $key => $setting)
                                @php
                                    $value = $propertyMap->has($key) ? $propertyMap->get($key)['value'] : '';
                                    $inputType = $setting['type'];
                                @endphp
                                <label class="spm-setting">
                                    <span class="spm-setting-label">{{ $setting['label'] }}</span>
                                    @if ($inputType === 'boolean')
                                        <select class="spm-setting-input" data-prop-key="{{ $key }}">
                                            <option value="" {{ $value === '' ? 'selected' : '' }}>Nao alterar</option>
                                            <option value="true" {{ $value === 'true' ? 'selected' : '' }}>true</option>
                                            <option value="false" {{ $value === 'false' ? 'selected' : '' }}>false</option>
                                        </select>
                                    @elseif ($inputType === 'select')
                                        <select class="spm-setting-input" data-prop-key="{{ $key }}">
                                            <option value="" {{ $value === '' ? 'selected' : '' }}>Nao alterar</option>
                                            @foreach ($setting['options'] as $option)
                                                <option value="{{ $option }}" {{ $value === $option ? 'selected' : '' }}>{{ $option }}</option>
                                            @endforeach
                                        </select>
                                    @else
                                        <input class="spm-setting-input" data-prop-key="{{ $key }}" type="{{ $inputType }}" value="{{ $value }}" placeholder="Nao alterar">
                                    @endif
                                    <small>{{ $setting['hint'] }}</small>
                                </label>
                            @endforeach
                        </div>
                    </section>

                    <section class="spm-panel spm-editor-panel">
                        <div class="spm-panel-heading">
                            <div>
                                <span class="spm-kicker">Arquivo real</span>
                                <h2>{{ $filePath }}</h2>
                            </div>
                            <div class="spm-actions">
                                <button type="button" class="spm-secondary" id="spm-sort">Organizar linhas</button>
                                <button type="submit" class="spm-primary">Salvar server.properties</button>
                            </div>
                        </div>

                        <textarea name="content" id="spm-content" spellcheck="false">{{ $rawContent }}</textarea>

                        <div class="spm-footer-note">
                            Ao salvar, o addon cria um arquivo <code>server.properties.blueprint-backup-YYYYmmdd-His</code> na raiz do servidor antes de escrever a nova versao.
                        </div>
                    </section>
                </form>
            @endif
        </main>
    </div>
</div>

<script>
(() => {
    const editor = document.getElementById('spm-content');
    if (!editor) return;

    const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const setProperty = (key, value) => {
        if (!key || value === '') return;

        const lines = editor.value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        const pattern = new RegExp('^\\s*' + escapeRegExp(key) + '\\s*[=:]');
        const nextLine = key + '=' + value;
        const index = lines.findIndex((line) => pattern.test(line));

        if (index >= 0) {
            lines[index] = nextLine;
        } else {
            while (lines.length && lines[lines.length - 1].trim() === '') {
                lines.pop();
            }
            lines.push(nextLine);
        }

        editor.value = lines.join('\n').replace(/\n*$/, '\n');
    };

    document.querySelectorAll('.spm-setting-input').forEach((input) => {
        input.addEventListener('change', () => setProperty(input.dataset.propKey, input.value));
        input.addEventListener('input', () => {
            if (input.tagName !== 'SELECT') {
                setProperty(input.dataset.propKey, input.value);
            }
        });
    });

    document.querySelectorAll('[data-copy-port]').forEach((button) => {
        button.addEventListener('click', () => {
            setProperty('server-port', button.dataset.copyPort);
            setProperty('query.port', button.dataset.copyPort);
        });
    });

    const sortButton = document.getElementById('spm-sort');
    if (sortButton) {
        sortButton.addEventListener('click', () => {
            const lines = editor.value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
            const comments = lines.filter((line) => line.trim() === '' || line.trim().startsWith('#') || line.trim().startsWith('!'));
            const props = lines.filter((line) => line.trim() !== '' && !line.trim().startsWith('#') && !line.trim().startsWith('!'));
            props.sort((a, b) => a.localeCompare(b));
            editor.value = [...comments, ...props].join('\n').replace(/\n*$/, '\n');
        });
    }
})();
</script>
