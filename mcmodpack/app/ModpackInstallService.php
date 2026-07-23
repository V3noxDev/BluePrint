<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcmodpack;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;
use Symfony\Component\Process\Process;

class ModpackInstallService
{
    private const SMALL_FILE_LIMIT = 8388608;
    private const WINGS_TIMEOUT = 900;

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
        ignore_user_abort(true);

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

        $usedServerPack = $packFileId !== $fileId || !empty($file['is_server_pack']);

        $downloadUrl = $this->curse->fetchFreshDownloadUrl($modpackId, $packFileId);
        if (!$downloadUrl) {
            $downloadUrl = $file['download_url'] ?: $this->curse->fetchFreshDownloadUrl($modpackId, $fileId);
        }
        if (!$downloadUrl) {
            throw new \RuntimeException('CurseForge não retornou URL de download para este arquivo.');
        }

        Log::info('[mcmodpack] iniciando instalação', array(
            'server' => $server->uuid,
            'modpack_id' => $modpackId,
            'file_id' => $fileId,
            'pack_file_id' => $packFileId,
            'server_pack' => $usedServerPack,
            'wipe' => $wipe,
        ));

        if ($wipe) {
            Log::info('[mcmodpack] apagando arquivos do servidor');
            $this->wipeServerFiles($server);
        }

        $archiveName = 'mcmodpack-install.zip';
        $this->deliverArchive($server, $downloadUrl, $archiveName);

        Log::info('[mcmodpack] descompactando zip');
        try {
            $this->files->setServer($server)->decompressFile('/', $archiveName);
            Log::info('[mcmodpack] zip descompactado');
        } catch (\Throwable $e) {
            throw new \RuntimeException('Falha ao descompactar o modpack no Wings: ' . $e->getMessage(), 0, $e);
        }

        try {
            $this->files->setServer($server)->deleteFiles('/', array($archiveName));
        } catch (\Throwable $e) {
            Log::warning('[mcmodpack] não foi possível remover zip temporário');
        }

        $modsDownloaded = 0;
        if (!$usedServerPack) {
            Log::info('[mcmodpack] baixando mods do manifest.json');
            $modsDownloaded = $this->downloadManifestMods($server);
        } else {
            Log::info('[mcmodpack] server pack detectado — mods do manifest ignorados');
        }

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

        Log::info('[mcmodpack] instalação concluída', array(
            'server' => $server->uuid,
            'name' => $installed['name'],
            'mods_downloaded' => $modsDownloaded,
        ));

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

    private function deliverArchive(Server $server, string $url, string $filename, string $directory = '/'): void
    {
        try {
            Log::info('[mcmodpack] tentando download via Wings pull');
            $this->pullToServer($server, $url, $filename, $directory);

            return;
        } catch (\Throwable $pullError) {
            Log::warning('[mcmodpack] pull falhou, usando download via painel', array(
                'error' => $pullError->getMessage(),
            ));
        }

        $this->downloadViaPanel($server, $url, $filename, $directory);
    }

    private function pullToServer(Server $server, string $url, string $filename, string $directory = '/'): void
    {
        $client = $this->wingsClient($server, self::WINGS_TIMEOUT);

        $response = $client->post(
            sprintf('/api/servers/%s/files/pull', $server->uuid),
            array(
                'json' => array_filter(array(
                    'url' => trim($url),
                    'root' => $directory === '' ? '/' : $directory,
                    'file_name' => $filename,
                    'foreground' => true,
                ), function ($value) {
                    return $value !== null && $value !== '';
                }),
            )
        );

        if ($response->getStatusCode() >= 400) {
            throw new \RuntimeException('Wings recusou o pull (HTTP ' . $response->getStatusCode() . ').');
        }

        Log::info('[mcmodpack] pull concluído', array(
            'server' => $server->uuid,
            'file' => $filename,
        ));
    }

    private function downloadViaPanel(Server $server, string $url, string $filename, string $directory = '/'): void
    {
        $url = trim($url);
        if ($url === '') {
            throw new \RuntimeException('URL de download vazia.');
        }

        $remotePath = $this->wingsPath($directory, $filename);
        $temp = tempnam(sys_get_temp_dir(), 'mcmodpack_');
        if ($temp === false) {
            throw new \RuntimeException('Não foi possível criar arquivo temporário para download.');
        }

        try {
            Log::info('[mcmodpack] baixando zip via painel');
            $response = Http::timeout(self::WINGS_TIMEOUT)
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

            Log::info('[mcmodpack] upload para Wings', array(
                'server' => $server->uuid,
                'bytes' => $size,
                'file' => $remotePath,
            ));

            $this->uploadLocalFile($server, $remotePath, $temp, $size);
        } finally {
            @unlink($temp);
        }
    }

    private function uploadLocalFile(Server $server, string $remotePath, string $localPath, int $size): void
    {
        if ($size <= self::SMALL_FILE_LIMIT) {
            $content = file_get_contents($localPath);
            if ($content === false) {
                throw new \RuntimeException('Falha ao ler arquivo baixado.');
            }
            $this->files->setServer($server)->putContent($remotePath, $content);

            return;
        }

        if ($this->uploadLargeViaCurl($server, $remotePath, $localPath, $size)) {
            return;
        }

        Log::warning('[mcmodpack] curl indisponível ou falhou, tentando upload Guzzle');
        $this->uploadLargeViaGuzzle($server, $remotePath, $localPath, $size);
    }

