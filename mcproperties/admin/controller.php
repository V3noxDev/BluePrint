<?php

namespace Pterodactyl\Http\Controllers\Admin\Extensions\{identifier};

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

class {identifier}ExtensionController extends Controller
{
    public function __construct(
        private ViewFactory $view,
        private BlueprintExtensionLibrary $blueprint,
    ) {
    }

    public function index(): View
    {
        return $this->view->make(
            'admin.extensions.{identifier}.index', [
                'root' => '/admin/extensions/{identifier}',
                'blueprint' => $this->blueprint,
                'settings' => [
                    'allow_dangerous' => $this->blueprint->dbGet('{identifier}', 'allow_dangerous', '0'),
                    'allow_raw_editor' => $this->blueprint->dbGet('{identifier}', 'allow_raw_editor', '1'),
                    'hide_unknown' => $this->blueprint->dbGet('{identifier}', 'hide_unknown', '0'),
                    'file_path' => $this->blueprint->dbGet('{identifier}', 'file_path', '/server.properties'),
                ],
            ]
        );
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'allow_dangerous' => 'required|in:0,1',
            'allow_raw_editor' => 'required|in:0,1',
            'hide_unknown' => 'required|in:0,1',
            'file_path' => 'required|string|max:191|starts_with:/|ends_with:.properties',
        ]);

        foreach ($data as $key => $value) {
            $this->blueprint->dbSet('{identifier}', $key, $value);
        }

        $this->blueprint->alert('success', 'As configurações do MC Properties foram salvas!');

        return redirect()->route('admin.extensions.{identifier}.index');
    }
}
