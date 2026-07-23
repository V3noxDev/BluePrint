<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcplugins;

use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Repositories\Wings\DaemonPowerRepository;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

class PluginInstallService
{
    public const PLUGINS_DIR = '/plugins';
    private const PULL_TIMEOUT = 300;
    private const DOWNLOAD_TIMEOUT = 180;
    private const MAX_PUT_BYTES = 33554432;

    public function __construct(
        private CurseForgeClient $curse,
        private ModrinthClient $modrinth,
        private HangarClient $hangar,
        private SpigotClient $spigot,
        private PluginIdentifyService $identify,
        private DaemonFileRepository $files,
        private DaemonPowerRepository $power,
        private BlueprintExtensionLibrary $blueprint,
    ) {}

    public function install(Server $server, string $provider, string|int $pluginId, string|int $fileId): array
    {
        $provider = strtolower($provider);
        $plugin = $this->fetchPlugin($provider, $pluginId);
        if (!$plugin) {
            throw new \RuntimeException('Plugin não encontrado.');
        }

        [$url, $filename, $file] = $this->resolveDownload($provider, $pluginId, $fileId);
        if (!$url) {
            throw new \RuntimeException('Não foi possível obter a URL de download.');
        }

        if (!str_ends_with(strtolower($filename), '.jar')) {
            $filename .= '.jar';
        }

        $this->ensurePluginsDir($server);
        $this->stopServer($server);

        $existing = $this->findInstalledByPluginId($server, $provider, $pluginId);
        if ($existing && ($existing['file_name'] ?? '') !== $filename) {
            $this->deletePluginFile($server, $existing['file_name']);
        }

        $this->deliverPlugin($server, $url, $filename);

        $record = [
            'provider' => $provider,
            'plugin_id' => $pluginId,
            'file_id' => $fileId,
            'name' => $plugin['name'],
            'version' => $file['display_name'],
            'file_name' => $filename,
            'logo' => $plugin['logo'],
            'author' => $plugin['author'],
            'summary' => $plugin['summary'],
            'loaders' => $file['loaders'] ?: $plugin['loaders'],
            'game_versions' => $file['game_versions'] ?: $plugin['game_versions'],
            'installed_at' => now()->toIso8601String(),
        ];

        $this->saveInstalledRecord($server, $filename, $record);
        $this->startServer($server);

        return $record;
    }

  /**
   * @return array{0: ?string, 1: string, 2: array}
   */
    private function resolveDownload(string $provider, string|int $pluginId, string|int $fileId): array
    {
        return match ($provider) {
            'modrinth' => $this->resolveModrinthDownload($fileId),
            'hangar' => $this->resolveHangarDownload((string) $pluginId, (string) $fileId),
            'spigot' => $this->resolveSpigotDownload((int) $pluginId, (int) $fileId),
            default => $this->resolveCurseForgeDownload((int) $pluginId, (int) $fileId),
        };
    }

  /**
   * @return array{0: ?string, 1: string, 2: array}
   */
    private function resolveModrinthDownload(string|int $fileId): array
    {
        $file = $this->modrinth->getVersion((string) $fileId);
        if (!$file) {
            throw new \RuntimeException('Versão do plugin não encontrada no Modrinth.');
        }

        return [
            $file['download_url'] ?? null,
            basename($file['file_name'] ?: 'plugin.jar'),
            $file,
        ];
    }

  /**
   * @return array{0: ?string, 1: string, 2: array}
   */
    private function resolveHangarDownload(string $pluginId, string $versionName): array
    {
        $file = $this->hangar->getVersion($pluginId, $versionName);
        if (!$file) {
            throw new \RuntimeException('Versão do plugin não encontrada no Hangar.');
        }

        return [
            $file['download_url'] ?? null,
            basename($file['file_name'] ?: 'plugin.jar'),
            $file,
        ];
    }

