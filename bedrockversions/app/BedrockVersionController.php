<?php

namespace Pterodactyl\BlueprintFramework\Extensions\bedrockversions;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\EggVariable;
use Pterodactyl\Models\ServerVariable;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Repositories\Wings\DaemonPowerRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

class BedrockVersionController extends Controller
{
    public function __construct(
        private BedrockVersionService $versions,
        private BedrockServerDetector $detector,
        private DaemonFileRepository $files,
        private DaemonPowerRepository $power,
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
                'chest_icon' => '/extensions/bedrockversions/chest-face.svg',
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
            'accept_eula' => 'required|accepted',
            'restart' => 'nullable|boolean',
        ]);

        $version = $data['version'];
        $channel = $data['channel'];
        $wipe = (bool) ($data['wipe'] ?? false);
        $restart = (bool) ($data['restart'] ?? true);

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
            if ($wipe) {
                $this->wipeServerFiles($server);
            }

            $this->updateBedrockVersionVariable($server, $version);

            if ($restart) {
                try {
                    $this->power->setServer($server)->send('restart');
                } catch (\Throwable) {
                    // ok se o servidor estiver offline
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Bedrock {$version} instalado com sucesso!",
                'data' => [
                    'version' => $version,
                    'channel' => $channel,
                    'download_url' => $url,
                    'wiped' => $wipe,
                ],
            ]);
        } catch (DaemonConnectionException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Não foi possível conectar ao daemon do servidor.',
            ], 502);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao instalar versão: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function updateBedrockVersionVariable(Server $server, string $version): void
    {
        $eggVariable = EggVariable::query()
            ->where('egg_id', $server->egg_id)
            ->where('env_variable', 'BEDROCK_VERSION')
            ->first();

        if (!$eggVariable) {
            throw new \RuntimeException(
                'A variável BEDROCK_VERSION não existe neste egg. Adicione-a ao egg Bedrock.'
            );
        }

        ServerVariable::query()->updateOrCreate(
            [
                'server_id' => $server->id,
                'variable_id' => $eggVariable->id,
            ],
            [
                'variable_value' => $version,
            ]
        );
    }

    private function wipeServerFiles(Server $server): void
    {
        $listing = $this->files->setServer($server)->getDirectory('/');
        $names = collect($listing)->pluck('name')->filter()->values()->all();

        if (!empty($names)) {
            $this->files->setServer($server)->deleteFiles('/', $names);
        }
    }
}
