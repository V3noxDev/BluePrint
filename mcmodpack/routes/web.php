<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\mcmodpack\ModpackPullController;

Route::get('/extensions/mcmodpack/pull/{token}', [ModpackPullController::class, 'stream']);
