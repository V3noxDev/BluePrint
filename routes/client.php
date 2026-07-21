<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Middleware\Activity\ServerSubject;
use Pterodactyl\Http\Middleware\Api\Client\Server\AuthenticateServerAccess;
use {appcontext}\Http\Controllers\MineFlowController;

Route::group([
    'prefix' => '/servers/{server}',
    'middleware' => [ServerSubject::class, AuthenticateServerAccess::class],
], function (): void {
    Route::get('/catalog', [MineFlowController::class, 'catalog'])->middleware('throttle:60,1');
    Route::get('/projects/{project}/versions', [MineFlowController::class, 'versions'])
        ->where('project', '[A-Za-z0-9_-]+')
        ->middleware('throttle:60,1');

    Route::get('/installed', [MineFlowController::class, 'installed']);
    Route::post('/install', [MineFlowController::class, 'install'])->middleware('throttle:10,1');
    Route::delete('/installed', [MineFlowController::class, 'remove'])->middleware('throttle:20,1');

    Route::get('/properties', [MineFlowController::class, 'properties']);
    Route::patch('/properties', [MineFlowController::class, 'updateProperties'])->middleware('throttle:30,1');
});
