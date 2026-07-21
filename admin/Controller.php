<?php

namespace Pterodactyl\Http\Controllers\Admin\Extensions\propertieseditor;

use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary;

class propertieseditorExtensionController extends Controller
{
    public function __construct(
        private ViewFactory $view,
        private BlueprintAdminLibrary $blueprint,
    ) {}

    /** Rendered when an administrator opens the extension's admin page. */
    public function index(): View
    {
        return $this->view->make('admin.extensions.propertieseditor.index', [
            'root' => '/admin/extensions/propertieseditor',
            'blueprint' => $this->blueprint,
        ]);
    }
}
