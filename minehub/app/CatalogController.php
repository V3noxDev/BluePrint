<?php

namespace {appcontext};

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Http\Controllers\Controller;
use RuntimeException;
use Throwable;

class CatalogController extends Controller
{
    private const API_BASE = 'https://api.modrinth.com/v2';

    private const PLUGIN_LOADERS = [
        ['id' => 'paper', 'name' => 'Paper'],
        ['id' => 'purpur', 'name' => 'Purpur'],
        ['id' => 'spigot', 'name' => 'Spigot'],
        ['id' => 'bukkit', 'name' => 'Bukkit'],
        ['id' => 'folia', 'name' => 'Folia'],
    ];

    private const MOD_LOADERS = [
        ['id' => 'fabric', 'name' => 'Fabric'],
        ['id' => 'neoforge', 'name' => 'NeoForge'],
        ['id' => 'forge', 'name' => 'Forge'],
        ['id' => 'quilt', 'name' => 'Quilt'],
    ];

    public function __construct(private SettingsRepositoryInterface $settings)
    {
    }

    public function configuration(): JsonResponse
    {
        return response()->json([
            'plugins_enabled' => $this->settingEnabled('plugins_enabled'),
            'mods_enabled' => $this->settingEnabled('mods_enabled'),
            'properties_enabled' => $this->settingEnabled('properties_enabled'),
            'default_section' => $this->settings->get('minehub::default_section', 'plugin'),
            'provider' => 'Modrinth',
        ]);
    }

    public function metadata(): JsonResponse
    {
        try {
            $versions = Cache::remember('minehub:modrinth:game-versions', now()->addHours(6), function (): array {
                $response = $this->modrinth()->get(self::API_BASE . '/tag/game_version');

                if (!$response->successful()) {
                    throw new RuntimeException('O catálogo recusou a consulta de versões.');
                }

                return collect($response->json())
                    ->filter(fn (array $version): bool => ($version['version_type'] ?? null) === 'release'
                        && (bool) ($version['major'] ?? false))
                    ->take(40)
                    ->map(fn (array $version): array => [
                        'id' => (string) $version['version'],
                        'name' => (string) $version['version'],
                        'released_at' => $version['date'] ?? null,
                    ])
                    ->values()
                    ->all();
            });

            return response()->json([
                'versions' => $versions,
                'loaders' => [
                    'plugin' => self::PLUGIN_LOADERS,
                    'mod' => self::MOD_LOADERS,
                ],
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return $this->upstreamError();
        }
    }

    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'nullable|string|max:80',
            'type' => 'required|in:plugin,mod',
            'version' => ['required', 'string', 'max:32', 'regex:/^[0-9A-Za-z._+-]+$/'],
            'loader' => ['required', 'string', 'max:32', 'regex:/^[a-z0-9_-]+$/'],
            'sort' => 'nullable|in:relevance,downloads,updated,newest',
            'offset' => 'nullable|integer|min:0|max:990',
        ]);

        if (!$this->isAllowedLoader($validated['type'], $validated['loader'])) {
            return response()->json(['message' => 'Loader não permitido para este tipo de addon.'], 422);
        }

        $facets = [
            ['project_type:' . $validated['type']],
            ['versions:' . $validated['version']],
            ['categories:' . $validated['loader']],
            ['server_side:required', 'server_side:optional'],
        ];

        $parameters = [
            'query' => $validated['query'] ?? '',
            'facets' => json_encode($facets, JSON_THROW_ON_ERROR),
            'index' => $validated['sort'] ?? 'relevance',
            'limit' => 12,
            'offset' => $validated['offset'] ?? 0,
        ];

        try {
            $cacheKey = 'minehub:modrinth:search:' . sha1(json_encode($parameters, JSON_THROW_ON_ERROR));
            $payload = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($parameters): array {
                $response = $this->modrinth()->get(self::API_BASE . '/search', $parameters);

                if (!$response->successful()) {
                    throw new RuntimeException('O catálogo recusou a pesquisa.');
                }

                return $response->json();
            });

            return response()->json([
                'data' => collect($payload['hits'] ?? [])->map(fn (array $project): array => [
                    'id' => (string) ($project['project_id'] ?? ''),
                    'slug' => (string) ($project['slug'] ?? ''),
                    'title' => (string) ($project['title'] ?? 'Sem nome'),
                    'description' => (string) ($project['description'] ?? ''),
                    'author' => (string) ($project['author'] ?? 'Desconhecido'),
                    'downloads' => (int) ($project['downloads'] ?? 0),
                    'icon_url' => $this->safeCdnUrl($project['icon_url'] ?? null),
                    'categories' => array_values(array_slice($project['display_categories'] ?? [], 0, 4)),
                    'updated_at' => $project['date_modified'] ?? null,
                ])->values(),
                'meta' => [
                    'offset' => (int) ($payload['offset'] ?? 0),
                    'limit' => (int) ($payload['limit'] ?? 12),
                    'total' => (int) ($payload['total_hits'] ?? 0),
                ],
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return $this->upstreamError();
        }
    }

