<?php

/*
|-----------------------------------------------------------------------------
| MC Hub — Addon Manager & Properties Editor
| Admin controller — handles the /admin/extensions/mchub page.
|
| Docs: https://blueprint.zip/guides/dev/admincontroller
|-----------------------------------------------------------------------------
*/

namespace Pterodactyl\Http\Controllers\Admin\Extensions\mchub;

use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Contracts\Config\Repository as ConfigRepository;

use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;

use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

class mchubExtensionController extends Controller
{
    public function __construct(
        private ViewFactory $view,
        private BlueprintExtensionLibrary $blueprint,
        private ConfigRepository $config,
        private SettingsRepositoryInterface $settings,
    ) {}

    public function index(): View
    {
        // Load persistent settings.
        $installFolder  = $this->blueprint->dbGet('mchub', 'install_folder');
        $defaultBranch  = $this->blueprint->dbGet('mchub', 'default_branch');
        $catCategories  = $this->blueprint->dbGet('mchub', 'enabled_categories');
        $accentColor    = $this->blueprint->dbGet('mchub', 'accent_color');
        $customCatalog  = $this->blueprint->dbGet('mchub', 'custom_catalog');
        $requireConfirm = $this->blueprint->dbGet('mchub', 'require_confirm');

        // Reasonable defaults on first load.
        if ($installFolder  === '') { $this->blueprint->dbSet('mchub', 'install_folder',      'plugins');            $installFolder  = 'plugins'; }
        if ($defaultBranch  === '') { $this->blueprint->dbSet('mchub', 'default_branch',      'paper');              $defaultBranch  = 'paper'; }
        if ($catCategories  === '') { $this->blueprint->dbSet('mchub', 'enabled_categories',  'core,economy,worldmgmt,admin,fun,protection,performance'); $catCategories = 'core,economy,worldmgmt,admin,fun,protection,performance'; }
        if ($accentColor    === '') { $this->blueprint->dbSet('mchub', 'accent_color',        '#4ade80');            $accentColor    = '#4ade80'; }
        if ($customCatalog  === '') { $this->blueprint->dbSet('mchub', 'custom_catalog',      '[]');                 $customCatalog  = '[]'; }
        if ($requireConfirm === '') { $this->blueprint->dbSet('mchub', 'require_confirm',    '1');                  $requireConfirm = '1'; }

        return $this->view->make(
            'admin.extensions.mchub.index',
            [
                'install_folder'     => $installFolder,
                'default_branch'     => $defaultBranch,
                'enabled_categories' => $catCategories,
                'accent_color'       => $accentColor,
                'custom_catalog'     => $customCatalog,
                'require_confirm'    => $requireConfirm,
                'root'               => '/admin/extensions/mchub',
                'blueprint'          => $this->blueprint,
            ]
        );
    }

    /**
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function update(mchubSettingsFormRequest $request): RedirectResponse
    {
        foreach ($request->normalize() as $key => $value) {
            $this->settings->set('mchub::' . $key, $value);
        }

        return redirect()->route('admin.extensions.mchub.index');
    }
}

class mchubSettingsFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'install_folder'     => 'required|string|max:96',
            'default_branch'     => 'required|in:paper,spigot,purpur,forge,fabric,neoforge',
            'enabled_categories' => 'string|max:512',
            'accent_color'       => 'starts_with:#|string|size:7',
            'custom_catalog'     => 'string',
            'require_confirm'    => 'in:0,1',
        ];
    }

    public function attributes(): array
    {
        return [
            'install_folder'     => 'Install folder',
            'default_branch'     => 'Default server branch',
            'enabled_categories' => 'Enabled categories',
            'accent_color'       => 'Accent color',
            'custom_catalog'     => 'Custom catalog JSON',
            'require_confirm'    => 'Require confirmation',
        ];
    }
}
