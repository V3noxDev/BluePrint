<div class="minesuite-admin">
  <div class="row">
    <div class="col-xs-12">
      <div class="box minesuite-hero">
        <div class="box-header with-border">
          <h3 class="box-title">
            <i class="fa fa-cube"></i> MineSuite
          </h3>
          <div class="box-tools">
            <span class="label label-success">v{version}</span>
          </div>
        </div>
        <div class="box-body">
          <p class="minesuite-lead">
            Extensão Blueprint para editar <code>server.properties</code> e instalar/remover addons
            Minecraft Java diretamente no painel do servidor.
          </p>
          <ul class="minesuite-points">
            <li>Editor visual categorizando todas as propriedades principais</li>
            <li>Instalador com seleção múltipla (catálogo Modrinth)</li>
            <li>Remoção segura de jars em <code>/plugins</code> e <code>/mods</code></li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <form method="POST" action="{{ $root }}">
    @csrf

    <div class="row">
      <div class="col-md-4">
        <div class="box box-primary">
          <div class="box-header with-border">
            <h3 class="box-title">Configurações</h3>
          </div>
          <div class="box-body">
            <div class="form-group">
              <label>
                <input type="checkbox" name="enabled" value="1" {{ $enabled ? 'checked' : '' }}>
                Extensão habilitada para usuários
              </label>
            </div>

            <div class="form-group">
              <label for="default_loader">Loader padrão (instalação)</label>
              <select name="default_loader" id="default_loader" class="form-control">
                @foreach (['paper','purpur','spigot','bukkit','fabric','forge','neoforge','quilt'] as $loader)
                  <option value="{{ $loader }}" {{ $defaultLoader === $loader ? 'selected' : '' }}>{{ ucfirst($loader) }}</option>
                @endforeach
              </select>
              <p class="help-block">Usado quando o usuário não escolhe um loader no instalador.</p>
            </div>
          </div>
        </div>

        <div class="box box-info">
          <div class="box-header with-border">
            <h3 class="box-title">Como usar</h3>
          </div>
          <div class="box-body">
            <ol class="minesuite-steps">
              <li>Abra um servidor Minecraft Java</li>
              <li>Vá na aba <strong>MineSuite</strong></li>
              <li>Edite propriedades ou selecione addons</li>
              <li>Salve / instale e reinicie o servidor</li>
            </ol>
          </div>
        </div>
      </div>

      <div class="col-md-8">
        <div class="box box-success">
          <div class="box-header with-border">
            <h3 class="box-title">Catálogo de addons (JSON)</h3>
          </div>
          <div class="box-body">
            @error('addons_catalog')
              <div class="alert alert-danger">{{ $message }}</div>
            @enderror

            <p class="help-block">
              Cada item precisa de <code>id</code>, <code>name</code>, <code>project</code> (slug/ID Modrinth),
              <code>destination</code> (<code>plugins</code> ou <code>mods</code>) e opcionalmente
              <code>filename_hint</code> para detectar instalação.
            </p>

            <textarea
              name="addons_catalog"
              id="addons_catalog"
              class="form-control minesuite-json"
              rows="22"
              spellcheck="false"
            >{{ old('addons_catalog', $catalogJson) }}</textarea>
          </div>
          <div class="box-footer">
            <button type="submit" class="btn btn-success btn-lg">
              <i class="fa fa-save"></i> Salvar configurações
            </button>
          </div>
        </div>
      </div>
    </div>
  </form>
</div>
