<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\{identifier}\PropertiesController;
use Pterodactyl\BlueprintFramework\Extensions\{identifier}\AddonController;

/*
|--------------------------------------------------------------------------
| MC Manager — Client API routes
|--------------------------------------------------------------------------
| Prefix: /api/client/extensions/mcmanager
| Auth: session / client API key
*/

Route::prefix('/{server}')->group(function () {
    Route::get('/config', [AddonController::class, 'config']);

    Route::get('/properties', [PropertiesController::class, 'show']);
    Route::put('/properties', [PropertiesController::class, 'update']);

    Route::get('/addons/installed', [AddonController::class, 'installed']);
    Route::get('/addons/search', [AddonController::class, 'search']);
    Route::get('/addons/versions/{projectId}', [AddonController::class, 'versions'])
        ->where('projectId', '[A-Za-z0-9._-]+');
    Route::post('/addons/install', [AddonController::class, 'install']);
    Route::post('/addons/remove', [AddonController::class, 'remove']);
});
