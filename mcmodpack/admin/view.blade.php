{{--
  Admin MC Modpacks — NÃO usar @extends (Blueprint envolve + engrenagem de eggs).
--}}

<div class="mp-admin">
    <div class="mp-admin__header">
        <div>
            <h3 class="mp-admin__title">MC Modpacks</h3>
            <p class="mp-admin__subtitle">
                Instalador de modpacks via <strong>CurseForge API</strong> para servidores
                Forge / NeoForge (e Fabric). Configure a API Key abaixo.
            </p>
        </div>
        <span class="mp-admin__version">v1.0.0</span>
    </div>

    @if(session('success'))
        <div class="mp-admin__alert mp-admin__alert--ok">{{ session('success') }}</div>
    @endif

    <div class="mp-admin__grid">
        <div class="mp-admin__card mp-admin__card--wide">
            <div class="mp-admin__card-title">CurseForge API Key</div>
            <form id="config-form" action="" method="POST" class="mp-admin__form">
                <p class="mp-admin__hint">
                    Crie uma chave em
                    <a href="https://console.curseforge.com/" target="_blank" rel="noreferrer">
                        console.curseforge.com
                    </a>
                    (CurseForge for Studios). Sem a chave, o painel mostra
                    <em>“Não encontramos nenhum modpack”</em>.
                </p>

                <label class="mp-admin__label" for="curseforge_api_key">API Key</label>
                <input
                    type="password"
                    name="curseforge_api_key"
                    id="curseforge_api_key"
                    class="mp-admin__input"
                    value="{{ $api_key }}"
                    placeholder="Cole sua x-api-key aqui"
                    autocomplete="off"
                />

                <div class="mp-admin__status">
                    Status:
                    @if($has_api_key)
                        <span class="mp-admin__badge mp-admin__badge--ok">Configurada</span>
                        <code>{{ $api_key_masked }}</code>
                    @else
                        <span class="mp-admin__badge mp-admin__badge--warn">Não configurada</span>
                    @endif
                </div>

                {{ csrf_field() }}
                <button type="submit" name="_method" value="PATCH" class="mp-admin__btn">
                    Salvar API Key
                </button>
            </form>
        </div>

        <div class="mp-admin__card">
            <div class="mp-admin__card-title">Como usar</div>
            <ol class="mp-admin__steps">
                <li>Salve a <strong>API Key</strong> do CurseForge nesta página.</li>
                <li>Clique na <strong>engrenagem</strong> e libere nos eggs Forge/NeoForge.</li>
                <li>No servidor: <code>/server/{id}/minecraft/modpacks</code>.</li>
            </ol>
        </div>

        <div class="mp-admin__card">
            <div class="mp-admin__card-title">Recursos</div>
            <ul class="mp-admin__list">
                <li>Busca e filtros (loader, versão, ordenação)</li>
                <li>Detalhes + lista de versões</li>
                <li>Instala server pack + mods do <code>manifest.json</code></li>
                <li>Wipe e EULA opcionais</li>
                <li>Interface 100% em português</li>
            </ul>
        </div>

        <div class="mp-admin__card mp-admin__card--wide">
            <div class="mp-admin__card-title">Download</div>
            <p class="mp-admin__hint">
                Os modpacks são baixados pelo painel (PHP) e enviados ao servidor — não depende de
                <code>api.disable_remote_download</code> no Wings. O node só precisa estar online.
            </p>
            <div class="mp-admin__route">
                <code>/server/{id}/minecraft/modpacks</code>
            </div>
        </div>
    </div>
</div>
