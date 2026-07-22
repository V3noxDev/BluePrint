<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcplugins;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HangarClient
{
    public const BASE = 'https://hangar.papermc.io/api/v1';

    public const SORTS = [
        'downloads' => 'Downloads',
        'stars' => 'Estrelas',
        '-updated' => 'Atualização',
        'name' => 'Nome',
    ];

    public const LOADERS = [
        '' => 'Qualquer',
        'PAPER' => 'Paper',
        'VELOCITY' => 'Velocity',
        'WATERFALL' => 'Waterfall',
    ];

    private function request(string $method, string $path, array $query = []): ?array
    {
        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'User-Agent' => 'MCPlugins/1.0 (Blueprint; +https://github.com/V3noxDev/BluePrint)',
                ])
                ->send($method, self::BASE . $path, ['query' => array_filter($query, fn ($v) => $v !== null && $v !== '')]);

            if (!$response->successful()) {
                Log::warning('[mcplugins] Hangar HTTP ' . $response->status() . ' ' . $path);
                return null;
            }

            return $response->json();
        } catch (\Throwable $e) {
            Log::warning('[mcplugins] Hangar erro: ' . $e->getMessage());
            return null;
        }
    }

    public function searchPlugins(array $params): array
    {
        $limit = min(50, max(1, (int) ($params['page_size'] ?? 48)));
        $offset = max(0, (int) ($params['index'] ?? 0));

        $query = [
            'limit' => $limit,
            'offset' => $offset,
            'sort' => $this->mapSort((string) ($params['sort'] ?? 'downloads')),
        ];

        $search = trim((string) ($params['search'] ?? ''));
        if ($search !== '') {
            $query['q'] = $search;
        }

        $json = $this->request('GET', '/projects', $query);
        if (!$json) {
            return ['data' => [], 'pagination' => ['index' => $offset, 'pageSize' => $limit, 'resultCount' => 0, 'totalCount' => 0]];
        }

        $items = array_map([$this, 'mapPlugin'], $json['result'] ?? []);
        $loader = strtoupper((string) ($params['loader'] ?? ''));
        if ($loader !== '') {
            $items = array_values(array_filter($items, fn ($item) => in_array($loader, $item['loaders'], true)));
        }

        $gameVersion = trim((string) ($params['game_version'] ?? ''));
        if ($gameVersion !== '') {
            $items = array_values(array_filter($items, function ($item) use ($gameVersion) {
                foreach ($item['game_versions'] as $v) {
                    if ($v === $gameVersion || str_starts_with($v, $gameVersion)) {
                        return true;
                    }
                }
                return false;
            }));
        }

        $total = (int) ($json['pagination']['count'] ?? count($items));

        return [
            'data' => $items,
            'pagination' => [
                'index' => $offset,
                'pageSize' => $limit,
                'resultCount' => count($items),
                'totalCount' => $total,
            ],
        ];
    }

    public function getPlugin(string $id): ?array
    {
        [$owner, $slug] = $this->parseId($id);
        if (!$owner || !$slug) {
            return null;
        }

        $json = $this->request('GET', '/projects/' . rawurlencode($owner) . '/' . rawurlencode($slug));
        if (!$json) {
            return null;
        }

        return $this->mapPluginDetail($json);
    }

    public function getVersions(string $id): array
    {
        [$owner, $slug] = $this->parseId($id);
        if (!$owner || !$slug) {
            return ['data' => [], 'pagination' => []];
        }

        $json = $this->request('GET', '/projects/' . rawurlencode($owner) . '/' . rawurlencode($slug) . '/versions', [
            'limit' => 50,
            'offset' => 0,
        ]);

        if (!$json) {
            return ['data' => [], 'pagination' => []];
        }

        $files = array_map(fn ($v) => $this->mapVersion($v, $owner, $slug), $json['result'] ?? []);

        return ['data' => $files, 'pagination' => ['totalCount' => count($files)]];
    }

    public function getVersion(string $id, string $versionName): ?array
    {
        [$owner, $slug] = $this->parseId($id);
        if (!$owner || !$slug) {
            return null;
        }

        $json = $this->request('GET', '/projects/' . rawurlencode($owner) . '/' . rawurlencode($slug) . '/versions/' . rawurlencode($versionName));
        if (!$json) {
            return null;
        }

        return $this->mapVersion($json, $owner, $slug);
    }

    public function getDownloadUrl(string $id, string $versionName, string $platform = 'PAPER'): ?string
    {
        $version = $this->getVersion($id, $versionName);
        if (!$version) {
            return null;
        }

        return $version['download_url'] ?? null;
    }

    private function parseId(string $id): array
    {
        $id = urldecode(trim($id));
        if (str_contains($id, '/')) {
            $parts = explode('/', $id, 2);
            return [$parts[0], $parts[1]];
        }

        return ['', ''];
    }

    private function mapSort(string $sort): string
    {
        return match ($sort) {
            'stars', '-stars' => 'stars',
            'updated', '-updated', '3' => '-updated',
            'name', '4' => 'name',
            'relevance', '1' => 'name',
            default => 'downloads',
        };
    }

    private function mapPlugin(array $project): array
    {
        $owner = (string) ($project['namespace']['owner'] ?? '');
        $slug = (string) ($project['namespace']['slug'] ?? '');
        $platforms = $project['supportedPlatforms'] ?? [];
        $loaders = array_keys($platforms);
        $gameVersions = [];
        foreach ($platforms as $versions) {
            foreach ($versions as $v) {
                $gameVersions[$v] = true;
            }
        }

        return [
            'id' => $owner . '/' . $slug,
            'slug' => $slug,
            'name' => (string) ($project['name'] ?? $slug),
            'summary' => (string) ($project['description'] ?? ''),
            'author' => $owner,
            'authors' => [$owner],
            'download_count' => (int) ($project['stats']['downloads'] ?? 0),
            'thumbs_up' => (int) ($project['stats']['stars'] ?? 0),
            'logo' => $project['avatarUrl'] ?? null,
            'url' => 'https://hangar.papermc.io/' . rawurlencode($owner) . '/' . rawurlencode($slug),
            'categories' => array_filter([(string) ($project['category'] ?? '')]),
            'loaders' => $loaders,
            'game_versions' => array_keys($gameVersions),
            'date_created' => $project['createdAt'] ?? null,
            'date_modified' => $project['lastUpdated'] ?? null,
            'provider' => 'hangar',
        ];
    }

    private function mapPluginDetail(array $project): array
    {
        $mapped = $this->mapPlugin($project);
        $body = (string) ($project['mainPageContent'] ?? $project['description'] ?? '');
        $mapped['description_html'] = $this->markdownToSimpleHtml($body);

        return $mapped;
    }

    private function mapVersion(array $version, string $owner, string $slug): array
    {
        $name = (string) ($version['name'] ?? 'Versão');
        $platform = 'PAPER';
        $downloads = $version['downloads'] ?? [];
        if (!isset($downloads['PAPER'])) {
            $platform = array_key_first($downloads) ?: 'PAPER';
        }
        $entry = $downloads[$platform] ?? ($downloads[array_key_first($downloads) ?: 'PAPER'] ?? []);
        $fileInfo = $entry['fileInfo'] ?? [];
        $downloadUrl = $entry['downloadUrl'] ?? $entry['externalUrl'] ?? null;
        $fileName = (string) ($fileInfo['name'] ?? ($name . '.jar'));

        $gameVersions = [];
        foreach ($version['platformDependencies'] ?? [] as $versions) {
            foreach ($versions as $v) {
                $gameVersions[] = (string) $v;
            }
        }

        return [
            'id' => $name,
            'display_name' => $name,
            'file_name' => $fileName,
            'download_count' => (int) ($version['stats']['downloads'] ?? 0),
            'file_date' => $version['createdAt'] ?? null,
            'loaders' => [ucfirst(strtolower($platform))],
            'game_versions' => array_values(array_unique($gameVersions)),
            'download_url' => $downloadUrl,
            'platform' => $platform,
            'project_id' => $owner . '/' . $slug,
        ];
    }

    private function markdownToSimpleHtml(string $md): string
    {
        if ($md === '') {
            return '<p>Sem descrição.</p>';
        }

        $html = htmlspecialchars($md, ENT_QUOTES, 'UTF-8');
        $html = preg_replace('/\*\*(.+?)\*\*/s', '<strong>$1</strong>', $html);
        $html = preg_replace('/\*(.+?)\*/s', '<em>$1</em>', $html);
        $html = nl2br($html);

        return '<div class="hangar-md">' . $html . '</div>';
    }
}
