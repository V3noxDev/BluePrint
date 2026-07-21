<?php

namespace Pterodactyl\BlueprintFramework\Extensions\bedrockversions;

use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

class BedrockVersionService
{
    /** Official Mojang links (latest only) */
    public const MOJANG_API = 'https://net-secondary.web.minecraft-services.net/api/v1.0/download/links';

    /** Full historical catalog (Linux stable + preview) */
    public const CATALOG_API = 'https://raw.githubusercontent.com/Bedrock-OSS/BDS-Versions/main/versions.json';

    public const TYPE_STABLE = 'serverBedrockLinux';
    public const TYPE_PREVIEW = 'serverBedrockPreviewLinux';
    public const SYNC_TTL_MINUTES = 30;

    public function __construct(private BlueprintExtensionLibrary $blueprint) {}

    public function syncFromApi(bool $force = false): array
    {
        if (!$force && !$this->shouldSync()) {
            return $this->getCatalog();
        }

        try {
            $this->importFullCatalog();
            $this->importLatestFromMojang();
            $this->recomputeLatestFlags();
            $this->blueprint->dbSet('bedrockversions', 'last_sync', now()->toDateTimeString());
        } catch (\Throwable $e) {
            Log::warning('[bedrockversions] sync failed: ' . $e->getMessage());
            $this->recomputeLatestFlags();
        }

        return $this->getCatalog();
    }

    public function shouldSync(): bool
    {
        $auto = ($this->blueprint->dbGet('bedrockversions', 'auto_sync') ?: 'true') === 'true';
        if (!$auto) {
            return false;
        }

        $last = $this->blueprint->dbGet('bedrockversions', 'last_sync');
        if (!$last) {
            return true;
        }

        try {
            return Carbon::parse($last)->diffInMinutes(now()) >= self::SYNC_TTL_MINUTES;
        } catch (\Throwable) {
            return true;
        }
    }

    /**
     * Import ALL known Linux BDS versions from Bedrock-OSS archive.
     */
    private function importFullCatalog(): void
    {
        $response = Http::timeout(45)
            ->withHeaders(['User-Agent' => 'BedrockVersionManager/1.3'])
            ->get(self::CATALOG_API);

        if (!$response->successful()) {
            throw new \RuntimeException('Catálogo BDS-Versions indisponível (HTTP ' . $response->status() . ')');
        }

        $json = $response->json();
        $linux = $json['linux'] ?? [];
        $now = now();

        $stableList = $linux['versions'] ?? [];
        $previewList = $linux['preview_versions'] ?? [];

        foreach ($stableList as $version) {
            $this->upsertVersion(
                'stable',
                (string) $version,
                $this->buildDownloadUrl('stable', (string) $version),
                self::TYPE_STABLE,
                $now
            );
        }

        foreach ($previewList as $version) {
            $this->upsertVersion(
                'preview',
                (string) $version,
                $this->buildDownloadUrl('preview', (string) $version),
                self::TYPE_PREVIEW,
                $now
            );
        }

        Log::info('[bedrockversions] catálogo importado', [
            'stable' => count($stableList),
            'preview' => count($previewList),
        ]);
    }

    /**
     * Pick up brand-new versions from Mojang (may not be in archive yet).
     */
    private function importLatestFromMojang(): void
    {
        $response = Http::timeout(20)
            ->withHeaders(['User-Agent' => 'BedrockVersionManager/1.3'])
            ->acceptJson()
            ->get(self::MOJANG_API);

        if (!$response->successful()) {
            return;
        }

        $now = now();
        foreach ($response->json('result.links') ?? [] as $link) {
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

            $this->upsertVersion($channel, $version, $url, $type, $now);
        }
    }

