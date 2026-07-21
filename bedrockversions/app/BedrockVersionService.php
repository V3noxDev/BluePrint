<?php

namespace Pterodactyl\BlueprintFramework\Extensions\bedrockversions;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

class BedrockVersionService
{
    public const API_URL = 'https://net-secondary.web.minecraft-services.net/api/v1.0/download/links';
    public const TYPE_STABLE = 'serverBedrockLinux';
    public const TYPE_PREVIEW = 'serverBedrockPreviewLinux';

    public function __construct(private BlueprintExtensionLibrary $blueprint) {}

    public function syncFromApi(bool $force = false): array
    {
        $auto = ($this->blueprint->dbGet('bedrockversions', 'auto_sync') ?: 'true') === 'true';
        if (!$force && !$auto) {
            return $this->getCatalog();
        }

        try {
            $response = Http::timeout(20)->acceptJson()->get(self::API_URL);

            if (!$response->successful()) {
                Log::warning('[bedrockversions] API Mojang indisponível', ['status' => $response->status()]);
                return $this->getCatalog();
            }

            $links = $response->json('result.links') ?? [];
            $now = now();

            foreach ($links as $link) {
                $type = $link['downloadType'] ?? '';
                $url = $link['downloadUrl'] ?? '';

                $channel = match ($type) {
                    self::TYPE_STABLE => 'stable',
                    self::TYPE_PREVIEW => 'preview',
                    default => null,
                };

                if (!$channel || !$url) {
                    continue;
                }

                $version = $this->extractVersionFromUrl($url);
                if (!$version) {
                    continue;
                }

                $available = $this->isDownloadAvailable($url);

                BedrockVersion::query()
                    ->where('channel', $channel)
                    ->update(['is_latest' => false]);

                $existing = BedrockVersion::query()
                    ->where('channel', $channel)
                    ->where('version', $version)
                    ->first();

                $payload = [
                    'download_url' => $url,
                    'download_type' => $type,
                    'is_latest' => true,
                    'last_seen_at' => $now,
                ];

                // Store availability in download_type suffix? Better add column - for now use is_latest and skip unavailable
                if ($existing) {
                    if ($available) {
                        $existing->fill($payload)->save();
                    }
                } elseif ($available) {
                    BedrockVersion::query()->create(array_merge($payload, [
                        'channel' => $channel,
                        'version' => $version,
                        'first_seen_at' => $now,
                    ]));
                }
            }

            $this->mergeSeedVersions();
            $this->blueprint->dbSet('bedrockversions', 'last_sync', $now->toDateTimeString());
        } catch (\Throwable $e) {
            Log::warning('[bedrockversions] sync failed: ' . $e->getMessage());
        }

        return $this->getCatalog();
    }

    /**
     * Catalog shaped like commercial Versions UI.
     */
    public function getCatalog(): array
    {
        $this->mergeSeedVersions();

        $rows = BedrockVersion::query()->get();

        $groups = [
            'stable' => [],
            'preview' => [],
        ];

        foreach ($rows as $row) {
            $channel = $row->channel;
            if (!isset($groups[$channel])) {
                continue;
            }

            $groupKey = $this->versionGroupKey($row->version);
            $buildId = $this->versionBuildId($row->version);

            if (!isset($groups[$channel][$groupKey])) {
                $groups[$channel][$groupKey] = [
                    'id' => $groupKey,
                    'version' => $groupKey,
                    'type' => $channel === 'preview' ? 'PREVIEW' : 'RELEASE',
                    'channel' => $channel,
                    'builds' => [],
                    'is_latest_group' => false,
                ];
            }

            $groups[$channel][$groupKey]['builds'][] = [
                'id' => $buildId,
                'label' => 'Build #' . $buildId,
                'full_version' => $row->version,
                'download_url' => $row->download_url,
                'available' => true,
                'is_latest' => (bool) $row->is_latest,
            ];

            if ($row->is_latest) {
                $groups[$channel][$groupKey]['is_latest_group'] = true;
            }
        }

        $stable = $this->sortGroups(array_values($groups['stable']));
        $preview = $this->sortGroups(array_values($groups['preview']));

        foreach ([&$stable, &$preview] as &$list) {
            foreach ($list as &$group) {
                usort($group['builds'], function ($a, $b) {
                    return version_compare($b['full_version'], $a['full_version']);
                });
                $group['builds_count'] = count($group['builds']);
            }
        }
        unset($list, $group);

        $latestStable = collect($stable)->firstWhere('is_latest_group')['builds'][0]['full_version']
            ?? ($stable[0]['builds'][0]['full_version'] ?? null);
        $latestPreview = collect($preview)->firstWhere('is_latest_group')['builds'][0]['full_version']
            ?? ($preview[0]['builds'][0]['full_version'] ?? null);

        $stableBuilds = array_sum(array_column($stable, 'builds_count'));
        $previewBuilds = array_sum(array_column($preview, 'builds_count'));

        return [
            'software' => [
                [
                    'id' => 'bedrock',
                    'name' => 'Bedrock',
                    'icon' => '/extensions/bedrockversions/chest-face.png',
                    'status' => 'available',
                    'minecraft_versions' => count($stable) + count($preview),
                    'builds' => $stableBuilds + $previewBuilds,
                    'latest' => $latestStable,
                ],
                [
                    'id' => 'pocketmine',
                    'name' => 'PocketMine',
                    'icon' => null,
                    'status' => 'coming_soon',
                    'minecraft_versions' => 0,
                    'builds' => 0,
                    'latest' => null,
                ],
            ],
            'release' => $stable,
            'preview' => $preview,
            'latest_stable' => $latestStable,
            'latest_preview' => $latestPreview,
            'last_sync' => $this->blueprint->dbGet('bedrockversions', 'last_sync') ?: null,
        ];
    }

