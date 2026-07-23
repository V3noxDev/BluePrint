<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\loginmaster\LoginMasterConfigController;

Route::get('/extensions/loginmaster/config', [LoginMasterConfigController::class, 'show']);