    private function upsertVersion(
        string $channel,
        string $version,
        string $url,
        string $type,
        $now
    ): void {
        $existing = BedrockVersion::query()
            ->where('channel', $channel)
            ->where('version', $version)
            ->first();

        if ($existing) {
            $existing->fill([
                'download_url' => $url,
                'download_type' => $type,
                'last_seen_at' => $now,
            ])->save();

            return;
        }

        BedrockVersion::query()->create([
            'channel' => $channel,
            'version' => $version,
            'download_url' => $url,
            'download_type' => $type,
            'is_latest' => false,
            'first_seen_at' => $now,
            'last_seen_at' => $now,
        ]);
    }

    public function recomputeLatestFlags(): void
    {
        foreach (['stable', 'preview'] as $channel) {
            $versions = BedrockVersion::query()
                ->where('channel', $channel)
                ->pluck('version')
                ->all();

            if (empty($versions)) {
                continue;
            }

            usort($versions, fn ($a, $b) => version_compare($b, $a));
            $latest = $versions[0];

            BedrockVersion::query()
                ->where('channel', $channel)
                ->update(['is_latest' => false]);

            BedrockVersion::query()
                ->where('channel', $channel)
                ->where('version', $latest)
                ->update(['is_latest' => true]);
        }
    }

    public function getCatalog(): array
    {
        // If DB empty, force a sync once
        if (!BedrockVersion::query()->exists()) {
            try {
                $this->importFullCatalog();
                $this->importLatestFromMojang();
                $this->recomputeLatestFlags();
                $this->blueprint->dbSet('bedrockversions', 'last_sync', now()->toDateTimeString());
            } catch (\Throwable $e) {
                Log::warning('[bedrockversions] bootstrap catalog failed: ' . $e->getMessage());
            }
        }

        $this->recomputeLatestFlags();

        $rows = BedrockVersion::query()->get();
        $groups = ['stable' => [], 'preview' => []];

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
                usort($group['builds'], fn ($a, $b) => version_compare($b['full_version'], $a['full_version']));
                $group['builds_count'] = count($group['builds']);
                // Always RELEASE / PREVIEW labels (never "LATEST" as type)
                $group['type'] = ($group['channel'] ?? '') === 'preview' ? 'PREVIEW' : 'RELEASE';
            }
        }
        unset($list, $group);

        $latestStable = $this->findLatestFullVersion($stable);
        $latestPreview = $this->findLatestFullVersion($preview);
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
            'latest_stable' => BedrockVersion::query()->where('channel', 'stable')->where('is_latest', true)->value('version'),
            'latest_preview' => BedrockVersion::query()->where('channel', 'preview')->where('is_latest', true)->value('version'),
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
        if ($cached && $cached->download_url) {
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
            $response = Http::timeout(12)
                ->withHeaders(['User-Agent' => 'BedrockVersionManager/1.3'])
                ->head($url);

            if ($response->successful()) {
                return true;
            }

            $get = Http::timeout(12)
                ->withHeaders([
                    'User-Agent' => 'BedrockVersionManager/1.3',
                    'Range' => 'bytes=0-0',
                ])
                ->get($url);

            return $get->successful() || $get->status() === 206;
        } catch (\Throwable $e) {
            return true;
        }
    }

    public function versionGroupKey(string $version): string
    {
        $parts = explode('.', $version);
        if (count($parts) >= 3) {
            return implode('.', array_slice($parts, 0, 3));
        }

        return $version;
    }

    public function versionBuildId(string $version): string
    {
        $parts = explode('.', $version);

        return (string) (end($parts) ?: '1');
    }

    private function findLatestFullVersion(array $groups): ?string
    {
        foreach ($groups as $group) {
            if (!empty($group['is_latest_group']) && !empty($group['builds'][0]['full_version'])) {
                return $group['builds'][0]['full_version'];
            }
        }

        return $groups[0]['builds'][0]['full_version'] ?? null;
    }

    private function sortGroups(array $groups): array
    {
        usort($groups, fn ($a, $b) => version_compare($b['version'], $a['version']));

        return $groups;
    }
}
