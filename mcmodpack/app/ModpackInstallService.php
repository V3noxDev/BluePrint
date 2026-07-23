<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcmodpack;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;
use Symfony\Component\Process\ExecutableFinder;
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

        if (ModpackInstallProgress::isLocked($server)) {
            throw new \RuntimeException('Já existe uma instalação em andamento neste servidor.');
        }

        if (!ModpackInstallProgress::acquireLock($server)) {
            throw new \RuntimeException('Já existe uma instalação em andamento neste servidor.');
        }

        @set_time_limit(0);
        @ini_set('memory_limit', '1024M');
        ignore_user_abort(true);

        try {
            $modpack = $this->curse->getModpackSummary($modpackId);
            if (!$modpack) {
                throw new \RuntimeException('Modpack não encontrado na CurseForge.');
            }

            $file = $this->curse->getFile($modpackId, $fileId);
            if (!$file) {
                throw new \RuntimeException('Versão do modpack não encontrada.');
            }

            ModpackInstallProgress::start($server, (string) $modpack['name']);
            ModpackInstallProgress::assertNotCancelled($server);

            return $this->runInstall($server, $modpackId, $fileId, $modpack, $file, $wipe, $acceptEula);
        } catch (ModpackInstallCancelledException $e) {
            ModpackInstallProgress::cancelled($server);
            throw $e;
        } catch (\Throwable $e) {
            ModpackInstallProgress::fail($server, $e->getMessage());
            throw $e;
        }
    }

    private function runInstall(
        Server $server,
        int $modpackId,
        int $fileId,
        array $modpack,
        array $file,
        bool $wipe,
        bool $acceptEula
    ): array {
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
            ModpackInstallProgress::phase($server, 'preparing', 1, 8, 'Apagando arquivos do servidor...');
            ModpackInstallProgress::assertNotCancelled($server);
            $this->wipeServerFiles($server);
        }

        $archiveName = 'mcmodpack-install.zip';
        $this->deliverArchive($server, $downloadUrl, $archiveName, '/', true);

        ModpackInstallProgress::assertNotCancelled($server);
        ModpackInstallProgress::phase($server, 'decompressing', 2, 88, 'Descompactando modpack no servidor...');

        Log::info('[mcmodpack] descompactando zip');
        try {
            $this->files->setServer($server)->decompressFile('/', $archiveName);
            Log::info('[mcmodpack] zip descompactado');
        } catch (\Throwable $e) {
            throw new \RuntimeException('Falha ao descompactar o modpack no Wings: ' . $e->getMessage(), 0, $e);
        }

        ModpackInstallProgress::phase($server, 'finishing', 2, 94, 'Finalizando instalação...');

        try {
            $this->files->setServer($server)->deleteFiles('/', array($archiveName));
        } catch (\Throwable $e) {
            Log::warning('[mcmodpack] não foi possível remover zip temporário');
        }

        $modsDownloaded = 0;
        if (!$usedServerPack) {
            ModpackInstallProgress::phase($server, 'finishing', 2, 96, 'Baixando mods do manifest...');
            $modsDownloaded = $this->downloadManifestMods($server);
        } else {
            Log::info('[mcmodpack] server pack detectado — mods do manifest ignorados');
        }

        ModpackInstallProgress::assertNotCancelled($server);

        if ($acceptEula) {
            $this->files->setServer($server)->putContent('eula.txt', "#By changing the setting below to TRUE you are indicating your agreement to our EULA (https://aka.ms/MinecraftEULA).\n"
                . "eula=true\n");
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

        ModpackInstallProgress::complete($server, "Modpack {$modpack['name']} instalado com sucesso!");

        Log::info('[mcmodpack] instalação concluída', array(
            'server' => $server->uuid,
            'name' => $installed['name'],
            'mods_downloaded' => $modsDownloaded,
        ));

        return $installed;
    }

    public function cancelAndWipe(Server $server): void
    {
        ModpackInstallProgress::requestCancel($server);

        try {
            $this->wipeServerFiles($server);
        } catch (\Throwable $e) {
            Log::warning('[mcmodpack] falha ao apagar arquivos no cancelamento: ' . $e->getMessage());
        }

        ModpackInstallProgress::cancelled($server);
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

    /**
     * @param bool $tryPull Tenta pull Wings antes do download via painel (desligado para mods pequenos)
     */
    private function deliverArchive(
        Server $server,
        string $url,
        string $filename,
        string $directory = '/',
        bool $tryPull = false
    ): void {
        ModpackInstallProgress::phase($server, 'downloading', 1, 10, 'Baixando modpack...');

        if ($tryPull) {
            try {
                Log::info('[mcmodpack] tentando download via Wings pull');
                ModpackInstallProgress::phase($server, 'downloading', 1, 15, 'Baixando via Wings...');
                $this->pullToServer($server, $url, $filename, $directory);
                ModpackInstallProgress::phase($server, 'downloading', 1, 82, 'Download concluído via Wings');

                return;
            } catch (\Throwable $pullError) {
                Log::warning('[mcmodpack] pull falhou, usando download via painel', array(
                    'error' => $pullError->getMessage(),
                ));
            }
        }

        ModpackInstallProgress::assertNotCancelled($server);
        $this->downloadViaPanel($server, $url, $filename, $directory);
    }

    private function pullToServer(Server $server, string $url, string $filename, string $directory = '/'): void
    {
        ModpackInstallProgress::assertNotCancelled($server);

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
            ModpackInstallProgress::phase($server, 'downloading', 1, 12, 'Baixando da CurseForge...');
            Log::info('[mcmodpack] baixando via painel');

            $response = Http::timeout(self::WINGS_TIMEOUT)
                ->withOptions(array(
                    'allow_redirects' => true,
                    'sink' => $temp,
                    'progress' => function ($downloadTotal, $downloadedBytes) use ($server) {
                        ModpackInstallProgress::assertNotCancelled($server);
                        if ($downloadTotal > 0) {
                            $ratio = $downloadedBytes / $downloadTotal;
                            $pct = 12 + (int) floor($ratio * 38);
                            ModpackInstallProgress::update($server, array(
                                'phase' => 'downloading',
                                'step' => 1,
                                'progress' => $pct,
                                'message' => 'Baixando... ' . $this->formatBytes((int) $downloadedBytes)
                                    . ' / ' . $this->formatBytes((int) $downloadTotal),
                                'bytes_done' => (int) $downloadedBytes,
                                'bytes_total' => (int) $downloadTotal,
                            ));
                        }
                    },
                ))
                ->withHeaders(array('User-Agent' => 'BluePrint-MCModpack/1.0'))
                ->get($url);

            if (!$response->successful()) {
                throw new \RuntimeException('Falha ao baixar arquivo (HTTP ' . $response->status() . ').');
            }

            $size = filesize($temp);
            if ($size === false || $size < 1) {
                throw new \RuntimeException('Download retornou arquivo vazio.');
            }

            $free = @disk_free_space(sys_get_temp_dir());
            if ($free !== false && $free < 52428800) {
                Log::warning('[mcmodpack] pouco espaço em disco no temp: ' . $this->formatBytes((int) $free));
            }

            ModpackInstallProgress::assertNotCancelled($server);
            ModpackInstallProgress::phase($server, 'uploading', 1, 55, 'Enviando para o servidor...', array(
                'bytes_done' => 0,
                'bytes_total' => $size,
            ));

            Log::info('[mcmodpack] upload para Wings', array(
                'server' => $server->uuid,
                'bytes' => $size,
                'file' => $remotePath,
            ));

            $this->uploadLocalFile($server, $remotePath, $temp, $size);
            ModpackInstallProgress::phase($server, 'uploading', 1, 82, 'Arquivo enviado ao servidor', array(
                'bytes_done' => $size,
                'bytes_total' => $size,
            ));
        } finally {
            @unlink($temp);
        }
    }

    private function uploadLocalFile(Server $server, string $remotePath, string $localPath, int $size): void
    {
        ModpackInstallProgress::assertNotCancelled($server);

        if ($size <= self::SMALL_FILE_LIMIT) {
            $content = file_get_contents($localPath);
            if ($content === false) {
                throw new \RuntimeException('Falha ao ler arquivo baixado.');
            }
            $this->files->setServer($server)->putContent($this->normalizePath($remotePath), $content);

            return;
        }

        if (!$this->uploadLargeViaCurl($server, $remotePath, $localPath, $size)) {
            throw new \RuntimeException(
                'Falha ao enviar arquivo ao Wings. Verifique se curl está instalado no servidor PHP e se o node está online.'
            );
        }
    }

    private function findCurlBinary(): ?string
    {
        foreach (array('/usr/bin/curl', '/bin/curl') as $path) {
            if (@is_executable($path)) {
                return $path;
            }
        }

        if (class_exists(ExecutableFinder::class)) {
            try {
                $found = (new ExecutableFinder())->find('curl');
                if (is_string($found) && $found !== '' && @is_executable($found)) {
                    return $found;
                }
            } catch (\Throwable $e) {
            }
        }

        $which = trim((string) @shell_exec('command -v curl 2>/dev/null'));
        if ($which !== '' && @is_executable($which)) {
            return $which;
        }

        return null;
    }

    private function uploadLargeViaCurl(Server $server, string $remotePath, string $localPath, int $size): bool
    {
        if (!is_file($localPath)) {
            return false;
        }

        $curl = $this->findCurlBinary();
        if ($curl === null) {
            Log::warning('[mcmodpack] curl não encontrado no sistema');

            return false;
        }

        try {
            ModpackInstallProgress::assertNotCancelled($server);

            $server->loadMissing('node');
            $node = $server->node;
            $base = rtrim($node->getConnectionAddress(), '/');
            $target = $base . sprintf(
                '/api/servers/%s/files/write?file=%s',
                $server->uuid,
                rawurlencode($this->normalizePath($remotePath))
            );

            ModpackInstallProgress::phase($server, 'uploading', 1, 58, 'Enviando ' . $this->formatBytes($size) . '...', array(
                'bytes_done' => 0,
                'bytes_total' => $size,
            ));

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
            $process->setTimeout(self::WINGS_TIMEOUT + 60);
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

    private function normalizePath(string $path): string
    {
        return ltrim(str_replace('\\', '/', $path), '/');
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
        $total = min($maxMods, count($manifest['files']));

        foreach ($manifest['files'] as $entry) {
            ModpackInstallProgress::assertNotCancelled($server);

            if ($count >= $maxMods) {
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

                ModpackInstallProgress::phase($server, 'finishing', 2, 96 + (int) floor(($count / max(1, $total)) * 3), 'Baixando mod ' . ($count + 1) . '...');
                $this->deliverArchive($server, $url, $filename, '/mods', false);
                $count++;
            } catch (\Throwable $e) {
                Log::warning('[mcmodpack] falha ao baixar mod: ' . $e->getMessage());
            }
        }

        return $count;
    }

    public function wipeServerFiles(Server $server): void
    {
        try {
            $listing = $this->files->setServer($server)->getDirectory('/');
            $names = collect($listing)->pluck('name')->filter()->values()->all();
            if (!empty($names)) {
                $this->files->setServer($server)->deleteFiles('/', $names);
            }
        } catch (\Throwable $e) {
            throw new \RuntimeException('Falha ao apagar arquivos do servidor: ' . $e->getMessage(), 0, $e);
        }
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes < 1024) {
            return $bytes . ' B';
        }
        if ($bytes < 1048576) {
            return round($bytes / 1024, 1) . ' KB';
        }
        if ($bytes < 1073741824) {
            return round($bytes / 1048576, 1) . ' MB';
        }

        return round($bytes / 1073741824, 2) . ' GB';
    }
}
