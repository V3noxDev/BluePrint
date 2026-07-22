{{--
  Admin MC Plugins — NÃO usar @extends (Blueprint envolve + engrenagem de eggs).
--}}

<div class="pl-admin">
    <div class="pl-admin__header">
        <div>
            <h3 class="pl-admin__title">MC Plugins Manager</h3>
            <p class="pl-admin__subtitle">
                Gerenciador de plugins Minecraft (Paper / Spigot / Purpur) via
                <strong>CurseForge API</strong>.
            </p>
        </div>
        <span class="pl-admin__version">v1.0.0</span>
    </div>

    @if(session('success'))
        <div class="pl-admin__alert pl-admin__alert--ok">{{ session('success') }}</div>
    @endif

    <div class="pl-admin__info-grid">
        <div class="pl-admin__info-card pl-admin__info-card--wide">
            <div class="pl-admin__info-title">ℹ Information</div>
            <ul class="pl-admin__info-list">
                <li>
                    O <strong>MC Plugins Manager</strong> facilita instalar e gerenciar plugins
                    de Minecraft: Java Edition para administradores de servidor.
                </li>
                <li>
                    Navegue por milhares de plugins, veja detalhes, instale uma versão
                    específica e gerencie tudo pelo painel — busca, instalação, atualização e
                    remoção.
                </li>
                <li>
                    A interface é inspirada em catálogos como Modrinth, Hangar e SpigotMC, mas
                    o catálogo e os downloads usam a <strong>API oficial do CurseForge</strong>
                    (Bukkit Plugins).
                </li>
                <li>
                    Configure a API Key abaixo. Sem ela, o painel mostra
                    <em>“Não encontramos nenhum plugin”</em>.
                </li>
            </ul>
        </div>

        <div class="pl-admin__info-card">
            <div class="pl-admin__info-title">👤 EULA</div>
            <p class="pl-admin__info-text">
                Compartilhar ou redistribuir os assets baixados desta extensão é proibido e pode
                resultar na revogação da licença. Você não possui direitos para distribuir os
                arquivos obtidos. Ao usar este produto, você concorda com estes termos.
            </p>
        </div>

        <div class="pl-admin__info-card">
            <div class="pl-admin__info-title">📖 Terms of Service</div>
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
            <div class="pl-admin__card-title">CurseForge API Key</div>
            <form id="config-form" action="" method="POST" class="pl-admin__form">
                <p class="pl-admin__hint">
                    Chave em
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
                <li>Salve a API Key do CurseForge.</li>
                <li>Engrenagem do Blueprint → eggs Paper/Spigot.</li>
                <li><code>/server/{id}/minecraft/plugins</code></li>
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
