<?php

namespace Pterodactyl\Http\Controllers\Admin\Extensions\serverproperties;

use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Illuminate\Http\RedirectResponse;
use Pterodactyl\Http\Controllers\Controller;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

class serverpropertiesExtensionController extends Controller
{
    public function __construct(
        private ViewFactory $view,
        private BlueprintExtensionLibrary $blueprint,
        private ConfigRepository $config,
        private SettingsRepositoryInterface $settings,
    ) {}

    public function index(): View
    {
        $showShortcut = $this->blueprint->dbGet('serverproperties', 'show_shortcut');
        $accentColor  = $this->blueprint->dbGet('serverproperties', 'accent_color');
        $panelTitle   = $this->blueprint->dbGet('serverproperties', 'panel_title');

        if ($showShortcut === '' || $showShortcut === null) {
            $this->blueprint->dbSet('serverproperties', 'show_shortcut', 'true');
            $showShortcut = 'true';
        }
        if ($accentColor === '' || $accentColor === null) {
            $this->blueprint->dbSet('serverproperties', 'accent_color', '#3ecf8e');
            $accentColor = '#3ecf8e';
        }
        if ($panelTitle === '' || $panelTitle === null) {
            $this->blueprint->dbSet('serverproperties', 'panel_title', 'Server Properties');
            $panelTitle = 'Server Properties';
        }

        return $this->view->make('admin.extensions.serverproperties.index', [
            'showShortcut' => $showShortcut,
            'accentColor'  => $accentColor,
            'panelTitle'   => $panelTitle,
            'root'         => '/admin/extensions/serverproperties',
            'blueprint'    => $this->blueprint,
        ]);
    }

    public function update(serverpropertiesSettingsFormRequest $request): RedirectResponse
    {
        foreach ($request->normalize() as $key => $value) {
            $this->settings->set('serverproperties::' . $key, $value);
        }
        return redirect()->route('admin.extensions.serverproperties.index');
    }
}

class serverpropertiesSettingsFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'show_shortcut' => 'string',
            'accent_color'  => 'starts_with:#|string',
            'panel_title'   => 'string',
        ];
    }

    public function attributes(): array
    {
        return [
            'show_shortcut' => 'Mostrar atalho na página de arquivos',
            'accent_color'  => 'Cor de destaque',
            'panel_title'   => 'Título da página do editor',
        ];
    }
}
