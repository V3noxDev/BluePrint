<?php

namespace Pterodactyl\BlueprintFramework\Extensions\minehub;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Pterodactyl\Models\Server;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;

class AddonManagerController extends Controller
{
    public function __construct(private DaemonFileRepository $fileRepository) {}

    public function catalog(Request $request, Server $server): JsonResponse
    {
        $this->authorize('file.read', $server);

        $catalog = AddonCatalogService::getCatalog();
        $installed = $this->listInstalled($server);

        $enriched = array_map(function (array $addon) use ($installed) {
            $addon['installed'] = in_array($addon['filename'] ?? '', $installed, true);

            return $addon;
        }, $catalog);

        return response()->json([
            'success' => true,
            'data' => [
                'catalog' => $enriched,
                'installed' => $installed,
                'addon_path' => AddonCatalogService::getAddonPath(),
                'modules' => AddonCatalogService::getEnabledModules(),
            ],
        ]);
    }

    public function install(Request $request, Server $server): JsonResponse
    {
        $this->authorize('file.create', $server);

        $request->validate([
            'addon_id' => 'required_without:filename|string',
            'filename' => 'required_without:addon_id|string',
            'download_url' => 'required_without:addon_id|url',
        ]);

        $addonPath = AddonCatalogService::getAddonPath();
        $filename = $request->input('filename');
        $downloadUrl = $request->input('download_url');

        if ($request->has('addon_id')) {
            $catalog = AddonCatalogService::getCatalog();
            $addon = collect($catalog)->firstWhere('id', $request->input('addon_id'));

            if (!$addon) {
                return response()->json(['success' => false, 'message' => 'Addon não encontrado no catálogo.'], 404);
            }

            $filename = $addon['filename'];
            $downloadUrl = $addon['download_url'];
        }

        if (!preg_match('/\.(jar|zip)$/i', $filename)) {
            return response()->json(['success' => false, 'message' => 'Tipo de arquivo não permitido.'], 422);
        }

        $filename = basename($filename);
        $path = rtrim($addonPath, '/') . '/' . $filename;

        try {
            $response = Http::timeout(120)->get($downloadUrl);

            if (!$response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Falha ao baixar o addon.',
                ], 502);
            }

            $this->fileRepository
                ->setServer($server)
                ->putContent($path, $response->body());

            return response()->json([
                'success' => true,
                'message' => "{$filename} instalado com sucesso.",
                'data' => ['path' => $path, 'filename' => $filename],
            ]);
        } catch (DaemonConnectionException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Não foi possível conectar ao daemon do servidor.',
            ], 502);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao instalar addon: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function remove(Request $request, Server $server, string $filename): JsonResponse
    {
        $this->authorize('file.delete', $server);

        $filename = basename($filename);
        $addonPath = AddonCatalogService::getAddonPath();
        $path = rtrim($addonPath, '/') . '/' . $filename;

        try {
            $this->fileRepository
                ->setServer($server)
                ->deleteFiles('/', [$path]);

            return response()->json([
                'success' => true,
                'message' => "{$filename} removido com sucesso.",
            ]);
        } catch (DaemonConnectionException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Não foi possível conectar ao daemon do servidor.',
            ], 502);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao remover addon.',
            ], 500);
        }
    }

    public function installed(Request $request, Server $server): JsonResponse
    {
        $this->authorize('file.read', $server);

        return response()->json([
            'success' => true,
            'data' => [
                'installed' => $this->listInstalled($server),
                'addon_path' => AddonCatalogService::getAddonPath(),
            ],
        ]);
    }

    private function listInstalled(Server $server): array
    {
        try {
            $addonPath = AddonCatalogService::getAddonPath();
            $files = $this->fileRepository
                ->setServer($server)
                ->getDirectory($addonPath);

            return collect($files)
                ->filter(function ($file) {
                    $isFile = $file['is_file'] ?? $file['file'] ?? false;
                    $name = $file['name'] ?? '';

                    return $isFile && preg_match('/\.(jar|zip)$/i', $name);
                })
                ->pluck('name')
                ->values()
                ->all();
        } catch (\Exception) {
            return [];
        }
    }
}
