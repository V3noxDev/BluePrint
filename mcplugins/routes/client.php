<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\mcplugins\PluginController;

Route::group(['prefix' => '/servers/{server}'], function () {
    Route::get('/plugins', [PluginController::class, 'index']);
    Route::get('/plugins/installed', [PluginController::class, 'installed']);
    Route::post('/plugins/sync', [PluginController::class, 'syncInstalled']);
    Route::get('/plugins/{plugin}', [PluginController::class, 'show']);
    Route::get('/plugins/{plugin}/files', [PluginController::class, 'files']);
    Route::post('/plugins/install', [PluginController::class, 'install']);
    Route::post('/plugins/update', [PluginController::class, 'update']);
    Route::post('/plugins/remove', [PluginController::class, 'remove']);
});
