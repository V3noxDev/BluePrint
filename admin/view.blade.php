<style>
    .sp-hero {
        position: relative;
        overflow: hidden;
        padding: 28px;
        margin-bottom: 20px;
        color: #fff;
        border-radius: 8px;
        background: radial-gradient(circle at 88% 18%, rgba(74, 222, 128, .22), transparent 30%),
                    linear-gradient(135deg, #111827 0%, #172033 58%, #10251b 100%);
        box-shadow: 0 10px 28px rgba(15, 23, 42, .16);
    }
    .sp-hero h2 { margin: 0 0 8px; font-weight: 700; }
    .sp-hero p { margin: 0; color: #cbd5e1; max-width: 760px; }
    .sp-badge {
        display: inline-block;
        margin-bottom: 12px;
        padding: 5px 10px;
        color: #bbf7d0;
        background: rgba(34, 197, 94, .16);
        border: 1px solid rgba(74, 222, 128, .2);
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .08em;
        text-transform: uppercase;
    }
    .sp-feature { display: flex; gap: 12px; margin-bottom: 18px; }
    .sp-feature:last-child { margin-bottom: 0; }
    .sp-feature-icon {
        display: flex;
        flex: 0 0 36px;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        color: #16a34a;
        background: #dcfce7;
        border-radius: 8px;
    }
    .sp-feature strong { display: block; margin-bottom: 3px; color: #1f2937; }
    .sp-feature p { margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5; }
    .sp-code {
        display: block;
        margin: 8px 0 0;
        padding: 10px 12px;
        color: #d1fae5;
        background: #111827;
        border-radius: 5px;
        font-size: 12px;
        white-space: nowrap;
        overflow-x: auto;
    }
    .sp-status { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
    .sp-dot { width: 9px; height: 9px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 0 4px #dcfce7; }
    .sp-table { margin-bottom: 0; }
    .sp-table td:first-child { width: 42%; color: #6b7280; }
</style>

<div class="sp-hero">
    <span class="sp-badge">Blueprint beta-2026-06</span>
    <h2><i class="fa fa-sliders" style="margin-right: 10px;"></i>{name}</h2>
    <p>
        Editor visual profissional para o <code style="color:#86efac;background:rgba(0,0,0,.2);">server.properties</code>
        de servidores Minecraft Java, integrado diretamente ao painel do cliente.
    </p>
</div>

<div class="row">
    <div class="col-md-7">
        <div class="box box-success">
            <div class="box-header with-border">
                <h3 class="box-title"><i class="fa fa-star-o"></i> Recursos incluídos</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-sm-6">
                        <div class="sp-feature">
                            <span class="sp-feature-icon"><i class="fa fa-th-large"></i></span>
                            <div>
                                <strong>Editor por categorias</strong>
                                <p>Campos, seleções e interruptores com descrições em português.</p>
                            </div>
                        </div>
                        <div class="sp-feature">
                            <span class="sp-feature-icon"><i class="fa fa-magic"></i></span>
                            <div>
                                <strong>Perfis rápidos</strong>
                                <p>Survival, privado, criativo, hardcore e desempenho.</p>
                            </div>
                        </div>
                        <div class="sp-feature">
                            <span class="sp-feature-icon"><i class="fa fa-search"></i></span>
                            <div>
                                <strong>Busca instantânea</strong>
                                <p>Encontre qualquer opção pelo nome, chave ou descrição.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div class="sp-feature">
                            <span class="sp-feature-icon"><i class="fa fa-code"></i></span>
                            <div>
                                <strong>Modo avançado</strong>
                                <p>Acesso ao arquivo completo para configurações personalizadas.</p>
                            </div>
                        </div>
                        <div class="sp-feature">
                            <span class="sp-feature-icon"><i class="fa fa-shield"></i></span>
                            <div>
                                <strong>Edição sem perdas</strong>
                                <p>Comentários e chaves desconhecidas permanecem intactos.</p>
                            </div>
                        </div>
                        <div class="sp-feature">
                            <span class="sp-feature-icon"><i class="fa fa-check-circle"></i></span>
                            <div>
                                <strong>Validação integrada</strong>
                                <p>Valores perigosos ou fora do limite são destacados antes de salvar.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="box box-info">
            <div class="box-header with-border">
                <h3 class="box-title"><i class="fa fa-compass"></i> Como usar</h3>
            </div>
            <div class="box-body">
                <ol style="padding-left:18px;margin-bottom:0;line-height:1.9;">
                    <li>Abra um servidor Minecraft Java no painel do cliente.</li>
                    <li>Acesse a aba <strong>Minecraft Properties</strong>.</li>
                    <li>Escolha um perfil ou altere as opções individualmente.</li>
                    <li>Salve e reinicie o servidor para aplicar todas as mudanças.</li>
                </ol>
            </div>
        </div>
    </div>

    <div class="col-md-5">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title"><i class="fa fa-info-circle"></i> Estado da extensão</h3>
            </div>
            <div class="box-body">
                <div class="sp-status">
                    <span class="sp-dot"></span>
                    <strong>Instalada e pronta para uso</strong>
                </div>
                <table class="table table-condensed sp-table">
                    <tbody>
                        <tr><td>Identificador</td><td><code>{identifier}</code></td></tr>
                        <tr><td>Versão</td><td>{version}</td></tr>
                        <tr><td>Autor</td><td>{author}</td></tr>
                        <tr><td>Blueprint alvo</td><td><code>beta-2026-06</code></td></tr>
                        <tr><td>Pterodactyl testado</td><td>1.14.1</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title"><i class="fa fa-key"></i> Permissões de subusuário</h3>
            </div>
            <div class="box-body">
                <p class="text-muted">
                    Para visualizar e salvar, conceda as três permissões de arquivo abaixo. Proprietários e administradores
                    já possuem acesso automaticamente.
                </p>
                <span class="sp-code">file.read-content · file.create · file.update</span>
            </div>
        </div>

        <div class="box box-default">
            <div class="box-header with-border">
                <h3 class="box-title"><i class="fa fa-terminal"></i> Remoção limpa</h3>
            </div>
            <div class="box-body">
                <p class="text-muted">A extensão pode ser removida pelo gerenciador do Blueprint sem alterar servidores.</p>
                <span class="sp-code">blueprint -remove serverproperties</span>
            </div>
        </div>
    </div>
</div>
