<div class="mh-admin">
    <section class="mh-admin__hero">
        <div class="mh-admin__hero-content">
            <span class="mh-admin__eyebrow">
                <i class="fa fa-cubes" aria-hidden="true"></i>
                Minecraft control center
            </span>
            <h1>MineHub</h1>
            <p>
                Uma central completa para seus clientes instalarem plugins e mods e configurarem
                o <code>server.properties</code> sem sair do painel.
            </p>
            <div class="mh-admin__badges" aria-label="Compatibilidade">
                <span><i class="fa fa-check-circle"></i> Blueprint beta-2026-06</span>
                <span><i class="fa fa-shield"></i> Permissões nativas</span>
                <span><i class="fa fa-cloud-download"></i> Catálogo Modrinth</span>
            </div>
        </div>
        <div class="mh-admin__hero-art" aria-hidden="true">
            <div class="mh-admin__cube"><i class="fa fa-cube"></i></div>
            <span class="mh-admin__orbit mh-admin__orbit--one"></span>
            <span class="mh-admin__orbit mh-admin__orbit--two"></span>
        </div>
    </section>

    @if (session('success'))
        <div class="alert alert-success mh-admin__alert">
            <i class="fa fa-check-circle"></i>
            {{ session('success') }}
        </div>
    @endif

    <div class="mh-admin__feature-grid">
        <article class="mh-admin__feature">
            <span class="mh-admin__feature-icon mh-admin__feature-icon--emerald">
                <i class="fa fa-plug"></i>
            </span>
            <div>
                <h3>Instalador inteligente</h3>
                <p>Busca por versão e loader, instalação direta e remoção com confirmação.</p>
            </div>
        </article>
        <article class="mh-admin__feature">
            <span class="mh-admin__feature-icon mh-admin__feature-icon--blue">
                <i class="fa fa-sliders"></i>
            </span>
            <div>
                <h3>Editor visual</h3>
                <p>Campos organizados, modo avançado e preservação de comentários do arquivo.</p>
            </div>
        </article>
        <article class="mh-admin__feature">
            <span class="mh-admin__feature-icon mh-admin__feature-icon--violet">
                <i class="fa fa-lock"></i>
            </span>
            <div>
                <h3>Seguro por padrão</h3>
                <p>As ações respeitam as permissões de arquivos já configuradas no Pterodactyl.</p>
            </div>
        </article>
    </div>

    <form id="minehub-settings" action="" method="POST">
        {{ csrf_field() }}
        <input type="hidden" name="_method" value="PATCH">

        <section class="mh-admin__panel">
            <header class="mh-admin__panel-header">
                <div>
                    <span class="mh-admin__section-label">Configuração global</span>
                    <h2>Recursos disponíveis</h2>
                    <p>Escolha o que será exibido dentro dos servidores dos seus clientes.</p>
                </div>
                <button class="btn btn-primary mh-admin__save" type="submit">
                    <i class="fa fa-save"></i>
                    Salvar alterações
                </button>
            </header>

            <div class="mh-admin__settings-grid">
                <label class="mh-admin__setting" for="plugins_enabled">
                    <span class="mh-admin__setting-copy">
                        <strong>Plugins</strong>
                        <small>Paper, Purpur, Spigot, Bukkit e Folia</small>
                    </span>
                    <select id="plugins_enabled" name="plugins_enabled" class="form-control">
                        <option value="1" @if($pluginsEnabled === '1') selected @endif>Ativado</option>
                        <option value="0" @if($pluginsEnabled === '0') selected @endif>Desativado</option>
                    </select>
                </label>

                <label class="mh-admin__setting" for="mods_enabled">
                    <span class="mh-admin__setting-copy">
                        <strong>Mods</strong>
                        <small>Fabric, Forge, NeoForge e Quilt</small>
                    </span>
                    <select id="mods_enabled" name="mods_enabled" class="form-control">
                        <option value="1" @if($modsEnabled === '1') selected @endif>Ativado</option>
                        <option value="0" @if($modsEnabled === '0') selected @endif>Desativado</option>
                    </select>
                </label>

                <label class="mh-admin__setting" for="properties_enabled">
                    <span class="mh-admin__setting-copy">
                        <strong>server.properties</strong>
                        <small>Editor visual e editor avançado</small>
                    </span>
                    <select id="properties_enabled" name="properties_enabled" class="form-control">
                        <option value="1" @if($propertiesEnabled === '1') selected @endif>Ativado</option>
                        <option value="0" @if($propertiesEnabled === '0') selected @endif>Desativado</option>
                    </select>
                </label>

                <label class="mh-admin__setting" for="default_section">
                    <span class="mh-admin__setting-copy">
                        <strong>Seção inicial</strong>
                        <small>Tipo selecionado ao abrir o instalador</small>
                    </span>
                    <select id="default_section" name="default_section" class="form-control">
                        <option value="plugin" @if($defaultSection === 'plugin') selected @endif>Plugins</option>
                        <option value="mod" @if($defaultSection === 'mod') selected @endif>Mods</option>
                    </select>
                </label>
            </div>
        </section>
    </form>

    <aside class="mh-admin__notice">
        <i class="fa fa-info-circle" aria-hidden="true"></i>
        <div>
            <strong>Como aparece para o cliente?</strong>
            <p>
                O item “MineHub” é adicionado à navegação de cada servidor. Em Blueprint,
                você também pode limitar a extensão aos eggs de Minecraft na página de permissões da extensão.
            </p>
        </div>
    </aside>
</div>
