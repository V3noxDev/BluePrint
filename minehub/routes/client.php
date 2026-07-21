<?php

use Illuminate\Support\Facades\Route;
use {appcontext}\CatalogController;

Route::prefix('/catalog')->group(function (): void {
    Route::get('/config', [CatalogController::class, 'configuration']);
    Route::get('/metadata', [CatalogController::class, 'metadata']);
    Route::get('/search', [CatalogController::class, 'search']);
    Route::get('/projects/{project}/versions', [CatalogController::class, 'versions'])
        ->where('project', '[A-Za-z0-9_-]{3,64}');
});
