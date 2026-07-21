<?php

namespace Pterodactyl\BlueprintFramework\Extensions\bedrockversions;

use Pterodactyl\Models\Server;

class BedrockServerDetector
{
    /**
     * Detect whether a server is a Bedrock Dedicated Server target.
     */
    public function isBedrockServer(Server $server): bool
    {
        // 1) Startup variable BEDROCK_VERSION
        $hasVariable = $server->variables()
            ->where('env_variable', 'BEDROCK_VERSION')
            ->exists();

        if ($hasVariable) {
            return true;
        }

        // 2) Egg name / nest hints
        $egg = $server->egg;
        if ($egg) {
            $haystack = strtolower(($egg->name ?? '') . ' ' . ($egg->description ?? '') . ' ' . ($egg->author ?? ''));
            if (str_contains($haystack, 'bedrock') || str_contains($haystack, 'bds')) {
                return true;
            }
        }

        // 3) Docker image + debian yolk commonly used by Bedrock eggs
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

        return $value !== '' ? $value : null;
    }

    public function getChannelForVersion(string $version, array $catalog): string
    {
        foreach ($catalog['preview'] ?? [] as $row) {
            if (($row['version'] ?? '') === $version) {
                return 'preview';
            }
        }

        foreach ($catalog['stable'] ?? [] as $row) {
            if (($row['version'] ?? '') === $version) {
                return 'stable';
            }
        }

        return 'stable';
    }
}
