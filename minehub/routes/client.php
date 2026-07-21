<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\minehub\ServerPropertiesController;

Route::group(['prefix' => '/servers/{server}'], function () {
    Route::get('/properties', [ServerPropertiesController::class, 'show']);
    Route::post('/properties', [ServerPropertiesController::class, 'update']);
});
