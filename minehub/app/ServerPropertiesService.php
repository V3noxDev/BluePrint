<?php

namespace Pterodactyl\BlueprintFramework\Extensions\minehub;

class ServerPropertiesService
{
    private const PROPERTIES_FILE = '/server.properties';

    public static function parse(string $content): array
    {
        $properties = [];
        $lines = preg_split('/\r\n|\r|\n/', $content);

        foreach ($lines as $line) {
            $line = trim($line);

            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            $parts = explode('=', $line, 2);
            if (count($parts) === 2) {
                $properties[trim($parts[0])] = trim($parts[1]);
            }
        }

        return $properties;
    }

    public static function serialize(array $properties, ?string $original = null): string
    {
        $comments = [];
        $order = [];

        if ($original !== null) {
            foreach (preg_split('/\r\n|\r|\n/', $original) as $line) {
                $trimmed = trim($line);

                if ($trimmed === '' || str_starts_with($trimmed, '#')) {
                    $comments[] = $line;
                    continue;
                }

                $parts = explode('=', $trimmed, 2);
                if (count($parts) === 2) {
                    $key = trim($parts[0]);
                    if (!in_array($key, $order, true)) {
                        $order[] = $key;
                    }
                }
            }
        }

        foreach (array_keys($properties) as $key) {
            if (!in_array($key, $order, true)) {
                $order[] = $key;
            }
        }

        $lines = $comments;
        if (!empty($comments)) {
            $lines[] = '';
        }

        foreach ($order as $key) {
            if (array_key_exists($key, $properties)) {
                $lines[] = $key . '=' . $properties[$key];
            }
        }

        return implode("\n", $lines) . "\n";
    }

    public static function getDefinitions(): array
    {
        return [
            'general' => [
                'label' => 'Geral',
                'icon' => '⚙️',
                'fields' => [
                    ['key' => 'motd', 'label' => 'MOTD', 'type' => 'text', 'description' => 'Mensagem exibida na lista de servidores.'],
                    ['key' => 'max-players', 'label' => 'Máximo de jogadores', 'type' => 'number', 'min' => 1, 'max' => 1000],
                    ['key' => 'server-port', 'label' => 'Porta do servidor', 'type' => 'number', 'min' => 1, 'max' => 65535],
                    ['key' => 'online-mode', 'label' => 'Modo online (Mojang)', 'type' => 'boolean', 'description' => 'Verifica contas oficiais da Mojang.'],
                    ['key' => 'white-list', 'label' => 'Whitelist ativa', 'type' => 'boolean'],
                    ['key' => 'enforce-whitelist', 'label' => 'Forçar whitelist', 'type' => 'boolean'],
                ],
            ],
            'gameplay' => [
                'label' => 'Gameplay',
                'icon' => '🎮',
                'fields' => [
                    ['key' => 'gamemode', 'label' => 'Modo de jogo', 'type' => 'select', 'options' => ['survival', 'creative', 'adventure', 'spectator']],
                    ['key' => 'difficulty', 'label' => 'Dificuldade', 'type' => 'select', 'options' => ['peaceful', 'easy', 'normal', 'hard']],
                    ['key' => 'hardcore', 'label' => 'Hardcore', 'type' => 'boolean'],
                    ['key' => 'pvp', 'label' => 'PvP', 'type' => 'boolean'],
                    ['key' => 'force-gamemode', 'label' => 'Forçar modo de jogo', 'type' => 'boolean'],
                    ['key' => 'spawn-protection', 'label' => 'Proteção do spawn', 'type' => 'number', 'min' => 0, 'max' => 100],
                    ['key' => 'player-idle-timeout', 'label' => 'Timeout AFK (min)', 'type' => 'number', 'min' => 0, 'max' => 60],
                ],
            ],
            'world' => [
                'label' => 'Mundo',
                'icon' => '🌍',
                'fields' => [
                    ['key' => 'level-name', 'label' => 'Nome do mundo', 'type' => 'text'],
                    ['key' => 'level-seed', 'label' => 'Seed', 'type' => 'text'],
                    ['key' => 'level-type', 'label' => 'Tipo de mundo', 'type' => 'select', 'options' => ['minecraft:normal', 'minecraft:flat', 'minecraft:large_biomes', 'minecraft:amplified']],
                    ['key' => 'generate-structures', 'label' => 'Gerar estruturas', 'type' => 'boolean'],
                    ['key' => 'spawn-animals', 'label' => 'Spawnar animais', 'type' => 'boolean'],
                    ['key' => 'spawn-monsters', 'label' => 'Spawnar monstros', 'type' => 'boolean'],
                    ['key' => 'spawn-npcs', 'label' => 'Spawnar NPCs', 'type' => 'boolean'],
                    ['key' => 'allow-nether', 'label' => 'Permitir Nether', 'type' => 'boolean'],
                    ['key' => 'allow-flight', 'label' => 'Permitir voo', 'type' => 'boolean'],
                ],
            ],
            'performance' => [
                'label' => 'Performance',
                'icon' => '🚀',
                'fields' => [
                    ['key' => 'view-distance', 'label' => 'Distância de visão', 'type' => 'number', 'min' => 2, 'max' => 32],
                    ['key' => 'simulation-distance', 'label' => 'Distância de simulação', 'type' => 'number', 'min' => 2, 'max' => 32],
                    ['key' => 'network-compression-threshold', 'label' => 'Compressão de rede', 'type' => 'number', 'min' => -1, 'max' => 1024],
                    ['key' => 'max-tick-time', 'label' => 'Max tick time (ms)', 'type' => 'number', 'min' => -1, 'max' => 60000],
                    ['key' => 'sync-chunk-writes', 'label' => 'Sync chunk writes', 'type' => 'boolean'],
                ],
            ],
            'advanced' => [
                'label' => 'Avançado',
                'icon' => '🔧',
                'fields' => [
                    ['key' => 'enable-command-block', 'label' => 'Command blocks', 'type' => 'boolean'],
                    ['key' => 'enable-rcon', 'label' => 'RCON', 'type' => 'boolean'],
                    ['key' => 'rcon.port', 'label' => 'Porta RCON', 'type' => 'number', 'min' => 1, 'max' => 65535],
                    ['key' => 'enable-query', 'label' => 'Query', 'type' => 'boolean'],
                    ['key' => 'query.port', 'label' => 'Porta Query', 'type' => 'number', 'min' => 1, 'max' => 65535],
                    ['key' => 'enable-status', 'label' => 'Status do servidor', 'type' => 'boolean'],
                    ['key' => 'hide-online-players', 'label' => 'Ocultar jogadores online', 'type' => 'boolean'],
                ],
            ],
        ];
    }

    public static function getFilePath(): string
    {
        return self::PROPERTIES_FILE;
    }
}
