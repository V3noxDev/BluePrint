@extends('layouts.admin')
@include('partials/blueprint.admin.nav', ['adminPrefix' => 'admin.extensions.mcproperties'])
@section('title', 'MC Properties Manager')

@section('content-header')
    <h1 style="color: #cdd6f4; text-shadow: 0 0 20px rgba(76,175,80,0.3);">
        MC Properties Manager
        <small style="color: rgba(255,255,255,0.5);">Gerencie o server.properties do Minecraft Java</small>
    </h1>
    <ol class="breadcrumb" style="background: transparent; padding: 0; margin: 0;">
        <li><a href="{{ route('admin.index') }}" style="color: #89b4fa;">Admin</a></li>
        <li><a href="{{ route('admin.extensions.overview') }}" style="color: #89b4fa;">Extensions</a></li>
        <li class="active" style="color: rgba(255,255,255,0.5);">MC Properties Manager</li>
    </ol>
@endsection

@section('content')

<style>
    body, .content-wrapper, .main-sidebar, .main-footer { background: #11111b !important; }
    .box { background: #1e1e2e !important; border: 1px solid rgba(255,255,255,0.07) !important; border-radius: 12px !important; box-shadow: 0 4px 24px rgba(0,0,0,0.4) !important; }
    .box-header { background: transparent !important; border-bottom: 1px solid rgba(255,255,255,0.07) !important; }
    .box-title { color: #cdd6f4 !important; font-weight: 600 !important; }
    .table { background: transparent !important; }
    .table > tbody > tr > td, .table > tbody > tr > th { border-color: rgba(255,255,255,0.07) !important; color: rgba(255,255,255,0.75) !important; }
    .table-hover > tbody > tr:hover { background: rgba(255,255,255,0.04) !important; }
    .mcp-badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
    .mcp-badge-active { background: rgba(76,175,80,0.15); color: #4CAF50; border: 1px solid rgba(76,175,80,0.3); }
    .mcp-badge-version { background: rgba(137,180,250,0.15); color: #89b4fa; border: 1px solid rgba(137,180,250,0.3); }
    .mcp-badge-blueprint { background: rgba(203,166,247,0.15); color: #cba6f7; border: 1px solid rgba(203,166,247,0.3); }
    .mcp-feature-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 20px; text-align: center; transition: all 0.3s ease; }
    .mcp-feature-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(76,175,80,0.3); transform: translateY(-2px); }
    .mcp-feature-icon { font-size: 36px; margin-bottom: 12px; display: block; }
    .mcp-feature-title { color: #cdd6f4; font-size: 15px; font-weight: 600; margin: 0 0 8px 0; }
    .mcp-feature-desc { color: rgba(255,255,255,0.45); font-size: 12px; line-height: 1.6; margin: 0; }
    .mcp-hero { background: linear-gradient(135deg, #1a1a2e 0%, #0d1b2a 50%, #0f2c1a 100%); border: 1px solid rgba(76,175,80,0.2) !important; }
    .mcp-category-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; margin: 4px; }
    .mcp-alert { border-radius: 8px; padding: 14px 18px; margin-top: 12px; display: flex; align-items: flex-start; gap: 10px; }
    .mcp-alert-warning { background: rgba(255,193,7,0.08); border-left: 3px solid #ffc107; color: rgba(255,255,255,0.7); }
    .mcp-alert-info { background: rgba(137,180,250,0.08); border-left: 3px solid #89b4fa; color: rgba(255,255,255,0.7); }
    code { background: rgba(255,255,255,0.08) !important; color: #89b4fa !important; padding: 2px 7px !important; border-radius: 4px !important; font-size: 12px !important; }
    .mcp-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 768px) { .mcp-stat-grid { grid-template-columns: repeat(2, 1fr); } }
    .mcp-stat-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 16px; text-align: center; }
    .mcp-stat-value { font-size: 28px; font-weight: 700; color: #cdd6f4; display: block; }
    .mcp-stat-label { font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.8px; margin-top: 4px; display: block; }
    .mcp-install-step { display: flex; align-items: flex-start; gap: 14px; padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .mcp-install-step:last-child { border-bottom: none; }
    .mcp-step-num { width: 28px; height: 28px; min-width: 28px; border-radius: 50%; background: linear-gradient(135deg, #4CAF50, #2e7d32); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; }
    .mcp-step-text { color: rgba(255,255,255,0.65); font-size: 14px; line-height: 1.6; }
    .mcp-step-text strong { color: #cdd6f4; }
    pre { background: rgba(0,0,0,0.4) !important; border: 1px solid rgba(255,255,255,0.08) !important; border-radius: 8px !important; padding: 14px !important; color: #a6e3a1 !important; font-size: 13px !important; }
</style>

<!-- ======================================================
     HERO CARD
     ====================================================== -->
<div class="row">
    <div class="col-xs-12">
        <div class="box mcp-hero" style="overflow: hidden; position: relative;">
            <!-- Background decoration -->
            <div style="position: absolute; top: -40px; right: -40px; width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle, rgba(76,175,80,0.15) 0%, transparent 70%); pointer-events: none;"></div>
            <div style="position: absolute; bottom: -30px; left: 100px; width: 150px; height: 150px; border-radius: 50%; background: radial-gradient(circle, rgba(137,180,250,0.1) 0%, transparent 70%); pointer-events: none;"></div>
            <div class="box-body" style="padding: 28px 30px; position: relative; z-index: 1;">
                <div style="display: flex; align-items: center; gap: 22px; flex-wrap: wrap;">
                    <!-- Icon -->
                    <div style="width: 72px; height: 72px; min-width: 72px; background: linear-gradient(135deg, #1b2e1b, #0d1f0d); border: 2px solid rgba(76,175,80,0.35); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 36px; box-shadow: 0 8px 24px rgba(76,175,80,0.2);">
                        ⚙️
                    </div>
                    <!-- Info -->
                    <div style="flex: 1; min-width: 200px;">
                        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px;">
                            <h2 style="color: #cdd6f4; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.3px;">MC Properties Manager</h2>
                            <span class="mcp-badge mcp-badge-active">● Active</span>
                            <span class="mcp-badge mcp-badge-version">v1.0.0</span>
                            <span class="mcp-badge mcp-badge-blueprint">Blueprint</span>
                        </div>
                        <p style="color: rgba(255,255,255,0.5); margin: 0; font-size: 14px; line-height: 1.6; max-width: 680px;">
                            Gerencie o <code>server.properties</code> do seu servidor Minecraft Java diretamente pelo painel Pterodactyl.
                            Interface organizada em categorias, com toggles para booleanos, dropdowns para enums e campos inteligentes para cada tipo de propriedade.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ======================================================
     STATS ROW
     ====================================================== -->
<div class="row">
    <div class="col-xs-12">
        <div class="box">
            <div class="box-body" style="padding: 20px 24px;">
                <div class="mcp-stat-grid">
                    <div class="mcp-stat-card">
                        <span class="mcp-stat-value" style="color: #4CAF50;">50+</span>
                        <span class="mcp-stat-label">Propriedades</span>
                    </div>
                    <div class="mcp-stat-card">
                        <span class="mcp-stat-value" style="color: #89b4fa;">6</span>
                        <span class="mcp-stat-label">Categorias</span>
                    </div>
                    <div class="mcp-stat-card">
                        <span class="mcp-stat-value" style="color: #cba6f7;">3</span>
                        <span class="mcp-stat-label">Tipos de Input</span>
                    </div>
                    <div class="mcp-stat-card">
                        <span class="mcp-stat-value" style="color: #f38ba8;">0</span>
                        <span class="mcp-stat-label">Conflitos</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ======================================================
     FEATURES GRID
     ====================================================== -->
<div class="row">
    <div class="col-xs-12 col-sm-4">
        <div class="box">
            <div class="box-body" style="padding: 24px;">
                <div class="mcp-feature-card" style="border: none; background: transparent; padding: 0;">
                    <span class="mcp-feature-icon">🎮</span>
                    <h4 class="mcp-feature-title">Interface Inteligente</h4>
                    <p class="mcp-feature-desc">Cada propriedade recebe o tipo de input correto: toggle para booleanos, dropdown para dificuldade/gamemode, sliders e campos de número para valores numéricos.</p>
                </div>
            </div>
        </div>
    </div>
    <div class="col-xs-12 col-sm-4">
        <div class="box">
            <div class="box-body" style="padding: 24px;">
                <div class="mcp-feature-card" style="border: none; background: transparent; padding: 0;">
                    <span class="mcp-feature-icon">📂</span>
                    <h4 class="mcp-feature-title">6 Categorias</h4>
                    <p class="mcp-feature-desc">Propriedades organizadas em: General, Gameplay, World, Performance, Network e Advanced. Navegação clara e intuitiva sem precisar conhecer todos os campos.</p>
                </div>
            </div>
        </div>
    </div>
    <div class="col-xs-12 col-sm-4">
        <div class="box">
            <div class="box-body" style="padding: 24px;">
                <div class="mcp-feature-card" style="border: none; background: transparent; padding: 0;">
                    <span class="mcp-feature-icon">💾</span>
                    <h4 class="mcp-feature-title">Leitura & Escrita Direta</h4>
                    <p class="mcp-feature-desc">Lê e escreve o <code>server.properties</code> real via Wings API, preservando comentários e ordem das linhas originais. Um clique salva tudo.</p>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-xs-12 col-sm-4">
        <div class="box">
            <div class="box-body" style="padding: 24px;">
                <div class="mcp-feature-card" style="border: none; background: transparent; padding: 0;">
                    <span class="mcp-feature-icon">🔔</span>
                    <h4 class="mcp-feature-title">Avisos de Restart</h4>
                    <p class="mcp-feature-desc">Propriedades que requerem reinicialização do servidor são marcadas visualmente, alertando o usuário antes de aplicar mudanças críticas.</p>
                </div>
            </div>
        </div>
    </div>
    <div class="col-xs-12 col-sm-4">
        <div class="box">
            <div class="box-body" style="padding: 24px;">
                <div class="mcp-feature-card" style="border: none; background: transparent; padding: 0;">
                    <span class="mcp-feature-icon">🔒</span>
                    <h4 class="mcp-feature-title">Permissões Nativas</h4>
                    <p class="mcp-feature-desc">Respeita as permissões do Pterodactyl. Somente usuários com acesso ao servidor podem editar propriedades. Admins têm visão completa.</p>
                </div>
            </div>
        </div>
    </div>
    <div class="col-xs-12 col-sm-4">
        <div class="box">
            <div class="box-body" style="padding: 24px;">
                <div class="mcp-feature-card" style="border: none; background: transparent; padding: 0;">
                    <span class="mcp-feature-icon">🚀</span>
                    <h4 class="mcp-feature-title">Auto-Installer</h4>
                    <p class="mcp-feature-desc">Acompanha script <code>install.sh</code> com menu interativo colorido para instalar ou remover a extensão com um único comando.</p>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ======================================================
     CATEGORIES LIST
     ====================================================== -->
<div class="row">
    <div class="col-xs-12">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">📋 Categorias de Propriedades</h3>
            </div>
            <div class="box-body">
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
                    <span class="mcp-category-chip" style="background: rgba(76,175,80,0.15); color: #4CAF50; border: 1px solid rgba(76,175,80,0.3);">🌐 General</span>
                    <span class="mcp-category-chip" style="background: rgba(137,180,250,0.15); color: #89b4fa; border: 1px solid rgba(137,180,250,0.3);">🎮 Gameplay</span>
                    <span class="mcp-category-chip" style="background: rgba(166,227,161,0.15); color: #a6e3a1; border: 1px solid rgba(166,227,161,0.3);">🌍 World</span>
                    <span class="mcp-category-chip" style="background: rgba(250,179,135,0.15); color: #fab387; border: 1px solid rgba(250,179,135,0.3);">⚡ Performance</span>
                    <span class="mcp-category-chip" style="background: rgba(243,189,168,0.15); color: #f38ba8; border: 1px solid rgba(243,189,168,0.3);">🌐 Network</span>
                    <span class="mcp-category-chip" style="background: rgba(203,166,247,0.15); color: #cba6f7; border: 1px solid rgba(203,166,247,0.3);">🔧 Advanced</span>
                </div>

                <table class="table table-hover" style="margin: 0;">
                    <thead>
                        <tr style="border-color: rgba(255,255,255,0.07);">
                            <th style="color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.07);">Categoria</th>
                            <th style="color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.07);">Propriedades Incluídas</th>
                            <th style="color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.07); text-align:center;">Qtd</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span style="color: #4CAF50;">🌐 General</span></td>
                            <td style="color: rgba(255,255,255,0.5); font-size: 13px;"><code>motd</code>, <code>server-name</code>, <code>server-port</code>, <code>online-mode</code>, <code>white-list</code>, <code>enforce-whitelist</code></td>
                            <td style="text-align:center;"><span class="mcp-badge" style="background: rgba(76,175,80,0.15); color: #4CAF50; border: 1px solid rgba(76,175,80,0.2);">6</span></td>
                        </tr>
                        <tr>
                            <td><span style="color: #89b4fa;">🎮 Gameplay</span></td>
                            <td style="color: rgba(255,255,255,0.5); font-size: 13px;"><code>gamemode</code>, <code>difficulty</code>, <code>hardcore</code>, <code>pvp</code>, <code>spawn-protection</code>, <code>allow-flight</code>, <code>allow-nether</code>, <code>spawn-animals</code>, <code>spawn-monsters</code>, <code>spawn-npcs</code></td>
                            <td style="text-align:center;"><span class="mcp-badge" style="background: rgba(137,180,250,0.15); color: #89b4fa; border: 1px solid rgba(137,180,250,0.2);">10</span></td>
                        </tr>
                        <tr>
                            <td><span style="color: #a6e3a1;">🌍 World</span></td>
                            <td style="color: rgba(255,255,255,0.5); font-size: 13px;"><code>level-name</code>, <code>level-seed</code>, <code>level-type</code>, <code>generate-structures</code>, <code>max-build-height</code>, <code>view-distance</code>, <code>simulation-distance</code>, <code>max-world-size</code></td>
                            <td style="text-align:center;"><span class="mcp-badge" style="background: rgba(166,227,161,0.15); color: #a6e3a1; border: 1px solid rgba(166,227,161,0.2);">8</span></td>
                        </tr>
                        <tr>
                            <td><span style="color: #fab387;">⚡ Performance</span></td>
                            <td style="color: rgba(255,255,255,0.5); font-size: 13px;"><code>max-players</code>, <code>max-tick-time</code>, <code>network-compression-threshold</code>, <code>entity-broadcast-range-percentage</code>, <code>sync-chunk-writes</code>, <code>use-native-transport</code></td>
                            <td style="text-align:center;"><span class="mcp-badge" style="background: rgba(250,179,135,0.15); color: #fab387; border: 1px solid rgba(250,179,135,0.2);">6</span></td>
                        </tr>
                        <tr>
                            <td><span style="color: #f38ba8;">🌐 Network</span></td>
                            <td style="color: rgba(255,255,255,0.5); font-size: 13px;"><code>server-ip</code>, <code>enable-query</code>, <code>query.port</code>, <code>enable-rcon</code>, <code>rcon.port</code>, <code>rcon.password</code>, <code>enable-status</code></td>
                            <td style="text-align:center;"><span class="mcp-badge" style="background: rgba(243,189,168,0.15); color: #f38ba8; border: 1px solid rgba(243,189,168,0.2);">7</span></td>
                        </tr>
                        <tr>
                            <td><span style="color: #cba6f7;">🔧 Advanced</span></td>
                            <td style="color: rgba(255,255,255,0.5); font-size: 13px;"><code>enable-command-block</code>, <code>force-gamemode</code>, <code>function-permission-level</code>, <code>op-permission-level</code>, <code>player-idle-timeout</code>, <code>log-ips</code>, <code>resource-pack</code>, <code>require-resource-pack</code></td>
                            <td style="text-align:center;"><span class="mcp-badge" style="background: rgba(203,166,247,0.15); color: #cba6f7; border: 1px solid rgba(203,166,247,0.2);">8+</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- ======================================================
     INSTALLATION GUIDE
     ====================================================== -->
<div class="row">
    <div class="col-xs-12 col-md-8">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">🚀 Guia de Uso</h3>
            </div>
            <div class="box-body" style="padding: 20px 24px;">
                <div class="mcp-install-step">
                    <div class="mcp-step-num">1</div>
                    <div class="mcp-step-text">A extensão já está <strong>ativa automaticamente</strong> para todos os servidores Minecraft Java no painel.</div>
                </div>
                <div class="mcp-install-step">
                    <div class="mcp-step-num">2</div>
                    <div class="mcp-step-text">O usuário acessa o servidor e clica na aba <strong>"Properties"</strong> no menu de navegação do servidor.</div>
                </div>
                <div class="mcp-install-step">
                    <div class="mcp-step-num">3</div>
                    <div class="mcp-step-text">O painel lê o arquivo <code>server.properties</code> diretamente via <strong>Wings API</strong> e exibe os campos organizados.</div>
                </div>
                <div class="mcp-install-step">
                    <div class="mcp-step-num">4</div>
                    <div class="mcp-step-text">O usuário edita os campos desejados e clica em <strong>"Salvar Propriedades"</strong>. As alterações são escritas imediatamente no arquivo.</div>
                </div>
                <div class="mcp-install-step">
                    <div class="mcp-step-num">5</div>
                    <div class="mcp-step-text">Reinicie o servidor para aplicar as mudanças. Propriedades que requerem restart são <strong>marcadas com ⚠️</strong> no painel.</div>
                </div>

                <div class="mcp-alert mcp-alert-warning">
                    <span>⚠️</span>
                    <div><strong style="color: #ffc107;">Atenção:</strong> Algumas propriedades como <code>server-port</code>, <code>level-name</code> e <code>online-mode</code> requerem reinicialização do servidor para ter efeito.</div>
                </div>

                <div class="mcp-alert mcp-alert-info" style="margin-top: 8px;">
                    <span>ℹ️</span>
                    <div><strong style="color: #89b4fa;">Dica:</strong> O arquivo <code>server.properties</code> é preservado com seus comentários e formatação original. Apenas os valores alterados são atualizados.</div>
                </div>
            </div>
        </div>
    </div>

    <!-- ======================================================
         EXTENSION INFO SIDEBAR
         ====================================================== -->
    <div class="col-xs-12 col-md-4">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">ℹ️ Informações</h3>
            </div>
            <div class="box-body" style="padding: 0;">
                <table class="table" style="margin: 0;">
                    <tbody>
                        <tr>
                            <td style="width: 130px; color: rgba(255,255,255,0.4); font-size: 12px; padding: 12px 16px;">Nome</td>
                            <td style="padding: 12px 16px; color: #cdd6f4; font-size: 13px;">MC Properties Manager</td>
                        </tr>
                        <tr>
                            <td style="color: rgba(255,255,255,0.4); font-size: 12px; padding: 12px 16px;">Identifier</td>
                            <td style="padding: 12px 16px;"><code>mcproperties</code></td>
                        </tr>
                        <tr>
                            <td style="color: rgba(255,255,255,0.4); font-size: 12px; padding: 12px 16px;">Versão</td>
                            <td style="padding: 12px 16px; color: #cdd6f4; font-size: 13px;">1.0.0</td>
                        </tr>
                        <tr>
                            <td style="color: rgba(255,255,255,0.4); font-size: 12px; padding: 12px 16px;">Blueprint</td>
                            <td style="padding: 12px 16px;"><code>beta-2026-01</code></td>
                        </tr>
                        <tr>
                            <td style="color: rgba(255,255,255,0.4); font-size: 12px; padding: 12px 16px;">Jogo</td>
                            <td style="padding: 12px 16px; color: #cdd6f4; font-size: 13px;">Minecraft Java</td>
                        </tr>
                        <tr>
                            <td style="color: rgba(255,255,255,0.4); font-size: 12px; padding: 12px 16px;">Status</td>
                            <td style="padding: 12px 16px;"><span class="mcp-badge mcp-badge-active">● Active</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Quick install command -->
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">⚡ Instalação Rápida</h3>
            </div>
            <div class="box-body">
                <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin-bottom: 12px;">Via Blueprint CLI no servidor:</p>
                <pre>blueprint -install mcproperties</pre>
                <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 12px 0;">Para remover:</p>
                <pre>blueprint -remove mcproperties</pre>
                <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 12px 0;">Ou use o auto-installer:</p>
                <pre>bash install.sh</pre>
            </div>
        </div>
    </div>
</div>

@endsection
