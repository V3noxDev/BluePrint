<?php

namespace {appcontext};

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\ValidationException;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;

class MinecraftPropertiesController extends Controller
{
    private const FILE_PATH = '/server.properties';
    private const MAX_FILE_SIZE = 131072;

    private const PROPERTY_DEFINITIONS = [
        'allow-flight' => ['label' => 'Allow Flight', 'category' => 'Gameplay', 'type' => 'boolean', 'description' => 'Allows players to fly if their client or mod permits it.'],
        'allow-nether' => ['label' => 'Allow Nether', 'category' => 'World', 'type' => 'boolean', 'description' => 'Enables travel to the Nether dimension.'],
        'broadcast-console-to-ops' => ['label' => 'Broadcast Console to OPs', 'category' => 'Admin', 'type' => 'boolean'],
        'broadcast-rcon-to-ops' => ['label' => 'Broadcast RCON to OPs', 'category' => 'Admin', 'type' => 'boolean'],
        'difficulty' => ['label' => 'Difficulty', 'category' => 'Gameplay', 'type' => 'select', 'options' => ['peaceful', 'easy', 'normal', 'hard']],
        'enable-command-block' => ['label' => 'Command Blocks', 'category' => 'Gameplay', 'type' => 'boolean'],
        'enable-jmx-monitoring' => ['label' => 'JMX Monitoring', 'category' => 'Advanced', 'type' => 'boolean'],
        'enable-query' => ['label' => 'Enable Query', 'category' => 'Network', 'type' => 'boolean'],
        'enable-rcon' => ['label' => 'Enable RCON', 'category' => 'Network', 'type' => 'boolean'],
        'enable-status' => ['label' => 'Enable Status', 'category' => 'Network', 'type' => 'boolean'],
        'enforce-secure-profile' => ['label' => 'Enforce Secure Profile', 'category' => 'Security', 'type' => 'boolean'],
        'enforce-whitelist' => ['label' => 'Enforce Whitelist', 'category' => 'Security', 'type' => 'boolean'],
        'entity-broadcast-range-percentage' => ['label' => 'Entity Broadcast Range', 'category' => 'Performance', 'type' => 'integer', 'min' => 10, 'max' => 1000],
        'force-gamemode' => ['label' => 'Force Gamemode', 'category' => 'Gameplay', 'type' => 'boolean'],
        'function-permission-level' => ['label' => 'Function Permission Level', 'category' => 'Admin', 'type' => 'integer', 'min' => 1, 'max' => 4],
        'gamemode' => ['label' => 'Gamemode', 'category' => 'Gameplay', 'type' => 'select', 'options' => ['survival', 'creative', 'adventure', 'spectator']],
        'generate-structures' => ['label' => 'Generate Structures', 'category' => 'World', 'type' => 'boolean'],
        'generator-settings' => ['label' => 'Generator Settings', 'category' => 'World', 'type' => 'string'],
        'hardcore' => ['label' => 'Hardcore', 'category' => 'Gameplay', 'type' => 'boolean'],
        'hide-online-players' => ['label' => 'Hide Online Players', 'category' => 'Privacy', 'type' => 'boolean'],
        'initial-disabled-packs' => ['label' => 'Initial Disabled Packs', 'category' => 'World', 'type' => 'string'],
        'initial-enabled-packs' => ['label' => 'Initial Enabled Packs', 'category' => 'World', 'type' => 'string'],
        'level-name' => ['label' => 'Level Name', 'category' => 'World', 'type' => 'string'],
        'level-seed' => ['label' => 'Level Seed', 'category' => 'World', 'type' => 'string'],
        'level-type' => ['label' => 'Level Type', 'category' => 'World', 'type' => 'select', 'options' => ['minecraft:normal', 'minecraft:flat', 'minecraft:large_biomes', 'minecraft:amplified', 'minecraft:single_biome_surface']],
        'log-ips' => ['label' => 'Log IPs', 'category' => 'Privacy', 'type' => 'boolean'],
        'max-chained-neighbor-updates' => ['label' => 'Max Chained Neighbor Updates', 'category' => 'Performance', 'type' => 'integer', 'min' => -1, 'max' => 10000000],
        'max-players' => ['label' => 'Max Players', 'category' => 'Gameplay', 'type' => 'integer', 'min' => 1, 'max' => 100000],
        'max-tick-time' => ['label' => 'Max Tick Time', 'category' => 'Performance', 'type' => 'integer', 'min' => -1, 'max' => 9223372036854775807],
        'max-world-size' => ['label' => 'Max World Size', 'category' => 'World', 'type' => 'integer', 'min' => 1, 'max' => 29999984],
        'motd' => ['label' => 'MOTD', 'category' => 'Branding', 'type' => 'string', 'description' => 'Text shown in the Minecraft multiplayer server list.'],
        'network-compression-threshold' => ['label' => 'Compression Threshold', 'category' => 'Network', 'type' => 'integer', 'min' => -1, 'max' => 65535],
        'online-mode' => ['label' => 'Online Mode', 'category' => 'Security', 'type' => 'boolean'],
        'op-permission-level' => ['label' => 'OP Permission Level', 'category' => 'Admin', 'type' => 'integer', 'min' => 1, 'max' => 4],
        'player-idle-timeout' => ['label' => 'Player Idle Timeout', 'category' => 'Gameplay', 'type' => 'integer', 'min' => 0, 'max' => 100000],
        'prevent-proxy-connections' => ['label' => 'Prevent Proxy Connections', 'category' => 'Security', 'type' => 'boolean'],
        'pvp' => ['label' => 'PvP', 'category' => 'Gameplay', 'type' => 'boolean'],
        'query.port' => ['label' => 'Query Port', 'category' => 'Network', 'type' => 'integer', 'min' => 1, 'max' => 65535],
        'rate-limit' => ['label' => 'Rate Limit', 'category' => 'Network', 'type' => 'integer', 'min' => 0, 'max' => 100000],
        'rcon.password' => ['label' => 'RCON Password', 'category' => 'Network', 'type' => 'secret'],
        'rcon.port' => ['label' => 'RCON Port', 'category' => 'Network', 'type' => 'integer', 'min' => 1, 'max' => 65535],
        'require-resource-pack' => ['label' => 'Require Resource Pack', 'category' => 'Branding', 'type' => 'boolean'],
        'resource-pack' => ['label' => 'Resource Pack URL', 'category' => 'Branding', 'type' => 'string'],
        'resource-pack-id' => ['label' => 'Resource Pack ID', 'category' => 'Branding', 'type' => 'string'],
        'resource-pack-prompt' => ['label' => 'Resource Pack Prompt', 'category' => 'Branding', 'type' => 'string'],
        'resource-pack-sha1' => ['label' => 'Resource Pack SHA1', 'category' => 'Branding', 'type' => 'string'],
        'server-ip' => ['label' => 'Server IP', 'category' => 'Network', 'type' => 'string'],
        'server-port' => ['label' => 'Server Port', 'category' => 'Network', 'type' => 'integer', 'min' => 1, 'max' => 65535],
        'simulation-distance' => ['label' => 'Simulation Distance', 'category' => 'Performance', 'type' => 'integer', 'min' => 2, 'max' => 32],
        'spawn-animals' => ['label' => 'Spawn Animals', 'category' => 'World', 'type' => 'boolean'],
        'spawn-monsters' => ['label' => 'Spawn Monsters', 'category' => 'World', 'type' => 'boolean'],
        'spawn-npcs' => ['label' => 'Spawn NPCs', 'category' => 'World', 'type' => 'boolean'],
        'spawn-protection' => ['label' => 'Spawn Protection', 'category' => 'World', 'type' => 'integer', 'min' => 0, 'max' => 100000],
        'sync-chunk-writes' => ['label' => 'Sync Chunk Writes', 'category' => 'Performance', 'type' => 'boolean'],
        'text-filtering-config' => ['label' => 'Text Filtering Config', 'category' => 'Advanced', 'type' => 'string'],
        'use-native-transport' => ['label' => 'Native Transport', 'category' => 'Performance', 'type' => 'boolean'],
        'view-distance' => ['label' => 'View Distance', 'category' => 'Performance', 'type' => 'integer', 'min' => 2, 'max' => 32],
        'white-list' => ['label' => 'Whitelist', 'category' => 'Security', 'type' => 'boolean'],
    ];

