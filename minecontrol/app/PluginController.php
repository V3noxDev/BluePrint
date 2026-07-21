<?php

namespace {appcontext};

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;

class PluginController extends Controller
{
    public function __construct(private DaemonFileRepository $files)
    {
    }

    /**
     * List installed plugins from /plugins (and optionally /mods).
     */
    public function list(Request $request): JsonResponse
    {
        $data = $request->validate([
            'serverUuid' => 'required|string|exists:servers,uuid',
            'directory' => 'nullable|string|in:plugins,mods',
        ]);

        $server = Server::where('uuid', $data['serverUuid'])->firstOrFail();
        $this->authorize('file.read', $server);

        $directory = '/' . ($data['directory'] ?? 'plugins');

        try {
            $entries = $this->files->setServer($server)->getDirectory($directory);
        } catch (DaemonConnectionException $e) {
            // Directory may not exist yet on fresh servers.
            return response()->json([
                'success' => true,
                'directory' => $directory,
                'plugins' => [],
                'message' => 'Directory not found or unreachable.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => true,
                'directory' => $directory,
                'plugins' => [],
            ]);
        }

        $plugins = [];
        foreach ($entries as $entry) {
            $name = $entry['name'] ?? '';
            $isFile = (bool) ($entry['is_file'] ?? false);
            if (!$isFile) {
                continue;
            }

            $lower = strtolower($name);
            $disabled = str_ends_with($lower, '.jar.disabled') || str_ends_with($lower, '.disabled');
            $isJar = str_ends_with($lower, '.jar') || $disabled;

            if (!$isJar) {
                continue;
            }

            $plugins[] = [
                'name' => $name,
                'path' => rtrim($directory, '/') . '/' . $name,
                'size' => (int) ($entry['size'] ?? 0),
                'modified_at' => $entry['modified'] ?? ($entry['modified_at'] ?? null),
                'enabled' => !$disabled,
            ];
        }

        usort($plugins, fn ($a, $b) => strcasecmp($a['name'], $b['name']));

        return response()->json([
            'success' => true,
            'directory' => $directory,
            'plugins' => $plugins,
        ]);
    }

