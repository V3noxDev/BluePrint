<?php

namespace Pterodactyl\BlueprintFramework\Extensions\bedrockversions;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Models\Server;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

class BedrockVersionController extends Controller
{
    public function __construct(
        private BedrockVersionService $versions,
        private BedrockServerDetector $detector,
        private BedrockInstallService $installer,
    ) {}

    public function index(Request $request, Server $server): JsonResponse
    {
        $this->authorize('startup.read', $server);

        if (!$this->detector->isBedrockServer($server)) {
            return response()->json([
                'success' => false,
                'message' => 'Este servidor não parece ser um Bedrock Dedicated Server.',
                'data' => ['is_bedrock' => false],
            ], 422);
        }

        $catalog = $this->versions->syncFromApi(false);
        $current = $this->detector->getCurrentVersion($server);
        $meta = $current ? $this->detector->findBuildMeta($current, $catalog) : null;
        $channel = $meta['channel'] ?? 'stable';
        $latest = $channel === 'preview'
            ? ($catalog['latest_preview'] ?? null)
            : ($catalog['latest_stable'] ?? null);
        $outdated = $current && $latest && version_compare($current, $latest, '<');

        return response()->json([
            'success' => true,
            'data' => [
                'is_bedrock' => true,
                'current_version' => $current,
                'current_group' => $meta['group'] ?? null,
                'current_build' => $meta['build'] ?? null,
                'current_channel' => $channel,
                'latest_for_channel' => $latest,
                'outdated' => $outdated,
                'software' => $catalog['software'],
                'release' => $catalog['release'],
                'preview' => $catalog['preview'],
                'latest_stable' => $catalog['latest_stable'],
                'latest_preview' => $catalog['latest_preview'],
                'last_sync' => $catalog['last_sync'],
                'chest_icon' => '/extensions/bedrockversions/chest-face.png',
            ],
        ]);
    }

    public function sync(Request $request, Server $server): JsonResponse
    {
        $this->authorize('startup.read', $server);

        $catalog = $this->versions->syncFromApi(true);

        return response()->json([
            'success' => true,
            'message' => 'Versões sincronizadas com a API.',
            'data' => $catalog,
        ]);
    }

    public function install(Request $request, Server $server): JsonResponse
    {
        $this->authorize('startup.update', $server);

        if (!$this->detector->isBedrockServer($server)) {
            return response()->json([
                'success' => false,
                'message' => 'Este servidor não é um Bedrock Dedicated Server.',
            ], 422);
        }

        $data = $request->validate([
            'channel' => 'required|in:stable,preview',
            'version' => 'required|string|max:64',
            'wipe' => 'nullable|boolean',
            'accept_eula' => 'nullable|boolean',
            'restart' => 'nullable|boolean',
        ]);

        $version = $data['version'];
        $channel = $data['channel'];
        $wipe = (bool) ($data['wipe'] ?? false);
        $acceptEula = (bool) ($data['accept_eula'] ?? false);

        $record = $this->versions->findVersion($channel, $version);
        if (!$record && !preg_match('/^[0-9]+(?:\.[0-9]+){2,}$/', $version)) {
            return response()->json([
                'success' => false,
                'message' => 'Versão inválida ou indisponível.',
            ], 422);
        }

        $url = $this->versions->buildDownloadUrl($channel, $version);
        if (!$this->versions->isDownloadAvailable($url)) {
            return response()->json([
                'success' => false,
                'message' => 'Esta versão não está disponível para download no momento.',
            ], 404);
        }

        try {
            $result = $this->installer->install(
                $server,
                $version,
                $url,
                $wipe,
                $acceptEula,
            );

            return response()->json([
                'success' => true,
                'message' => "Baixando Bedrock {$version}… acompanhe o progresso na aba Console / instalação do servidor.",
                'data' => [
                    'version' => $version,
                    'channel' => $channel,
                    'download_url' => $url,
                    'method' => $result['method'],
                    'wiped' => $result['wiped'],
                    'eula_written' => $result['eula_written'],
                ],
            ], 202);
        } catch (DaemonConnectionException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Não foi possível conectar ao daemon do servidor.',
            ], 502);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao instalar a versão: ' . $e->getMessage(),
            ], 500);
        }
    }
}
