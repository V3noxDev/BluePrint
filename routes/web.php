<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\mcproperties\PropertiesController;

Route::post('/read', [PropertiesController::class, 'read'])->name('extensions.mcproperties.read');
Route::post('/write', [PropertiesController::class, 'write'])->name('extensions.mcproperties.write');