    private function uploadLargeViaCurl(Server $server, string $remotePath, string $localPath, int $size): bool
    {
        if (!is_file($localPath)) {
            return false;
        }

        $curl = Process::findExecutable('curl');
        if ($curl === null) {
            return false;
        }

        try {
            $server->loadMissing('node');
            $node = $server->node;
            $base = rtrim($node->getConnectionAddress(), '/');
            $target = $base . sprintf(
                '/api/servers/%s/files/write?file=%s',
                $server->uuid,
                rawurlencode($remotePath)
            );

            $process = new Process(array(
                $curl,
                '-sfS',
                '-X', 'POST',
                '-H', 'Authorization: Bearer ' . $node->getDecryptedKey(),
                '-H', 'Content-Type: application/octet-stream',
                '--data-binary', '@' . $localPath,
                '--max-time', (string) self::WINGS_TIMEOUT,
                $target,
            ));
            $process->setTimeout(self::WINGS_TIMEOUT + 30);
            $process->run();

            if (!$process->isSuccessful()) {
                Log::warning('[mcmodpack] curl upload falhou', array(
                    'exit' => $process->getExitCode(),
                    'error' => trim($process->getErrorOutput() ?: $process->getOutput()),
                ));

                return false;
            }

            Log::info('[mcmodpack] upload curl concluído', array(
                'server' => $server->uuid,
                'path' => $remotePath,
                'bytes' => $size,
            ));

            return true;
        } catch (\Throwable $e) {
            Log::warning('[mcmodpack] curl upload exception: ' . $e->getMessage());

            return false;
        }
    }

    private function uploadLargeViaGuzzle(Server $server, string $remotePath, string $localPath, int $size): void
    {
        if (!is_file($localPath)) {
            throw new \RuntimeException('Arquivo local não encontrado para upload.');
        }

        try {
            $client = $this->wingsClient($server, self::WINGS_TIMEOUT);
            $response = $client->request(
                'POST',
                sprintf('/api/servers/%s/files/write', $server->uuid),
                array(
                    'query' => array('file' => $remotePath),
                    'headers' => array('Content-Type' => 'application/octet-stream'),
                    'body' => fopen($localPath, 'rb'),
                )
            );

            if ($response->getStatusCode() >= 400) {
                throw new \RuntimeException('Wings recusou o upload (HTTP ' . $response->getStatusCode() . ').');
            }

            Log::info('[mcmodpack] upload guzzle concluído', array(
                'server' => $server->uuid,
                'path' => $remotePath,
                'bytes' => $size,
            ));
        } catch (GuzzleException $e) {
            throw new \RuntimeException('Falha ao enviar arquivo ao Wings: ' . $e->getMessage(), 0, $e);
        }
    }

    private function wingsClient(Server $server, int $timeout): Client
    {
        $server->loadMissing('node');
        $node = $server->node;

        return new Client(array(
            'verify' => app()->environment('production'),
            'base_uri' => $node->getConnectionAddress(),
            'timeout' => $timeout,
            'connect_timeout' => 30,
            'headers' => array(
                'Authorization' => 'Bearer ' . $node->getDecryptedKey(),
                'Accept' => 'application/json',
            ),
        ));
    }

    private function wingsPath(string $directory, string $filename): string
    {
        $dir = trim(str_replace('\\', '/', $directory), '/');
        $name = ltrim($filename, '/');
        $path = $dir === '' ? $name : $dir . '/' . $name;

        return '/' . ltrim($path, '/');
    }

    private function downloadManifestMods(Server $server): int
    {
        $manifest = null;
        foreach (array('manifest.json', 'modpack/manifest.json') as $path) {
            try {
                $content = $this->files->setServer($server)->getContent($path);
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
        $maxMods = 100;

        foreach ($manifest['files'] as $entry) {
            if ($count >= $maxMods) {
                Log::warning('[mcmodpack] limite de mods do manifest atingido (' . $maxMods . ')');
                break;
            }

            if (($entry['required'] ?? true) === false) {
                continue;
            }

            $projectId = (int) ($entry['projectID'] ?? $entry['projectId'] ?? 0);
            $modFileId = (int) ($entry['fileID'] ?? $entry['fileId'] ?? 0);
            if ($projectId < 1 || $modFileId < 1) {
                continue;
            }

            try {
                $url = $this->curse->fetchFreshDownloadUrl($projectId, $modFileId);
                if (!$url) {
                    continue;
                }

                $fileMeta = $this->curse->getFile($projectId, $modFileId);
                $filename = basename(is_array($fileMeta) ? ($fileMeta['file_name'] ?? ('mod-' . $modFileId . '.jar')) : ('mod-' . $modFileId . '.jar'));

                $this->deliverArchive($server, $url, $filename, '/mods');
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
