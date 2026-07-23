<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcmodpack;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Server;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

class ModpackController extends Controller
{
    private CurseForgeClient $curse;
    private BlueprintExtensionLibrary $blueprint;

    public function __construct(CurseForgeClient $curse, BlueprintExtensionLibrary $blueprint)
    {
        $this->curse = $curse;
        $this->blueprint = $blueprint;
    }

    public function index(Request $request, Server $server): JsonResponse
    {
        try {
            $this->authorize('file.read', $server);

            $hasKey = $this->curse->hasApiKey();
            $installed = $this->readInstalled($server);

            if (!$hasKey) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'api_configured' => false,
                        'message' => 'Configure a API Key do CurseForge em Admin → Extensions → MC Modpacks.',
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
            if (!empty($search['error'])) {
                $message = $search['error'];
            } elseif (empty($search['data'])) {
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
        } catch (\Throwable $e) {
            Log::error('[mcmodpack] index failed', [
                'server' => $server->uuid ?? null,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao carregar modpacks: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(Request $request, Server $server, int $modpack): JsonResponse
    {
        try {
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
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao carregar modpack: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function files(Request $request, Server $server, int $modpack): JsonResponse
    {
        try {
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
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao carregar versões: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function installStatus(Request $request, Server $server): JsonResponse
    {
        try {
            $this->authorize('file.read', $server);

            $progress = ModpackInstallProgress::get($server);
            $payload = $progress ?? array(
                'active' => false,
                'phase' => 'idle',
                'step' => 0,
                'progress' => 0,
                'message' => 'Nenhuma instalação em andamento',
            );
            $payload['locked'] = ModpackInstallProgress::isLocked($server);

            return response()->json(array(
                'success' => true,
                'data' => $payload,
            ));
        } catch (\Throwable $e) {
            return response()->json(array(
                'success' => false,
                'message' => 'Erro ao consultar progresso: ' . $e->getMessage(),
            ), 500);
        }
    }

    public function installCancel(Request $request, Server $server): JsonResponse
    {
        $this->authorize('file.update', $server);

        try {
            /** @var ModpackInstallService $installer */
            $installer = app(ModpackInstallService::class);
            $installer->cancelAndWipe($server);

            return response()->json(array(
                'success' => true,
                'message' => 'Instalação cancelada e arquivos do servidor apagados.',
            ));
        } catch (\Throwable $e) {
            Log::error('[mcmodpack] cancel failed', array(
                'server' => $server->uuid ?? null,
                'error' => $e->getMessage(),
            ));

            return response()->json(array(
                'success' => false,
                'message' => 'Erro ao cancelar: ' . $e->getMessage(),
            ), 500);
        }
    }

    public function install(Request $request, Server $server): JsonResponse
    {
        try {
            $this->authorize('file.update', $server);

            $data = $request->validate(array(
                'modpack_id' => 'required|integer|min:1',
                'file_id' => 'required|integer|min:1',
                'wipe' => 'nullable|boolean',
                'accept_eula' => 'nullable|boolean',
            ));

            /** @var ModpackInstallService $installer */
            $installer = app(ModpackInstallService::class);

            $result = $installer->install(
                $server,
                (int) $data['modpack_id'],
                (int) $data['file_id'],
                (bool) ($data['wipe'] ?? false),
                (bool) ($data['accept_eula'] ?? false)
            );

            return response()->json(array(
                'success' => true,
                'message' => "Modpack {$result['name']} instalado com sucesso!",
                'data' => $result,
            ));
        } catch (ModpackInstallCancelledException $e) {
            return response()->json(array(
                'success' => false,
                'message' => 'Instalação cancelada. Arquivos do servidor foram apagados.',
            ), 409);
        } catch (\RuntimeException $e) {
            if (stripos($e->getMessage(), 'instalação em andamento') !== false) {
                return response()->json(array(
                    'success' => false,
                    'message' => $e->getMessage(),
                ), 409);
            }

            return response()->json(array(
                'success' => false,
                'message' => 'Erro ao instalar o modpack: ' . $e->getMessage(),
            ), 500);
        } catch (DaemonConnectionException $e) {
            ModpackInstallProgress::fail($server, 'Falha ao comunicar com o Wings.');

            return response()->json(array(
                'success' => false,
                'message' => 'Não foi possível comunicar com o Wings. Verifique se o node está online.',
            ), 502);
        } catch (\Throwable $e) {
            Log::error('[mcmodpack] install failed', array(
                'server' => $server->uuid ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ));

            return response()->json(array(
                'success' => false,
                'message' => 'Erro ao instalar o modpack: ' . $e->getMessage(),
            ), 500);
        }
    }

    private function readInstalled(Server $server): ?array
    {
        $raw = $this->blueprint->dbGet('mcmodpack', 'installed:' . $server->uuid);
        if (!$raw) {
            return null;
        }

        $data = is_string($raw) ? json_decode($raw, true) : $raw;

        return is_array($data) ? $data : null;
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
