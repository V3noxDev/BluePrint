<?php

namespace Pterodactyl\BlueprintFramework\Extensions\bedrockversions;

use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\EggVariable;
use Pterodactyl\Models\ServerVariable;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Repositories\Wings\DaemonPowerRepository;
use Pterodactyl\Services\Servers\ReinstallServerService;

/**
 * Installs a Bedrock Dedicated Server build for real.
 *
 * Mojang's CDN often blocks the Wings remote-download User-Agent, so the
 * reliable path on Pterodactyl is the egg install script (same as "Reinstall"):
 * it curls bedrock-server-{version}.zip with a browser UA and runs unzip -o.
 *
 * Without wipe: egg replaces package files only (worlds / configs kept via
 * the egg's own backup of server.properties, permissions, allowlist).
 * With wipe: we clear the disk first, then the egg downloads a clean pack.
 */
class BedrockInstallService
{
    public function __construct(
        private DaemonFileRepository $files,
        private DaemonPowerRepository $power,
        private ReinstallServerService $reinstaller,
    ) {}

    /**
     * @return array{method: string, version: string, wiped: bool, eula_written: bool, download_url: string}
     */
    public function install(
        Server $server,
        string $version,
        string $url,
        bool $wipe = false,
        bool $acceptEula = false,
    ): array {
        $this->stopServer($server);

        if ($wipe) {
            $this->wipeServerFiles($server);
        }

        // Egg script reads BEDROCK_VERSION to build the Mojang download URL.
        $this->updateBedrockVersionVariable($server, $version);

        // Optional — eula.txt is NOT a gate; false = server boots then stops.
        if ($acceptEula) {
            $this->writeEulaAccepted($server);
        }

        // This is the actual download: Wings runs the egg installer container,
        // which downloads bedrock-server-{version}.zip and extracts it.
        $this->reinstaller->handle($server);

        Log::info('[bedrockversions] install/reinstall disparado', [
            'server' => $server->uuid,
            'version' => $version,
            'url' => $url,
            'wipe' => $wipe,
        ]);

        return [
            'method' => 'egg_download',
            'version' => $version,
            'wiped' => $wipe,
            'eula_written' => $acceptEula,
            'download_url' => $url,
        ];
    }

    private function wipeServerFiles(Server $server): void
    {
        $listing = $this->files->setServer($server)->getDirectory('/');
        $names = collect($listing)->pluck('name')->filter()->values()->all();

        if (!empty($names)) {
            $this->files->setServer($server)->deleteFiles('/', $names);
        }
    }

    private function writeEulaAccepted(Server $server): void
    {
        $content = "#By changing the setting below to TRUE you are indicating your agreement to our EULA (https://aka.ms/MinecraftEULA).\n"
            . "eula=true\n";

        $this->files->setServer($server)->putContent('eula.txt', $content);
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

        // Refresh relation so Wings gets the new env on install.
        $server->load('variables');
    }

    private function stopServer(Server $server): void
    {
        try {
            $this->power->setServer($server)->send('kill');
        } catch (\Throwable) {
            // offline is fine
        }
    }
}