  /**
   * @return array{0: ?string, 1: string, 2: array}
   */
    private function resolveSpigotDownload(int $pluginId, int $fileId): array
    {
        $file = $this->spigot->getVersion($pluginId, $fileId);
        if (!$file) {
            throw new \RuntimeException('Versão do plugin não encontrada no SpigotMC.');
        }

        return [
            $this->spigot->getDownloadUrl($pluginId, $fileId),
            basename($file['file_name'] ?: 'plugin.jar'),
            $file,
        ];
    }

  /**
   * @return array{0: ?string, 1: string, 2: array}
   */
    private function resolveCurseForgeDownload(int $pluginId, int $fileId): array
    {
        if (!$this->curse->hasApiKey()) {
            throw new \RuntimeException('API Key do CurseForge não configurada.');
        }

        $file = $this->curse->getFile($pluginId, $fileId);
        if (!$file) {
            throw new \RuntimeException('Versão do plugin não encontrada no CurseForge.');
        }

        return [
            $this->curse->getDownloadUrl($pluginId, $fileId) ?: ($file['download_url'] ?? null),
            basename($file['file_name'] ?: 'plugin-' . $fileId . '.jar'),
            $file,
        ];
    }

    private function fetchPlugin(string $provider, string|int $pluginId): ?array
    {
        return match ($provider) {
            'modrinth' => $this->modrinth->getPlugin((string) $pluginId),
            'hangar' => $this->hangar->getPlugin((string) $pluginId),
            'spigot' => $this->spigot->getPlugin((int) $pluginId),
            default => $this->curse->getPlugin((int) $pluginId),
        };
    }

    private function deliverPlugin(Server $server, string $url, string $filename): void
    {
        $url = trim($url);
        if ($url === '') {
            throw new \RuntimeException('URL de download vazia.');
        }

        try {
            $this->pullFromWings($server, $url, $filename);
            Log::info('[mcplugins] plugin entregue via Wings pull', array(
                'server' => $server->uuid,
                'file' => $filename,
            ));

            return;
        } catch (\Throwable $pullError) {
            Log::warning('[mcplugins] pull remoto falhou, usando download via painel', array(
                'server' => $server->uuid,
                'file' => $filename,
                'error' => $pullError->getMessage(),
            ));
        }

        $this->downloadViaPanel($server, $url, $filename);
    }

    private function pullFromWings(Server $server, string $url, string $filename): void
    {
        try {
            $response = $this->files->setServer($server)->getHttpClient()->post(
                sprintf('/api/servers/%s/files/pull', $server->uuid),
                array(
                    'json' => array_filter(array(
                        'url' => $url,
                        'root' => self::PLUGINS_DIR,
                        'file_name' => basename($filename),
                        'foreground' => true,
                    ), function ($value) {
                        return $value !== null && $value !== '';
                    }),
                    'timeout' => self::PULL_TIMEOUT,
                    'connect_timeout' => 30,
                )
            );

            if ($response->getStatusCode() >= 400) {
                throw new \RuntimeException('Wings recusou pull remoto (HTTP ' . $response->getStatusCode() . ').');
            }
        } catch (RequestException $e) {
            $detail = $e->getMessage();
            if ($e->hasResponse()) {
                $body = trim((string) $e->getResponse()->getBody());
                if ($body !== '') {
                    $detail = $body;
                }
            }

            if (stripos($detail, 'disable_remote_download') !== false) {
                throw new \RuntimeException('Pull remoto desativado no Wings (api.disable_remote_download).');
            }

            throw new \RuntimeException('Wings pull falhou: ' . $detail, 0, $e);
        }
    }

