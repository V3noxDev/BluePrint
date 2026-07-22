<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\templates\AdminTemplateController;

Route::prefix('/admin')->group(function () {
    Route::get('/variables-doc', [AdminTemplateController::class, 'variablesDoc']);
    Route::get('/actions', [AdminTemplateController::class, 'actions']);
    Route::post('/import', [AdminTemplateController::class, 'import']);

    Route::get('/templates', [AdminTemplateController::class, 'index']);
    Route::post('/templates', [AdminTemplateController::class, 'store']);
    Route::get('/templates/{template}', [AdminTemplateController::class, 'show']);
    Route::patch('/templates/{template}', [AdminTemplateController::class, 'update']);
    Route::delete('/templates/{template}', [AdminTemplateController::class, 'destroy']);
    Route::get('/templates/{template}/export', [AdminTemplateController::class, 'export']);

    Route::post('/templates/{template}/variables', [AdminTemplateController::class, 'storeVariable']);
    Route::patch('/templates/{template}/variables/{variable}', [AdminTemplateController::class, 'updateVariable']);
    Route::delete('/templates/{template}/variables/{variable}', [AdminTemplateController::class, 'destroyVariable']);

    Route::post('/templates/{template}/steps', [AdminTemplateController::class, 'storeStep']);
    Route::patch('/templates/{template}/steps/{step}', [AdminTemplateController::class, 'updateStep']);
    Route::delete('/templates/{template}/steps/{step}', [AdminTemplateController::class, 'destroyStep']);
});
