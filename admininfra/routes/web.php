<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\admininfra\NodeInfraController;

Route::get('/nodes/{node}/stats', [NodeInfraController::class, 'stats']);
