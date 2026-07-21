<?php

namespace {appcontext};

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Client\BlueprintClientLibrary;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;

class AddonController extends Controller
{
    public function __construct(
        private DaemonFileRepository $files,
        private BlueprintClientLibrary $blueprint,
    ) {}

    public function catalog(Request $request): JsonResponse
    {
        $server = $this->resolveServer($request);
        $this->authorize('file.read', $server);

        $catalog = $this->loadCatalog();
        $installed = $this->detectInstalled($server, $catalog['addons']);

        return response()->json([
            'success' => true,
            'addons' => $catalog['addons'],
            'installed' => $installed,
            'categories' => $this->categoriesFrom($catalog['addons']),
        ]);
    }

    public function install(Request $request): JsonResponse
    {
        $server = $this->resolveServer($request);
        $this->authorize('file.create', $server);

        $validated = $request->validate([
            'addonIds' => 'required|array|min:1|max:20',
            'addonIds.*' => 'required|string|max:64',
            'gameVersion' => 'nullable|string|max:32',
            'loader' => 'nullable|string|max:32',
        ]);

        $catalog = $this->loadCatalog();
        $byId = collect($catalog['addons'])->keyBy('id');
        $results = [];

        foreach ($validated['addonIds'] as $addonId) {
            $addon = $byId->get($addonId);
            if (!$addon) {
                $results[] = [
                    'id' => $addonId,
                    'success' => false,
                    'message' => 'Addon não encontrado no catálogo.',
                ];
                continue;
            }

            try {
                $results[] = $this->installAddon(
                    $server,
                    $addon,
                    $validated['gameVersion'] ?? null,
                    $validated['loader'] ?? 'paper'
                );
            } catch (\Throwable $e) {
                $results[] = [
                    'id' => $addonId,
                    'name' => $addon['name'] ?? $addonId,
                    'success' => false,
                    'message' => $e->getMessage(),
                ];
            }
        }

        $successCount = collect($results)->where('success', true)->count();

        return response()->json([
            'success' => $successCount > 0,
            'installed_count' => $successCount,
            'results' => $results,
            'message' => $successCount > 0
                ? "{$successCount} addon(s) instalado(s). Reinicie o servidor para aplicar."
                : 'Nenhum addon foi instalado.',
        ], $successCount > 0 ? 200 : 422);
    }

