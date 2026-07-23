<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcmodpack;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

class ModpackInstallService
{
    public function __construct(
        private CurseForgeClient $curse,
        private DaemonFileRepository $files,
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

        $packFileId = $fileId;
        if (!$file['is_server_pack'] && !empty($file['server_pack_file_id'])) {
            $packFileId = (int) $file['server_pack_file_id'];
        }

        $downloadUrl = $this->curse->getDownloadUrl($modpackId, $packFileId);
        if (!$downloadUrl) {
            $downloadUrl = $file['download_url'] ?: $this->curse->getDownloadUrl($modpackId, $fileId);
        }
        if (!$downloadUrl) {
            throw new \RuntimeException('CurseForge não retornou URL de download para este arquivo.');
        }

        if ($wipe) {
            $this->wipeServerFiles($server);
        }

        $archiveName = 'mcmodpack-install.zip';
        $this->downloadToServer($server, $downloadUrl, '/', $archiveName);

        $this->withWingsRetry(function () use ($server, $archiveName) {
            $this->files->setServer($server)->decompressFile('/', $archiveName);
        });

        $modsDownloaded = $this->downloadManifestMods($server);

        if ($acceptEula) {
            $this->withWingsRetry(function () use ($server) {
                $this->writeEulaAccepted($server);
            });
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

    private function downloadToServer(Server $server, string $url, string $directory, string $filename): void
    {
        $url = trim($url);
        if ($url === '') {
            throw new \RuntimeException('URL de download vazia.');
        }

        $temp = tempnam(sys_get_temp_dir(), 'mcmodpack_');
        if ($temp === false) {
            throw new \RuntimeException('Não foi possível criar arquivo temporário para download.');
        }

        try {
            $response = Http::timeout(600)
                ->withOptions(['allow_redirects' => true])
                ->withHeaders(['User-Agent' => 'BluePrint-MCModpack/1.0'])
                ->sink($temp)
                ->get($url);

            if (!$response->successful()) {
                throw new \RuntimeException('Falha ao baixar modpack (HTTP ' . $response->status() . ').');
            }

            $size = filesize($temp);
            if ($size === false || $size < 1) {
                throw new \RuntimeException('Download retornou arquivo vazio.');
            }

            Log::info('[mcmodpack] download via painel', [
                'server' => $server->uuid,
                'bytes' => $size,
                'file' => $filename,
            ]);

            $content = file_get_contents($temp);
            if ($content === false) {
                throw new \RuntimeException('Falha ao ler arquivo baixado.');
            }

            $path = rtrim($directory, '/') . '/' . ltrim($filename, '/');

            $this->withWingsRetry(function () use ($server, $path, $content) {
                $this->files->setServer($server)->putContent($path, $content);
            });
        } finally {
            @unlink($temp);
        }
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
            }
        }

        if (!is_array($manifest) || empty($manifest['files']) || !is_array($manifest['files'])) {
            return 0;
        }

        try {
            $this->files->setServer($server)->createDirectory('mods', '/');
        } catch (\Throwable) {
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

                $this->downloadToServer($server, $url, '/mods', $filename);
                $count++;
            } catch (\Throwable $e) {
                Log::warning('[mcmodpack] falha ao baixar mod: ' . $e->getMessage());
            }
        }

        return $count;
    }

    private function wipeServerFiles(Server $server): void
    {
        $this->withWingsRetry(function () use ($server) {
            $listing = $this->files->setServer($server)->getDirectory('/');
            $names = collect($listing)->pluck('name')->filter()->values()->all();
            if (!empty($names)) {
                $this->files->setServer($server)->deleteFiles('/', $names);
            }
        });
    }

    private function writeEulaAccepted(Server $server): void
    {
        $content = "#By changing the setting below to TRUE you are indicating your agreement to our EULA (https://aka.ms/MinecraftEULA).\n"
            . "eula=true\n";
        $this->files->setServer($server)->putContent('eula.txt', $content);
    }

    private function withWingsRetry(callable $callback, int $attempts = 3): void
    {
        $last = null;

        for ($i = 0; $i < $attempts; $i++) {
            try {
                $callback();

                return;
            } catch (\Throwable $e) {
                $last = $e;
                Log::warning('[mcmodpack] wings retry', [
                    'attempt' => $i + 1,
                    'error' => $e->getMessage(),
                ]);

                if ($i < $attempts - 1) {
                    usleep(800_000);
                }
            }
        }

        throw $last ?? new \RuntimeException('Falha ao comunicar com o Wings.');
    }
}