    /**
     * Download and install a plugin/mod jar onto the server.
     */
    public function install(Request $request): JsonResponse
    {
        $data = $request->validate([
            'serverUuid' => 'required|string|exists:servers,uuid',
            'downloadUrl' => 'required|url',
            'filename' => 'required|string|max:180',
            'directory' => 'nullable|string|in:plugins,mods',
        ]);

        $server = Server::where('uuid', $data['serverUuid'])->firstOrFail();
        $this->authorize('file.create', $server);

        $filename = basename($data['filename']);
        if (!preg_match('/\.jar$/i', $filename) || preg_match('/[\\\\\/]/', $filename)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid plugin filename. Only .jar files are allowed.',
            ], 422);
        }

        $directory = '/' . ($data['directory'] ?? 'plugins');
        $path = $directory . '/' . $filename;

        try {
            // Prefer Wings remote pull when available — avoids buffering large jars in PHP.
            try {
                $this->files->setServer($server)->pull($data['downloadUrl'], $directory, [
                    'filename' => $filename,
                    'foreground' => true,
                ]);
            } catch (\Throwable $pullError) {
                $response = Http::timeout(120)
                    ->withHeaders(['User-Agent' => 'MineControl/1.0 (Pterodactyl Blueprint)'])
                    ->get($data['downloadUrl']);

                if (!$response->successful()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to download addon from remote source.',
                    ], 502);
                }

                $this->files->setServer($server)->putContent($path, $response->body());
            }

            return response()->json([
                'success' => true,
                'path' => $path,
                'filename' => $filename,
            ]);
        } catch (DaemonConnectionException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not connect to Wings daemon.',
                'error' => $e->getMessage(),
            ], 500);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Unexpected error while installing addon.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove one or many selected plugins.
     */
    public function remove(Request $request): JsonResponse
    {
        $data = $request->validate([
            'serverUuid' => 'required|string|exists:servers,uuid',
            'directory' => 'nullable|string|in:plugins,mods',
            'files' => 'required|array|min:1|max:100',
            'files.*' => 'required|string|max:180',
        ]);

        $server = Server::where('uuid', $data['serverUuid'])->firstOrFail();
        $this->authorize('file.delete', $server);

        $directory = '/' . ($data['directory'] ?? 'plugins');
        $safe = [];

        foreach ($data['files'] as $file) {
            $base = basename($file);
            if ($base === '' || $base === '.' || $base === '..') {
                continue;
            }
            if (!preg_match('/\.(jar|jar\.disabled|disabled)$/i', $base)) {
                continue;
            }
            $safe[] = $base;
        }

        if (empty($safe)) {
            return response()->json([
                'success' => false,
                'message' => 'No valid plugin files selected.',
            ], 422);
        }

        try {
            $this->files->setServer($server)->deleteFiles($directory, $safe);

            return response()->json([
                'success' => true,
                'removed' => $safe,
            ]);
        } catch (DaemonConnectionException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not connect to Wings daemon.',
                'error' => $e->getMessage(),
            ], 500);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove selected addons.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Enable / disable a plugin by renaming .jar <-> .jar.disabled
     */
    public function toggle(Request $request): JsonResponse
    {
        $data = $request->validate([
            'serverUuid' => 'required|string|exists:servers,uuid',
            'directory' => 'nullable|string|in:plugins,mods',
            'filename' => 'required|string|max:180',
            'enable' => 'required|boolean',
        ]);

        $server = Server::where('uuid', $data['serverUuid'])->firstOrFail();
        $this->authorize('file.update', $server);

        $directory = '/' . ($data['directory'] ?? 'plugins');
        $filename = basename($data['filename']);

        $from = $filename;
        if ($data['enable']) {
            $to = preg_replace('/\.disabled$/i', '', $filename);
            if (!str_ends_with(strtolower($to), '.jar')) {
                $to .= '.jar';
            }
        } else {
            $to = str_ends_with(strtolower($filename), '.disabled')
                ? $filename
                : $filename . '.disabled';
        }

        if ($from === $to) {
            return response()->json([
                'success' => true,
                'filename' => $to,
                'enabled' => (bool) $data['enable'],
            ]);
        }

        try {
            $this->files->setServer($server)->renameFiles($directory, [
                ['from' => $from, 'to' => $to],
            ]);

            return response()->json([
                'success' => true,
                'filename' => $to,
                'enabled' => (bool) $data['enable'],
            ]);
        } catch (DaemonConnectionException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not connect to Wings daemon.',
                'error' => $e->getMessage(),
            ], 500);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle addon state.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Proxy Modrinth search so the panel never needs CORS workarounds.
     */
    public function search(Request $request): JsonResponse
    {
        $data = $request->validate([
            'query' => 'nullable|string|max:120',
            'offset' => 'nullable|integer|min:0|max:10000',
            'limit' => 'nullable|integer|min:1|max:40',
            'facets' => 'nullable|string|max:500',
            'index' => 'nullable|string|in:relevance,downloads,follows,newest,updated',
        ]);

        $params = [
            'query' => $data['query'] ?? '',
            'offset' => $data['offset'] ?? 0,
            'limit' => $data['limit'] ?? 12,
            'index' => $data['index'] ?? 'relevance',
        ];

        if (!empty($data['facets'])) {
            $params['facets'] = $data['facets'];
        }

        try {
            $response = Http::timeout(20)
                ->withHeaders(['User-Agent' => 'MineControl/1.0 (Pterodactyl Blueprint)'])
                ->get('https://api.modrinth.com/v2/search', $params);

            if (!$response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Modrinth search failed.',
                ], 502);
            }

            return response()->json([
                'success' => true,
                'data' => $response->json(),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not reach Modrinth API.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Fetch versions for a Modrinth project.
     */
    public function versions(Request $request): JsonResponse
    {
        $data = $request->validate([
            'projectId' => 'required|string|max:80',
        ]);

        $id = $data['projectId'];
        if (!preg_match('/^[a-zA-Z0-9_-]+$/', $id)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid project id.',
            ], 422);
        }

        try {
            $response = Http::timeout(20)
                ->withHeaders(['User-Agent' => 'MineControl/1.0 (Pterodactyl Blueprint)'])
                ->get("https://api.modrinth.com/v2/project/{$id}/version");

            if (!$response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to load project versions.',
                ], 502);
            }

            return response()->json([
                'success' => true,
                'versions' => $response->json(),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not reach Modrinth API.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
