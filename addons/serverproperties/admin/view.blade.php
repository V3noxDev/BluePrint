<style>
    .sp-admin-hero{
        background:linear-gradient(135deg,#131a27 0%,#1a2334 100%);
        color:#e6ecf5;border-radius:12px;padding:22px 26px;margin-bottom:20px;
        border:1px solid #263045;display:flex;align-items:center;gap:18px;flex-wrap:wrap;
    }
    .sp-admin-hero h2{margin:0;font-size:22px;font-weight:700;}
    .sp-admin-hero p{margin:4px 0 0;color:#9aa7c0;}
    .sp-admin-hero .sp-badge{
        display:inline-block;padding:3px 10px;border-radius:999px;
        background:rgba(62,207,142,.14);color:#3ecf8e;border:1px solid rgba(62,207,142,.4);
        font-size:12px;font-weight:600;
    }
    #save-overlay{display:none;position:fixed;transition:bottom 1s;bottom:-200px;right:20px;z-index:500;}
</style>

<div class="sp-admin-hero">
    <div style="flex:1 1 320px">
        <h2>Server Properties <span class="sp-badge">v1.0.0</span></h2>
        <p>Editor visual do <code>server.properties</code> para Minecraft: Java Edition. Modificações finas de UX e comportamento estão abaixo.</p>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <a href="/server" class="btn btn-primary btn-sm">Ver no cliente</a>
        <a href="https://github.com/BluePrintStore/serverproperties" target="_blank" rel="noopener" class="btn btn-default btn-sm">Docs</a>
    </div>
</div>

<form id="config-form" action="{{ $root }}" method="POST">
    <script>
        document.addEventListener("DOMContentLoaded", function () {
            const form = document.getElementById("config-form");
            const overlay = document.getElementById("save-overlay");
            form.addEventListener("change", function () {
                overlay.style.display = "inline";
                setTimeout(() => { overlay.style.bottom = "20px"; }, 60);
            });
        });
    </script>

    <div id="save-overlay">
        {{ csrf_field() }}
        <button type="submit" name="_method" value="PATCH" class="btn btn-primary btn-lg">
            Aplicar alterações
        </button>
    </div>

    <div class="row">
        <div class="col-xs-12 col-md-4">
            <div class="box box-primary">
                <div class="box-header with-border"><h3 class="box-title">Título do editor</h3></div>
                <div class="box-body">
                    <label class="control-label">Nome mostrado no cabeçalho</label>
                    <input type="text" name="panel_title" value="{{ $panelTitle }}" class="form-control" />
                    <p class="text-muted small">Aparece no topo da página <code>/server/&lt;id&gt;/properties</code>.</p>
                </div>
            </div>
        </div>

        <div class="col-xs-12 col-md-4">
            <div class="box box-warning">
                <div class="box-header with-border"><h3 class="box-title">Atalho na página de arquivos</h3></div>
                <div class="box-body">
                    <label class="control-label">Exibir card de atalho</label>
                    <select class="form-control" name="show_shortcut">
                        <option value="true"  @if($showShortcut == 'true')  selected @endif>Sim, mostrar (recomendado)</option>
                        <option value="false" @if($showShortcut == 'false') selected @endif>Não, ocultar</option>
                    </select>
                    <p class="text-muted small">Card que aparece antes da lista de arquivos, apontando para o editor.</p>
                </div>
            </div>
        </div>

        <div class="col-xs-12 col-md-4">
            <div class="box box-danger">
                <div class="box-header with-border"><h3 class="box-title">Cor de destaque</h3></div>
                <div class="box-body">
                    <label class="control-label">Cor primária</label>
                    <input type="color" name="accent_color" value="{{ $accentColor }}" class="form-control" />
                    <p class="text-muted small">Aplicada no botão de salvar e nos elementos ativos do editor.</p>
                </div>
            </div>
        </div>
    </div>
</form>
