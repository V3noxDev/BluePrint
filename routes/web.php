<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\minecraftsuite\MinecraftSuiteController;

Route::get('/properties', [MinecraftSuiteController::class, 'properties'])->name('extension.minecraftsuite.properties');
Route::patch('/properties', [MinecraftSuiteController::class, 'saveProperties'])->name('extension.minecraftsuite.properties.save');

Route::get('/addons', [MinecraftSuiteController::class, 'listAddons'])->name('extension.minecraftsuite.addons');
Route::post('/addons/install', [MinecraftSuiteController::class, 'installAddon'])->name('extension.minecraftsuite.addons.install');
Route::delete('/addons/remove', [MinecraftSuiteController::class, 'removeAddon'])->name('extension.minecraftsuite.addons.remove');
