<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcplugins;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SpigotClient
{
    public const SPIGET_BASE = 'https://api.spiget.org/v2';
    public const SPIGOT_BASE = 'https://api.spigotmc.org/simple/0.2/index.php';
    public const CATEGORY_PLUGINS = 4;

    public const SORTS = [
        '-downloads' => 'Downloads',
        '-rating' => 'Avaliação',
        '-updateDate' => 'Atualização',
        '-name' => 'Nome',
    ];

    public const LOADERS = [
        '' => 'Qualquer',
    ];

    private function spigetRequest(string $path, array $query = []): mixed
    {
        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'User-Agent' => 'MCPlugins/1.0 (Blueprint; +https://github.com/V3noxDev/BluePrint)',
                ])
                ->get(self::SPIGET_BASE . $path, array_filter($query, fn ($v) => $v !== null && $v !== ''));

            if (!$response->successful()) {
                Log::warning('[mcplugins] Spigot/Spiget HTTP ' . $response->status() . ' ' . $path);
                return null;
            }

            return $response->json();
        } catch (\Throwable $e) {
            Log::warning('[mcplugins] Spigot/Spiget erro: ' . $e->getMessage());
            return null;
        }
    }

    private function spigotRequest(array $query): ?array
    {
        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'User-Agent' => 'MCPlugins/1.0 (Blueprint)',
                ])
                ->get(self::SPIGOT_BASE, $query);

            if (!$response->successful()) {
                return null;
            }

            return $response->json();
        } catch (\Throwable) {
            return null;
        }
    }

    public function searchPlugins(array $params): array
    {
        $size = min(50, max(1, (int) ($params['page_size'] ?? 48)));
        $page = (int) floor(max(0, (int) ($params['index'] ?? 0)) / max(1, $size));
        $search = trim((string) ($params['search'] ?? ''));

        $sort = $this->mapSort((string) ($params['sort'] ?? '-downloads'));

        if ($search === '') {
            $json = $this->spigetRequest('/categories/' . self::CATEGORY_PLUGINS . '/resources', [
                'size' => $size,
                'page' => $page,
                'sort' => $sort,
            ]);
        } else {
            $json = $this->spigetRequest('/search/resources/' . rawurlencode($search), [
                'size' => $size,
                'page' => $page,
                'sort' => $sort,
                'field' => 'name',
            ]);
        }

        if (!is_array($json)) {
            return ['data' => [], 'pagination' => ['index' => $page * $size, 'pageSize' => $size, 'resultCount' => 0, 'totalCount' => 0]];
        }

        $items = array_map([$this, 'mapPlugin'], $json);

        $gameVersion = trim((string) ($params['game_version'] ?? ''));
        if ($gameVersion !== '') {
            $items = array_values(array_filter($items, function ($item) use ($gameVersion) {
                foreach ($item['game_versions'] as $v) {
                    if ($v === $gameVersion || str_starts_with((string) $v, $gameVersion)) {
                        return true;
                    }
                }
                return false;
            }));
        }

        $total = count($items) < $size ? ($page * $size + count($items)) : (($page + 1) * $size + 1);

        return [
            'data' => $items,
            'pagination' => [
                'index' => $page * $size,
                'pageSize' => $size,
                'resultCount' => count($items),
                'totalCount' => $total,
            ],
        ];
    }

    public function getPlugin(int $id): ?array
    {
        $mapped = null;
        $json = $this->spigetRequest('/resources/' . $id);
        if (is_array($json)) {
            $mapped = $this->mapPlugin($json);
        }

        $detail = $this->spigotRequest(['action' => 'getResource', 'id' => $id]);
        if (is_array($detail)) {
            $official = $this->mapSpigotResource($detail);
            if ($mapped) {
                $mapped['description_html'] = $official['description_html'];
                $mapped['categories'] = $official['categories'];
                $mapped['game_versions'] = $official['game_versions'] ?: $mapped['game_versions'];
                $mapped['download_count'] = max($mapped['download_count'], $official['download_count']);
                if (!empty($official['logo'])) {
                    $mapped['logo'] = $official['logo'];
                }
            } else {
                $mapped = $official;
            }
        }

        return $mapped;
    }

    public function getVersions(int $id): array
    {
        $json = $this->spigetRequest('/resources/' . $id . '/versions', [
            'size' => 50,
            'page' => 0,
            'sort' => '-releaseDate',
        ]);

        if (!is_array($json)) {
            return ['data' => [], 'pagination' => []];
        }

        $files = array_map(fn ($v) => $this->mapVersion($v, $id), $json);

        return ['data' => $files, 'pagination' => ['totalCount' => count($files)]];
    }

    public function getVersion(int $resourceId, int $versionId): ?array
    {
        $json = $this->spigetRequest('/resources/' . $resourceId . '/versions/' . $versionId);
        if (!is_array($json)) {
            return null;
        }

        return $this->mapVersion($json, $resourceId);
    }

    public function getDownloadUrl(int $resourceId, int $versionId): ?string
    {
        if ($resourceId < 1 || $versionId < 1) {
            return null;
        }

        return self::SPIGET_BASE . '/resources/' . $resourceId . '/versions/' . $versionId . '/download/proxy';
    }

    /**
     * Resolve a melhor URL de download: jar externo direto ou proxy Spiget (contorna Cloudflare 403).
     */
    public function resolveDownloadUrl(int $resourceId, int $versionId): ?string
    {
        if ($resourceId < 1 || $versionId < 1) {
            return null;
        }

        $direct = $this->findDirectDownloadUrl($resourceId);
        if ($direct !== null) {
            return $direct;
        }

        return $this->getDownloadUrl($resourceId, $versionId);
    }

    public function isExternalResource(int $resourceId): bool
    {
        $json = $this->spigetRequest('/resources/' . $resourceId);
        if (is_array($json)) {
            return !empty($json['external']);
        }

        $detail = $this->spigotRequest(['action' => 'getResource', 'id' => $resourceId]);

        return is_array($detail) && !empty($detail['external_download_url']);
    }

    private function findDirectDownloadUrl(int $resourceId): ?string
    {
        $json = $this->spigetRequest('/resources/' . $resourceId);
        if (is_array($json)) {
            $externalUrl = $json['file']['externalUrl'] ?? null;
            if ($this->isDirectArtifactUrl(is_string($externalUrl) ? $externalUrl : null)) {
                return $externalUrl;
            }
        }

        $detail = $this->spigotRequest(['action' => 'getResource', 'id' => $resourceId]);
        if (is_array($detail)) {
            $externalUrl = $detail['external_download_url'] ?? null;
            if ($this->isDirectArtifactUrl(is_string($externalUrl) ? $externalUrl : null)) {
                return $externalUrl;
            }
        }

        return null;
    }

    private function isDirectArtifactUrl(?string $url): bool
    {
        if ($url === null || trim($url) === '') {
            return false;
        }

        $url = trim($url);
        $path = strtolower((string) parse_url($url, PHP_URL_PATH));

        if (str_ends_with($path, '.jar') || str_ends_with($path, '.zip')) {
            return true;
        }

        if (str_contains($url, 'github.com') && str_contains($url, '/releases/download/')) {
            return true;
        }

        if (str_contains($url, 'cdn.spiget.org')) {
            return true;
        }

        return false;
    }

    private function mapSort(string $sort): string
    {
        return match ($sort) {
            'rating', '-rating', '6' => '-rating',
            'updated', '-updateDate', '3' => '-updateDate',
            'name', '-name', '4' => '-name',
            'relevance', '1', '2', 'downloads', '-downloads' => '-downloads',
            default => '-downloads',
        };
    }

    private function mapPlugin(array $resource): array
    {
        $id = (int) ($resource['id'] ?? 0);
        $icon = $this->normalizeIconUrl($resource['icon']['url'] ?? null, $id);

        $tested = $resource['testedVersions'] ?? ($resource['supported_minecraft_versions'] ?? []);

        return [
            'id' => $id,
            'slug' => (string) ($resource['name'] ?? ''),
            'name' => (string) ($resource['name'] ?? 'Plugin'),
            'summary' => (string) ($resource['tag'] ?? ''),
            'author' => (string) ($resource['author']['name'] ?? ($resource['author']['id'] ?? 'Desconhecido')),
            'authors' => [(string) ($resource['author']['name'] ?? 'Desconhecido')],
            'download_count' => (int) ($resource['downloads'] ?? ($resource['stats']['downloads'] ?? 0)),
            'thumbs_up' => (int) ($resource['likes'] ?? ($resource['rating']['count'] ?? 0)),
            'logo' => $icon,
            'url' => 'https://www.spigotmc.org/resources/' . $id,
            'categories' => [],
            'loaders' => ['Spigot', 'Paper'],
            'game_versions' => array_values(array_unique(array_map('strval', $tested))),
            'date_created' => isset($resource['releaseDate']) ? date('c', (int) $resource['releaseDate']) : null,
            'date_modified' => isset($resource['updateDate']) ? date('c', (int) $resource['updateDate']) : null,
            'provider' => 'spigot',
            'external' => (bool) ($resource['external'] ?? false),
        ];
    }

    private function mapSpigotResource(array $resource): array
    {
        $id = (int) ($resource['id'] ?? 0);
        $icon = $this->normalizeIconUrl($resource['icon_link'] ?? null, $id);

        return [
            'id' => $id,
            'slug' => (string) ($resource['title'] ?? ''),
            'name' => (string) ($resource['title'] ?? 'Plugin'),
            'summary' => (string) ($resource['tag'] ?? ''),
            'author' => (string) ($resource['author']['username'] ?? 'Desconhecido'),
            'authors' => [(string) ($resource['author']['username'] ?? 'Desconhecido')],
            'download_count' => (int) ($resource['stats']['downloads'] ?? 0),
            'thumbs_up' => (int) ($resource['stats']['reviews']['total'] ?? 0),
            'logo' => $icon,
            'url' => 'https://www.spigotmc.org/resources/' . $id,
            'categories' => [(string) ($resource['category']['title'] ?? '')],
            'loaders' => ['Spigot', 'Paper'],
            'game_versions' => array_values(array_map('strval', $resource['supported_minecraft_versions'] ?? [])),
            'date_created' => isset($resource['first_release']) ? date('c', (int) $resource['first_release']) : null,
            'date_modified' => isset($resource['last_update']) ? date('c', (int) $resource['last_update']) : null,
            'provider' => 'spigot',
            'external' => !empty($resource['external_download_url']),
            'description_html' => $this->bbcodeToSimpleHtml((string) ($resource['description'] ?? $resource['tag'] ?? '')),
        ];
    }

    private function mapVersion(array $version, int $resourceId): array
    {
        $versionId = (int) ($version['id'] ?? 0);
        $name = (string) ($version['name'] ?? 'Versão');

        return [
            'id' => $versionId,
            'display_name' => $name,
            'file_name' => preg_replace('/[^a-zA-Z0-9._-]+/', '-', strtolower($name)) . '.jar',
            'download_count' => (int) ($version['downloads'] ?? 0),
            'file_date' => isset($version['releaseDate']) ? date('c', (int) $version['releaseDate']) : null,
            'loaders' => ['Spigot', 'Paper'],
            'game_versions' => [],
            'download_url' => $this->resolveDownloadUrl($resourceId, $versionId),
            'resource_id' => $resourceId,
            'external' => (bool) ($version['external'] ?? false),
        ];
    }

    private function normalizeIconUrl(?string $icon, int $resourceId): ?string
    {
        if ($icon === null || $icon === '') {
            return null;
        }

        $icon = trim($icon);
        if ($icon === '') {
            return null;
        }

        if (str_starts_with($icon, 'http://') || str_starts_with($icon, 'https://')) {
            return $icon;
        }

        if (str_starts_with($icon, '//')) {
            return 'https:' . $icon;
        }

        if (str_starts_with($icon, '/')) {
            return 'https://www.spigotmc.org' . $icon;
        }

        if (str_starts_with($icon, 'data/')) {
            return 'https://www.spigotmc.org/' . ltrim($icon, '/');
        }

        return 'https://www.spigotmc.org/data/resource_icons/' . $resourceId . '/' . ltrim($icon, '/');
    }

    private function bbcodeToSimpleHtml(string $text): string
    {
        if ($text === '') {
            return '<p>Sem descrição.</p>';
        }

        $html = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
        $html = preg_replace('/\[b\](.*?)\[\/b\]/is', '<strong>$1</strong>', $html);
        $html = preg_replace('/\[i\](.*?)\[\/i\]/is', '<em>$1</em>', $html);
        $html = preg_replace_callback(
            '/\[url=(.*?)\](.*?)\[\/url\]/is',
            function ($m) {
                $href = trim($m[1]);
                if (!preg_match('#^https?://#i', $href)) {
                    return $m[2];
                }

                return '<a href="' . htmlspecialchars($href, ENT_QUOTES, 'UTF-8')
                    . '" target="_blank" rel="noopener noreferrer">' . $m[2] . '</a>';
            },
            $html
        ) ?? $html;
        $html = nl2br($html);

        return MarkdownRenderer::fromHtml($html, 'spigot-md');
    }
}
