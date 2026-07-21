<?php

namespace Pterodactyl\Http\Controllers\Admin\Extensions\{identifier};

use Illuminate\Http\RedirectResponse;
use Illuminate\View\Factory as ViewFactory;
use Illuminate\View\View;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class {identifier}ExtensionController extends Controller
{
    public function __construct(
        private ViewFactory $view,
        private BlueprintExtensionLibrary $blueprint,
        private SettingsRepositoryInterface $settings,
    ) {
    }

    public function index(): View
    {
        return $this->view->make('admin.extensions.{identifier}.index', [
            'root' => '/admin/extensions/{identifier}',
            'blueprint' => $this->blueprint,
            'pluginsEnabled' => $this->settings->get('{identifier}::plugins_enabled', '1'),
            'modsEnabled' => $this->settings->get('{identifier}::mods_enabled', '1'),
            'propertiesEnabled' => $this->settings->get('{identifier}::properties_enabled', '1'),
            'defaultSection' => $this->settings->get('{identifier}::default_section', 'plugin'),
        ]);
    }

    /**
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function update({identifier}SettingsFormRequest $request): RedirectResponse
    {
        foreach ($request->normalize() as $key => $value) {
            $this->settings->set('{identifier}::' . $key, (string) $value);
        }

        return redirect()
            ->route('admin.extensions.{identifier}.index')
            ->with('success', 'Configurações do MineHub atualizadas.');
    }
}

class {identifier}SettingsFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'plugins_enabled' => 'required|in:0,1',
            'mods_enabled' => 'required|in:0,1',
            'properties_enabled' => 'required|in:0,1',
            'default_section' => 'required|in:plugin,mod',
        ];
    }

    public function attributes(): array
    {
        return [
            'plugins_enabled' => 'Instalador de plugins',
            'mods_enabled' => 'Instalador de mods',
            'properties_enabled' => 'Editor do server.properties',
            'default_section' => 'Seção inicial',
        ];
    }
}
