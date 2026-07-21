<?php

namespace Pterodactyl\Http\Controllers\Admin\Extensions\minehub;

use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;
use Illuminate\Http\RedirectResponse;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

class minehubExtensionController extends Controller
{
    public function __construct(
        private ViewFactory $view,
        private BlueprintExtensionLibrary $blueprint,
    ) {}

    public function index(): View
    {
        $catalog = $this->getCatalog();
        $enabledModules = $this->blueprint->dbGet('minehub', 'modules') ?: 'properties,addons';
        $autoInstall = $this->blueprint->dbGet('minehub', 'auto_install') ?: 'false';
        $defaultPath = $this->blueprint->dbGet('minehub', 'addon_path') ?: '/plugins';

        if ($enabledModules === '') {
            $this->blueprint->dbSet('minehub', 'modules', 'properties,addons');
            $enabledModules = 'properties,addons';
        }

        return $this->view->make('admin.extensions.minehub.index', [
            'root' => '/admin/extensions/minehub',
            'blueprint' => $this->blueprint,
            'catalog' => $catalog,
            'enabled_modules' => explode(',', $enabledModules),
            'auto_install' => $autoInstall === 'true',
            'addon_path' => $defaultPath,
        ]);
    }

    public function update(minehubSettingsFormRequest $request): RedirectResponse
    {
        $this->blueprint->dbSet('minehub', 'addon_path', $request->input('addon_path', '/plugins'));
        $this->blueprint->dbSet('minehub', 'auto_install', $request->boolean('auto_install') ? 'true' : 'false');

        $modules = $request->input('modules', []);
        $this->blueprint->dbSet('minehub', 'modules', is_array($modules) ? implode(',', $modules) : 'properties,addons');

        $catalog = json_decode($request->input('catalog_json', '[]'), true);
        if (is_array($catalog)) {
            $this->saveCatalog($catalog);
        }

        return redirect()->route('admin.extensions.minehub.index');
    }

    private function getCatalogPath(): string
    {
        return base_path('.blueprint/extensions/minehub/private/catalog.json');
    }

    private function getCatalog(): array
    {
        $path = $this->getCatalogPath();

        if (!file_exists($path)) {
            $default = base_path('.blueprint/extensions/minehub/private/default-catalog.json');
            if (file_exists($default)) {
                return json_decode(file_get_contents($default), true) ?: [];
            }

            return [];
        }

        return json_decode(file_get_contents($path), true) ?: [];
    }

    private function saveCatalog(array $catalog): void
    {
        $path = $this->getCatalogPath();
        $dir = dirname($path);

        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        file_put_contents($path, json_encode(array_values($catalog), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
}

class minehubSettingsFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'addon_path' => 'required|string|starts_with:/',
            'catalog_json' => 'nullable|string',
            'modules' => 'nullable|array',
            'modules.*' => 'string|in:properties,addons',
            'auto_install' => 'nullable|boolean',
        ];
    }

    public function attributes(): array
    {
        return [
            'addon_path' => 'Diretório de addons',
            'catalog_json' => 'Catálogo de addons',
        ];
    }
}
