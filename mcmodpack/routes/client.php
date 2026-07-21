<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\mcmodpack\ModpackController;

Route::group(['prefix' => '/servers/{server}'], function () {
    Route::get('/modpacks', [ModpackController::class, 'index']);
    Route::get('/modpacks/{modpack}', [ModpackController::class, 'show']);
    Route::get('/modpacks/{modpack}/files', [ModpackController::class, 'files']);
    Route::post('/modpacks/install', [ModpackController::class, 'install']);
});
