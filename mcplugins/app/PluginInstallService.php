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
        private DaemonFileRepository $files,
        private DaemonPowerRepository $power,
        private BlueprintExtensionLibrary $blueprint,
    ) {}

    public function install(Server $server, int $pluginId, int $fileId): array
    {
        if (!$this->curse->hasApiKey()) {
            throw new \RuntimeException('API Key do CurseForge não configurada.');
        }

        $plugin = $this->curse->getPlugin($pluginId);
        if (!$plugin) {
            throw new \RuntimeException('Plugin não encontrado na CurseForge.');
        }

        $file = $this->curse->getFile($pluginId, $fileId);
        if (!$file) {
            throw new \RuntimeException('Versão do plugin não encontrada.');
        }

        $url = $this->curse->getDownloadUrl($pluginId, $fileId) ?: ($file['download_url'] ?? null);
        if (!$url) {
            throw new \RuntimeException('CurseForge não retornou URL de download.');
        }

        $filename = basename($file['file_name'] ?: 'plugin-' . $fileId . '.jar');
        if (!str_ends_with(strtolower($filename), '.jar')) {
            $filename .= '.jar';
        }

        $this->ensurePluginsDir($server);
        $this->stopServer($server);

        // Remove jar antigo do mesmo plugin se existir
        $existing = $this->findInstalledByPluginId($server, $pluginId);
        if ($existing && ($existing['file_name'] ?? '') !== $filename) {
            $this->deletePluginFile($server, $existing['file_name']);
        }

        $this->files->setServer($server)->pull($url, self::PLUGINS_DIR, [
            'filename' => $filename,
            'foreground' => true,
        ]);

        $record = [
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
            'provider' => 'curseforge',
            'installed_at' => now()->toIso8601String(),
        ];

        $this->saveInstalledRecord($server, $filename, $record);
        $this->startServer($server);

        return $record;
    }

    public function update(Server $server, int $pluginId, int $fileId): array
    {
        return $this->install($server, $pluginId, $fileId);
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
                $plugin = $this->curse->getPlugin((int) $record['plugin_id']);
                if ($plugin && !empty($plugin['main_file_id'])) {
                    $latestFileId = (int) $plugin['main_file_id'];
                    $updateAvailable = $latestFileId > 0 && $latestFileId !== (int) ($record['file_id'] ?? 0);
                }
            }

            $items[] = [
                'file_name' => $fileName,
                'name' => $record['name'] ?? $this->guessNameFromFile($fileName),
                'version' => $record['version'] ?? null,
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

    private function findInstalledByPluginId(Server $server, int $pluginId): ?array
    {
        foreach ($this->getAllInstalledMeta($server) as $fileName => $record) {
            if ((int) ($record['plugin_id'] ?? 0) === $pluginId) {
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
