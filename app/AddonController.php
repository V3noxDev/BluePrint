<?php

namespace Pterodactyl\BlueprintFramework\Extensions\{identifier};

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

class AddonController extends ClientApiController
{
    use McManagerHelpers;

    public function __construct(private DaemonFileRepository $files)
    {
        parent::__construct();
    }

    public function config(Request $request, Server $server): JsonResponse
    {
        $this->authorizeServer($request, $server, 'file.read');

        return response()->json([
            'config' => $this->configPayload(),
        ]);
    }

    public function installed(Request $request, Server $server): JsonResponse
    {
        $this->assertExtensionEnabled();
        $this->authorizeServer($request, $server, 'file.read');

        $pluginsPath = $this->configPayload()['plugins_path'];

        try {
            $listing = $this->files->setServer($server)->getDirectory($pluginsPath);
        } catch (DaemonConnectionException $exception) {
            return response()->json([
                'error' => 'Could not list plugins directory.',
                'message' => $exception->getMessage(),
                'addons' => [],
                'path' => $pluginsPath,
            ], 502);
        } catch (\Throwable $exception) {
            return response()->json([
                'addons' => [],
                'path' => $pluginsPath,
                'message' => 'Plugins directory not found yet.',
            ]);
        }

        $addons = collect($listing)
            ->filter(function ($entry) {
                $name = (string) ($entry['name'] ?? '');
                $isFile = !($entry['directory'] ?? false) && !($entry['is_file'] === false);

                // Wings returns is_file boolean in newer versions; older may omit it.
                if (array_key_exists('is_file', $entry)) {
                    $isFile = (bool) $entry['is_file'];
                } elseif (array_key_exists('directory', $entry)) {
                    $isFile = !(bool) $entry['directory'];
                }

                return $isFile && str_ends_with(strtolower($name), '.jar');
            })
            ->map(function ($entry) use ($pluginsPath) {
                $name = (string) $entry['name'];

                return [
                    'name' => $name,
                    'path' => rtrim($pluginsPath, '/') . '/' . ltrim($name, '/'),
                    'size' => (int) ($entry['size'] ?? 0),
                    'modified_at' => $entry['modified'] ?? $entry['modified_at'] ?? null,
                ];
            })
            ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->all();

        return response()->json([
            'path' => $pluginsPath,
            'addons' => $addons,
        ]);
    }

