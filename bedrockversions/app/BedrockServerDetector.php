<?php

namespace Pterodactyl\BlueprintFramework\Extensions\bedrockversions;

use Pterodactyl\Models\Server;

class BedrockServerDetector
{
    public function isBedrockServer(Server $server): bool
    {
        $hasVariable = $server->variables()
            ->where('env_variable', 'BEDROCK_VERSION')
            ->exists();

        if ($hasVariable) {
            return true;
        }

        $egg = $server->egg;
        if ($egg) {
            $haystack = strtolower(($egg->name ?? '') . ' ' . ($egg->description ?? '') . ' ' . ($egg->author ?? ''));
            if (str_contains($haystack, 'bedrock') || str_contains($haystack, 'bds')) {
                return true;
            }
        }

        $image = strtolower((string) $server->image);
        if (
            str_contains($image, 'yolks:debian')
            && $egg
            && str_contains(strtolower($egg->name ?? ''), 'bedrock')
        ) {
            return true;
        }

        return false;
    }

    public function getCurrentVersion(Server $server): ?string
    {
        $variable = $server->variables()
            ->where('env_variable', 'BEDROCK_VERSION')
            ->first();

        if (!$variable) {
            return null;
        }

        $value = $variable->server_value ?? $variable->default_value ?? null;

        return $value !== '' && $value !== null ? (string) $value : null;
    }

    public function getChannelForVersion(string $version, array $catalog): string
    {
        foreach ($catalog['preview'] ?? [] as $group) {
            foreach ($group['builds'] ?? [] as $build) {
                if (($build['full_version'] ?? '') === $version) {
                    return 'preview';
                }
            }
        }

        return 'stable';
    }

    public function findBuildMeta(string $version, array $catalog): array
    {
        foreach (['release', 'preview'] as $bucket) {
            foreach ($catalog[$bucket] ?? [] as $group) {
                foreach ($group['builds'] ?? [] as $build) {
                    if (($build['full_version'] ?? '') === $version) {
                        return [
                            'group' => $group['version'],
                            'build' => $build['id'],
                            'channel' => $group['channel'] ?? ($bucket === 'preview' ? 'preview' : 'stable'),
                            'type' => $group['type'] ?? 'RELEASE',
                        ];
                    }
                }
            }
        }

        return [
            'group' => $version,
            'build' => null,
            'channel' => 'stable',
            'type' => 'RELEASE',
        ];
    }
}
