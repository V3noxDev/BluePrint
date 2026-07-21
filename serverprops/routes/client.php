<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\serverprops\ServerPropertiesController;

Route::group(['prefix' => '/servers/{server}'], function () {
    Route::get('/properties', [ServerPropertiesController::class, 'show']);
    Route::post('/properties', [ServerPropertiesController::class, 'update']);
});
