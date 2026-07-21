@php
  $toggle = function ($name, $value) {
      return [
          ['value' => '1', 'label' => 'Enabled', 'selected' => (string) $value === '1'],
          ['value' => '0', 'label' => 'Disabled', 'selected' => (string) $value !== '1'],
      ];
  };
@endphp

<div class="mcmanager-admin">
  <div class="mcmanager-hero">
    <div>
      <p class="mcmanager-kicker">Blueprint Extension</p>
      <h2>MC Manager</h2>
      <p class="mcmanager-lead">
        Visual <code>server.properties</code> editor and Modrinth addon installer/remover for Minecraft Java servers.
      </p>
    </div>
    <div class="mcmanager-badge">v1.0.0</div>
  </div>

  @if(session('success') || session('error') || session('warning') || session('info'))
    {{-- Blueprint alerts are rendered by the library --}}
  @endif

  <form id="mcmanager-config-form" action="" method="POST">
    <div class="row">
      <div class="col-xs-12 col-lg-8">
        <div class="box box-primary mcmanager-box">
          <div class="box-header with-border">
            <h3 class="box-title">General</h3>
          </div>
          <div class="box-body">
            <div class="form-group">
              <label class="control-label" for="enabled">Extension status</label>
              <select class="form-control" name="enabled" id="enabled">
                @foreach($toggle('enabled', $enabled) as $option)
                  <option value="{{ $option['value'] }}" @if($option['selected']) selected @endif>{{ $option['label'] }}</option>
                @endforeach
              </select>
              <p class="text-muted small">When disabled, the client navigation tab still appears but API actions are blocked.</p>
            </div>

            <div class="form-group">
              <label class="control-label" for="default_tab">Default client tab</label>
              <select class="form-control" name="default_tab" id="default_tab">
                <option value="properties" @if($defaultTab === 'properties') selected @endif>server.properties</option>
                <option value="addons" @if($defaultTab === 'addons') selected @endif>Addons</option>
              </select>
            </div>

            <div class="form-group">
              <label class="control-label" for="properties_path">Properties file path</label>
              <input type="text" class="form-control" name="properties_path" id="properties_path" value="{{ $propertiesPath }}" placeholder="/server.properties">
              <p class="text-muted small">Relative to the server root. Usually <code>/server.properties</code>.</p>
            </div>

            <div class="form-group">
              <label class="control-label" for="plugins_path">Plugins directory</label>
              <input type="text" class="form-control" name="plugins_path" id="plugins_path" value="{{ $pluginsPath }}" placeholder="/plugins">
              <p class="text-muted small">Where JAR addons are installed and listed from.</p>
            </div>
          </div>
        </div>

        <div class="box box-primary mcmanager-box">
          <div class="box-header with-border">
            <h3 class="box-title">Permissions</h3>
          </div>
          <div class="box-body">
            <div class="row">
              <div class="col-sm-4">
                <div class="form-group">
                  <label class="control-label" for="allow_properties_edit">Edit properties</label>
                  <select class="form-control" name="allow_properties_edit" id="allow_properties_edit">
                    @foreach($toggle('allow_properties_edit', $allowPropertiesEdit) as $option)
                      <option value="{{ $option['value'] }}" @if($option['selected']) selected @endif>{{ $option['label'] }}</option>
                    @endforeach
                  </select>
                </div>
              </div>
              <div class="col-sm-4">
                <div class="form-group">
                  <label class="control-label" for="allow_addon_install">Install addons</label>
                  <select class="form-control" name="allow_addon_install" id="allow_addon_install">
                    @foreach($toggle('allow_addon_install', $allowAddonInstall) as $option)
                      <option value="{{ $option['value'] }}" @if($option['selected']) selected @endif>{{ $option['label'] }}</option>
                    @endforeach
                  </select>
                </div>
              </div>
              <div class="col-sm-4">
                <div class="form-group">
                  <label class="control-label" for="allow_addon_remove">Remove addons</label>
                  <select class="form-control" name="allow_addon_remove" id="allow_addon_remove">
                    @foreach($toggle('allow_addon_remove', $allowAddonRemove) as $option)
                      <option value="{{ $option['value'] }}" @if($option['selected']) selected @endif>{{ $option['label'] }}</option>
                    @endforeach
                  </select>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="control-label" for="modrinth_loaders">Allowed Modrinth loaders</label>
              <input type="text" class="form-control" name="modrinth_loaders" id="modrinth_loaders" value="{{ $modrinthLoaders }}" placeholder="paper,purpur,spigot,bukkit,folia">
              <p class="text-muted small">Comma-separated loader filters used when searching Modrinth plugins.</p>
            </div>
          </div>
          <div class="box-footer">
            {{ csrf_field() }}
            <button type="submit" name="_method" value="PATCH" class="btn btn-primary">Save changes</button>
          </div>
        </div>
      </div>

      <div class="col-xs-12 col-lg-4">
        <div class="box mcmanager-side">
          <div class="box-header with-border">
            <h3 class="box-title">How to use</h3>
          </div>
          <div class="box-body">
            <ol class="mcmanager-steps">
              <li>Install this extension with Blueprint.</li>
              <li>Open a Minecraft Java server in the client panel.</li>
              <li>Open the <strong>MC Manager</strong> tab.</li>
              <li>Edit <code>server.properties</code> or install/remove plugins.</li>
            </ol>
            <p class="text-muted small" style="margin-top: 1rem;">
              Egg visibility can be limited under <em>Admin → Extensions → Blueprint → Manage extensions</em>.
            </p>
          </div>
        </div>
      </div>
    </div>
  </form>
</div>
