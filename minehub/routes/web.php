<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\minehub\AddonManagerController;

Route::post('/addons/install', [AddonManagerController::class, 'install'])->name('extension.minehub.install');
