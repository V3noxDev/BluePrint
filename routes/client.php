<?php

use Illuminate\Support\Facades\Route;
use {appcontext}\MinecraftPropertiesController;

Route::prefix('/servers/{server}/properties')->group(function () {
    Route::get('/', [MinecraftPropertiesController::class, 'show']);
    Route::patch('/', [MinecraftPropertiesController::class, 'update']);
    Route::put('/raw', [MinecraftPropertiesController::class, 'raw']);
});
