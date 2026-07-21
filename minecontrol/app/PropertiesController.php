<?php

namespace {appcontext};

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;

class PropertiesController extends Controller
{
    private const PROPERTIES_PATH = '/server.properties';
    private const BACKUP_PATH = '/server.properties.minecontrol.bak';

    public function __construct(private DaemonFileRepository $files)
    {
    }

    /**
     * Read and parse server.properties into structured fields.
     */
    public function show(Request $request): JsonResponse
    {
        $data = $request->validate([
            'serverUuid' => 'required|string|exists:servers,uuid',
        ]);

        $server = Server::where('uuid', $data['serverUuid'])->firstOrFail();
        $this->authorize('file.read', $server);

        try {
            $raw = $this->files->setServer($server)->getContent(self::PROPERTIES_PATH);
        } catch (DaemonConnectionException $e) {
            return response()->json([
                'success' => false,
                'exists' => false,
                'message' => 'server.properties not found. Start the Minecraft server once to generate it.',
            ], 404);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'exists' => false,
                'message' => 'Unable to read server.properties.',
                'error' => $e->getMessage(),
            ], 500);
        }

        $parsed = $this->parseProperties($raw);
        $schema = $this->schema();

        $fields = [];
        $knownKeys = [];

        foreach ($schema as $group) {
            foreach ($group['fields'] as $field) {
                $key = $field['key'];
                $knownKeys[$key] = true;
                $fields[] = array_merge($field, [
                    'group' => $group['id'],
                    'group_label' => $group['label'],
                    'value' => array_key_exists($key, $parsed)
                        ? $parsed[$key]
                        : ($field['default'] ?? ''),
                    'present' => array_key_exists($key, $parsed),
                ]);
            }
        }

        $extras = [];
        foreach ($parsed as $key => $value) {
            if (isset($knownKeys[$key])) {
                continue;
            }
            $extras[] = [
                'key' => $key,
                'value' => $value,
            ];
        }

        return response()->json([
            'success' => true,
            'exists' => true,
            'path' => self::PROPERTIES_PATH,
            'groups' => array_map(fn ($g) => [
                'id' => $g['id'],
                'label' => $g['label'],
                'description' => $g['description'],
            ], $schema),
            'fields' => $fields,
            'extras' => $extras,
            'raw' => $raw,
        ]);
    }

    /**
     * Write updated properties back to the server.
     */
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'serverUuid' => 'required|string|exists:servers,uuid',
            'values' => 'required|array',
            'extras' => 'nullable|array',
            'create_backup' => 'nullable|boolean',
        ]);

        $server = Server::where('uuid', $data['serverUuid'])->firstOrFail();
        $this->authorize('file.update', $server);

        try {
            $existingRaw = '';
            try {
                $existingRaw = $this->files->setServer($server)->getContent(self::PROPERTIES_PATH);
            } catch (\Throwable $e) {
                $existingRaw = $this->defaultPropertiesTemplate();
            }

            if ($data['create_backup'] ?? true) {
                try {
                    $this->files->setServer($server)->putContent(self::BACKUP_PATH, $existingRaw);
                } catch (\Throwable $e) {
                    // Backup is best-effort; continue saving.
                }
            }

            $merged = $this->parseProperties($existingRaw);

            foreach ($data['values'] as $key => $value) {
                if (!is_string($key) || $key === '' || str_contains($key, '=')) {
                    continue;
                }
                if (!preg_match('/^[a-z0-9._-]+$/i', $key)) {
                    continue;
                }
                $merged[$key] = $this->stringifyValue($value);
            }

            if (!empty($data['extras']) && is_array($data['extras'])) {
                foreach ($data['extras'] as $extra) {
                    if (!is_array($extra)) {
                        continue;
                    }
                    $key = (string) ($extra['key'] ?? '');
                    if ($key === '' || !preg_match('/^[a-z0-9._-]+$/i', $key)) {
                        continue;
                    }
                    $merged[$key] = $this->stringifyValue($extra['value'] ?? '');
                }
            }

            $content = $this->buildPropertiesFile($merged, $existingRaw);
            $this->files->setServer($server)->putContent(self::PROPERTIES_PATH, $content);

            return response()->json([
                'success' => true,
                'path' => self::PROPERTIES_PATH,
                'backup' => self::BACKUP_PATH,
                'count' => count($merged),
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
                'message' => 'Failed to save server.properties.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function backup(Request $request): JsonResponse
    {
        $data = $request->validate([
            'serverUuid' => 'required|string|exists:servers,uuid',
        ]);

        $server = Server::where('uuid', $data['serverUuid'])->firstOrFail();
        $this->authorize('file.create', $server);

        try {
            $raw = $this->files->setServer($server)->getContent(self::PROPERTIES_PATH);
            $this->files->setServer($server)->putContent(self::BACKUP_PATH, $raw);

            return response()->json([
                'success' => true,
                'backup' => self::BACKUP_PATH,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create backup.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function restore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'serverUuid' => 'required|string|exists:servers,uuid',
        ]);

        $server = Server::where('uuid', $data['serverUuid'])->firstOrFail();
        $this->authorize('file.update', $server);

        try {
            $raw = $this->files->setServer($server)->getContent(self::BACKUP_PATH);
            $this->files->setServer($server)->putContent(self::PROPERTIES_PATH, $raw);

            return response()->json([
                'success' => true,
                'path' => self::PROPERTIES_PATH,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Backup not found or restore failed.',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    private function parseProperties(string $raw): array
    {
        $result = [];
        $lines = preg_split('/\r\n|\r|\n/', $raw) ?: [];

        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || str_starts_with($trimmed, '#')) {
                continue;
            }
            $pos = strpos($line, '=');
            if ($pos === false) {
                continue;
            }
            $key = trim(substr($line, 0, $pos));
            $value = substr($line, $pos + 1);
            if ($key === '') {
                continue;
            }
            $result[$key] = $value;
        }

        return $result;
    }

    private function buildPropertiesFile(array $values, string $originalRaw): string
    {
        $lines = preg_split('/\r\n|\r|\n/', $originalRaw) ?: [];
        $written = [];
        $output = [];

        if (empty($lines) || (count($lines) === 1 && trim($lines[0]) === '')) {
            $output[] = '#Minecraft server properties';
            $output[] = '#Edited by MineControl';
            foreach ($values as $key => $value) {
                $output[] = $key . '=' . $value;
            }

            return implode("\n", $output) . "\n";
        }

        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || str_starts_with($trimmed, '#')) {
                $output[] = $line;
                continue;
            }

            $pos = strpos($line, '=');
            if ($pos === false) {
                $output[] = $line;
                continue;
            }

            $key = trim(substr($line, 0, $pos));
            if (array_key_exists($key, $values)) {
                $output[] = $key . '=' . $values[$key];
                $written[$key] = true;
            } else {
                $output[] = $line;
            }
        }

        foreach ($values as $key => $value) {
            if (isset($written[$key])) {
                continue;
            }
            $output[] = $key . '=' . $value;
        }

        return implode("\n", $output) . "\n";
    }

    private function stringifyValue(mixed $value): string
    {
        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }
        if (is_int($value) || is_float($value)) {
            return (string) $value;
        }
        if ($value === null) {
            return '';
        }

        $str = trim((string) $value);
        // Prevent newline injection into properties file.
        return str_replace(["\r", "\n"], ['', ''], $str);
    }

    private function defaultPropertiesTemplate(): string
    {
        return "#Minecraft server properties\n#Generated by MineControl\n";
    }

    /**
     * UI schema for popular Minecraft Java Edition server.properties keys.
     */
    private function schema(): array
    {
        return [
            [
                'id' => 'general',
                'label' => 'General',
                'description' => 'Core identity and player limits.',
                'fields' => [
                    ['key' => 'motd', 'label' => 'MOTD', 'type' => 'text', 'default' => 'A Minecraft Server', 'help' => 'Message shown in the multiplayer server list.'],
                    ['key' => 'max-players', 'label' => 'Max players', 'type' => 'number', 'default' => '20', 'min' => 1, 'max' => 1000, 'help' => 'Maximum concurrent players.'],
                    ['key' => 'online-mode', 'label' => 'Online mode', 'type' => 'boolean', 'default' => 'true', 'help' => 'Verify players with Mojang/Microsoft authentication.'],
                    ['key' => 'white-list', 'label' => 'Whitelist', 'type' => 'boolean', 'default' => 'false', 'help' => 'Only allow whitelisted players.'],
                    ['key' => 'enforce-whitelist', 'label' => 'Enforce whitelist', 'type' => 'boolean', 'default' => 'false', 'help' => 'Kick players removed from whitelist immediately.'],
                    ['key' => 'force-gamemode', 'label' => 'Force gamemode', 'type' => 'boolean', 'default' => 'false', 'help' => 'Force default gamemode on join.'],
                ],
            ],
            [
                'id' => 'gameplay',
                'label' => 'Gameplay',
                'description' => 'Difficulty, mode and world rules.',
                'fields' => [
                    ['key' => 'gamemode', 'label' => 'Gamemode', 'type' => 'select', 'default' => 'survival', 'options' => ['survival', 'creative', 'adventure', 'spectator'], 'help' => 'Default game mode for new players.'],
                    ['key' => 'difficulty', 'label' => 'Difficulty', 'type' => 'select', 'default' => 'easy', 'options' => ['peaceful', 'easy', 'normal', 'hard'], 'help' => 'World difficulty.'],
                    ['key' => 'hardcore', 'label' => 'Hardcore', 'type' => 'boolean', 'default' => 'false', 'help' => 'Enables hardcore mode (sets difficulty to hard permanently).'],
                    ['key' => 'pvp', 'label' => 'PvP', 'type' => 'boolean', 'default' => 'true', 'help' => 'Allow player vs player combat.'],
                    ['key' => 'allow-flight', 'label' => 'Allow flight', 'type' => 'boolean', 'default' => 'false', 'help' => 'Allow flight in survival (may be needed for some mods).'],
                    ['key' => 'allow-nether', 'label' => 'Allow Nether', 'type' => 'boolean', 'default' => 'true', 'help' => 'Enable Nether dimension portals.'],
                    ['key' => 'spawn-monsters', 'label' => 'Spawn monsters', 'type' => 'boolean', 'default' => 'true'],
                    ['key' => 'spawn-animals', 'label' => 'Spawn animals', 'type' => 'boolean', 'default' => 'true'],
                    ['key' => 'spawn-npcs', 'label' => 'Spawn NPCs', 'type' => 'boolean', 'default' => 'true'],
                    ['key' => 'generate-structures', 'label' => 'Generate structures', 'type' => 'boolean', 'default' => 'true'],
                    ['key' => 'enable-command-block', 'label' => 'Command blocks', 'type' => 'boolean', 'default' => 'false'],
                ],
            ],
            [
                'id' => 'world',
                'label' => 'World & spawn',
                'description' => 'Spawn protection and world borders.',
                'fields' => [
                    ['key' => 'level-name', 'label' => 'Level name', 'type' => 'text', 'default' => 'world', 'help' => 'World folder name.'],
                    ['key' => 'level-seed', 'label' => 'Level seed', 'type' => 'text', 'default' => '', 'help' => 'World seed (only used when generating a new world).'],
                    ['key' => 'level-type', 'label' => 'Level type', 'type' => 'text', 'default' => 'minecraft\:normal', 'help' => 'World type / generator preset.'],
                    ['key' => 'spawn-protection', 'label' => 'Spawn protection', 'type' => 'number', 'default' => '16', 'min' => 0, 'max' => 1000],
                    ['key' => 'max-world-size', 'label' => 'Max world size', 'type' => 'number', 'default' => '29999984', 'min' => 1],
                    ['key' => 'player-idle-timeout', 'label' => 'Player idle timeout', 'type' => 'number', 'default' => '0', 'min' => 0, 'help' => 'Kick idle players after N minutes (0 = disabled).'],
                ],
            ],
            [
                'id' => 'performance',
                'label' => 'Performance',
                'description' => 'View distance and simulation tuning.',
                'fields' => [
                    ['key' => 'view-distance', 'label' => 'View distance', 'type' => 'number', 'default' => '10', 'min' => 2, 'max' => 32, 'help' => 'Chunk send distance to clients.'],
                    ['key' => 'simulation-distance', 'label' => 'Simulation distance', 'type' => 'number', 'default' => '10', 'min' => 2, 'max' => 32, 'help' => 'Chunk simulation radius.'],
                    ['key' => 'max-tick-time', 'label' => 'Max tick time', 'type' => 'number', 'default' => '60000', 'help' => 'Watchdog max tick time in ms (-1 to disable).'],
                    ['key' => 'network-compression-threshold', 'label' => 'Network compression', 'type' => 'number', 'default' => '256', 'help' => 'Packet size threshold for compression (-1 disables).'],
                    ['key' => 'entity-broadcast-range-percentage', 'label' => 'Entity broadcast %', 'type' => 'number', 'default' => '100', 'min' => 10, 'max' => 1000],
                ],
            ],
            [
                'id' => 'network',
                'label' => 'Network',
                'description' => 'Ports, RCON and query settings.',
                'fields' => [
                    ['key' => 'server-port', 'label' => 'Server port', 'type' => 'number', 'default' => '25565', 'min' => 1, 'max' => 65535, 'help' => 'Usually managed by Pterodactyl — change carefully.'],
                    ['key' => 'server-ip', 'label' => 'Server IP', 'type' => 'text', 'default' => '', 'help' => 'Leave empty unless you know you need a bind address.'],
                    ['key' => 'enable-status', 'label' => 'Enable status', 'type' => 'boolean', 'default' => 'true', 'help' => 'Appear in server lists / respond to status pings.'],
                    ['key' => 'enable-query', 'label' => 'Enable query', 'type' => 'boolean', 'default' => 'false'],
                    ['key' => 'query.port', 'label' => 'Query port', 'type' => 'number', 'default' => '25565'],
                    ['key' => 'enable-rcon', 'label' => 'Enable RCON', 'type' => 'boolean', 'default' => 'false'],
                    ['key' => 'rcon.port', 'label' => 'RCON port', 'type' => 'number', 'default' => '25575'],
                    ['key' => 'rcon.password', 'label' => 'RCON password', 'type' => 'password', 'default' => '', 'help' => 'Stored in server.properties on disk.'],
                    ['key' => 'broadcast-rcon-to-ops', 'label' => 'Broadcast RCON to ops', 'type' => 'boolean', 'default' => 'true'],
                    ['key' => 'prevent-proxy-connections', 'label' => 'Prevent proxy connections', 'type' => 'boolean', 'default' => 'false'],
                ],
            ],
            [
                'id' => 'security',
                'label' => 'Security & ops',
                'description' => 'Operator and permission related options.',
                'fields' => [
                    ['key' => 'op-permission-level', 'label' => 'OP permission level', 'type' => 'select', 'default' => '4', 'options' => ['1', '2', '3', '4']],
                    ['key' => 'function-permission-level', 'label' => 'Function permission level', 'type' => 'select', 'default' => '2', 'options' => ['1', '2', '3', '4']],
                    ['key' => 'broadcast-console-to-ops', 'label' => 'Broadcast console to ops', 'type' => 'boolean', 'default' => 'true'],
                    ['key' => 'enforce-secure-profile', 'label' => 'Enforce secure profile', 'type' => 'boolean', 'default' => 'true'],
                    ['key' => 'hide-online-players', 'label' => 'Hide online players', 'type' => 'boolean', 'default' => 'false'],
                ],
            ],
        ];
    }
}
