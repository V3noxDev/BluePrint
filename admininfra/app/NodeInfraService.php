<?php

namespace Pterodactyl\BlueprintFramework\Extensions\admininfra;

use Pterodactyl\Models\Node;
use Pterodactyl\Repositories\Eloquent\NodeRepository;
use Pterodactyl\Repositories\Wings\DaemonConfigurationRepository;

class NodeInfraService
{
    public function __construct(
        private NodeRepository $nodes,
        private DaemonConfigurationRepository $daemon,
    ) {}

    public function stats(Node $node): array
    {
        $raw = $this->nodes->getUsageStatsRaw($node);

        $memory = [
            'configured' => (int) $node->memory,
            'max' => $this->maxResource($node, 'memory'),
            'allocated' => (int) ($raw['memory']['value'] ?? 0),
            'real' => 0,
            'physical' => 0,
        ];

        $disk = [
            'configured' => (int) $node->disk,
            'max' => $this->maxResource($node, 'disk'),
            'allocated' => (int) ($raw['disk']['value'] ?? 0),
            'real' => 0,
        ];

        $wings = $this->fetchWings($node);
        if ($wings !== null) {
            $memory['physical'] = (int) round(($wings['system']['memory_bytes'] ?? 0) / 1048576);

            foreach ($wings['servers'] as $server) {
                if (!is_array($server)) {
                    continue;
                }

                $util = $server['utilization'] ?? [];
                $memory['real'] += (int) round(($util['memory_bytes'] ?? 0) / 1048576);
                $disk['real'] += (int) round(($util['disk_bytes'] ?? 0) / 1048576);
            }
        }

        return [
            'connected' => $wings !== null,
            'memory' => $memory,
            'disk' => $disk,
        ];
    }

    private function maxResource(Node $node, string $key): int
    {
        $base = (int) $node->{$key};
        $overallocate = (int) $node->{$key . '_overallocate'};

        if ($overallocate > 0) {
            return (int) floor($base * (1 + ($overallocate / 100)));
        }

        return $base;
    }

    private function fetchWings(Node $node): ?array
    {
        try {
            $repository = $this->daemon->setNode($node);
            $system = $repository->getSystemInformation(2);
            $response = $repository->getHttpClient()->get('/api/servers');
            $servers = json_decode($response->getBody()->__toString(), true);

            return [
                'system' => is_array($system['system'] ?? null) ? $system['system'] : [],
                'servers' => is_array($servers) ? $servers : [],
            ];
        } catch (\Throwable) {
            return null;
        }
    }
}
