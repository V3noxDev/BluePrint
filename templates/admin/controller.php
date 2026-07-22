<?php

namespace Pterodactyl\Http\Controllers\Admin\Extensions\templates;

use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

class templatesExtensionController extends Controller
{
    public function __construct(
        private ViewFactory $view,
        private BlueprintExtensionLibrary $blueprint,
    ) {}

    public function index(): View
    {
        return $this->view->make('admin.extensions.templates.index', [
            'root' => '/admin/extensions/templates',
            'blueprint' => $this->blueprint,
            'api_root' => '/extensions/templates/admin',
        ]);
    }
}
