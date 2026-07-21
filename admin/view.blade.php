@php
    $groupedDefinitions = [];
    foreach ($fieldDefinitions as $key => $definition) {
        $groupedDefinitions[$definition['group']][$key] = $definition;
    }

    $selectedServer = null;
    foreach ($servers as $serverOption) {
        if ((string) $serverOption['id'] === (string) $selectedServerId) {
            $selectedServer = $serverOption;
            break;
        }
    }

    $statusClass = $statusType === 'danger' ? 'mcsp-alert-danger' : 'mcsp-alert-success';
@endphp

<div class="mcsp-shell">
    <section class="mcsp-hero">
        <div class="mcsp-hero-copy">
            <span class="mcsp-badge">Blueprint beta-2026-05</span>
            <h1>MC Server Properties Pro</h1>
            <p>
                Editor visual e raw para <code>server.properties</code> com fluxo pensado para Pterodactyl + Blueprint.
                Escolha o servidor, carregue o arquivo e aplique ajustes rapidos sem perder a flexibilidade do texto bruto.
            </p>
        </div>

        <div class="mcsp-hero-panel">
            <div class="mcsp-mini-stat">
                <span>Servidores visiveis</span>
                <strong>{{ $stats['server_count'] }}</strong>
            </div>
            <div class="mcsp-mini-stat">
                <span>Campos rapidos</span>
                <strong>{{ $stats['field_count'] }}</strong>
            </div>
            <div class="mcsp-mini-stat">
                <span>Arquivo alvo</span>
                <strong>{{ $propertiesPath }}</strong>
            </div>
        </div>
    </section>

    @if (session('status'))
        <div class="mcsp-alert {{ $statusClass }}">
            <strong>Status:</strong>
            <span>{{ session('status') }}</span>
        </div>
    @endif

    @if ($errors->any())
        <div class="mcsp-alert mcsp-alert-danger">
            <strong>Atencao:</strong>
            <ul>
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <section class="mcsp-panel">
        <div class="mcsp-section-heading">
            <div>
                <span class="mcsp-kicker">Passo 1</span>
                <h2>Selecionar servidor e carregar arquivo</h2>
            </div>
            <p>Use um servidor Minecraft Java e mantenha o caminho padrao se o arquivo estiver na raiz.</p>
        </div>

        <form action="{{ $root }}" method="POST" autocomplete="off" class="mcsp-selector-grid">
            {!! csrf_field() !!}

            <label class="mcsp-field">
                <span>Servidor</span>
                <select name="server_id" required>
                    <option value="">Escolha um servidor</option>
                    @foreach ($servers as $server)
                        <option value="{{ $server['id'] }}" @selected((string) $server['id'] === (string) $selectedServerId)>
                            #{{ $server['id'] }} - {{ $server['name'] }} ({{ $server['short_uuid'] }})
                        </option>
                    @endforeach
                </select>
            </label>

            <label class="mcsp-field">
                <span>Caminho do arquivo</span>
                <input type="text" name="properties_path" value="{{ $propertiesPath }}" placeholder="server.properties" required>
            </label>

            <button type="submit" class="mcsp-button mcsp-button-primary">Carregar server.properties</button>
        </form>
    </section>

    <div class="mcsp-stats-grid">
        <article class="mcsp-stat-card">
            <span>Servidor atual</span>
            <strong>{{ $selectedServer['name'] ?? 'Nenhum servidor carregado' }}</strong>
            <small>{{ $selectedServer ? '#' . $selectedServer['id'] . ' - ' . $selectedServer['uuid'] : 'Selecione um servidor acima' }}</small>
        </article>

        <article class="mcsp-stat-card">
            <span>Fluxo de instalacao</span>
            <strong>Install / Remove / Export</strong>
            <small>Pronto para uso com <code>blueprint -install</code> e <code>blueprint -remove</code>.</small>
        </article>

        <article class="mcsp-stat-card">
            <span>Compatibilidade</span>
            <strong>{{ $stats['target_version'] }}</strong>
            <small>Target definido para o release atual do Blueprint.</small>
        </article>
    </div>

    <form action="{{ $root }}" method="POST" autocomplete="off" class="mcsp-editor-layout">
        {!! csrf_field() !!}
        <input type="hidden" name="_method" value="PATCH">
        <input type="hidden" name="server_id" value="{{ $selectedServerId }}">
        <input type="hidden" name="properties_path" value="{{ $propertiesPath }}">

        <div class="mcsp-editor-main">
            <section class="mcsp-panel">
                <div class="mcsp-section-heading">
                    <div>
                        <span class="mcsp-kicker">Passo 2</span>
                        <h2>Edicao visual rapida</h2>
                    </div>
                    <p>Os campos abaixo aplicam override no texto bruto no momento do salvamento.</p>
                </div>

                <div class="mcsp-group-grid">
                    @foreach ($groupedDefinitions as $groupName => $definitions)
                        <article class="mcsp-group-card">
                            <div class="mcsp-group-header">
                                <h3>{{ $groupName }}</h3>
                                <span>{{ count($definitions) }} campos</span>
                            </div>

                            <div class="mcsp-group-body">
                                @foreach ($definitions as $fieldKey => $definition)
                                    @php
                                        $fieldValue = $fieldValues[$fieldKey] ?? '';
                                        $inputId = 'field-' . $fieldKey;
                                    @endphp

                                    <label class="mcsp-field">
                                        <span>{{ $definition['label'] }}</span>

                                        @if ($definition['type'] === 'select')
                                            <select id="{{ $inputId }}" name="fields[{{ $fieldKey }}]">
                                                @foreach ($definition['options'] as $optionValue => $optionLabel)
                                                    <option value="{{ $optionValue }}" @selected((string) $fieldValue === (string) $optionValue)>
                                                        {{ $optionLabel }}
                                                    </option>
                                                @endforeach
                                            </select>
                                        @elseif ($definition['type'] === 'toggle')
                                            <select id="{{ $inputId }}" name="fields[{{ $fieldKey }}]">
                                                <option value="true" @selected((string) $fieldValue === 'true')>Ativado</option>
                                                <option value="false" @selected((string) $fieldValue === 'false')>Desativado</option>
                                            </select>
                                        @else
                                            <input
                                                id="{{ $inputId }}"
                                                type="{{ $definition['type'] === 'number' ? 'number' : 'text' }}"
                                                name="fields[{{ $fieldKey }}]"
                                                value="{{ $fieldValue }}"
                                                placeholder="{{ $definition['placeholder'] ?? '' }}"
                                            >
                                        @endif

                                        <small>{{ $definition['description'] }}</small>
                                    </label>
                                @endforeach
                            </div>
                        </article>
                    @endforeach
                </div>
            </section>
        </div>

        <aside class="mcsp-editor-side">
            <section class="mcsp-panel mcsp-sticky-panel">
                <div class="mcsp-section-heading mcsp-section-heading-compact">
                    <div>
                        <span class="mcsp-kicker">Passo 3</span>
                        <h2>Editor raw</h2>
                    </div>
                    <p>Ideal para propriedades avancadas que nao estao no formulario rapido.</p>
                </div>

                <textarea
                    class="mcsp-raw-editor"
                    name="properties_content"
                    spellcheck="false"
                    placeholder="# server.properties"
                >{{ $propertiesContent }}</textarea>

                <div class="mcsp-save-stack">
                    <button
                        type="submit"
                        class="mcsp-button mcsp-button-primary mcsp-button-block"
                        @if ((string) $selectedServerId === '') disabled @endif
                    >
                        Salvar no Wings
                    </button>

                    <a href="{{ $root }}" class="mcsp-button mcsp-button-ghost">Limpar rascunho visual</a>
                </div>

                <div class="mcsp-info-card">
                    <h3>Resumo da sessao</h3>
                    <ul>
                        <li><strong>Servidor:</strong> {{ $selectedServer['name'] ?? 'Nenhum' }}</li>
                        <li><strong>ID:</strong> {{ $selectedServer['id'] ?? '-' }}</li>
                        <li><strong>Arquivo:</strong> {{ $propertiesPath }}</li>
                        <li><strong>Modo:</strong> Admin extension Blueprint</li>
                    </ul>
                </div>

                <div class="mcsp-command-card">
                    <h3>Comandos de deploy</h3>
                    <code>blueprint -install mcserverprops</code>
                    <code>blueprint -remove mcserverprops</code>
                    <code>./scripts/blueprint-installer.sh</code>
                </div>
            </section>
        </aside>
    </form>
</div>
