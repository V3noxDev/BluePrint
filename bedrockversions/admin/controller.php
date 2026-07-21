<?php

namespace Pterodactyl\Http\Controllers\Admin\Extensions\bedrockversions;

use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;
use Illuminate\Http\RedirectResponse;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;
use Pterodactyl\BlueprintFramework\Extensions\bedrockversions\BedrockVersionService;

class bedrockversionsExtensionController extends Controller
{
    public function __construct(
        private ViewFactory $view,
        private BlueprintExtensionLibrary $blueprint,
        private BedrockVersionService $versions,
    ) {}

    public function index(): View
    {
        $stats = $this->versions->getStats();

        return $this->view->make('admin.extensions.bedrockversions.index', [
            'root' => '/admin/extensions/bedrockversions',
            'blueprint' => $this->blueprint,
            'stats' => $stats,
            'last_sync' => $this->blueprint->dbGet('bedrockversions', 'last_sync') ?: 'Nunca',
            'auto_sync' => ($this->blueprint->dbGet('bedrockversions', 'auto_sync') ?: 'true') === 'true',
        ]);
    }

    public function update(bedrockversionsSettingsFormRequest $request): RedirectResponse
    {
        $this->blueprint->dbSet(
            'bedrockversions',
            'auto_sync',
            $request->boolean('auto_sync') ? 'true' : 'false'
        );

        if ($request->boolean('force_sync')) {
            $this->versions->syncFromApi(true);
            $this->blueprint->dbSet('bedrockversions', 'last_sync', now()->toDateTimeString());
        }

        return redirect()->route('admin.extensions.bedrockversions.index');
    }
}

class bedrockversionsSettingsFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'auto_sync' => 'nullable|boolean',
            'force_sync' => 'nullable|boolean',
        ];
    }
}
