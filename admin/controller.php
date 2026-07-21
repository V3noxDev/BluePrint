<?php

namespace Pterodactyl\Http\Controllers\Admin\Extensions\{identifier};

use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Illuminate\Http\RedirectResponse;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

class {identifier}ExtensionController extends Controller
{
    public function __construct(
        private ViewFactory $view,
        private BlueprintExtensionLibrary $blueprint,
        private SettingsRepositoryInterface $settings,
    ) {}

    public function index(): View
    {
        return $this->view->make('admin.extensions.{identifier}.index', [
            'enabled' => $this->blueprint->dbGet('{identifier}', 'enabled') ?? '1',
            'defaultTab' => $this->blueprint->dbGet('{identifier}', 'default_tab') ?? 'properties',
            'pluginsPath' => $this->blueprint->dbGet('{identifier}', 'plugins_path') ?? '/plugins',
            'propertiesPath' => $this->blueprint->dbGet('{identifier}', 'properties_path') ?? '/server.properties',
            'allowAddonInstall' => $this->blueprint->dbGet('{identifier}', 'allow_addon_install') ?? '1',
            'allowAddonRemove' => $this->blueprint->dbGet('{identifier}', 'allow_addon_remove') ?? '1',
            'allowPropertiesEdit' => $this->blueprint->dbGet('{identifier}', 'allow_properties_edit') ?? '1',
            'modrinthLoaders' => $this->blueprint->dbGet('{identifier}', 'modrinth_loaders') ?? 'paper,purpur,spigot,bukkit,folia',
            'root' => '/admin/extensions/{identifier}',
            'blueprint' => $this->blueprint,
        ]);
    }

    public function update({identifier}SettingsFormRequest $request): RedirectResponse
    {
        foreach ($request->normalize() as $key => $value) {
            $this->settings->set('{identifier}::' . $key, $value);
        }

        $this->blueprint->alert('success', 'MC Manager settings saved successfully.');

        return redirect()->route('admin.extensions.{identifier}.index');
    }
}

class {identifier}SettingsFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'enabled' => ['required', 'in:0,1'],
            'default_tab' => ['required', 'in:properties,addons'],
            'plugins_path' => ['required', 'string', 'max:120'],
            'properties_path' => ['required', 'string', 'max:120'],
            'allow_addon_install' => ['required', 'in:0,1'],
            'allow_addon_remove' => ['required', 'in:0,1'],
            'allow_properties_edit' => ['required', 'in:0,1'],
            'modrinth_loaders' => ['required', 'string', 'max:255'],
        ];
    }

    public function attributes(): array
    {
        return [
            'enabled' => 'Enabled',
            'default_tab' => 'Default tab',
            'plugins_path' => 'Plugins path',
            'properties_path' => 'Properties path',
            'allow_addon_install' => 'Allow addon install',
            'allow_addon_remove' => 'Allow addon remove',
            'allow_properties_edit' => 'Allow properties edit',
            'modrinth_loaders' => 'Modrinth loaders',
        ];
    }
}
