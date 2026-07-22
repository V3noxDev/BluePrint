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
        private ModrinthClient $modrinth,
        private PluginInstallService $installer,
    ) {}

    public function index(Request $request, Server $server): JsonResponse
    {
        $this->authorize('file.read', $server);

        $provider = $this->normalizeProvider($request->query('provider', 'modrinth'));

        if ($provider === 'curseforge' && !$this->curse->hasApiKey()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'api_configured' => false,
                    'message' => 'Configure a API Key do CurseForge em Admin → Extensions → MC Plugins para buscar neste provedor.',
                    'plugins' => [],
                    'pagination' => ['index' => 0, 'pageSize' => 48, 'resultCount' => 0, 'totalCount' => 0],
                    'filters' => $this->filterMeta($provider),
                ],
            ]);
        }

        $params = [
            'search' => $request->query('search'),
            'game_version' => $request->query('game_version'),
            'loader' => $request->query('loader'),
            'sort' => $request->query('sort', $provider === 'modrinth' ? 'downloads' : 2),
            'page_size' => $request->query('page_size', 48),
            'index' => $request->query('index', 0),
        ];

        $search = $provider === 'modrinth'
            ? $this->modrinth->searchPlugins($params)
            : $this->curse->searchPlugins($params);

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
                'filters' => $this->filterMeta($provider),
            ],
        ]);
    }

    public function installed(Request $request, Server $server): JsonResponse
    {
        $this->authorize('file.read', $server);

        return response()->json([
            'success' => true,
            'data' => [
                'api_configured' => true,
                'curseforge_configured' => $this->curse->hasApiKey(),
                'plugins' => $this->installer->listManaged($server),
            ],
        ]);
    }

    public function show(Request $request, Server $server, string $plugin): JsonResponse
    {
        $this->authorize('file.read', $server);

        $provider = $this->normalizeProvider($request->query('provider', 'modrinth'));

        if ($provider === 'curseforge' && !$this->curse->hasApiKey()) {
            return response()->json(['success' => false, 'message' => 'API Key do CurseForge não configurada.'], 422);
        }

        $data = $provider === 'modrinth'
            ? $this->modrinth->getPlugin($plugin)
            : $this->curse->getPlugin((int) $plugin);

        if (!$data) {
            return response()->json(['success' => false, 'message' => 'Plugin não encontrado.'], 404);
        }

        $data['provider'] = $provider;

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function files(Request $request, Server $server, string $plugin): JsonResponse
    {
        $this->authorize('file.read', $server);

        $provider = $this->normalizeProvider($request->query('provider', 'modrinth'));

        if ($provider === 'curseforge' && !$this->curse->hasApiKey()) {
            return response()->json(['success' => false, 'message' => 'API Key do CurseForge não configurada.'], 422);
        }

        if ($provider === 'modrinth') {
            $files = $this->modrinth->getVersions($plugin);
        } else {
            $files = $this->curse->getFiles(
                (int) $plugin,
                (int) $request->query('index', 0),
                (int) $request->query('page_size', 50)
            );
        }

        return response()->json(['success' => true, 'data' => $files]);
    }

    public function install(Request $request, Server $server): JsonResponse
    {
        $this->authorize('file.update', $server);

        $data = $request->validate([
            'provider' => 'required|in:modrinth,curseforge',
            'plugin_id' => 'required',
            'file_id' => 'required',
        ]);

        if ($data['provider'] === 'curseforge' && !$this->curse->hasApiKey()) {
            return response()->json([
                'success' => false,
                'message' => 'Configure a API Key do CurseForge em Admin → Extensions → MC Plugins.',
            ], 422);
        }

        try {
            $result = $this->installer->install(
                $server,
                $data['provider'],
                $data['plugin_id'],
                $data['file_id'],
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
            'provider' => 'required|in:modrinth,curseforge',
            'plugin_id' => 'required',
            'file_id' => 'required',
        ]);

        if ($data['provider'] === 'curseforge' && !$this->curse->hasApiKey()) {
            return response()->json([
                'success' => false,
                'message' => 'Configure a API Key do CurseForge em Admin → Extensions → MC Plugins.',
            ], 422);
        }

        try {
            $result = $this->installer->update(
                $server,
                $data['provider'],
                $data['plugin_id'],
                $data['file_id'],
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

    private function normalizeProvider(?string $provider): string
    {
        $provider = strtolower(trim((string) $provider));

        return in_array($provider, ['modrinth', 'curseforge'], true) ? $provider : 'modrinth';
    }

    private function filterMeta(string $provider): array
    {
        return [
            'loaders' => $provider === 'modrinth'
                ? ModrinthClient::LOADERS
                : CurseForgeClient::SERVER_LOADERS,
            'sorts' => $provider === 'modrinth'
                ? ModrinthClient::SORTS
                : CurseForgeClient::SORTS,
            'page_sizes' => [24, 48],
            'providers' => [
                'modrinth' => 'Modrinth',
                'curseforge' => 'CurseForge',
            ],
            'provider' => $provider,
            'curseforge_configured' => $this->curse->hasApiKey(),
        ];
    }
}
