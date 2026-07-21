<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcproperties;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Models\Server;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

class PropertiesController extends Controller
{
    /**
     * The path (relative to the server root) of the Minecraft properties file.
     */
    private const PROPERTIES_PATH = '/server.properties';

    /**
     * Maximum size (bytes) we are willing to read. server.properties files are
     * tiny, so this protects against accidentally pulling a huge file.
     */
    private const MAX_SIZE = 512000;

    public function __construct(private DaemonFileRepository $fileRepository)
    {
    }

    /**
     * Read the raw contents of server.properties for a given server.
     */
    public function read(Request $request): JsonResponse
    {
        $request->validate([
            'serverUuid' => 'required|string|exists:servers,uuid',
        ]);

        $server = Server::query()->where('uuid', $request->input('serverUuid'))->firstOrFail();

        $this->authorize('file.read-content', $server);

        try {
            $content = $this->fileRepository
                ->setServer($server)
                ->getContent(self::PROPERTIES_PATH, self::MAX_SIZE);

            return response()->json([
                'success' => true,
                'content' => $content,
            ]);
        } catch (DaemonConnectionException $ex) {
            return response()->json([
                'success' => false,
                'code' => $ex->getStatusCode() ?: 500,
                'message' => $this->friendlyDaemonError($ex),
            ], 200);
        } catch (\Throwable $ex) {
            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred while reading server.properties.',
            ], 200);
        }
    }

    /**
     * Write new contents to server.properties for a given server.
     */
    public function write(Request $request): JsonResponse
    {
        $request->validate([
            'serverUuid' => 'required|string|exists:servers,uuid',
            'content' => 'required|string',
        ]);

        $server = Server::query()->where('uuid', $request->input('serverUuid'))->firstOrFail();

        $this->authorize('file.update', $server);

        try {
            $this->fileRepository
                ->setServer($server)
                ->putContent(self::PROPERTIES_PATH, $request->input('content'));

            return response()->json([
                'success' => true,
            ]);
        } catch (DaemonConnectionException $ex) {
            return response()->json([
                'success' => false,
                'message' => $this->friendlyDaemonError($ex),
            ], 200);
        } catch (\Throwable $ex) {
            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred while saving server.properties.',
            ], 200);
        }
    }

    /**
     * Turn a raw daemon exception into a human friendly message.
     */
    private function friendlyDaemonError(DaemonConnectionException $ex): string
    {
        if ($ex->getStatusCode() === 404) {
            return 'No server.properties file was found. Start your Minecraft server at least once so it can generate one.';
        }

        return 'Could not communicate with the server daemon (Wings). Make sure the server node is online.';
    }
}
