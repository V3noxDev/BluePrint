<?php

namespace Pterodactyl\Http\Controllers\Admin\Extensions\minecontrol;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;
use Pterodactyl\Http\Controllers\Controller;

class minecontrolExtensionController extends Controller
{
    public function __construct(
        private ViewFactory $view,
        private BlueprintExtensionLibrary $blueprint,
    ) {
    }

    public function index(): View
    {
        return $this->view->make('admin.extensions.minecontrol.index', [
            'blueprint' => $this->blueprint,
            'defaultDirectory' => $this->blueprint->dbGet('minecontrol', 'default_directory') ?: 'plugins',
            'allowMods' => $this->blueprint->dbGet('minecontrol', 'allow_mods') !== '0',
            'autoBackup' => $this->blueprint->dbGet('minecontrol', 'auto_backup') !== '0',
        ]);
    }

    public function post(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'default_directory' => 'required|in:plugins,mods',
            'allow_mods' => 'nullable|in:0,1',
            'auto_backup' => 'nullable|in:0,1',
        ]);

        $this->blueprint->dbSet('minecontrol', 'default_directory', $data['default_directory']);
        $this->blueprint->dbSet('minecontrol', 'allow_mods', $request->boolean('allow_mods') ? '1' : '0');
        $this->blueprint->dbSet('minecontrol', 'auto_backup', $request->boolean('auto_backup') ? '1' : '0');

        return redirect()->route('admin.extensions.minecontrol.index')->with('success', 'MineControl settings saved.');
    }
}
