<?php

namespace Pterodactyl\BlueprintFramework\Extensions\loginmaster;

use Illuminate\Http\JsonResponse;

class LoginMasterConfigController
{
    public function __construct(
        private LoginMasterService $service,
    ) {}

    public function show(): JsonResponse
    {
        return response()->json([
            'data' => $this->service->publicConfig(),
        ])->header('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
}