    private function downloadViaPanel(Server $server, string $url, string $filename): void
    {
        Log::info('[mcplugins] baixando plugin via painel', array(
            'server' => $server->uuid,
            'file' => $filename,
        ));

        $response = Http::timeout(self::DOWNLOAD_TIMEOUT)
            ->withOptions(array(
                'allow_redirects' => true,
            ))
            ->withHeaders(array(
                'User-Agent' => 'BluePrint-MCPlugins/1.0',
                'Accept' => '*/*',
            ))
            ->get($url);

        if (!$response->successful()) {
            throw new \RuntimeException('Falha ao baixar plugin (HTTP ' . $response->status() . ').');
        }

        $body = $response->body();
        $size = strlen($body);
        if ($size < 100) {
            throw new \RuntimeException('Download retornou arquivo vazio ou inválido.');
        }

        if ($size > self::MAX_PUT_BYTES) {
            throw new \RuntimeException(
                'Plugin muito grande (' . $this->formatBytes($size) . '). '
                . 'Ative api.disable_remote_download: false no Wings ou aumente api.upload_limit.'
            );
        }

        $path = 'plugins/' . basename($filename);
        $this->files->setServer($server)->putContent($path, $body);

        Log::info('[mcplugins] plugin enviado via painel', array(
            'server' => $server->uuid,
            'file' => $path,
            'bytes' => $size,
        ));
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes < 1024) {
            return $bytes . ' B';
        }
        if ($bytes < 1048576) {
            return round($bytes / 1024, 1) . ' KB';
        }