    public function search(Request $request, Server $server): JsonResponse
    {
        $this->assertExtensionEnabled();
        $this->authorizeServer($request, $server, 'file.read');

        $validated = $request->validate([
            'query' => ['nullable', 'string', 'max:120'],
            'offset' => ['nullable', 'integer', 'min:0'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:40'],
        ]);

        $query = trim((string) ($validated['query'] ?? ''));
        $offset = (int) ($validated['offset'] ?? 0);
        $limit = (int) ($validated['limit'] ?? 20);
        $loaders = $this->configPayload()['modrinth_loaders'];

        $facets = [
            ['project_type:plugin'],
        ];

        if (!empty($loaders)) {
            $facets[] = array_map(static fn ($loader) => 'categories:' . $loader, $loaders);
        }

        $params = [
            'limit' => $limit,
            'offset' => $offset,
            'index' => $query === '' ? 'downloads' : 'relevance',
            'facets' => json_encode($facets),
        ];

        if ($query !== '') {
            $params['query'] = $query;
        }

        try {
            $response = Http::timeout(20)
                ->acceptJson()
                ->withHeaders(['User-Agent' => 'mcmanager/1.0.0 (V3noxDev Blueprint Extension)'])
                ->get('https://api.modrinth.com/v2/search', $params);

            if (!$response->successful()) {
                return response()->json([
                    'error' => 'Modrinth search failed.',
                    'status' => $response->status(),
                ], 502);
            }

            $data = $response->json();
            $hits = collect($data['hits'] ?? [])->map(function ($hit) {
                return [
                    'id' => $hit['project_id'] ?? $hit['slug'] ?? '',
                    'slug' => $hit['slug'] ?? '',
                    'title' => $hit['title'] ?? 'Unknown',
                    'description' => $hit['description'] ?? '',
                    'author' => $hit['author'] ?? '',
                    'downloads' => (int) ($hit['downloads'] ?? 0),
                    'icon_url' => $hit['icon_url'] ?? null,
                    'categories' => $hit['categories'] ?? [],
                    'date_modified' => $hit['date_modified'] ?? null,
                ];
            })->values()->all();

            return response()->json([
                'hits' => $hits,
                'total' => (int) ($data['total_hits'] ?? count($hits)),
                'offset' => $offset,
                'limit' => $limit,
            ]);
        } catch (\Throwable $exception) {
            return response()->json([
                'error' => 'Could not reach Modrinth.',
                'message' => $exception->getMessage(),
            ], 502);
        }
    }

    public function versions(Request $request, Server $server, string $projectId): JsonResponse
    {
        $this->assertExtensionEnabled();
        $this->authorizeServer($request, $server, 'file.read');

        try {
            $response = Http::timeout(20)
                ->acceptJson()
                ->withHeaders(['User-Agent' => 'mcmanager/1.0.0 (V3noxDev Blueprint Extension)'])
                ->get('https://api.modrinth.com/v2/project/' . urlencode($projectId) . '/version');

            if (!$response->successful()) {
                return response()->json([
                    'error' => 'Could not load Modrinth versions.',
                    'status' => $response->status(),
                ], 502);
            }

            $loaders = $this->configPayload()['modrinth_loaders'];

            $versions = collect($response->json() ?? [])
                ->filter(function ($version) use ($loaders) {
                    if (empty($loaders)) {
                        return true;
                    }

                    $versionLoaders = $version['loaders'] ?? [];

                    return count(array_intersect($loaders, $versionLoaders)) > 0;
                })
                ->map(function ($version) {
                    $files = collect($version['files'] ?? [])->map(function ($file) {
                        return [
                            'url' => $file['url'] ?? '',
                            'filename' => $file['filename'] ?? 'addon.jar',
                            'primary' => (bool) ($file['primary'] ?? false),
                            'size' => (int) ($file['size'] ?? 0),
                        ];
                    })->values()->all();

                    return [
                        'id' => $version['id'] ?? '',
                        'name' => $version['name'] ?? 'Version',
                        'version_number' => $version['version_number'] ?? '',
                        'version_type' => $version['version_type'] ?? 'release',
                        'date_published' => $version['date_published'] ?? null,
                        'downloads' => (int) ($version['downloads'] ?? 0),
                        'game_versions' => $version['game_versions'] ?? [],
                        'loaders' => $version['loaders'] ?? [],
                        'files' => $files,
                    ];
                })
                ->values()
                ->all();

            return response()->json(['versions' => $versions]);
        } catch (\Throwable $exception) {
            return response()->json([
                'error' => 'Could not reach Modrinth.',
                'message' => $exception->getMessage(),
            ], 502);
        }
    }

    public function install(Request $request, Server $server): JsonResponse
    {
        $this->assertExtensionEnabled();
        $this->authorizeServer($request, $server, 'file.create');

        if (!$this->configPayload()['allow_addon_install']) {
            abort(403, 'Installing addons is disabled by the administrator.');
        }

        $validated = $request->validate([
            'download_url' => ['required', 'url'],
            'filename' => ['required', 'string', 'max:180', 'regex:/^[A-Za-z0-9._-]+\.jar$/i'],
        ]);

        $host = parse_url($validated['download_url'], PHP_URL_HOST);
        $allowedHosts = ['cdn.modrinth.com', 'modrinth.com', 'github.com', 'objects.githubusercontent.com', 'raw.githubusercontent.com'];
        $allowed = false;
        foreach ($allowedHosts as $allowedHost) {
            if ($host === $allowedHost || str_ends_with((string) $host, '.' . $allowedHost)) {
                $allowed = true;
                break;
            }
        }

        if (!$allowed) {
            return response()->json([
                'error' => 'Download host is not allowed.',
            ], 422);
        }

        $pluginsPath = $this->configPayload()['plugins_path'];
        $target = rtrim($pluginsPath, '/') . '/' . $validated['filename'];

        try {
            $response = Http::timeout(60)
                ->withHeaders(['User-Agent' => 'mcmanager/1.0.0 (V3noxDev Blueprint Extension)'])
                ->get($validated['download_url']);

            if (!$response->successful()) {
                return response()->json([
                    'error' => 'Failed to download addon file.',
                    'status' => $response->status(),
                ], 502);
            }

            $this->files->setServer($server)->putContent($target, $response->body());
        } catch (DaemonConnectionException $exception) {
            return response()->json([
                'error' => 'Could not write addon to the daemon.',
                'message' => $exception->getMessage(),
            ], 502);
        } catch (\Throwable $exception) {
            return response()->json([
                'error' => 'Install failed.',
                'message' => $exception->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'path' => $target,
            'message' => 'Addon installed successfully. Restart the server to load it.',
        ]);
    }

    public function remove(Request $request, Server $server): JsonResponse
    {
        $this->assertExtensionEnabled();
        $this->authorizeServer($request, $server, 'file.delete');

        if (!$this->configPayload()['allow_addon_remove']) {
            abort(403, 'Removing addons is disabled by the administrator.');
        }

        $validated = $request->validate([
            'files' => ['required', 'array', 'min:1'],
            'files.*' => ['required', 'string', 'max:220'],
        ]);

        $pluginsPath = rtrim($this->configPayload()['plugins_path'], '/');
        $root = $pluginsPath === '' ? '/' : $pluginsPath;
        $safeFiles = [];

        foreach ($validated['files'] as $file) {
            $normalized = $this->normalizePath($file);
            $name = basename($normalized);

            if (!str_ends_with(strtolower($name), '.jar')) {
                return response()->json([
                    'error' => 'Only .jar files can be removed.',
                    'file' => $file,
                ], 422);
            }

            // Force path under plugins directory to avoid path traversal.
            $candidate = $root . '/' . $name;
            if (!str_starts_with($normalized, $root . '/') && $normalized !== $candidate) {
                // Accept bare filenames too.
                if ($normalized !== '/' . $name && $normalized !== $name) {
                    return response()->json([
                        'error' => 'File is outside the plugins directory.',
                        'file' => $file,
                    ], 422);
                }
            }

            $safeFiles[] = $candidate;
        }

        $basenames = array_values(array_map('basename', $safeFiles));

        try {
            $this->files->setServer($server)->deleteFiles($root, $basenames);
        } catch (DaemonConnectionException $daemonException) {
            return response()->json([
                'error' => 'Could not delete addon files.',
                'message' => $daemonException->getMessage(),
            ], 502);
        } catch (\Throwable $inner) {
            return response()->json([
                'error' => 'Could not delete addon files.',
                'message' => $inner->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'removed' => $safeFiles,
            'message' => count($safeFiles) . ' addon(s) removed. Restart the server if it was running.',
        ]);
    }
}
