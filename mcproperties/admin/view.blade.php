<style>
    .mcp-wrapper * { box-sizing: border-box; }
    .mcp-wrapper {
        --mcp-green: #10b981;
        --mcp-green-dark: #047857;
        --mcp-bg: #1f2933;
        --mcp-card: #323f4b;
        --mcp-border: #3e4c59;
        --mcp-text: #e4e7eb;
        --mcp-muted: #9aa5b1;
        font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        color: var(--mcp-text);
    }
    .mcp-hero {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 18px;
        padding: 26px 30px;
        border-radius: 14px;
        background: linear-gradient(135deg, rgba(16,185,129,.18), rgba(4,120,87,.30)), var(--mcp-bg);
        border: 1px solid rgba(16,185,129,.45);
        box-shadow: 0 14px 34px -16px rgba(0,0,0,.6);
        margin-bottom: 22px;
    }
    .mcp-hero-icon {
        width: 64px; height: 64px; flex-shrink: 0;
        border-radius: 16px;
        display: flex; align-items: center; justify-content: center;
        font-size: 26px; color: #fff;
        background: linear-gradient(135deg, #34d399, #047857);
        box-shadow: 0 10px 24px -8px rgba(16,185,129,.65);
    }
    .mcp-hero h1 { margin: 0; font-size: 24px; font-weight: 800; color: #f5f7fa; }
    .mcp-hero p { margin: 4px 0 0; font-size: 13px; color: var(--mcp-muted); max-width: 640px; }
    .mcp-hero .mcp-version {
        margin-left: auto;
        font-size: 12px; font-weight: 700;
        padding: 6px 14px; border-radius: 999px;
        color: #6ee7b7;
        background: rgba(16,185,129,.12);
        border: 1px solid rgba(16,185,129,.4);
        white-space: nowrap;
    }
    .mcp-grid { display: flex; flex-wrap: wrap; gap: 18px; }
    .mcp-col { flex: 1 1 420px; min-width: 320px; }
    .mcp-card {
        background: var(--mcp-card);
        border: 1px solid var(--mcp-border);
        border-radius: 12px;
        padding: 22px 24px;
        margin-bottom: 18px;
        box-shadow: 0 8px 22px -14px rgba(0,0,0,.55);
    }
    .mcp-card h2 {
        margin: 0 0 4px; font-size: 16px; font-weight: 800; color: #f5f7fa;
        display: flex; align-items: center; gap: 8px;
    }
    .mcp-card h2 i { color: var(--mcp-green); }
    .mcp-card > p.mcp-sub { margin: 0 0 18px; font-size: 12px; color: var(--mcp-muted); }
    .mcp-setting {
        display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
        padding: 14px 0;
        border-bottom: 1px solid var(--mcp-border);
    }
    .mcp-setting:last-of-type { border-bottom: 0; }
    .mcp-setting-label { font-size: 13.5px; font-weight: 700; color: var(--mcp-text); }
    .mcp-setting-desc { margin-top: 2px; font-size: 12px; color: var(--mcp-muted); line-height: 1.5; }
    .mcp-switch { position: relative; display: inline-block; width: 48px; height: 26px; flex-shrink: 0; }
    .mcp-switch input { opacity: 0; width: 0; height: 0; }
    .mcp-slider {
        position: absolute; inset: 0; cursor: pointer;
        border-radius: 999px;
        background: #1f2933;
        border: 1px solid var(--mcp-border);
        transition: .2s;
    }
    .mcp-slider:before {
        content: ""; position: absolute;
        width: 18px; height: 18px; left: 3px; top: 3px;
        border-radius: 999px; background: #fff;
        box-shadow: 0 2px 6px rgba(0,0,0,.4);
        transition: .2s;
    }
    .mcp-switch input:checked + .mcp-slider {
        background: linear-gradient(135deg, #10b981, #047857);
        border-color: rgba(16,185,129,.7);
    }
    .mcp-switch input:checked + .mcp-slider:before { transform: translateX(22px); }
    .mcp-input {
        width: 100%;
        padding: 10px 14px;
        border-radius: 8px;
        background: #1f2933;
        border: 1px solid var(--mcp-border);
        color: var(--mcp-text);
        font-size: 13px;
        font-family: monospace;
    }
    .mcp-input:focus { outline: none; border-color: var(--mcp-green); box-shadow: 0 0 0 3px rgba(16,185,129,.18); }
    .mcp-save {
        display: inline-flex; align-items: center; gap: 8px;
        margin-top: 18px;
        padding: 11px 26px;
        border: 0; border-radius: 9px; cursor: pointer;
        font-size: 13.5px; font-weight: 800; color: #fff;
        background: linear-gradient(135deg, #10b981, #047857);
        box-shadow: 0 10px 22px -8px rgba(16,185,129,.6);
        transition: filter .15s ease;
    }
    .mcp-save:hover { filter: brightness(1.12); }
    .mcp-feature { display: flex; gap: 12px; padding: 10px 0; }
    .mcp-feature i {
        width: 34px; height: 34px; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        border-radius: 9px; font-size: 14px;
        color: #6ee7b7; background: rgba(16,185,129,.12);
        border: 1px solid rgba(16,185,129,.3);
    }
    .mcp-feature b { display: block; font-size: 13px; color: var(--mcp-text); }
    .mcp-feature span { font-size: 12px; color: var(--mcp-muted); }
    .mcp-step { display: flex; gap: 12px; padding: 9px 0; align-items: baseline; }
    .mcp-step em {
        font-style: normal; font-weight: 800; font-size: 12px;
        color: #6ee7b7; flex-shrink: 0;
        width: 22px; height: 22px; line-height: 20px; text-align: center;
        border-radius: 999px; border: 1px solid rgba(16,185,129,.4);
        background: rgba(16,185,129,.12);
        display: inline-block;
    }
    .mcp-step p { margin: 0; font-size: 12.5px; color: var(--mcp-muted); }
    .mcp-step p code { color: #6ee7b7; background: rgba(16,185,129,.1); padding: 1px 6px; border-radius: 4px; font-size: 11.5px; }
    .mcp-footer { margin-top: 6px; text-align: center; font-size: 11px; color: #616e7c; }
    .mcp-footer a { color: var(--mcp-green); text-decoration: none; }
</style>

<div class="mcp-wrapper">
    <div class="mcp-hero">
        <div class="mcp-hero-icon"><i class="fa fa-sliders"></i></div>
        <div>
            <h1>MC Properties</h1>
            <p>
                Editor visual completo do <code>server.properties</code> para servidores Minecraft Java.
                Seus usuários editam MOTD, gamemode, dificuldade, whitelist e mais de 60 propriedades
                direto do painel &mdash; com busca, categorias e proteção de propriedades críticas.
            </p>
        </div>
        <span class="mcp-version"><i class="fa fa-tag"></i>&nbsp; v{version}</span>
    </div>

    <div class="mcp-grid">
        <div class="mcp-col">
            <form class="mcp-card" action="{{ $root }}" method="POST">
                {{ csrf_field() }}
                <h2><i class="fa fa-cogs"></i> Configurações</h2>
                <p class="mcp-sub">As alterações são aplicadas imediatamente para todos os servidores.</p>

                <div class="mcp-setting">
                    <div>
                        <div class="mcp-setting-label">Permitir propriedades críticas</div>
                        <div class="mcp-setting-desc">
                            Libera a edição de propriedades perigosas como <code>server-port</code>,
                            <code>server-ip</code>, <code>level-name</code> e credenciais RCON.
                            Recomendado deixar <b>desativado</b>, pois essas portas são gerenciadas pelo Pterodactyl.
                        </div>
                    </div>
                    <label class="mcp-switch">
                        <input type="hidden" name="allow_dangerous" value="0">
                        <input type="checkbox" name="allow_dangerous" value="1" @if($settings['allow_dangerous'] === '1') checked @endif>
                        <span class="mcp-slider"></span>
                    </label>
                </div>

                <div class="mcp-setting">
                    <div>
                        <div class="mcp-setting-label">Editor raw</div>
                        <div class="mcp-setting-desc">
                            Permite que os usuários alternem para um editor de texto e editem o arquivo
                            <code>server.properties</code> manualmente.
                        </div>
                    </div>
                    <label class="mcp-switch">
                        <input type="hidden" name="allow_raw_editor" value="0">
                        <input type="checkbox" name="allow_raw_editor" value="1" @if($settings['allow_raw_editor'] === '1') checked @endif>
                        <span class="mcp-slider"></span>
                    </label>
                </div>

                <div class="mcp-setting">
                    <div>
                        <div class="mcp-setting-label">Ocultar propriedades desconhecidas</div>
                        <div class="mcp-setting-desc">
                            Esconde propriedades presentes no arquivo que não fazem parte do catálogo oficial
                            (ex: propriedades adicionadas por plugins ou forks).
                        </div>
                    </div>
                    <label class="mcp-switch">
                        <input type="hidden" name="hide_unknown" value="0">
                        <input type="checkbox" name="hide_unknown" value="1" @if($settings['hide_unknown'] === '1') checked @endif>
                        <span class="mcp-slider"></span>
                    </label>
                </div>

                <div class="mcp-setting" style="display:block;">
                    <div class="mcp-setting-label">Caminho do arquivo</div>
                    <div class="mcp-setting-desc" style="margin-bottom:10px;">
                        Caminho do <code>server.properties</code> relativo à raiz do servidor.
                        Só altere se seus servidores usam um diretório customizado.
                    </div>
                    <input class="mcp-input" type="text" name="file_path" value="{{ $settings['file_path'] }}" placeholder="/server.properties">
                </div>

                <button type="submit" name="_method" value="PATCH" class="mcp-save">
                    <i class="fa fa-save"></i> Salvar configurações
                </button>
            </form>
        </div>

        <div class="mcp-col">
            <div class="mcp-card">
                <h2><i class="fa fa-star"></i> Recursos</h2>
                <p class="mcp-sub">Tudo o que este addon adiciona ao seu painel.</p>
                <div class="mcp-feature">
                    <i class="fa fa-sliders"></i>
                    <div><b>Editor visual</b><span>Mais de 60 propriedades catalogadas com toggles, selects e validação de números.</span></div>
                </div>
                <div class="mcp-feature">
                    <i class="fa fa-search"></i>
                    <div><b>Busca &amp; categorias</b><span>Filtre por Geral, Mundo, Jogadores, Rede, Resource Pack, Segurança e Avançado.</span></div>
                </div>
                <div class="mcp-feature">
                    <i class="fa fa-shield"></i>
                    <div><b>Proteção de propriedades críticas</b><span>Porta, IP e RCON ficam bloqueados por padrão para não quebrar a integração com o Wings.</span></div>
                </div>
                <div class="mcp-feature">
                    <i class="fa fa-code"></i>
                    <div><b>Editor raw opcional</b><span>Usuários avançados podem editar o arquivo diretamente, com um clique.</span></div>
                </div>
                <div class="mcp-feature">
                    <i class="fa fa-refresh"></i>
                    <div><b>Reinício em um clique</b><span>Depois de salvar, o usuário pode reiniciar o servidor direto da página.</span></div>
                </div>
                <div class="mcp-feature">
                    <i class="fa fa-lock"></i>
                    <div><b>Respeita as permissões</b><span>Usa as permissões nativas de subusuário do Pterodactyl (file.read / file.update / control.restart).</span></div>
                </div>
            </div>

            <div class="mcp-card">
                <h2><i class="fa fa-graduation-cap"></i> Como ativar nos servidores</h2>
                <p class="mcp-sub">A página "Properties" aparece nos servidores dos eggs que você habilitar.</p>
                <div class="mcp-step"><em>1</em><p>Acesse <code>Admin &rsaquo; Extensions &rsaquo; Blueprint</code>.</p></div>
                <div class="mcp-step"><em>2</em><p>Abra o gerenciamento de rotas por egg (<i>egg-specific routes</i>).</p></div>
                <div class="mcp-step"><em>3</em><p>Habilite a rota <code>Properties</code> apenas para os seus eggs de <b>Minecraft Java</b> (Vanilla, Paper, Purpur, Forge, Fabric...).</p></div>
                <div class="mcp-step"><em>4</em><p>Pronto! A aba aparece na navegação dos servidores desses eggs.</p></div>
            </div>
        </div>
    </div>

    <p class="mcp-footer">
        MC Properties v{version} por <b>{author}</b> &mdash; construído com
        <a href="https://blueprint.zip" target="_blank" rel="noopener">Blueprint Framework</a> ({target})
    </p>
</div>