        return round($bytes / 1048576, 1) . ' MB';
    }

    public function update(Server $server, string $provider, string|int $pluginId, string|int $fileId): array
    {
        return $this->install($server, $provider, $pluginId, $fileId);
    }

    public function remove(Server $server, string $fileName): void
    {
        $this->stopServer($server);
        $this->deletePluginFile($server, $fileName);
        $this->removeInstalledRecord($server, $fileName);
        $this->startServer($server);
    }

    public function listManaged(Server $server): array
    {
        return $this->buildManagedList($server, sync: false);
    }

    public function syncManaged(Server $server): array
    {
        return $this->buildManagedList($server, sync: true);
    }

    private function buildManagedList(Server $server, bool $sync): array
    {
        $meta = $this->getAllInstalledMeta($server);
        $diskFiles = $this->listPluginJars($server);
        $items = [];
        $identified = 0;
        $enriched = 0;

        foreach ($diskFiles as $fileName) {
            $record = $meta[$fileName] ?? null;

            if ($sync && !$record && $identified < 15) {
                $record = $this->identify->identify($fileName);
                if ($record) {
                    $this->saveInstalledRecord($server, $fileName, $record);
                    $meta[$fileName] = $record;
                    $identified++;
                }
            }

            $latestFileId = null;
            $latestVersion = null;
            $updateAvailable = false;

            if ($sync && $record && !empty($record['plugin_id'])) {
                $provider = (string) ($record['provider'] ?? 'spigot');
                if (empty($record['logo']) && $enriched < 20) {
                    $record = $this->enrichRecord($provider, $record);
                    if (!empty($record['logo'])) {
                        $this->saveInstalledRecord($server, $fileName, $record);
                        $meta[$fileName] = $record;
                    }
                    $enriched++;
                }

                $update = $this->checkUpdate(
                    $provider,
                    $record['plugin_id'],
                    $record['file_id'] ?? null,
                    $record['version'] ?? null,
                );
                if ($update) {
                    $updateAvailable = (bool) ($update['available'] ?? false);
                    $latestFileId = $update['latest_file_id'] ?? null;
                    $latestVersion = $update['latest_version'] ?? null;
                }
            }

            $items[] = [
                'file_name' => $fileName,
                'name' => $record['name'] ?? $this->guessNameFromFile($fileName),
                'version' => $record['version'] ?? $this->guessVersionFromFileName($fileName),
                'provider' => $record['provider'] ?? null,
                'plugin_id' => $record['plugin_id'] ?? null,
                'file_id' => $record['file_id'] ?? null,
                'logo' => $record['logo'] ?? null,
                'installed_at' => $record['installed_at'] ?? null,
                'tracked' => $record !== null && !empty($record['plugin_id']),
                'update_available' => $updateAvailable,
                'latest_file_id' => $latestFileId,
                'latest_version' => $latestVersion,
            ];
        }

        usort($items, fn ($a, $b) => strcasecmp($a['name'], $b['name']));

        return $items;
    }

    private function enrichRecord(string $provider, array $record): array
    {
        if (!empty($record['logo'])) {
            return $record;
        }

        $plugin = $this->fetchPlugin($provider, $record['plugin_id']);
        if ($plugin) {
            $record['logo'] = $plugin['logo'] ?? null;
            $record['name'] = $record['name'] ?: ($plugin['name'] ?? $record['name']);
            $record['summary'] = $record['summary'] ?: ($plugin['summary'] ?? '');
        }

        return $record;
    }

  /**
   * @return array{available: bool, latest_file_id?: string|int, latest_version?: string}|null
   */
    private function checkUpdate(
        string $provider,
        string|int $pluginId,
        string|int|null $currentFileId,
        ?string $currentVersion = null,
    ): ?array {
        try {
            if ($provider === 'modrinth') {
                $versions = $this->modrinth->getVersions((string) $pluginId);
                $latest = $versions['data'][0] ?? null;
                if (!$latest) {
                    return null;
                }
                $latestName = (string) ($latest['display_name'] ?? $latest['id']);
                if ($currentFileId && (string) $latest['id'] === (string) $currentFileId) {
                    return ['available' => false, 'latest_version' => $latestName];
                }
                if (!$currentFileId && $currentVersion && $this->versionsMatch($currentVersion, $latestName)) {
                    return ['available' => false, 'latest_version' => $latestName];
                }

                return [
                    'available' => true,
                    'latest_file_id' => $latest['id'],
                    'latest_version' => $latestName,
                ];
            }

            if ($provider === 'hangar') {
                $versions = $this->hangar->getVersions((string) $pluginId);
                $latest = $versions['data'][0] ?? null;
                if (!$latest) {
                    return null;
                }
                $latestName = (string) ($latest['display_name'] ?? $latest['id']);
                if ($currentFileId && (string) $latest['id'] === (string) $currentFileId) {
                    return ['available' => false, 'latest_version' => $latestName];
                }
                if (!$currentFileId && $currentVersion && $this->versionsMatch($currentVersion, $latestName)) {
                    return ['available' => false, 'latest_version' => $latestName];
                }

                return [
                    'available' => true,
                    'latest_file_id' => $latest['id'],
                    'latest_version' => $latestName,
                ];
            }

            if ($provider === 'spigot') {
                $versions = $this->spigot->getVersions((int) $pluginId);
                $latest = $versions['data'][0] ?? null;
                if (!$latest) {
                    return null;
                }
                $latestName = (string) ($latest['display_name'] ?? $latest['id']);
                if ($currentFileId && (string) $latest['id'] === (string) $currentFileId) {
                    return ['available' => false, 'latest_version' => $latestName];
                }
                if (!$currentFileId && $currentVersion && $this->versionsMatch($currentVersion, $latestName)) {
                    return ['available' => false, 'latest_version' => $latestName];
                }

                return [
                    'available' => true,
                    'latest_file_id' => $latest['id'],
                    'latest_version' => $latestName,
                ];
            }

            if (!$this->curse->hasApiKey()) {
                return null;
            }

            $plugin = $this->curse->getPlugin((int) $pluginId);
            if ($plugin && !empty($plugin['main_file_id'])) {
                $latestFileId = (int) $plugin['main_file_id'];
                $latestFile = $this->curse->getFile((int) $pluginId, $latestFileId);
                $latestName = (string) ($latestFile['display_name'] ?? $latestFileId);
                if ($latestFileId > 0 && (string) $latestFileId !== (string) $currentFileId) {
                    return [
                        'available' => true,
                        'latest_file_id' => $latestFileId,
                        'latest_version' => $latestName,
                    ];
                }

                return ['available' => false, 'latest_version' => $latestName];
            }
        } catch (\Throwable $e) {
            Log::debug('[mcplugins] checkUpdate: ' . $e->getMessage());
        }

        return null;
    }

    private function versionsMatch(string $current, string $latest): bool
    {
        $a = strtolower(preg_replace('/[^a-z0-9.]+/i', '', $current) ?? '');
        $b = strtolower(preg_replace('/[^a-z0-9.]+/i', '', $latest) ?? '');

        return $a !== '' && ($a === $b || str_contains($b, $a) || str_contains($a, $b));
    }

    private function guessVersionFromFileName(string $fileName): ?string
    {
        if (preg_match('/(\d+\.\d+(?:\.\d+)*(?:[-.][\w]+)?)/', pathinfo($fileName, PATHINFO_FILENAME), $m)) {
            return $m[1];
        }

        return null;
    }

    private function listPluginJars(Server $server): array
    {
        try {
            $listing = $this->files->setServer($server)->getDirectory(self::PLUGINS_DIR);
        } catch (\Throwable) {
            return [];
        }

        return collect($listing)
            ->filter(fn ($e) => !($e['directory'] ?? false))
            ->pluck('name')
            ->filter(fn ($n) => str_ends_with(strtolower((string) $n), '.jar'))
            ->values()
            ->all();
    }

    private function ensurePluginsDir(Server $server): void
    {
        try {
            $this->files->setServer($server)->createDirectory('plugins', '/');
        } catch (\Throwable) {
            // já existe
        }
    }

    private function deletePluginFile(Server $server, string $fileName): void
    {
        $this->files->setServer($server)->deleteFiles(self::PLUGINS_DIR, [basename($fileName)]);
    }

    private function metaKey(Server $server): string
    {
        return 'installed_map:' . $server->uuid;
    }

    private const META_FILE = '/plugins/.mcplugins-meta.json';

    private function getAllInstalledMeta(Server $server): array
    {
        $db = [];
        $raw = $this->blueprint->dbGet('mcplugins', $this->metaKey($server));
        if ($raw) {
            $db = is_string($raw) ? json_decode($raw, true) : $raw;
            $db = is_array($db) ? $db : [];
        }

        $file = $this->getFileMeta($server);

        return array_merge($file, $db);
    }

    private function getFileMeta(Server $server): array
    {
        try {
            $raw = $this->files->setServer($server)->getContent(self::META_FILE);
            $data = json_decode($raw, true);

            return is_array($data) ? $data : [];
        } catch (\Throwable) {
            return [];
        }
    }

    private function saveInstalledRecord(Server $server, string $fileName, array $record): void
    {
        $key = basename($fileName);
        $map = $this->getAllInstalledMeta($server);
        $map[$key] = $record;

        $this->blueprint->dbSet('mcplugins', $this->metaKey($server), json_encode($map));

        try {
            $this->files->setServer($server)->putContent(
                self::META_FILE,
                json_encode($map, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
            );
        } catch (\Throwable $e) {
            Log::debug('[mcplugins] meta file write: ' . $e->getMessage());
        }
    }

    private function removeInstalledRecord(Server $server, string $fileName): void
    {
        $key = basename($fileName);
        $map = $this->getAllInstalledMeta($server);
        unset($map[$key]);

        $this->blueprint->dbSet('mcplugins', $this->metaKey($server), json_encode($map));

        try {
            $this->files->setServer($server)->putContent(
                self::META_FILE,
                json_encode($map, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
            );
        } catch (\Throwable) {
            // opcional
        }
    }

    private function findInstalledByPluginId(Server $server, string $provider, string|int $pluginId): ?array
    {
        foreach ($this->getAllInstalledMeta($server) as $fileName => $record) {
            $sameProvider = ($record['provider'] ?? 'curseforge') === $provider;
            if ($sameProvider && (string) ($record['plugin_id'] ?? '') === (string) $pluginId) {
                $record['file_name'] = $fileName;

                return $record;
            }
        }

        return null;
    }

    private function guessNameFromFile(string $fileName): string
    {
        $base = pathinfo($fileName, PATHINFO_FILENAME);

        return str_replace(['-', '_'], ' ', $base);
    }

    private function stopServer(Server $server): void
    {
        try {
            $this->power->setServer($server)->send('kill');
        } catch (\Throwable) {
        }
        usleep(250000);
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