    public function getStats(): array
    {
        return [
            'stable' => BedrockVersion::query()->where('channel', 'stable')->count(),
            'preview' => BedrockVersion::query()->where('channel', 'preview')->count(),
        ];
    }

    public function findVersion(string $channel, string $version): ?BedrockVersion
    {
        return BedrockVersion::query()
            ->where('channel', $channel)
            ->where('version', $version)
            ->first();
    }

    public function buildDownloadUrl(string $channel, string $version): string
    {
        $cached = $this->findVersion($channel, $version);
        if ($cached) {
            return $cached->download_url;
        }

        if ($channel === 'preview') {
            return "https://www.minecraft.net/bedrockdedicatedserver/bin-linux-preview/bedrock-server-{$version}.zip";
        }

        return "https://www.minecraft.net/bedrockdedicatedserver/bin-linux/bedrock-server-{$version}.zip";
    }

    public function extractVersionFromUrl(string $url): ?string
    {
        if (preg_match('/bedrock-server-([0-9]+(?:\.[0-9]+){2,})\.zip/i', $url, $m)) {
            return $m[1];
        }

        return null;
    }

    public function isDownloadAvailable(string $url): bool
    {
        try {
            $response = Http::timeout(10)
                ->withHeaders(['User-Agent' => 'BedrockVersionManager/1.0'])
                ->head($url);

            if ($response->successful()) {
                return true;
            }

            // Some CDNs block HEAD — try a ranged GET
            $get = Http::timeout(10)
                ->withHeaders([
                    'User-Agent' => 'BedrockVersionManager/1.0',
                    'Range' => 'bytes=0-0',
                ])
                ->get($url);

            return $get->successful() || $get->status() === 206;
        } catch (\Throwable $e) {
            Log::debug('[bedrockversions] availability check failed: ' . $e->getMessage());
            // Don't drop newly discovered versions if CDN blocks probes
            return true;
        }
    }

    /** Group 1.26.33.2 → 1.26.33 */
    public function versionGroupKey(string $version): string
    {
        $parts = explode('.', $version);
        if (count($parts) >= 3) {
            return implode('.', array_slice($parts, 0, 3));
        }

        return $version;
    }

    /** Build id from 1.26.33.2 → 2 */
    public function versionBuildId(string $version): string
    {
        $parts = explode('.', $version);

        return (string) (end($parts) ?: '1');
    }

    private function sortGroups(array $groups): array
    {
        usort($groups, fn ($a, $b) => version_compare($b['version'], $a['version']));

        return $groups;
    }

    private function mergeSeedVersions(): void
    {
        $seedPath = base_path('.blueprint/extensions/bedrockversions/private/seed-versions.json');
        if (!file_exists($seedPath)) {
            $seedPath = __DIR__ . '/../data/seed-versions.json';
        }

        if (!file_exists($seedPath)) {
            return;
        }

        $seed = json_decode(file_get_contents($seedPath), true) ?: [];
        $now = now();

        foreach ($seed as $row) {
            $exists = BedrockVersion::query()
                ->where('channel', $row['channel'])
                ->where('version', $row['version'])
                ->exists();

            if ($exists) {
                continue;
            }

            BedrockVersion::query()->create([
                'channel' => $row['channel'],
                'version' => $row['version'],
                'download_url' => $row['download_url'],
                'download_type' => $row['download_type'],
                'is_latest' => false,
                'first_seen_at' => $now,
                'last_seen_at' => $now,
            ]);
        }
    }
}
