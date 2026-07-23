<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcplugins;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

class CurseForgeClient
{
    public const BASE = 'https://api.curseforge.com';
    public const GAME_MINECRAFT = 432;
    /** Bukkit Plugins (Paper / Spigot / Purpur) */
    public const CLASS_PLUGINS = 5;

    public const LOADERS = [
        0 => 'Qualquer',
        1 => 'Forge',
        4 => 'Fabric',
        6 => 'NeoForge',
    ];

    /** Labels exibidos na UI (filtro por gameVersion na API) */
    public const SERVER_LOADERS = [
        '' => 'Qualquer',
        'paper' => 'Paper',
        'spigot' => 'Spigot',
        'bukkit' => 'Bukkit',
        'purpur' => 'Purpur',
        'folia' => 'Folia',
    ];

    /** Loaders padrão para Bukkit Plugins quando a API não retorna loaders na busca */
    public const DEFAULT_PLUGIN_LOADERS = ['Paper', 'Spigot', 'Bukkit', 'Purpur', 'Folia'];

    public const SORTS = [
        1 => 'Destaques',
        2 => 'Popularidade',
        3 => 'Atualização',
        4 => 'Nome',
        6 => 'Downloads',
    ];

    public function __construct(private BlueprintExtensionLibrary $blueprint) {}

    public function getApiKey(): string
    {
        return trim((string) ($this->blueprint->dbGet('mcplugins', 'curseforge_api_key') ?: ''));
    }

    public function hasApiKey(): bool
    {
        return $this->getApiKey() !== '';
    }