    public function __construct(private DaemonFileRepository $fileRepository)
    {
    }

    public function show(Request $request, string $server): JsonResponse
    {
        $serverModel = $this->resolveServer($server);
        $this->authorizeFileAccess($request, $serverModel, ['file.read', 'file.read-content']);

        $content = $this->fileRepository
            ->setServer($serverModel)
            ->getContent(self::FILE_PATH, self::MAX_FILE_SIZE);

        return response()->json([
            'data' => $this->formatResponse($content),
        ]);
    }

    public function update(Request $request, string $server): JsonResponse
    {
        $serverModel = $this->resolveServer($server);
        $this->authorizeFileAccess($request, $serverModel, ['file.update']);

        $payload = $request->validate([
            'properties' => ['required', 'array'],
            'create_backup' => ['sometimes', 'boolean'],
        ]);

        $original = $this->fileRepository
            ->setServer($serverModel)
            ->getContent(self::FILE_PATH, self::MAX_FILE_SIZE);

        $properties = $this->normaliseProperties($payload['properties']);
        $content = $this->renderProperties($original, $properties);

        if ((bool) Arr::get($payload, 'create_backup', true)) {
            $this->fileRepository
                ->setServer($serverModel)
                ->putContent('/server.properties.blueprint.bak', $original);
        }

        $this->fileRepository
            ->setServer($serverModel)
            ->putContent(self::FILE_PATH, $content);

        return response()->json([
            'data' => $this->formatResponse($content),
        ]);
    }

