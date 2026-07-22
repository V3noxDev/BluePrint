<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcplugins;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ModrinthClient
{
    public const BASE = 'https://api.modrinth.com/v2';

    public const SORTS = [
        'relevance' => 'Relevância',
        'downloads' => 'Downloads',
        'updated' => 'Atualização',
        'newest' => 'Mais recentes',
    ];

    public const LOADERS = [
        '' => 'Qualquer',
        'paper' => 'Paper',
        'spigot' => 'Spigot',
        'bukkit' => 'Bukkit',
        'purpur' => 'Purpur',
        'folia' => 'Folia',
        'bungeecord' => 'Bungeecord',
        'velocity' => 'Velocity',
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
                Log::warning('[mcplugins] Modrinth HTTP ' . $response->status() . ' ' . $path);
                return null;
            }

            return $response->json();
        } catch (\Throwable $e) {
            Log::warning('[mcplugins] Modrinth erro: ' . $e->getMessage());
            return null;
        }
    }

    public function searchPlugins(array $params): array
    {
        $facets = [['project_type:plugin']];

        if (!empty($params['game_version'])) {
            $facets[] = ['versions:' . $params['game_version']];
        }
        if (!empty($params['loader'])) {
            $facets[] = ['categories:' . strtolower($params['loader'])];
        }

        $limit = min(50, max(1, (int) ($params['page_size'] ?? 48)));
        $offset = max(0, (int) ($params['index'] ?? 0));

        $sortMap = [
            '1' => 'relevance',
            '2' => 'downloads',
            '3' => 'updated',
            '4' => 'relevance',
            '6' => 'downloads',
        ];
        $index = $sortMap[(string) ($params['sort'] ?? '2')] ?? ($params['sort_index'] ?? 'downloads');

        $json = $this->request('GET', '/search', [
            'query' => $params['search'] ?? '',
            'limit' => $limit,
            'offset' => $offset,
            'index' => $index,
            'facets' => json_encode($facets),
        ]);

        if (!$json) {
            return ['data' => [], 'pagination' => ['index' => $offset, 'pageSize' => $limit, 'resultCount' => 0, 'totalCount' => 0]];
        }

        $hits = $json['hits'] ?? [];
        $total = (int) ($json['total_hits'] ?? 0);

        return [
            'data' => array_map([$this, 'mapPlugin'], $hits),
            'pagination' => [
                'index' => $offset,
                'pageSize' => $limit,
                'resultCount' => count($hits),
                'totalCount' => $total,
            ],
        ];
    }

    public function getPlugin(string $id): ?array
    {
        $json = $this->request('GET', '/project/' . urlencode($id));
        if (!$json) {
            return null;
        }

        return $this->mapPluginDetail($json);
    }

    public function getVersions(string $projectId): array
    {
        $json = $this->request('GET', '/project/' . urlencode($projectId) . '/version');
        if (!is_array($json)) {
            return ['data' => [], 'pagination' => []];
        }

        $files = array_map([$this, 'mapVersion'], $json);

        return ['data' => $files, 'pagination' => ['totalCount' => count($files)]];
    }

    public function getVersion(string $versionId): ?array
    {
        $json = $this->request('GET', '/version/' . urlencode($versionId));
        if (!$json) {
            return null;
        }

        return $this->mapVersion($json);
    }

    public function getDownloadUrl(string $versionId): ?string
    {
        $version = $this->getVersion($versionId);
        if (!$version) {
            return null;
        }

        return $version['download_url'] ?? null;
    }

    private function mapPlugin(array $hit): array
    {
        $author = $hit['author'] ?? ($hit['team'] ?? 'Desconhecido');

        return [
            'id' => (string) ($hit['project_id'] ?? $hit['slug'] ?? ''),
            'slug' => (string) ($hit['slug'] ?? ''),
            'name' => (string) ($hit['title'] ?? 'Plugin'),
            'summary' => (string) ($hit['description'] ?? ''),
            'author' => is_string($author) ? $author : 'Desconhecido',
            'authors' => [is_string($author) ? $author : 'Desconhecido'],
            'download_count' => (int) ($hit['downloads'] ?? 0),
            'thumbs_up' => (int) ($hit['follows'] ?? 0),
            'logo' => $hit['icon_url'] ?? null,
            'url' => 'https://modrinth.com/plugin/' . ($hit['slug'] ?? $hit['project_id'] ?? ''),
            'categories' => $hit['categories'] ?? [],
            'loaders' => array_values(array_filter($hit['categories'] ?? [], fn ($c) => in_array(strtolower($c), ['paper', 'spigot', 'bukkit', 'purpur', 'folia', 'bungeecord', 'velocity'], true))),
            'game_versions' => $hit['versions'] ?? [],
            'date_created' => $hit['date_created'] ?? null,
            'date_modified' => $hit['date_modified'] ?? null,
            'provider' => 'modrinth',
        ];
    }

    private function mapPluginDetail(array $project): array
    {
        $mapped = $this->mapPlugin($project);
        $mapped['id'] = (string) ($project['id'] ?? $mapped['id']);
        $mapped['description_html'] = $this->markdownToSimpleHtml((string) ($project['body'] ?? $project['description'] ?? ''));
        $mapped['main_file_id'] = null;

        return $mapped;
    }

    private function mapVersion(array $version): array
    {
        $primary = null;
        foreach ($version['files'] ?? [] as $file) {
            if (!empty($file['primary'])) {
                $primary = $file;
                break;
            }
        }
        $primary ??= ($version['files'][0] ?? null);

        return [
            'id' => (string) ($version['id'] ?? ''),
            'display_name' => (string) ($version['name'] ?? ($version['version_number'] ?? 'Versão')),
            'file_name' => (string) ($primary['filename'] ?? 'plugin.jar'),
            'download_count' => (int) ($version['downloads'] ?? 0),
            'file_date' => $version['date_published'] ?? null,
            'loaders' => array_map('ucfirst', $version['loaders'] ?? []),
            'game_versions' => $version['game_versions'] ?? [],
            'download_url' => $primary['url'] ?? null,
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

        return '<div class="modrinth-md">' . $html . '</div>';
    }
}