    public function versions(Request $request, string $project): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:plugin,mod',
            'version' => ['required', 'string', 'max:32', 'regex:/^[0-9A-Za-z._+-]+$/'],
            'loader' => ['required', 'string', 'max:32', 'regex:/^[a-z0-9_-]+$/'],
        ]);

        if (!$this->isAllowedLoader($validated['type'], $validated['loader'])) {
            return response()->json(['message' => 'Loader não permitido para este tipo de addon.'], 422);
        }

        $parameters = [
            'game_versions' => json_encode([$validated['version']], JSON_THROW_ON_ERROR),
            'loaders' => json_encode([$validated['loader']], JSON_THROW_ON_ERROR),
        ];

        try {
            $cacheKey = sprintf(
                'minehub:modrinth:versions:%s:%s:%s',
                $project,
                $validated['version'],
                $validated['loader'],
            );

            $payload = Cache::remember($cacheKey, now()->addMinutes(10), function () use ($project, $parameters): array {
                $response = $this->modrinth()->get(
                    self::API_BASE . '/project/' . rawurlencode($project) . '/version',
                    $parameters,
                );

                if (!$response->successful()) {
                    throw new RuntimeException('O catálogo recusou a consulta de versões.');
                }

                return $response->json();
            });

            $versions = collect($payload)
                ->map(function (array $version): ?array {
                    $files = collect($version['files'] ?? [])->filter(function (array $file): bool {
                        $filename = strtolower((string) ($file['filename'] ?? ''));

                        return str_ends_with($filename, '.jar')
                            && $this->safeCdnUrl($file['url'] ?? null) !== null;
                    });

                    $file = $files->firstWhere('primary', true) ?? $files->first();

                    if (!$file) {
                        return null;
                    }

                    return [
                        'id' => (string) ($version['id'] ?? ''),
                        'name' => (string) ($version['name'] ?? $version['version_number'] ?? 'Versão'),
                        'version_number' => (string) ($version['version_number'] ?? ''),
                        'version_type' => (string) ($version['version_type'] ?? 'release'),
                        'published_at' => $version['date_published'] ?? null,
                        'game_versions' => array_values($version['game_versions'] ?? []),
                        'loaders' => array_values($version['loaders'] ?? []),
                        'file' => [
                            'filename' => basename((string) $file['filename']),
                            'url' => $this->safeCdnUrl($file['url']),
                            'size' => (int) ($file['size'] ?? 0),
                            'sha512' => Arr::get($file, 'hashes.sha512'),
                        ],
                    ];
                })
                ->filter()
                ->take(20)
                ->values();

            return response()->json(['data' => $versions]);
        } catch (Throwable $exception) {
            report($exception);

            return $this->upstreamError();
        }
    }

    private function settingEnabled(string $key): bool
    {
        return filter_var(
            $this->settings->get('minehub::' . $key, '1'),
            FILTER_VALIDATE_BOOLEAN,
        );
    }

    private function isAllowedLoader(string $type, string $loader): bool
    {
        $loaders = $type === 'plugin' ? self::PLUGIN_LOADERS : self::MOD_LOADERS;

        return collect($loaders)->contains('id', $loader);
    }

    private function modrinth(): \Illuminate\Http\Client\PendingRequest
    {
        return Http::acceptJson()
            ->withUserAgent('MineHub/1.0.0 (https://github.com/V3noxDev/BluePrint)')
            ->connectTimeout(5)
            ->timeout(12)
            ->retry(2, 200);
    }

    private function safeCdnUrl(mixed $url): ?string
    {
        if (!is_string($url) || $url === '') {
            return null;
        }

        $parts = parse_url($url);
        $host = strtolower((string) ($parts['host'] ?? ''));

        if (($parts['scheme'] ?? null) !== 'https') {
            return null;
        }

        if ($host !== 'cdn.modrinth.com' && !str_ends_with($host, '.modrinth.com')) {
            return null;
        }

        return $url;
    }

    private function upstreamError(): JsonResponse
    {
        return response()->json([
            'message' => 'Não foi possível acessar o catálogo agora. Tente novamente em instantes.',
        ], 502);
    }
}
