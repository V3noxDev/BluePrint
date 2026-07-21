<?php

/**
 * MC Properties Manager — Admin Controller
 * Blueprint Extension for Pterodactyl Panel
 *
 * Handles the admin panel view for the mcproperties extension.
 * The {identifier} placeholder is replaced with 'mcproperties'
 * automatically by Blueprint during installation.
 */

namespace Pterodactyl\Http\Controllers\Admin\Extensions\{identifier};

use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

class {identifier}ExtensionController extends Controller
{
    public function __construct(
        private ViewFactory $view,
        private BlueprintExtensionLibrary $blueprint,
    ) {}

    /**
     * Render the admin panel page (GET /admin/extensions/mcproperties).
     */
    public function index(Request $request): View
    {
        $extensionVersion  = '1.0.0';
        $blueprintTarget   = 'beta-2026-01';
        $totalProperties   = 45;
        $totalCategories   = 6;

        return $this->view->make(
            'admin.extensions.{identifier}.index',
            [
                'root'             => '/admin/extensions/{identifier}',
                'blueprint'        => $this->blueprint,
                'extensionVersion' => $extensionVersion,
                'blueprintTarget'  => $blueprintTarget,
                'totalProperties'  => $totalProperties,
                'totalCategories'  => $totalCategories,
            ]
        );
    }

    /**
     * Handle PATCH requests — reserved for future settings persistence.
     */
    public function update(Request $request): \Illuminate\Http\RedirectResponse
    {
        return redirect()->route('admin.extensions.{identifier}.index')
            ->with('success', 'Configurações salvas com sucesso.');
    }
}
