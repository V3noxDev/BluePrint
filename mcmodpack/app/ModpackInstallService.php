<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcmodpack;

use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Repositories\Wings\DaemonPowerRepository;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

class ModpackInstallService
{
    public function __construct(
        private CurseForgeClient $curse,
        private DaemonFileRepository $files,
        private DaemonPowerRepository $power,
        private BlueprintExtensionLibrary $blueprint,
    ) {}

    /**
     * @return array{modpack_id:int,file_id:int,server_pack_file_id:int,name:string,version:string,mods_downloaded:int}
     */
    public function install(
        Server $server,
        int $modpackId,
        int $fileId,
        bool $wipe = false,
        bool $acceptEula = false,
    ): array {
        if (!$this->curse->hasApiKey()) {
            throw new \RuntimeException('API Key do CurseForge não configurada no admin.');
        }

        @set_time_limit(0);

        $modpack = $this->curse->getModpack($modpackId);
        if (!$modpack) {
            throw new \RuntimeException('Modpack não encontrado na CurseForge.');
        }

        $file = $this->curse->getFile($modpackId, $fileId);
        if (!$file) {
            throw new \RuntimeException('Versão do modpack não encontrada.');
        }

        // Prefer official server pack when CurseForge provides one
        $packFileId = $fileId;
        if (!$file['is_server_pack'] && !empty($file['server_pack_file_id'])) {
            $packFileId = (int) $file['server_pack_file_id'];
        }

        $downloadUrl = $this->curse->getDownloadUrl($modpackId, $packFileId);
        if (!$downloadUrl) {
            // Fallback: try the selected client file itself
            $downloadUrl = $file['download_url'] ?: $this->curse->getDownloadUrl($modpackId, $fileId);
        }
        if (!$downloadUrl) {
            throw new \RuntimeException('CurseForge não retornou URL de download para este arquivo.');
        }

        $this->stopServer($server);

        if ($wipe) {
            $this->wipeServerFiles($server);
        }

        $archiveName = 'mcmodpack-install.zip';
        $this->files->setServer($server)->pull($downloadUrl, '/', [
            'filename' => $archiveName,
            'foreground' => true,
        ]);
        $this->files->setServer($server)->decompressFile('/', $archiveName);

        $modsDownloaded = $this->downloadManifestMods($server);

        if ($acceptEula) {
            $this->writeEulaAccepted($server);
        }

        $installed = [
            'modpack_id' => $modpackId,
            'file_id' => $fileId,
            'server_pack_file_id' => $packFileId,
            'name' => $modpack['name'],
            'version' => $file['display_name'],
            'logo' => $modpack['logo'],
            'author' => $modpack['author'],
            'summary' => $modpack['summary'],
            'loaders' => $file['loaders'] ?: $modpack['loaders'],
            'game_versions' => $file['game_versions'] ?: $modpack['game_versions'],
            'provider' => 'curseforge',
            'installed_at' => now()->toIso8601String(),
            'mods_downloaded' => $modsDownloaded,
        ];

        $this->blueprint->dbSet('mcmodpack', $this->serverKey($server), json_encode($installed));

        $this->startServer($server);

        return $installed;
    }

    public function getInstalled(Server $server): ?array
    {
        $raw = $this->blueprint->dbGet('mcmodpack', $this->serverKey($server));
        if (!$raw) {
            return null;
        }

        $data = is_string($raw) ? json_decode($raw, true) : $raw;

        return is_array($data) ? $data : null;
    }

    private function serverKey(Server $server): string
    {
        return 'installed:' . $server->uuid;
    }

    private function downloadManifestMods(Server $server): int
    {
        $manifest = null;
        foreach (['manifest.json', 'modpack/manifest.json'] as $path) {
            try {
                $content = $this->files->setServer($server)->getContent($path);
                $manifest = json_decode($content, true);
                if (is_array($manifest)) {
                    break;
                }
            } catch (\Throwable) {
                // try next path
            }
        }

        if (!is_array($manifest) || empty($manifest['files']) || !is_array($manifest['files'])) {
            return 0;
        }

        // Ensure mods directory exists
        try {
            $this->files->setServer($server)->createDirectory('mods', '/');
        } catch (\Throwable) {
            // may already exist
        }

        $count = 0;
        foreach ($manifest['files'] as $entry) {
            $required = $entry['required'] ?? true;
            if ($required === false) {
                continue;
            }

            $projectId = (int) ($entry['projectID'] ?? $entry['projectId'] ?? 0);
            $modFileId = (int) ($entry['fileID'] ?? $entry['fileId'] ?? 0);
            if ($projectId < 1 || $modFileId < 1) {
                continue;
            }

            try {
                $url = $this->curse->getDownloadUrl($projectId, $modFileId);
                if (!$url) {
                    Log::warning("[mcmodpack] sem URL para mod {$projectId}/{$modFileId}");
                    continue;
                }

                $fileMeta = $this->curse->getFile($projectId, $modFileId);
                $filename = $fileMeta['file_name'] ?? ('mod-' . $modFileId . '.jar');
                $filename = basename($filename);

                $this->files->setServer($server)->pull($url, '/mods', [
                    'filename' => $filename,
                    'foreground' => true,
                ]);
                $count++;
            } catch (\Throwable $e) {
                Log::warning('[mcmodpack] falha ao baixar mod: ' . $e->getMessage());
            }
        }

        return $count;
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

    private function stopServer(Server $server): void
    {
        try {
            $this->power->setServer($server)->send('kill');
        } catch (\Throwable) {
        }
        usleep(300000);
    }

    private function startServer(Server $server): void
    {
        try {
            $this->power->setServer($server)->send('start');
        } catch (\Throwable) {
            try {
                $this->power->setServer($server)->send('restart');
            } catch (\Throwable) {
            }
        }
    }
}