    public function remove(Request $request): JsonResponse
    {
        $server = $this->resolveServer($request);
        $this->authorize('file.delete', $server);

        $validated = $request->validate([
            'files' => 'required|array|min:1|max:50',
            'files.*' => 'required|string|max:255',
        ]);

        $grouped = [];
        $removed = [];

        foreach ($validated['files'] as $file) {
            $normalized = '/' . ltrim(str_replace('\\', '/', $file), '/');
            if (!preg_match('#^/(plugins|mods)/([^/]+\.jar)$#i', $normalized, $matches)) {
                return response()->json([
                    'success' => false,
                    'message' => "Caminho não permitido: {$normalized}",
                ], 422);
            }

            $root = '/' . trim(dirname($normalized), '/');
            $name = $matches[2];
            $grouped[$root][] = $name;
            $removed[] = $normalized;
        }

        try {
            foreach ($grouped as $root => $names) {
                $this->files->setServer($server)->deleteFiles($root, array_values(array_unique($names)));
            }

            return response()->json([
                'success' => true,
                'removed' => $removed,
                'message' => count($removed) . ' arquivo(s) removido(s). Reinicie o servidor para aplicar.',
            ]);
        } catch (DaemonConnectionException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Falha ao remover arquivos no daemon.',
                'error' => $e->getMessage(),
            ], 502);
        }
    }

    public function installedFiles(Request $request): JsonResponse
    {
        $server = $this->resolveServer($request);
        $this->authorize('file.read', $server);

        $directory = '/' . trim((string) $request->input('directory', 'plugins'), '/');
        if (!in_array($directory, ['/plugins', '/mods'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Diretório inválido.',
            ], 422);
        }

        try {
            $listing = $this->files->setServer($server)->getDirectory($directory);
            $jars = collect($listing)
                ->filter(function ($item) {
                    $name = strtolower((string) ($item['name'] ?? ''));
                    $isFile = (bool) ($item['is_file'] ?? $item['file'] ?? false);

                    return $isFile && str_ends_with($name, '.jar');
                })
                ->map(function ($item) use ($directory) {
                    $name = (string) ($item['name'] ?? '');

                    return [
                        'name' => $name,
                        'path' => rtrim($directory, '/') . '/' . $name,
                        'size' => $item['size'] ?? 0,
                        'modified_at' => $item['modified_at'] ?? ($item['modified'] ?? null),
                    ];
                })
                ->values()
                ->all();

            return response()->json([
                'success' => true,
                'directory' => $directory,
                'files' => $jars,
            ]);
        } catch (DaemonConnectionException $e) {
            return response()->json([
                'success' => true,
                'directory' => $directory,
                'files' => [],
                'warning' => 'Diretório ausente ou node offline.',
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function resolveServer(Request $request): Server
    {
        abort_unless($request->user(), 403);

        $request->validate([
            'serverUuid' => 'required|string|exists:servers,uuid',
        ]);

        return Server::where('uuid', $request->input('serverUuid'))->firstOrFail();
    }

    /**
     * @return array{addons: array<int, array<string, mixed>>}
     */
    private function loadCatalog(): array
    {
        $custom = $this->blueprint->dbGet('{identifier}', 'addons_catalog', null);
        if (is_string($custom) && $custom !== '') {
            $decoded = json_decode($custom, true);
            if (is_array($decoded) && isset($decoded['addons']) && is_array($decoded['addons'])) {
                return $decoded;
            }
        }

        $path = '{root/data}/addons.json';
        if (!is_file($path)) {
            return ['addons' => []];
        }

        $decoded = json_decode((string) file_get_contents($path), true);
        if (!is_array($decoded) || !isset($decoded['addons'])) {
            return ['addons' => []];
        }

        return $decoded;
    }

    /**
     * @param  array<string, mixed>  $addon
     * @return array<string, mixed>
     */
    private function installAddon(Server $server, array $addon, ?string $gameVersion, string $loader): array
    {
        $source = $addon['source'] ?? 'modrinth';
        if ($source !== 'modrinth') {
            throw new \RuntimeException('Fonte de addon não suportada.');
        }

        $project = $addon['project'] ?? null;
        if (!$project) {
            throw new \RuntimeException('Projeto Modrinth não configurado.');
        }

        $query = [
            'loaders' => json_encode([$loader, 'bukkit', 'spigot', 'paper', 'purpur']),
        ];
        if ($gameVersion) {
            $query['game_versions'] = json_encode([$gameVersion]);
        }

        $response = Http::timeout(30)
            ->withHeaders(['User-Agent' => 'MineSuite/1.0.0 (Pterodactyl Blueprint)'])
            ->get("https://api.modrinth.com/v2/project/{$project}/version", $query);

        if (!$response->successful()) {
            throw new \RuntimeException('Falha ao consultar o Modrinth.');
        }

        $versions = $response->json();
        if (!is_array($versions) || count($versions) === 0) {
            // fallback without filters
            $response = Http::timeout(30)
                ->withHeaders(['User-Agent' => 'MineSuite/1.0.0 (Pterodactyl Blueprint)'])
                ->get("https://api.modrinth.com/v2/project/{$project}/version");
            $versions = $response->json();
        }

        if (!is_array($versions) || count($versions) === 0) {
            throw new \RuntimeException('Nenhuma versão encontrada no Modrinth.');
        }

        $version = $versions[0];
        $files = $version['files'] ?? [];
        $primary = collect($files)->firstWhere('primary', true) ?? ($files[0] ?? null);
        if (!$primary || empty($primary['url']) || empty($primary['filename'])) {
            throw new \RuntimeException('Arquivo de download inválido.');
        }

        $download = Http::timeout(120)
            ->withHeaders(['User-Agent' => 'MineSuite/1.0.0 (Pterodactyl Blueprint)'])
            ->get($primary['url']);

        if (!$download->successful()) {
            throw new \RuntimeException('Download do addon falhou.');
        }

        $destination = trim((string) ($addon['destination'] ?? 'plugins'), '/');
        if (!in_array($destination, ['plugins', 'mods'], true)) {
            $destination = 'plugins';
        }

        $filename = basename((string) $primary['filename']);
        if (!str_ends_with(strtolower($filename), '.jar')) {
            throw new \RuntimeException('Somente arquivos .jar são permitidos.');
        }

        $path = '/' . $destination . '/' . $filename;
        $this->ensureDirectory($server, '/' . $destination);
        $this->files->setServer($server)->putContent($path, $download->body());

        return [
            'id' => $addon['id'],
            'name' => $addon['name'] ?? $addon['id'],
            'success' => true,
            'path' => $path,
            'version' => $version['version_number'] ?? ($version['name'] ?? 'unknown'),
            'message' => 'Instalado com sucesso.',
        ];
    }

    private function ensureDirectory(Server $server, string $directory): void
    {
        try {
            $this->files->setServer($server)->getDirectory($directory);
        } catch (\Throwable) {
            $parent = dirname($directory);
            $name = basename($directory);
            try {
                $this->files->setServer($server)->createDirectory($name, $parent === '\\' ? '/' : $parent);
            } catch (\Throwable) {
                // Directory may already exist or be created on write.
            }
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $addons
     * @return array<string, array{id: string, files: array<int, string>}>
     */
    private function detectInstalled(Server $server, array $addons): array
    {
        $installed = [];

        foreach (['/plugins', '/mods'] as $directory) {
            try {
                $listing = $this->files->setServer($server)->getDirectory($directory);
            } catch (\Throwable) {
                continue;
            }

            $names = collect($listing)
                ->map(fn ($item) => (string) ($item['name'] ?? ''))
                ->filter(fn ($name) => str_ends_with(strtolower($name), '.jar'))
                ->values()
                ->all();

            foreach ($addons as $addon) {
                $hint = strtolower((string) ($addon['filename_hint'] ?? $addon['id'] ?? ''));
                if ($hint === '') {
                    continue;
                }

                $matches = array_values(array_filter(
                    $names,
                    fn ($name) => str_contains(strtolower($name), $hint)
                ));

                if (count($matches) === 0) {
                    continue;
                }

                $id = (string) $addon['id'];
                $installed[$id] = [
                    'id' => $id,
                    'files' => array_map(
                        fn ($name) => rtrim($directory, '/') . '/' . $name,
                        $matches
                    ),
                ];
            }
        }

        return $installed;
    }

    /**
     * @param  array<int, array<string, mixed>>  $addons
     * @return array<int, string>
     */
    private function categoriesFrom(array $addons): array
    {
        return collect($addons)
            ->pluck('category')
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();
    }
}