    private function request(string $method, string $path, array $query = []): ?array
    {
        $key = $this->getApiKey();
        if ($key === '') {
            return null;
        }

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'x-api-key' => $key,
                    'User-Agent' => 'MCPlugins/1.0 (Blueprint)',
                ])
                ->send($method, self::BASE . $path, ['query' => array_filter($query, fn ($v) => $v !== null && $v !== '')]);

            if (!$response->successful()) {
                Log::warning('[mcplugins] CurseForge HTTP ' . $response->status() . ' ' . $path);
                return null;
            }

            return $response->json();
        } catch (\Throwable $e) {
            Log::warning('[mcplugins] CurseForge erro: ' . $e->getMessage());
            return null;
        }
    }

    public function searchPlugins(array $params): array
    {
        if (!$this->hasApiKey()) {
            return ['data' => [], 'pagination' => ['index' => 0, 'pageSize' => 48, 'resultCount' => 0, 'totalCount' => 0]];
        }

        $query = [
            'gameId' => self::GAME_MINECRAFT,
            'classId' => self::CLASS_PLUGINS,
            'searchFilter' => $params['search'] ?? null,
            'gameVersion' => $params['game_version'] ?? null,
            'sortField' => (int) ($params['sort'] ?? 2),
            'sortOrder' => $params['sort_order'] ?? 'desc',
            'pageSize' => min(50, max(1, (int) ($params['page_size'] ?? 48))),
            'index' => max(0, (int) ($params['index'] ?? 0)),
        ];

        $json = $this->request('GET', '/v1/mods/search', $query);
        if (!$json) {
            return ['data' => [], 'pagination' => ['index' => 0, 'pageSize' => 48, 'resultCount' => 0, 'totalCount' => 0]];
        }

        $items = array_map([$this, 'mapPlugin'], $json['data'] ?? []);

        // Filtro visual de loader (Paper/Spigot…) quando a API não filtra direto
        $loader = strtolower((string) ($params['loader'] ?? ''));
        if ($loader !== '' && $loader !== '0') {
            $items = array_values(array_filter($items, function ($item) use ($loader) {
                if (empty($item['loaders'])) {
                    return true;
                }
                foreach ($item['loaders'] as $l) {
                    if (stripos($l, $loader) !== false) {
                        return true;
                    }
                }

                return false;
            }));
        }

        return [
            'data' => $items,
            'pagination' => $json['pagination'] ?? ['index' => 0, 'pageSize' => 48, 'resultCount' => 0, 'totalCount' => 0],
        ];
    }

    public function getPlugin(int $modId): ?array
    {
        $json = $this->request('GET', '/v1/mods/' . $modId);
        if (!$json || empty($json['data'])) {
            return null;
        }

        $mapped = $this->mapPlugin($json['data']);
        $desc = $this->request('GET', '/v1/mods/' . $modId . '/description');
        $mapped['description_html'] = MarkdownRenderer::fromHtml((string) ($desc['data'] ?? ''), 'curseforge-md');

        return $mapped;
    }

    public function getFiles(int $modId, int $index = 0, int $pageSize = 50): array
    {
        $json = $this->request('GET', '/v1/mods/' . $modId . '/files', [
            'index' => $index,
            'pageSize' => min(50, max(1, $pageSize)),
        ]);

        if (!$json) {
            return ['data' => [], 'pagination' => []];
        }

        return [
            'data' => array_map([$this, 'mapFile'], $json['data'] ?? []),
            'pagination' => $json['pagination'] ?? [],
        ];
    }

    public function getFile(int $modId, int $fileId): ?array
    {
        $json = $this->request('GET', '/v1/mods/' . $modId . '/files/' . $fileId);
        if (!$json || empty($json['data'])) {
            return null;
        }

        return $this->mapFile($json['data']);
    }

    public function getDownloadUrl(int $modId, int $fileId): ?string
    {
        $json = $this->request('GET', '/v1/mods/' . $modId . '/files/' . $fileId . '/download-url');
        $url = $json['data'] ?? null;

        return is_string($url) && $url !== '' ? $url : null;
    }

    public function fetchFreshDownloadUrl(int $modId, int $fileId): ?string
    {
        return $this->getDownloadUrl($modId, $fileId);
    }

    public function mapPlugin(array $mod): array
    {
        $authors = collect($mod['authors'] ?? [])->pluck('name')->filter()->values()->all();
        $categories = collect($mod['categories'] ?? [])->pluck('name')->filter()->values()->all();
        $loaders = [];
        $gameVersions = [];

        foreach ($mod['latestFilesIndexes'] ?? [] as $idx) {
            if (!empty($idx['gameVersion']) && preg_match('/^\d/', $idx['gameVersion'])) {
                $gameVersions[$idx['gameVersion']] = true;
            }
        }

        foreach ($mod['latestFilesIndexes'] ?? [] as $idx) {
            $lt = (int) ($idx['modLoader'] ?? 0);
            if ($lt > 0) {
                $loaders[self::LOADERS[$lt] ?? ('Loader ' . $lt)] = true;
            }
        }

        // Plugins costumam listar loaders em gameVersions do arquivo
        foreach ($mod['latestFiles'] ?? [] as $file) {
            foreach ($file['gameVersions'] ?? [] as $v) {
                $lower = strtolower((string) $v);
                if (in_array($lower, ['paper', 'spigot', 'bukkit', 'purpur', 'folia', 'bungeecord', 'velocity'], true)) {
                    $loaders[ucfirst($lower)] = true;
                } elseif (preg_match('/^\d/', (string) $v)) {
                    $gameVersions[(string) $v] = true;
                }
            }
        }

        $classId = (int) ($mod['classId'] ?? self::CLASS_PLUGINS);
        if ($classId === self::CLASS_PLUGINS && empty($loaders)) {
            foreach (self::DEFAULT_PLUGIN_LOADERS as $defaultLoader) {
                $loaders[$defaultLoader] = true;
            }
        }

        return [
            'id' => (int) ($mod['id'] ?? 0),
            'name' => (string) ($mod['name'] ?? 'Plugin'),
            'slug' => (string) ($mod['slug'] ?? ''),
            'summary' => (string) ($mod['summary'] ?? ''),
            'authors' => $authors,
            'author' => $authors[0] ?? 'Desconhecido',
            'download_count' => (int) ($mod['downloadCount'] ?? 0),
            'thumbs_up' => (int) (($mod['thumbsUpCount'] ?? null) ?? 0),
            'logo' => $mod['logo']['thumbnailUrl'] ?? ($mod['logo']['url'] ?? null),
            'url' => $mod['links']['websiteUrl'] ?? null,
            'categories' => $categories,
            'loaders' => array_keys($loaders),
            'game_versions' => array_keys($gameVersions),
            'date_created' => $mod['dateCreated'] ?? null,
            'date_modified' => $mod['dateModified'] ?? null,
            'main_file_id' => (int) ($mod['mainFileId'] ?? 0),
            'provider' => 'curseforge',
        ];
    }

    public function mapFile(array $file): array
    {
        $loaders = [];
        $gameVersions = [];

        foreach ($file['gameVersions'] ?? [] as $v) {
            $lower = strtolower((string) $v);
            if (in_array($lower, ['paper', 'spigot', 'bukkit', 'purpur', 'folia', 'bungeecord', 'velocity', 'quilt'], true)) {
                $loaders[] = ucfirst($lower === 'neoforge' ? 'NeoForge' : $lower);
            } elseif (preg_match('/^\d/', (string) $v)) {
                $gameVersions[] = (string) $v;
            }
        }

        return [
            'id' => (int) ($file['id'] ?? 0),
            'display_name' => (string) ($file['displayName'] ?? $file['fileName'] ?? 'Versão'),
            'file_name' => (string) ($file['fileName'] ?? ''),
            'download_count' => (int) ($file['downloadCount'] ?? 0),
            'file_date' => $file['fileDate'] ?? null,
            'release_type' => (int) ($file['releaseType'] ?? 1),
            'download_url' => $file['downloadUrl'] ?? null,
            'loaders' => array_values(array_unique($loaders)),
            'game_versions' => array_values(array_unique($gameVersions)),
        ];
    }
}
