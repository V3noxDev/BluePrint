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
        $enabled = $this->blueprint->dbGet('minehub', 'enabled');
        if ($enabled === '') {
            $this->blueprint->dbSet('minehub', 'enabled', 'true');
            $enabled = 'true';
        }

        return $this->view->make('admin.extensions.minehub.index', [
            'root' => '/admin/extensions/minehub',
            'blueprint' => $this->blueprint,
            'enabled' => $enabled === 'true',
        ]);
    }

    public function update(minehubSettingsFormRequest $request): RedirectResponse
    {
        $this->blueprint->dbSet('minehub', 'enabled', $request->boolean('enabled') ? 'true' : 'false');

        return redirect()->route('admin.extensions.minehub.index');
    }
}

class minehubSettingsFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'enabled' => 'nullable|boolean',
        ];
    }

    public function attributes(): array
    {
        return [
            'enabled' => 'Enabled',
        ];
    }
}
