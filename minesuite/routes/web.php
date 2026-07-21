<?php

use Illuminate\Support\Facades\Route;
use {appcontext}\AddonController;
use {appcontext}\PropertiesController;

/*
|--------------------------------------------------------------------------
| MineSuite web routes
| Prefix: /extensions/minesuite
|--------------------------------------------------------------------------
| Authenticated panel requests (session + CSRF) hit these endpoints from
| the React dashboard via @/api/http.
*/

Route::post('/properties', [PropertiesController::class, 'show'])->name('extension.minesuite.properties.show');
Route::put('/properties', [PropertiesController::class, 'update'])->name('extension.minesuite.properties.update');

Route::post('/addons/catalog', [AddonController::class, 'catalog'])->name('extension.minesuite.addons.catalog');
Route::post('/addons/install', [AddonController::class, 'install'])->name('extension.minesuite.addons.install');
Route::post('/addons/remove', [AddonController::class, 'remove'])->name('extension.minesuite.addons.remove');
Route::post('/addons/files', [AddonController::class, 'installedFiles'])->name('extension.minesuite.addons.files');
