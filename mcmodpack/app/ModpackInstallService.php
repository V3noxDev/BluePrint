<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcmodpack;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintExtensionLibrary as BlueprintExtensionLibrary;

class ModpackInstallService
{
    private const SMALL_FILE_LIMIT = 8388608;
    private const WRITE_TIMEOUT = 900;

    private CurseForgeClient $curse;
    private DaemonFileRepository $files;
    private BlueprintExtensionLibrary $blueprint;

    public function __construct(
        CurseForgeClient $curse,
        DaemonFileRepository $files,
        BlueprintExtensionLibrary $blueprint
    ) {
        $this->curse = $curse;
        $this->files = $files;
        $this->blueprint = $blueprint;
    }

    /**
     * @return array{modpack_id:int,file_id:int,server_pack_file_id:int,name:string,version:string,mods_downloaded:int}
     */
    public function install(
        Server $server,
        int $modpackId,
        int $fileId,
        bool $wipe = false,
        bool $acceptEula = false
    ): array {
        if (!$this->curse->hasApiKey()) {
            throw new \RuntimeException('API Key do CurseForge não configurada no admin.');
        }

        @set_time_limit(0);
        @ini_set('memory_limit', '512M');

        $modpack = $this->curse->getModpackSummary($modpackId);
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
        $this->downloadToServer($server, $downloadUrl, $archiveName);

        $this->withWingsRetry(function () use ($server, $archiveName) {
            $this->files->setServer($server)->decompressFile('/', $archiveName);
        });

        try {
            $this->files->setServer($server)->deleteFiles('/', array($archiveName));
        } catch (\Throwable $e) {
            Log::warning('[mcmodpack] não foi possível remover zip temporário');
        }

        $modsDownloaded = $this->downloadManifestMods($server);

        if ($acceptEula) {
            $this->withWingsRetry(function () use ($server) {
                $this->writeEulaAccepted($server);
            });
        }

        $installed = array(
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
        );

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

    private function downloadToServer(Server $server, string $url, string $filename, string $directory = '/'): void
    {
        $url = trim($url);
        if ($url === '') {
            throw new \RuntimeException('URL de download vazia.');
        }

        $remotePath = $this->joinPath($directory, $filename);
        $temp = tempnam(sys_get_temp_dir(), 'mcmodpack_');
        if ($temp === false) {
            throw new \RuntimeException('Não foi possível criar arquivo temporário para download.');
        }

        try {
            $response = Http::timeout(600)
                ->withOptions(array('allow_redirects' => true))
                ->withHeaders(array('User-Agent' => 'BluePrint-MCModpack/1.0'))
                ->sink($temp)
                ->get($url);

            if (!$response->successful()) {
                throw new \RuntimeException('Falha ao baixar arquivo (HTTP ' . $response->status() . ').');
            }

            $size = filesize($temp);
            if ($size === false || $size < 1) {
                throw new \RuntimeException('Download retornou arquivo vazio.');
            }

            Log::info('[mcmodpack] download via painel', array(
                'server' => $server->uuid,
                'bytes' => $size,
                'file' => $remotePath,
            ));

            $this->uploadLocalFile($server, $remotePath, $temp, $url, $directory, $filename, $size);
        } finally {
            @unlink($temp);
        }
    }

    private function uploadLocalFile(
        Server $server,
        string $remotePath,
        string $localPath,
        string $sourceUrl,
        string $directory,
        string $filename,
        int $size
    ): void {
        try {
            if ($size <= self::SMALL_FILE_LIMIT) {
                $content = file_get_contents($localPath);
                if ($content === false) {
                    throw new \RuntimeException('Falha ao ler arquivo baixado.');
                }
                $this->withWingsRetry(function () use ($server, $remotePath, $content) {
                    $this->uploadSmall($server, $remotePath, $content);
                });

                return;
            }

            $this->withWingsRetry(function () use ($server, $remotePath, $localPath) {
                $this->uploadFromPath($server, $remotePath, $localPath);
            });
        } catch (\Throwable $panelUpload) {
            Log::warning('[mcmodpack] upload via painel falhou, tentando pull Wings', array(
                'error' => $panelUpload->getMessage(),
                'file' => $remotePath,
            ));

            $this->withWingsRetry(function () use ($server, $sourceUrl, $directory, $filename) {
                $this->files->setServer($server)->pull($sourceUrl, $directory === '' ? '/' : $directory, array(
                    'filename' => $filename,
                    'foreground' => true,
                ));
            });
        }
    }

    private function uploadFromPath(Server $server, string $remotePath, string $localPath): void
    {
        if (!is_file($localPath)) {
            throw new \RuntimeException('Arquivo local não encontrado para upload.');
        }

        $size = filesize($localPath);
        if ($size === false || $size < 1) {
            throw new \RuntimeException('Arquivo local está vazio.');
        }

        $server->loadMissing('node');
        $node = $server->node;
        $remotePath = '/' . ltrim(str_replace('\\', '/', $remotePath), '/');

        $handle = fopen($localPath, 'rb');
        if ($handle === false) {
            throw new \RuntimeException('Não foi possível abrir o arquivo para upload.');
        }

        try {
            $client = new Client(array(
                'verify' => app()->environment('production'),
                'base_uri' => $node->getConnectionAddress(),
                'timeout' => self::WRITE_TIMEOUT,
                'connect_timeout' => 30,
                'headers' => array(
                    'Authorization' => 'Bearer ' . $node->getDecryptedKey(),
                    'Accept' => 'application/json',
                ),
            ));

            $response = $client->post(
                sprintf('/api/servers/%s/files/write', $server->uuid),
                array(
                    'query' => array('file' => $remotePath),
                    'body' => $handle,
                )
            );

            if ($response->getStatusCode() >= 400) {
                throw new \RuntimeException('Wings recusou o upload (HTTP ' . $response->getStatusCode() . ').');
            }

            Log::info('[mcmodpack] upload stream concluído', array(
                'server' => $server->uuid,
                'path' => $remotePath,
                'bytes' => $size,
            ));
        } catch (GuzzleException $e) {
            throw new \RuntimeException('Falha ao enviar arquivo ao Wings: ' . $e->getMessage(), 0, $e);
        } finally {
            fclose($handle);
        }
    }

    private function uploadSmall(Server $server, string $remotePath, string $content): void
    {
        $remotePath = ltrim(str_replace('\\', '/', $remotePath), '/');
        $this->files->setServer($server)->putContent($remotePath, $content);
    }

    private function downloadManifestMods(Server $server): int
    {
        $manifest = null;
        foreach (array('/manifest.json', 'manifest.json', '/modpack/manifest.json', 'modpack/manifest.json') as $path) {
            try {
                $content = $this->files->setServer($server)->getContent(ltrim($path, '/'));
                $manifest = json_decode($content, true);
                if (is_array($manifest)) {
                    break;
                }
            } catch (\Throwable $e) {
            }
        }

        if (!is_array($manifest) || empty($manifest['files']) || !is_array($manifest['files'])) {
            return 0;
        }

        try {
            $this->files->setServer($server)->createDirectory('mods', '/');
        } catch (\Throwable $e) {
        }

        $count = 0;
        foreach ($manifest['files'] as $entry) {
            if (($entry['required'] ?? true) === false) {
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
                    continue;
                }

                $fileMeta = $this->curse->getFile($projectId, $modFileId);
                $filename = basename(is_array($fileMeta) ? ($fileMeta['file_name'] ?? ('mod-' . $modFileId . '.jar')) : ('mod-' . $modFileId . '.jar'));

                $this->downloadToServer($server, $url, $filename, '/mods');
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

    private function joinPath(string $directory, string $filename): string
    {
        $dir = trim(str_replace('\\', '/', $directory), '/');
        $name = ltrim($filename, '/');

        return $dir === '' ? $name : $dir . '/' . $name;
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
                Log::warning('[mcmodpack] wings retry', array(
                    'attempt' => $i + 1,
                    'error' => $e->getMessage(),
                ));

                if ($i < $attempts - 1) {
                    usleep(800000);
                }
            }
        }

        throw $last ?? new \RuntimeException('Falha ao comunicar com o Wings.');
    }
}
