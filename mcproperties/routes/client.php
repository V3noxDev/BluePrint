<?php

use Illuminate\Support\Facades\Route;

// Prefixed with /api/client/extensions/mcproperties by Blueprint.
// Authenticated with a client API key or an active panel session.
Route::get('/settings', [{appcontext}\SettingsController::class, 'index']);