    public function raw(Request $request, string $server): JsonResponse
    {
        $serverModel = $this->resolveServer($server);
        $this->authorizeFileAccess($request, $serverModel, ['file.update']);

        $payload = $request->validate([
            'content' => ['required', 'string', 'max:' . self::MAX_FILE_SIZE],
            'create_backup' => ['sometimes', 'boolean'],
        ]);

        $original = $this->fileRepository
            ->setServer($serverModel)
            ->getContent(self::FILE_PATH, self::MAX_FILE_SIZE);

        if ((bool) Arr::get($payload, 'create_backup', true)) {
            $this->fileRepository
                ->setServer($serverModel)
                ->putContent('/server.properties.blueprint.bak', $original);
        }

        $content = str_replace(["\r\n", "\r"], "\n", $payload['content']);
        $this->fileRepository
            ->setServer($serverModel)
            ->putContent(self::FILE_PATH, rtrim($content, "\n") . "\n");

        return response()->json([
            'data' => $this->formatResponse($content),
        ]);
    }

    private function resolveServer(string $identifier): Server
    {
        $query = Server::query()
            ->where('uuid', $identifier)
            ->orWhere('uuid', 'like', $identifier . '%');

        if (ctype_digit($identifier)) {
            $query->orWhere('id', (int) $identifier);
        }

        /** @var Server|null $server */
        $server = $query->first();

        abort_unless($server instanceof Server, 404, 'Server not found.');

        return $server;
    }

    private function authorizeFileAccess(Request $request, Server $server, array $acceptedPermissions): void
    {
        $user = $request->user();

        abort_unless($user, 403, 'You must be authenticated to use this extension.');

        $ownerId = $server->owner_id ?? $server->user_id ?? null;
        if ((bool) ($user->root_admin ?? false) || (int) $ownerId === (int) $user->id) {
            return;
        }

        $subuser = $server->subusers()->where('user_id', $user->id)->first();
        abort_unless($subuser, 403, 'You do not have access to this server.');

        $permissions = $this->normalisePermissionList($subuser->permissions ?? []);
        foreach ($acceptedPermissions as $permission) {
            if (in_array($permission, $permissions, true)) {
                return;
            }
        }

        abort(403, 'You need file permissions to edit server.properties.');
    }

    private function normalisePermissionList(mixed $permissions): array
    {
        if ($permissions instanceof \Illuminate\Support\Collection) {
            $permissions = $permissions->all();
        }

        if (is_string($permissions)) {
            $decoded = json_decode($permissions, true);
            $permissions = is_array($decoded) ? $decoded : [$permissions];
        }

        if (!is_array($permissions)) {
            return [];
        }

        return array_values(array_filter(array_map('strval', $permissions)));
    }

    private function normaliseProperties(array $properties): array
    {
        $normalised = [];

        foreach ($properties as $key => $value) {
            $key = trim((string) $key);
            if (!preg_match('/^[A-Za-z0-9._-]+$/', $key)) {
                throw ValidationException::withMessages([
                    'properties' => "Invalid property key: {$key}",
                ]);
            }

            $definition = self::PROPERTY_DEFINITIONS[$key] ?? ['type' => 'string'];
            $normalised[$key] = $this->normaliseValue($key, $value, $definition);
        }

        return $normalised;
    }

