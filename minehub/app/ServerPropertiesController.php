<?php

namespace Pterodactyl\BlueprintFramework\Extensions\minehub;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Models\Server;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;

class ServerPropertiesController extends Controller
{
    public function __construct(private DaemonFileRepository $fileRepository) {}

    public function show(Request $request, Server $server): JsonResponse
    {
        $this->authorize('file.read-content', $server);

        try {
            $content = $this->fileRepository
                ->setServer($server)
                ->getContent(ServerPropertiesService::getFilePath());

            return response()->json([
                'success' => true,
                'data' => [
                    'properties' => ServerPropertiesService::parse($content),
                    'raw' => $content,
                ],
            ]);
        } catch (DaemonConnectionException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not connect to the server daemon.',
            ], 502);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'server.properties not found or inaccessible.',
            ], 404);
        }
    }

    public function update(Request $request, Server $server): JsonResponse
    {
        $this->authorize('file.update', $server);

        $request->validate([
            'properties' => 'required|array',
        ]);

        try {
            $original = $this->fileRepository
                ->setServer($server)
                ->getContent(ServerPropertiesService::getFilePath());

            $merged = array_merge(
                ServerPropertiesService::parse($original),
                $request->input('properties', [])
            );

            $content = ServerPropertiesService::serialize($merged, $original);

            $this->fileRepository
                ->setServer($server)
                ->putContent(ServerPropertiesService::getFilePath(), $content);

            return response()->json([
                'success' => true,
                'message' => 'server.properties updated successfully.',
                'data' => ['properties' => $merged],
            ]);
        } catch (DaemonConnectionException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not connect to the server daemon.',
            ], 502);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save server.properties.',
            ], 500);
        }
    }
}
