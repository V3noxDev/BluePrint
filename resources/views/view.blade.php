<div class="row">
  <div class="col-xs-12">
    <div class="box" style="border-top-color:#22c55e;">
      <div class="box-header with-border">
        <h3 class="box-title"><i class="fa fa-server"></i> MC Properties Editor</h3>
      </div>
      <div class="box-body">
        <p>
          <strong>MC Properties Editor</strong> adds a beautiful <em>Properties</em> tab to every server's
          panel, letting your users edit the <code>server.properties</code> file of their Minecraft: Java Edition
          servers with toggle switches, dropdowns and smart inputs &mdash; no config editing required.
        </p>

        @if("{is_target}" != "true")
          <div class="callout callout-warning">
            <h4><i class="fa fa-exclamation-triangle"></i> Version mismatch</h4>
            <p>
              This extension targets Blueprint <code>{target}</code> but your panel is running a different version.
              Everything should still work, but keep this in mind if you run into issues.
            </p>
          </div>
        @endif

        <div class="callout callout-success">
          <h4><i class="fa fa-check"></i> No configuration needed</h4>
          <p>Once installed, the <strong>Properties</strong> tab automatically appears in the server view for Minecraft servers.</p>
        </div>

        <h4><i class="fa fa-star"></i> Features</h4>
        <ul>
          <li>Structured editor covering every vanilla <code>server.properties</code> key, grouped into categories.</li>
          <li>Toggle switches for booleans, dropdowns for gamemode / difficulty / level-type and permission levels.</li>
          <li>Raw editor mode for full manual control.</li>
          <li>Live search across all properties.</li>
          <li>Unknown / plugin-added keys are preserved and editable.</li>
          <li>Permission-aware &mdash; respects Pterodactyl's file read/update subuser permissions.</li>
        </ul>

        <h4><i class="fa fa-shield"></i> Permissions</h4>
        <p>
          Reading the file requires the <code>file.read-content</code> permission and saving requires
          <code>file.update</code>. Subusers without these permissions cannot view or change the file.
        </p>
      </div>
      <div class="box-footer">
        <span class="text-muted">Version {version} &bull; by {author}</span>
      </div>
    </div>
  </div>
</div>