    private function normaliseValue(string $key, mixed $value, array $definition): string
    {
        $type = $definition['type'] ?? 'string';

        if ($type === 'boolean') {
            if (is_bool($value)) {
                return $value ? 'true' : 'false';
            }

            $value = strtolower(trim((string) $value));
            if (!in_array($value, ['true', 'false'], true)) {
                throw ValidationException::withMessages([
                    "properties.{$key}" => "{$key} must be true or false.",
                ]);
            }

            return $value;
        }

        if ($type === 'integer') {
            if (!is_numeric($value) || (string) (int) $value !== trim((string) $value)) {
                throw ValidationException::withMessages([
                    "properties.{$key}" => "{$key} must be an integer.",
                ]);
            }

            $integer = (int) $value;
            if (array_key_exists('min', $definition) && $integer < $definition['min']) {
                throw ValidationException::withMessages([
                    "properties.{$key}" => "{$key} must be at least {$definition['min']}.",
                ]);
            }

            if (array_key_exists('max', $definition) && $integer > $definition['max']) {
                throw ValidationException::withMessages([
                    "properties.{$key}" => "{$key} must be at most {$definition['max']}.",
                ]);
            }

            return (string) $integer;
        }

        if ($type === 'select') {
            $value = trim((string) $value);
            if (!in_array($value, $definition['options'] ?? [], true)) {
                throw ValidationException::withMessages([
                    "properties.{$key}" => "{$key} has an unsupported value.",
                ]);
            }

            return $value;
        }

        $value = str_replace(["\r", "\n"], ' ', (string) $value);
        if (strlen($value) > 4096) {
            throw ValidationException::withMessages([
                "properties.{$key}" => "{$key} is too long.",
            ]);
        }

        return $value;
    }

    private function formatResponse(string $content): array
    {
        $parsed = $this->parseProperties($content);
        $categories = array_values(array_unique(array_map(
            static fn (array $property): string => $property['category'],
            $parsed['properties']
        )));
        sort($categories);

        return [
            'path' => self::FILE_PATH,
            'backup_path' => '/server.properties.blueprint.bak',
            'content' => $content,
            'properties' => $parsed['properties'],
            'comments' => $parsed['comments'],
            'definitions' => self::PROPERTY_DEFINITIONS,
            'categories' => $categories,
            'stats' => [
                'properties' => count($parsed['properties']),
                'comments' => count($parsed['comments']),
                'bytes' => strlen($content),
            ],
        ];
    }

    private function parseProperties(string $content): array
    {
        $properties = [];
        $comments = [];
        $lines = preg_split('/\R/', $content);

        foreach ($lines as $index => $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || str_starts_with($trimmed, '#') || str_starts_with($trimmed, '!')) {
                if ($trimmed !== '') {
                    $comments[] = ['line' => $index + 1, 'value' => $line];
                }

                continue;
            }

            $parsed = $this->parseLine($line);
            if (!$parsed) {
                continue;
            }

            [$key, $value] = $parsed;
            $definition = self::PROPERTY_DEFINITIONS[$key] ?? [
                'label' => $key,
                'category' => 'Custom',
                'type' => 'string',
                'description' => 'Custom or version-specific Minecraft property.',
            ];

            $properties[] = [
                'key' => $key,
                'value' => $value,
                'line' => $index + 1,
                'label' => $definition['label'] ?? $key,
                'category' => $definition['category'] ?? 'Custom',
                'type' => $definition['type'] ?? 'string',
                'options' => $definition['options'] ?? [],
                'min' => $definition['min'] ?? null,
                'max' => $definition['max'] ?? null,
                'description' => $definition['description'] ?? '',
                'secret' => ($definition['type'] ?? '') === 'secret',
            ];
        }

        return ['properties' => $properties, 'comments' => $comments];
    }

    private function renderProperties(string $original, array $properties): string
    {
        $lines = preg_split('/\R/', rtrim($original, "\r\n"));
        $written = [];

        foreach ($lines as $index => $line) {
            $parsed = $this->parseLine($line);
            if (!$parsed) {
                continue;
            }

            [$key] = $parsed;
            if (array_key_exists($key, $properties)) {
                $lines[$index] = $key . '=' . $properties[$key];
                $written[$key] = true;
            }
        }

        $missing = array_diff_key($properties, $written);
        if ($missing) {
            $lines[] = '';
            $lines[] = '# Added by Minecraft Properties Blueprint';
            foreach ($missing as $key => $value) {
                $lines[] = $key . '=' . $value;
            }
        }

        return implode("\n", $lines) . "\n";
    }

    private function parseLine(string $line): ?array
    {
        if (!preg_match('/^\s*([^:=\s]+)\s*(?:[:=]|\s)\s*(.*)$/', $line, $matches)) {
            return null;
        }

        return [$matches[1], $matches[2] ?? ''];
    }
}
