<?php

namespace {appcontext};

use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Client\BlueprintClientLibrary;

class SettingsController extends Controller
{
    public function __construct(
        private BlueprintClientLibrary $blueprint,
    ) {
    }

    /**
     * Expose the extension settings (configured on the admin page) to the
     * client-side React application.
     */
    public function index(): JsonResponse
    {
        return new JsonResponse([
            'success' => true,
            'data' => [
                'allow_dangerous' => $this->blueprint->dbGet('mcproperties', 'allow_dangerous', '0') === '1',
                'allow_raw_editor' => $this->blueprint->dbGet('mcproperties', 'allow_raw_editor', '1') === '1',
                'hide_unknown' => $this->blueprint->dbGet('mcproperties', 'hide_unknown', '0') === '1',
                'file_path' => $this->blueprint->dbGet('mcproperties', 'file_path', '/server.properties'),
            ],
        ]);
    }
}
