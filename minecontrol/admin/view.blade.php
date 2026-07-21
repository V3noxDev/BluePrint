<div class="minecontrol-admin">
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-success">
                <div class="box-header with-border">
                    <h3 class="box-title">
                        <i class="fa fa-cube"></i> MineControl
                    </h3>
                    <div class="box-tools pull-right">
                        <span class="label label-success">v1.0.0</span>
                    </div>
                </div>
                <div class="box-body">
                    <p class="text-muted" style="margin-bottom: 18px;">
                        Minecraft Java toolkit for your panel users — browse &amp; install addons from Modrinth,
                        multi-select remove/disable installed jars, and edit <code>server.properties</code>
                        with a categorized UI.
                    </p>

                    @if(session('success'))
                        <div class="alert alert-success">{{ session('success') }}</div>
                    @endif

                    <form method="POST" action="{{ route('admin.extensions.minecontrol.index') }}">
                        @csrf

                        <div class="form-group">
                            <label for="default_directory">Default install directory</label>
                            <select name="default_directory" id="default_directory" class="form-control" style="max-width: 280px;">
                                <option value="plugins" @if(($defaultDirectory ?? 'plugins') === 'plugins') selected @endif>plugins/</option>
                                <option value="mods" @if(($defaultDirectory ?? '') === 'mods') selected @endif>mods/</option>
                            </select>
                            <p class="help-block">Used as the preferred target when installing addons.</p>
                        </div>

                        <div class="checkbox">
                            <label>
                                <input type="hidden" name="allow_mods" value="0">
                                <input type="checkbox" name="allow_mods" value="1" @if($allowMods ?? true) checked @endif>
                                Allow switching between <code>plugins/</code> and <code>mods/</code> in the client UI
                            </label>
                        </div>

                        <div class="checkbox">
                            <label>
                                <input type="hidden" name="auto_backup" value="0">
                                <input type="checkbox" name="auto_backup" value="1" @if($autoBackup ?? true) checked @endif>
                                Automatically backup <code>server.properties</code> before saving
                            </label>
                        </div>

                        <hr>

                        <button type="submit" class="btn btn-success">
                            <i class="fa fa-save"></i> Save settings
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-md-6">
            <div class="box box-solid">
                <div class="box-header with-border">
                    <h3 class="box-title">Client pages</h3>
                </div>
                <div class="box-body">
                    <ul style="padding-left: 18px; margin: 0;">
                        <li><strong>Addons</strong> — <code>/server/&lt;id&gt;/minecontrol</code></li>
                        <li><strong>Properties</strong> — same page, Properties tab</li>
                    </ul>
                    <p class="help-block" style="margin-top: 12px; margin-bottom: 0;">
                        Restrict which eggs show this route under
                        <em>Admin → Blueprint → Extensions → manage eggs</em>.
                    </p>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="box box-solid">
                <div class="box-header with-border">
                    <h3 class="box-title">Permissions</h3>
                </div>
                <div class="box-body">
                    <p style="margin: 0;">
                        Install uses <code>file.create</code>, remove uses <code>file.delete</code>,
                        toggle/save uses <code>file.update</code>, listing uses <code>file.read</code>.
                        Subusers without those permissions cannot mutate server files.
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>
