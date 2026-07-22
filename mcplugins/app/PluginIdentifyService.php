<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcplugins;

class PluginIdentifyService
{
    public function __construct(
        private ModrinthClient $modrinth,
        private HangarClient $hangar,
        private SpigotClient $spigot,
    ) {}

    public function identify(string $fileName): ?array
    {
        $query = $this->guessSearchQuery($fileName);
        if ($query === '') {
            return null;
        }

        foreach (['spigot', 'modrinth', 'hangar'] as $provider) {
            $match = match ($provider) {
                'hangar' => $this->searchHangar($query, $fileName),
                'spigot' => $this->searchSpigot($query, $fileName),
                default => $this->searchModrinth($query, $fileName),
            };

            if ($match) {
                return $match;
            }
        }

        return null;
    }

    private function searchModrinth(string $query, string $fileName): ?array
    {
        $results = $this->modrinth->searchPlugins([
            'search' => $query,
            'page_size' => 8,
            'index' => 0,
        ]);

        foreach ($results['data'] as $plugin) {
            if (!$this->namesMatch($fileName, (string) $plugin['name'], (string) ($plugin['slug'] ?? ''))) {
                continue;
            }

            return $this->buildRecord('modrinth', $plugin['id'], $plugin, $fileName);
        }

        return null;
    }

    private function searchHangar(string $query, string $fileName): ?array
    {
        $results = $this->hangar->searchPlugins([
            'search' => $query,
            'page_size' => 8,
            'index' => 0,
        ]);

        foreach ($results['data'] as $plugin) {
            if (!$this->namesMatch($fileName, (string) $plugin['name'], (string) ($plugin['slug'] ?? ''))) {
                continue;
            }

            return $this->buildRecord('hangar', $plugin['id'], $plugin, $fileName);
        }

        return null;
    }

    private function searchSpigot(string $query, string $fileName): ?array
    {
        $results = $this->spigot->searchPlugins([
            'search' => $query,
            'page_size' => 8,
            'index' => 0,
        ]);

        foreach ($results['data'] as $plugin) {
            if (!$this->namesMatch($fileName, (string) $plugin['name'], (string) ($plugin['slug'] ?? ''))) {
                continue;
            }

            return $this->buildRecord('spigot', $plugin['id'], $plugin, $fileName);
        }

        return null;
    }

    private function buildRecord(string $provider, string|int $pluginId, array $plugin, string $fileName): array
    {
        return [
            'provider' => $provider,
            'plugin_id' => $pluginId,
            'file_id' => null,
            'name' => $plugin['name'],
            'version' => $this->guessVersionFromFile($fileName) ?: null,
            'file_name' => basename($fileName),
            'logo' => $plugin['logo'] ?? null,
            'author' => $plugin['author'] ?? '',
            'summary' => $plugin['summary'] ?? '',
            'loaders' => $plugin['loaders'] ?? [],
            'game_versions' => $plugin['game_versions'] ?? [],
            'installed_at' => null,
            'auto_identified' => true,
        ];
    }

    private function guessSearchQuery(string $fileName): string
    {
        $base = pathinfo($fileName, PATHINFO_FILENAME);
        $base = preg_replace('/-(?:bukkit|spigot|paper|purpur|folia)(?:-|$)/i', '-', $base) ?? $base;
        $base = preg_replace('/-?\d+(\.\d+)+([-.][\w]+)?$/i', '', $base) ?? $base;
        $base = trim($base, '-_ ');

        if ($base === '') {
            return '';
        }

        $parts = preg_split('/[-_]+/', $base) ?: [];
        $parts = array_values(array_filter($parts, fn ($p) => strlen($p) > 1 && !is_numeric($p)));

        if (count($parts) >= 2) {
            return $parts[0] . ' ' . $parts[1];
        }

        return $parts[0] ?? $base;
    }

    private function guessVersionFromFile(string $fileName): ?string
    {
        if (preg_match('/(\d+\.\d+(?:\.\d+)*(?:[-.][\w]+)?)/', pathinfo($fileName, PATHINFO_FILENAME), $m)) {
            return $m[1];
        }

        return null;
    }

    private function namesMatch(string $fileName, string $pluginName, string $slug): bool
    {
        $file = $this->normalize($fileName);
        $name = $this->normalize($pluginName);
        $slugNorm = $this->normalize($slug);

        if ($name !== '' && (str_contains($file, $name) || str_contains($name, $file))) {
            return true;
        }

        if ($slugNorm !== '' && str_contains($file, $slugNorm)) {
            return true;
        }

        similar_text($file, $name, $percent);

        return $percent >= 55;
    }

    private function normalize(string $value): string
    {
        return strtolower(preg_replace('/[^a-z0-9]+/i', '', $value) ?? '');
    }
}
