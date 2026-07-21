<?php

namespace Pterodactyl\Http\Controllers\Admin\Extensions\minehub;

use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

class minehubExtensionController extends Controller
{
    public function __construct(
        private ViewFactory $view,
        private BlueprintExtensionLibrary $blueprint,
    ) {}

    public function index(): View
    {
        return $this->view->make('admin.extensions.minehub.index', [
            'root' => '/admin/extensions/minehub',
            'blueprint' => $this->blueprint,
        ]);
    }
}
