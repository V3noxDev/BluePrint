<?php

use Illuminate\Support\Facades\Route;
use {appcontext}\PluginController;
use {appcontext}\PropertiesController;

/*
|--------------------------------------------------------------------------
| MineControl web routes
| Prefix: /extensions/minecontrol
|--------------------------------------------------------------------------
*/

Route::middleware(['web', 'auth'])->group(function () {
    // Plugin / addon manager
    Route::get('/plugins', [PluginController::class, 'list'])->name('extension.minecontrol.plugins.list');
    Route::post('/plugins/install', [PluginController::class, 'install'])->name('extension.minecontrol.plugins.install');
    Route::post('/plugins/remove', [PluginController::class, 'remove'])->name('extension.minecontrol.plugins.remove');
    Route::post('/plugins/toggle', [PluginController::class, 'toggle'])->name('extension.minecontrol.plugins.toggle');
    Route::get('/plugins/search', [PluginController::class, 'search'])->name('extension.minecontrol.plugins.search');
    Route::get('/plugins/versions', [PluginController::class, 'versions'])->name('extension.minecontrol.plugins.versions');

    // server.properties manager
    Route::get('/properties', [PropertiesController::class, 'show'])->name('extension.minecontrol.properties.show');
    Route::post('/properties', [PropertiesController::class, 'update'])->name('extension.minecontrol.properties.update');
    Route::post('/properties/backup', [PropertiesController::class, 'backup'])->name('extension.minecontrol.properties.backup');
    Route::post('/properties/restore', [PropertiesController::class, 'restore'])->name('extension.minecontrol.properties.restore');
});
