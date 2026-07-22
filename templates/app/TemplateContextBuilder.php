<?php

namespace Pterodactyl\BlueprintFramework\Extensions\templates;

use Illuminate\Support\Facades\Http;
use Pterodactyl\Models\Server;

class TemplateContextBuilder
{
    public function build(Server $server, array $userVariables = []): array
    {
        $server->loadMissing(['user', 'node', 'allocations', 'egg', 'nest', 'variables']);

        $primary = $server->allocation;
        $allocations = $server->allocations->map(fn ($a) => [
            'id' => $a->id,
            'ip' => $a->ip,
            'alias' => $a->ip_alias,
            'port' => $a->port,
        ])->values()->all();

        $context = [
            'server' => [
                'id' => $server->id,
                'uuid' => $server->uuid,
                'uuidShort' => $server->uuidShort,
                'name' => $server->name,
                'description' => $server->description,
                'memory' => $server->memory,
                'disk' => $server->disk,
                'cpu' => $server->cpu,
                'node' => [
                    'id' => $server->node->id,
                    'name' => $server->node->name,
                    'fqdn' => $server->node->fqdn,
                ],
                'user' => [
                    'id' => $server->user->id,
                    'username' => $server->user->username,
                    'email' => $server->user->email,
                ],
                'allocation' => $primary ? [
                    'id' => $primary->id,
                    'ip' => $primary->ip,
                    'alias' => $primary->ip_alias,
                    'port' => $primary->port,
                ] : null,
                'allocations' => $allocations,
            ],
            'server_port' => $primary?->port ?? '',
            'egg' => $server->egg ? [
                'id' => $server->egg->id,
                'name' => $server->egg->name,
                'startup' => $server->egg->startup,
            ] : null,
            'nest' => $server->nest ? [
                'id' => $server->nest->id,
                'name' => $server->nest->name,
            ] : null,
        ];

        foreach ($userVariables as $key => $value) {
            $key = ltrim((string) $key, '$');
            $context[$key] = $value;
        }

        return $context;
    }

    public static function availableVariablesDoc(): array
    {
        return [
            ['$server[\'id\']', 'ID do servidor'],
            ['$server[\'uuid\']', 'UUID do servidor'],
            ['$server[\'name\']', 'Nome do servidor'],
            ['$server[\'node\'][\'id\']', 'ID do node'],
            ['$server[\'node\'][\'name\']', 'Nome do node'],
            ['$server[\'user\'][\'id\']', 'ID do dono'],
            ['$server[\'user\'][\'username\']', 'Username do dono'],
            ['$server[\'user\'][\'email\']', 'Email do dono'],
            ['$server[\'allocation\'][\'port\']', 'Porta principal'],
            ['$server_port', 'Porta principal (atalho)'],
            ['$server[\'allocations\']', 'Array de allocations'],
            ['$egg[\'id\']', 'ID do egg'],
            ['$egg[\'name\']', 'Nome do egg'],
            ['$egg[\'startup\']', 'Startup do egg'],
            ['$nest[\'id\']', 'ID do nest'],
            ['$nest[\'name\']', 'Nome do nest'],
            ['$request(\'GET\', \'url\')', 'HTTP request (Guzzle)'],
            ['$follow_redirects(\'url\')', 'Segue redirects e retorna URL final'],
        ];
    }
}
