<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcplugins;

use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Repositories\Wings\DaemonPowerRepository;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

class PluginInstallService
{
    public const PLUGINS_DIR = '/plugins';

    public function __construct(
        private CurseForgeClient $curse,
        private ModrinthClient $modrinth,
        private HangarClient $hangar,
        private SpigotClient $spigot,
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

        $this->files->setServer($server)->pull($url, self::PLUGINS_DIR, [
            'filename' => $filename,
            'foreground' => true,
        ]);

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
        $meta = $this->getAllInstalledMeta($server);
        $diskFiles = $this->listPluginJars($server);
        $items = [];

        foreach ($diskFiles as $fileName) {
            $record = $meta[$fileName] ?? null;
            $latestFileId = null;
            $updateAvailable = false;

            if ($record && !empty($record['plugin_id'])) {
                $provider = (string) ($record['provider'] ?? 'curseforge');
                $update = $this->checkUpdate($provider, $record['plugin_id'], $record['file_id'] ?? null);
                if ($update) {
                    $updateAvailable = (bool) ($update['available'] ?? false);
                    $latestFileId = $update['latest_file_id'] ?? null;
                }
            }

            $items[] = [
                'file_name' => $fileName,
                'name' => $record['name'] ?? $this->guessNameFromFile($fileName),
                'version' => $record['version'] ?? null,
                'provider' => $record['provider'] ?? null,
                'plugin_id' => $record['plugin_id'] ?? null,
                'file_id' => $record['file_id'] ?? null,
                'logo' => $record['logo'] ?? null,
                'installed_at' => $record['installed_at'] ?? null,
                'tracked' => $record !== null,
                'update_available' => $updateAvailable,
                'latest_file_id' => $latestFileId,
            ];
        }

        usort($items, fn ($a, $b) => strcasecmp($a['name'], $b['name']));

        return $items;
    }

  /**
   * @return array{available: bool, latest_file_id?: string|int}|null
   */
    private function checkUpdate(string $provider, string|int $pluginId, string|int|null $currentFileId): ?array
    {
        try {
            if ($provider === 'modrinth') {
                $versions = $this->modrinth->getVersions((string) $pluginId);
                $latest = $versions['data'][0] ?? null;
                if (!$latest) {
                    return null;
                }
                if ((string) $latest['id'] === (string) $currentFileId) {
                    return ['available' => false];
                }

                return ['available' => true, 'latest_file_id' => $latest['id']];
            }

            if ($provider === 'hangar') {
                $versions = $this->hangar->getVersions((string) $pluginId);
                $latest = $versions['data'][0] ?? null;
                if (!$latest) {
                    return null;
                }
                if ((string) $latest['id'] === (string) $currentFileId) {
                    return ['available' => false];
                }

                return ['available' => true, 'latest_file_id' => $latest['id']];
            }

            if ($provider === 'spigot') {
                $versions = $this->spigot->getVersions((int) $pluginId);
                $latest = $versions['data'][0] ?? null;
                if (!$latest) {
                    return null;
                }
                if ((string) $latest['id'] === (string) $currentFileId) {
                    return ['available' => false];
                }

                return ['available' => true, 'latest_file_id' => $latest['id']];
            }

            if (!$this->curse->hasApiKey()) {
                return null;
            }

            $plugin = $this->curse->getPlugin((int) $pluginId);
            if ($plugin && !empty($plugin['main_file_id'])) {
                $latestFileId = (int) $plugin['main_file_id'];
                if ($latestFileId > 0 && (string) $latestFileId !== (string) $currentFileId) {
                    return ['available' => true, 'latest_file_id' => $latestFileId];
                }

                return ['available' => false];
            }
        } catch (\Throwable $e) {
            Log::debug('[mcplugins] checkUpdate: ' . $e->getMessage());
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

    private function getAllInstalledMeta(Server $server): array
    {
        $raw = $this->blueprint->dbGet('mcplugins', $this->metaKey($server));
        if (!$raw) {
            return [];
        }
        $data = is_string($raw) ? json_decode($raw, true) : $raw;

        return is_array($data) ? $data : [];
    }

    private function saveInstalledRecord(Server $server, string $fileName, array $record): void
    {
        $map = $this->getAllInstalledMeta($server);
        $map[basename($fileName)] = $record;
        $this->blueprint->dbSet('mcplugins', $this->metaKey($server), json_encode($map));
    }

    private function removeInstalledRecord(Server $server, string $fileName): void
    {
        $map = $this->getAllInstalledMeta($server);
        unset($map[basename($fileName)]);
        $this->blueprint->dbSet('mcplugins', $this->metaKey($server), json_encode($map));
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
