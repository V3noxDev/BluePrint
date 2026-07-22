{{--
  Admin MC Plugins — NÃO usar @extends (Blueprint envolve + engrenagem de eggs).
--}}

<div class="pl-admin">
    <div class="pl-admin__header">
        <div>
            <h3 class="pl-admin__title">MC Plugins Manager</h3>
            <p class="pl-admin__subtitle">
                Gerenciador de plugins Minecraft (Paper / Spigot / Purpur) com busca em
                <strong>Modrinth</strong>, <strong>Hangar</strong>, <strong>SpigotMC</strong> e
                <strong>CurseForge</strong>.
            </p>
        </div>
        <span class="pl-admin__version">v1.0.0</span>
    </div>

    @if(session('success'))
        <div class="pl-admin__alert pl-admin__alert--ok">{{ session('success') }}</div>
    @endif

    <div class="pl-admin__info-grid">
        <div class="pl-admin__info-card pl-admin__info-card--wide">
            <div class="pl-admin__info-title">
                <svg class="pl-admin__icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.12c.176-.203.176-.492-.096-.754l-.13-.155 1.178-2.066.082-.145c.182-.29.11-.578-.062-.785-.18-.214-.5-.295-.84-.223l-.17.038.287-2.23zm-.034 6.878-.708.707a.5.5 0 0 1-.707-.707l.707-.708.708.708z"/></svg>
                Information
            </div>
            <ul class="pl-admin__info-list">
                <li>
                    O <strong>MC Plugins Manager</strong> facilita instalar e gerenciar plugins
                    de Minecraft: Java Edition para administradores de servidor.
                </li>
                <li>
                    Busque plugins no <strong>Modrinth</strong>, <strong>Hangar</strong>,
                    <strong>SpigotMC</strong> ou <strong>CurseForge</strong>. Os três primeiros
                    funcionam sem configuração; o CurseForge exige API Key abaixo.
                </li>
                <li>
                    Instale uma versão específica e gerencie tudo pelo painel — busca, instalação,
                    atualização e remoção na pasta <code>/plugins</code>.
                </li>
            </ul>
        </div>

        <div class="pl-admin__info-card">
            <div class="pl-admin__info-title">
                <svg class="pl-admin__icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1h-3zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5zm1.886 6.914L15 7.151V12.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V7.15l6.614 1.764a1.5 1.5 0 0 0 .772 0zM1.5 4h13a.5.5 0 0 1 .5.5v1.616L8.129 7.948a.5.5 0 0 1-.258 0L1 6.116V4.5a.5.5 0 0 1 .5-.5z"/></svg>
                EULA
            </div>
            <p class="pl-admin__info-text">
                Compartilhar ou redistribuir os assets baixados desta extensão é proibido e pode
                resultar na revogação da licença. Você não possui direitos para distribuir os
                arquivos obtidos. Ao usar este produto, você concorda com estes termos.
            </p>
        </div>

        <div class="pl-admin__info-card">
            <div class="pl-admin__info-title">
                <svg class="pl-admin__icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5 10.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/><path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z"/><path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1H1v.5a.5.5 0 0 1-1 0V6h-.5a.5.5 0 0 1 0-1H1V5z"/></svg>
                Terms of Service
            </div>
            <ol class="pl-admin__info-ol">
                <li>Sem reembolsos.</li>
                <li>Não revenda ou redistribua esta extensão.</li>
                <li>Chargebacks são proibidos.</li>
                <li>Não publique esta extensão em sites de terceiros.</li>
                <li>Suporte via canal oficial do provedor.</li>
                <li>Atualizações não são garantidas.</li>
                <li>Uma licença por instalação, salvo autorização.</li>
            </ol>
        </div>
    </div>

    <div class="pl-admin__grid">
        <div class="pl-admin__card pl-admin__card--wide">
            <div class="pl-admin__card-title">CurseForge API Key (opcional)</div>
            <form id="config-form" action="" method="POST" class="pl-admin__form">
                <p class="pl-admin__hint">
                    Necessária apenas para buscar no <strong>CurseForge</strong>. O
                    <strong>Modrinth</strong> não precisa de API Key. Chave em
                    <a href="https://console.curseforge.com/" target="_blank" rel="noreferrer">
                        console.curseforge.com
                    </a>
                    (CurseForge for Studios).
                </p>
                <label class="pl-admin__label" for="curseforge_api_key">API Key</label>
                <input
                    type="password"
                    name="curseforge_api_key"
                    id="curseforge_api_key"
                    class="pl-admin__input"
                    value="{{ $api_key }}"
                    placeholder="Cole sua x-api-key aqui"
                    autocomplete="off"
                />
                <div class="pl-admin__status">
                    Status:
                    @if($has_api_key)
                        <span class="pl-admin__badge pl-admin__badge--ok">Configurada</span>
                        <code>{{ $api_key_masked }}</code>
                    @else
                        <span class="pl-admin__badge pl-admin__badge--warn">Não configurada</span>
                    @endif
                </div>
                {{ csrf_field() }}
                <button type="submit" name="_method" value="PATCH" class="pl-admin__btn">
                    Salvar API Key
                </button>
            </form>
        </div>

        <div class="pl-admin__card">
            <div class="pl-admin__card-title">Como usar</div>
            <ol class="pl-admin__steps">
                <li>Abra <code>/server/{id}/minecraft/plugins</code> e escolha o provedor desejado.</li>
                <li>Para CurseForge, salve a API Key nesta página.</li>
                <li>Engrenagem do Blueprint → eggs Paper/Spigot.</li>
            </ol>
        </div>

        <div class="pl-admin__card">
            <div class="pl-admin__card-title">Wings</div>
            <p class="pl-admin__hint">
                Download remoto ativo:
                <code>api.disable_remote_download: false</code>
            </p>
        </div>
    </div>
</div>
