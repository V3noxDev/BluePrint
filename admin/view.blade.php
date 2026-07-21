{{-- =========================================================================
     MC Hub — Admin panel (Pterodactyl / Blueprint)
     Route:   /admin/extensions/mchub
     Docs:    https://blueprint.zip/guides/dev/adminpage
     ========================================================================= --}}

<form id="mchub-config-form" action="{{ $root }}" method="POST">
  {{ csrf_field() }}

  {{-- ==================== HERO ==================== --}}
  <section class="mchub-hero">
    <span class="mchub-badge"><span class="mchub-dot"></span> Extension active</span>
    <h1>MC Hub — Addon Manager &amp; Properties Editor</h1>
    <p>
      A modern control-plane for Minecraft: Java servers on Pterodactyl.
      Configure the built-in <strong>server.properties editor</strong> and the
      <strong>auto-installer</strong> with its curated catalogue of plugins &amp; mods.
      Anything you change here will apply on every user's server dashboard.
    </p>
  </section>

  {{-- ==================== STATS ==================== --}}
  <section class="mchub-stats">
    <div class="mchub-stat">
      <div class="mchub-stat-label">Version</div>
      <div class="mchub-stat-value">1.0.0</div>
      <div class="mchub-stat-hint">Latest stable release</div>
    </div>
    <div class="mchub-stat">
      <div class="mchub-stat-label">Target</div>
      <div class="mchub-stat-value">beta-2025-09</div>
      <div class="mchub-stat-hint">Blueprint compatibility</div>
    </div>
    <div class="mchub-stat">
      <div class="mchub-stat-label">Catalog entries</div>
      <div class="mchub-stat-value" id="mchub-stat-catalog">—</div>
      <div class="mchub-stat-hint">Built-in + custom addons</div>
    </div>
    <div class="mchub-stat">
      <div class="mchub-stat-label">Default folder</div>
      <div class="mchub-stat-value" id="mchub-stat-folder">{{ $install_folder }}</div>
      <div class="mchub-stat-hint">Where addons get dropped</div>
    </div>
  </section>

  {{-- ==================== MAIN GRID ==================== --}}
  <section class="mchub-grid">

    {{-- LEFT COLUMN --}}
    <div>
      {{-- General settings --}}
      <div class="mchub-card" style="margin-bottom: 24px;">
        <div class="mchub-card-head">
          <h3>General settings</h3>
          <span class="mchub-tag">Applies to all servers</span>
        </div>
        <div class="mchub-card-body">

          <div class="mchub-field">
            <label for="install_folder">Default install folder</label>
            <input
              type="text" class="mchub-input"
              id="install_folder" name="install_folder"
              value="{{ $install_folder }}"
              placeholder="plugins"
            />
            <p class="mchub-hint">
              Where installed addons are dropped by default. Common values:
              <code>plugins</code> (Paper/Spigot/Purpur) or <code>mods</code> (Forge/Fabric/NeoForge).
              Users can still choose a different folder per install.
            </p>
          </div>

          <div class="mchub-field">
            <label for="default_branch">Default server branch</label>
            <select id="default_branch" name="default_branch">
              @foreach (['paper','spigot','purpur','forge','fabric','neoforge'] as $branch)
                <option value="{{ $branch }}" @if($default_branch === $branch) selected @endif>
                  {{ ucfirst($branch) }}
                </option>
              @endforeach
            </select>
            <p class="mchub-hint">
              Hints the catalog which addons to prioritize. Users can override.
            </p>
          </div>

          <div class="mchub-field">
            <label>Confirmation prompts</label>
            <div style="display:flex; align-items:center; gap:12px;">
              <label class="mchub-toggle">
                <input type="hidden" name="require_confirm" value="0" />
                <input type="checkbox" id="require_confirm_cb" name="require_confirm" value="1"
                       @if($require_confirm === '1') checked @endif />
                <span class="mchub-slider"></span>
              </label>
              <span style="color:#334155; font-size:14px;">
                Ask users to confirm before installing or removing an addon.
              </span>
            </div>
          </div>

          <div class="mchub-field">
            <label for="accent_color">Accent color</label>
            <div style="display:flex; align-items:center; gap:12px;">
              <input type="color" class="mchub-color" id="accent_color"
                     name="accent_color" value="{{ $accent_color }}" />
              <input type="text" class="mchub-input" style="max-width: 140px;"
                     value="{{ $accent_color }}" id="accent_color_text" readonly />
            </div>
            <p class="mchub-hint">Used across the dashboard UI (buttons, chips, highlights).</p>
          </div>

        </div>
      </div>

      {{-- Categories --}}
      <div class="mchub-card" style="margin-bottom: 24px;">
        <div class="mchub-card-head">
          <h3>Enabled catalog categories</h3>
        </div>
        <div class="mchub-card-body">
          <p class="mchub-hint" style="margin-top:0; margin-bottom:12px;">
            Disable a category to hide it from the user-facing dashboard.
          </p>

          @php
            $activeCats = collect(explode(',', $enabled_categories))->map(fn($v) => trim($v))->filter();
            $allCats = [
              'core'        => 'Essentials / Core',
              'economy'     => 'Economy',
              'worldmgmt'   => 'World management',
              'admin'       => 'Admin tools',
              'fun'         => 'Fun & gameplay',
              'protection'  => 'Anti-grief / protection',
              'performance' => 'Performance',
            ];
          @endphp

          <div class="mchub-chips" id="mchub-chips">
            @foreach ($allCats as $key => $label)
              @php $on = $activeCats->contains($key); @endphp
              <label class="mchub-chip {{ $on ? 'mchub-chip-on' : '' }}" data-cat="{{ $key }}">
                <input type="checkbox" value="{{ $key }}" @if($on) checked @endif />
                {{ $label }}
              </label>
            @endforeach
          </div>

          <input type="hidden" id="enabled_categories" name="enabled_categories"
                 value="{{ $enabled_categories }}" />
        </div>
      </div>

      {{-- Custom catalog --}}
      <div class="mchub-card">
        <div class="mchub-card-head">
          <h3>Custom catalog entries</h3>
          <span class="mchub-tag">JSON</span>
        </div>
        <div class="mchub-card-body">
          <p class="mchub-hint" style="margin-top:0;">
            Extend the built-in catalog with your own addons. Entries here are merged
            with the default catalog in every user's dashboard.
          </p>
          <div class="mchub-field">
            <label for="custom_catalog">catalog.json</label>
            <textarea id="custom_catalog" name="custom_catalog" spellcheck="false">{{ $custom_catalog }}</textarea>
            <p class="mchub-hint">
              Example:
              <code>[{"id":"myplugin","name":"My Plugin","category":"core","branch":"paper","filename":"MyPlugin.jar","url":"https://example.com/MyPlugin.jar","description":"..."}]</code>
            </p>
          </div>
        </div>
      </div>
    </div>

    {{-- RIGHT COLUMN --}}
    <div>
      <div class="mchub-card" style="margin-bottom: 24px;">
        <div class="mchub-card-head">
          <h3>What this extension does</h3>
        </div>
        <div class="mchub-card-body">
          <ul class="mchub-list">
            <li><strong>server.properties editor</strong><span class="mchub-tag">GUI</span></li>
            <li><strong>Auto-installer for plugins / mods</strong><span class="mchub-tag">1-click</span></li>
            <li><strong>Curated catalog</strong><span class="mchub-tag">built-in</span></li>
            <li><strong>Uninstall / remove</strong><span class="mchub-tag">safe</span></li>
            <li><strong>Category filters + search</strong><span class="mchub-tag">UX</span></li>
            <li><strong>Backups on save</strong><span class="mchub-tag">safety</span></li>
          </ul>
        </div>
      </div>

      <div class="mchub-card" style="margin-bottom: 24px;">
        <div class="mchub-card-head">
          <h3>How users access it</h3>
        </div>
        <div class="mchub-card-body">
          <ol style="margin: 0; padding-left: 18px; color:#334155; font-size: 14px; line-height: 1.7;">
            <li>Open any Minecraft server on Pterodactyl.</li>
            <li>Look for the <strong>MC Hub</strong> tab in the server sub-navigation.</li>
            <li>Choose <em>Server Properties</em> or <em>Addon Manager</em>.</li>
            <li>Make changes and hit <strong>Save</strong> or <strong>Install</strong>.</li>
          </ol>
        </div>
      </div>

      <div class="mchub-card">
        <div class="mchub-card-head">
          <h3>Uninstalling</h3>
        </div>
        <div class="mchub-card-body">
          <p style="margin: 0; color:#334155; font-size: 14px; line-height: 1.6;">
            Run <code>blueprint -remove mchub</code> from your Pterodactyl root to
            fully uninstall this extension. Any settings you configured here will be
            cleared automatically.
          </p>
        </div>
      </div>
    </div>

  </section>

  {{-- ==================== FLOATING SAVE ==================== --}}
  <div id="mchub-save" class="mchub-save-overlay">
    <span>Unsaved changes</span>
    <button type="submit" name="_method" value="PATCH" class="btn btn-primary btn-sm">
      Apply changes
    </button>
  </div>

  <script>
    (function () {
      var form = document.getElementById('mchub-config-form');
      var save = document.getElementById('mchub-save');
      var chips = document.getElementById('mchub-chips');
      var enabledHidden = document.getElementById('enabled_categories');
      var colorInput = document.getElementById('accent_color');
      var colorText  = document.getElementById('accent_color_text');
      var folderInput = document.getElementById('install_folder');
      var folderStat  = document.getElementById('mchub-stat-folder');
      var catalogStat = document.getElementById('mchub-stat-catalog');
      var customCatalog = document.getElementById('custom_catalog');

      function showSave() { save.classList.add('mchub-show'); }
      form.addEventListener('input',  showSave, true);
      form.addEventListener('change', showSave, true);

      colorInput.addEventListener('input', function () { colorText.value = colorInput.value; });
      folderInput.addEventListener('input', function () {
        folderStat.textContent = folderInput.value || '—';
      });

      function refreshCategories() {
        var picked = [];
        chips.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
          var chip = cb.closest('.mchub-chip');
          if (cb.checked) { picked.push(cb.value); chip.classList.add('mchub-chip-on'); }
          else { chip.classList.remove('mchub-chip-on'); }
        });
        enabledHidden.value = picked.join(',');
      }
      chips.addEventListener('change', function () { refreshCategories(); showSave(); });
      refreshCategories();

      function refreshCatalogCount() {
        var builtin = 24; // approximate count in bundled catalog.json
        var extra = 0;
        try {
          var parsed = JSON.parse(customCatalog.value || '[]');
          if (Array.isArray(parsed)) extra = parsed.length;
        } catch (e) { extra = 0; }
        catalogStat.textContent = (builtin + extra) + '';
      }
      customCatalog.addEventListener('input', refreshCatalogCount);
      refreshCatalogCount();
    })();
  </script>
</form>
