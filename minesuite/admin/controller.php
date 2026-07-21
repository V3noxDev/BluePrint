<?php

namespace Pterodactyl\Http\Controllers\Admin\Extensions\{identifier};

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

class {identifier}ExtensionController extends Controller
{
    public function __construct(
        private BlueprintExtensionLibrary $blueprint,
        private ViewFactory $view,
    ) {}

    public function index(): View
    {
        $catalogJson = $this->blueprint->dbGet('{identifier}', 'addons_catalog', '');
        if (!is_string($catalogJson) || $catalogJson === '') {
            $defaultPath = '{root/data}/addons.json';
            $catalogJson = is_file($defaultPath) ? (string) file_get_contents($defaultPath) : "{\"addons\":[]}";
        }

        return $this->view->make('admin.extensions.{identifier}.view', [
            'root' => '/admin/extensions/{identifier}',
            'blueprint' => $this->blueprint,
            'catalogJson' => $catalogJson,
            'defaultLoader' => $this->blueprint->dbGet('{identifier}', 'default_loader', 'paper'),
            'enabled' => (bool) $this->blueprint->dbGet('{identifier}', 'enabled', true),
        ]);
    }

    public function post(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'enabled' => 'nullable|in:0,1',
            'default_loader' => 'required|string|in:paper,spigot,bukkit,purpur,fabric,forge,neoforge,quilt',
            'addons_catalog' => 'required|string',
        ]);

        $decoded = json_decode($validated['addons_catalog'], true);
        if (!is_array($decoded) || !isset($decoded['addons']) || !is_array($decoded['addons'])) {
            return redirect()->back()->withErrors([
                'addons_catalog' => 'JSON inválido. Esperado: { "addons": [ ... ] }',
            ]);
        }

        foreach ($decoded['addons'] as $addon) {
            if (!is_array($addon) || empty($addon['id']) || empty($addon['name']) || empty($addon['project'])) {
                return redirect()->back()->withErrors([
                    'addons_catalog' => 'Cada addon precisa de id, name e project (Modrinth).',
                ]);
            }
        }

        $this->blueprint->dbSet('{identifier}', 'enabled', ($validated['enabled'] ?? '0') === '1');
        $this->blueprint->dbSet('{identifier}', 'default_loader', $validated['default_loader']);
        $this->blueprint->dbSet(
            '{identifier}',
            'addons_catalog',
            json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        );

        $this->blueprint->notify('MineSuite atualizado com sucesso.');

        return redirect('/admin/extensions/{identifier}');
    }
}
