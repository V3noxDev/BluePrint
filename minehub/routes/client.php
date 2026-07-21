<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\minehub\ServerPropertiesController;
use Pterodactyl\BlueprintFramework\Extensions\minehub\AddonManagerController;

Route::group(['prefix' => '/servers/{server}'], function () {
    Route::get('/properties', [ServerPropertiesController::class, 'show']);
    Route::post('/properties', [ServerPropertiesController::class, 'update']);

    Route::get('/addons/catalog', [AddonManagerController::class, 'catalog']);
    Route::get('/addons/installed', [AddonManagerController::class, 'installed']);
    Route::post('/addons/install', [AddonManagerController::class, 'install']);
    Route::delete('/addons/{filename}', [AddonManagerController::class, 'remove']);
});
