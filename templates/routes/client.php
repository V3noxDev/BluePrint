<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\templates\TemplateController;

Route::group(['prefix' => '/servers/{server}'], function () {
    Route::get('/templates', [TemplateController::class, 'index']);
    Route::get('/templates/allocations', [TemplateController::class, 'allocations']);
    Route::post('/templates/install', [TemplateController::class, 'install']);
    Route::get('/templates/{template}', [TemplateController::class, 'show']);
});
