<?php

namespace Pterodactyl\Http\Controllers\Admin\Extensions\bedrockversions;

use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Http\Controllers\Controller;
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
        // Keep catalog fresh when admin opens the page
        $this->versions->syncFromApi(false);
        $stats = $this->versions->getStats();

        return $this->view->make('admin.extensions.bedrockversions.index', [
            'root' => '/admin/extensions/bedrockversions',
            'blueprint' => $this->blueprint,
            'stats' => $stats,
            'last_sync' => $this->blueprint->dbGet('bedrockversions', 'last_sync') ?: 'Nunca',
        ]);
    }
}
