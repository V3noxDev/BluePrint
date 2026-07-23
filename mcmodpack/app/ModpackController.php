<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcmodpack;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Models\Server;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

class ModpackController extends Controller
{
    public function __construct(
        private CurseForgeClient $curse,
        private ModpackInstallService $installer,
    ) {}

    public function index(Request $request, Server $server): JsonResponse
    {
        $this->authorize('file.read', $server);

        $hasKey = $this->curse->hasApiKey();
        $installed = $this->installer->getInstalled($server);

        if (!$hasKey) {
            return response()->json([
                'success' => true,
                'data' => [
                    'api_configured' => false,
                    'message' => 'Não encontramos nenhum modpack. Configure a API Key do CurseForge na área admin do Blueprint.',
                    'installed' => $installed,
                    'modpacks' => [],
                    'pagination' => ['index' => 0, 'pageSize' => 20, 'resultCount' => 0, 'totalCount' => 0],
                    'filters' => $this->filterMeta(),
                ],
            ]);
        }

        $search = $this->curse->searchModpacks([
            'search' => $request->query('search'),
            'game_version' => $request->query('game_version'),
            'loader' => $request->query('loader'),
            'sort' => $request->query('sort', 2),
            'page_size' => $request->query('page_size', 20),
            'index' => $request->query('index', 0),
        ]);

        $message = null;
        if (empty($search['data'])) {
            $message = 'Não encontramos nenhum modpack com esses filtros.';
        }

        return response()->json([
            'success' => true,
            'data' => [
                'api_configured' => true,
                'message' => $message,
                'installed' => $installed,
                'modpacks' => $search['data'],
                'pagination' => $search['pagination'],
                'filters' => $this->filterMeta(),
            ],
        ]);
    }

    public function show(Request $request, Server $server, int $modpack): JsonResponse
    {
        $this->authorize('file.read', $server);

        if (!$this->curse->hasApiKey()) {
            return response()->json([
                'success' => false,
                'message' => 'API Key do CurseForge não configurada.',
            ], 422);
        }

        $data = $this->curse->getModpack($modpack);
        if (!$data) {
            return response()->json([
                'success' => false,
                'message' => 'Modpack não encontrado.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function files(Request $request, Server $server, int $modpack): JsonResponse
    {
        $this->authorize('file.read', $server);

        if (!$this->curse->hasApiKey()) {
            return response()->json([
                'success' => false,
                'message' => 'API Key do CurseForge não configurada.',
            ], 422);
        }

        $files = $this->curse->getFiles(
            $modpack,
            (int) $request->query('index', 0),
            (int) $request->query('page_size', 50)
        );

        return response()->json([
            'success' => true,
            'data' => $files,
        ]);
    }

    public function install(Request $request, Server $server): JsonResponse
    {
        $this->authorize('file.update', $server);

        $data = $request->validate([
            'modpack_id' => 'required|integer|min:1',
            'file_id' => 'required|integer|min:1',
            'wipe' => 'nullable|boolean',
            'accept_eula' => 'nullable|boolean',
        ]);

        try {
            $result = $this->installer->install(
                $server,
                (int) $data['modpack_id'],
                (int) $data['file_id'],
                (bool) ($data['wipe'] ?? false),
                (bool) ($data['accept_eula'] ?? false),
            );

            return response()->json([
                'success' => true,
                'message' => "Modpack {$result['name']} instalado com sucesso!",
                'data' => $result,
            ]);
        } catch (DaemonConnectionException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Não foi possível comunicar com o Wings. Verifique se o node está online.',
            ], 502);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao instalar o modpack: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function filterMeta(): array
    {
        return [
            'loaders' => CurseForgeClient::LOADERS,
            'sorts' => CurseForgeClient::SORTS,
            'page_sizes' => [12, 20, 30, 50],
            'provider' => 'CurseForge',
        ];
    }
}
