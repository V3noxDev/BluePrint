<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcplugins;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Models\Server;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

class PluginController extends Controller
{
    public function __construct(
        private CurseForgeClient $curse,
        private PluginInstallService $installer,
    ) {}

    public function index(Request $request, Server $server): JsonResponse
    {
        $this->authorize('file.read', $server);

        $hasKey = $this->curse->hasApiKey();

        if (!$hasKey) {
            return response()->json([
                'success' => true,
                'data' => [
                    'api_configured' => false,
                    'message' => 'Não encontramos nenhum plugin. Configure a API Key do CurseForge na área admin do Blueprint.',
                    'plugins' => [],
                    'pagination' => ['index' => 0, 'pageSize' => 48, 'resultCount' => 0, 'totalCount' => 0],
                    'filters' => $this->filterMeta(),
                ],
            ]);
        }

        $search = $this->curse->searchPlugins([
            'search' => $request->query('search'),
            'game_version' => $request->query('game_version'),
            'loader' => $request->query('loader'),
            'sort' => $request->query('sort', 2),
            'page_size' => $request->query('page_size', 48),
            'index' => $request->query('index', 0),
        ]);

        $message = empty($search['data'])
            ? 'Não encontramos nenhum plugin com esses filtros.'
            : null;

        return response()->json([
            'success' => true,
            'data' => [
                'api_configured' => true,
                'message' => $message,
                'plugins' => $search['data'],
                'pagination' => $search['pagination'],
                'filters' => $this->filterMeta(),
            ],
        ]);
    }

    public function installed(Request $request, Server $server): JsonResponse
    {
        $this->authorize('file.read', $server);

        return response()->json([
            'success' => true,
            'data' => [
                'api_configured' => $this->curse->hasApiKey(),
                'plugins' => $this->installer->listManaged($server),
            ],
        ]);
    }

    public function show(Request $request, Server $server, int $plugin): JsonResponse
    {
        $this->authorize('file.read', $server);

        if (!$this->curse->hasApiKey()) {
            return response()->json(['success' => false, 'message' => 'API Key não configurada.'], 422);
        }

        $data = $this->curse->getPlugin($plugin);
        if (!$data) {
            return response()->json(['success' => false, 'message' => 'Plugin não encontrado.'], 404);
        }

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function files(Request $request, Server $server, int $plugin): JsonResponse
    {
        $this->authorize('file.read', $server);

        if (!$this->curse->hasApiKey()) {
            return response()->json(['success' => false, 'message' => 'API Key não configurada.'], 422);
        }

        $files = $this->curse->getFiles(
            $plugin,
            (int) $request->query('index', 0),
            (int) $request->query('page_size', 50)
        );

        return response()->json(['success' => true, 'data' => $files]);
    }

    public function install(Request $request, Server $server): JsonResponse
    {
        $this->authorize('file.update', $server);

        $data = $request->validate([
            'plugin_id' => 'required|integer|min:1',
            'file_id' => 'required|integer|min:1',
        ]);

        try {
            $result = $this->installer->install(
                $server,
                (int) $data['plugin_id'],
                (int) $data['file_id'],
            );

            return response()->json([
                'success' => true,
                'message' => "Plugin {$result['name']} instalado em /plugins/{$result['file_name']}!",
                'data' => $result,
            ]);
        } catch (DaemonConnectionException) {
            return response()->json([
                'success' => false,
                'message' => 'Não foi possível conectar ao daemon. Verifique api.disable_remote_download no Wings.',
            ], 502);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao instalar: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, Server $server): JsonResponse
    {
        $this->authorize('file.update', $server);

        $data = $request->validate([
            'plugin_id' => 'required|integer|min:1',
            'file_id' => 'required|integer|min:1',
        ]);

        try {
            $result = $this->installer->update(
                $server,
                (int) $data['plugin_id'],
                (int) $data['file_id'],
            );

            return response()->json([
                'success' => true,
                'message' => "Plugin {$result['name']} atualizado!",
                'data' => $result,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao atualizar: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function remove(Request $request, Server $server): JsonResponse
    {
        $this->authorize('file.update', $server);

        $data = $request->validate([
            'file_name' => 'required|string|max:255',
        ]);

        try {
            $this->installer->remove($server, $data['file_name']);

            return response()->json([
                'success' => true,
                'message' => 'Plugin removido com sucesso.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao remover: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function filterMeta(): array
    {
        return [
            'loaders' => CurseForgeClient::SERVER_LOADERS,
            'sorts' => CurseForgeClient::SORTS,
            'page_sizes' => [24, 48],
            'provider' => 'CurseForge',
        ];
    }
}
