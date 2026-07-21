<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\bedrockversions\BedrockVersionController;

Route::group(['prefix' => '/servers/{server}'], function () {
    Route::get('/versions', [BedrockVersionController::class, 'index']);
    Route::post('/versions/sync', [BedrockVersionController::class, 'sync']);
    Route::post('/versions/install', [BedrockVersionController::class, 'install']);
});
