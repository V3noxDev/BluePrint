<?php

namespace Pterodactyl\BlueprintFramework\Extensions\admininfra;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Models\Node;
use Pterodactyl\Http\Controllers\Controller;

class NodeInfraController extends Controller
{
    public function __construct(private NodeInfraService $service) {}

    public function stats(Request $request, Node $node): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->root_admin) {
            abort(403);
        }

        return response()->json([
            'success' => true,
            'data' => $this->service->stats($node),
        ]);
    }
}
