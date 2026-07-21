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

            $properties = ServerPropertiesService::parse($content);

            return response()->json([
                'success' => true,
                'data' => [
                    'properties' => $properties,
                    'definitions' => ServerPropertiesService::getDefinitions(),
                    'raw' => $content,
                    'modules' => AddonCatalogService::getEnabledModules(),
                ],
            ]);
        } catch (DaemonConnectionException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Não foi possível conectar ao daemon do servidor.',
            ], 502);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Arquivo server.properties não encontrado ou inacessível.',
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
                'message' => 'server.properties atualizado com sucesso.',
                'data' => ['properties' => $merged],
            ]);
        } catch (DaemonConnectionException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Não foi possível conectar ao daemon do servidor.',
            ], 502);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao salvar server.properties.',
            ], 500);
        }
    }

}
