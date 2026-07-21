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
            return $this->getCachedVersions();
        }

        try {
            $response = Http::timeout(20)
                ->acceptJson()
                ->get(self::API_URL);

            if (!$response->successful()) {
                Log::warning('[bedrockversions] API unavailable', ['status' => $response->status()]);
                return $this->getCachedVersions();
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

                BedrockVersion::query()
                    ->where('channel', $channel)
                    ->update(['is_latest' => false]);

                $existing = BedrockVersion::query()
                    ->where('channel', $channel)
                    ->where('version', $version)
                    ->first();

                if ($existing) {
                    $existing->fill([
                        'download_url' => $url,
                        'download_type' => $type,
                        'is_latest' => true,
                        'last_seen_at' => $now,
                    ])->save();
                } else {
                    BedrockVersion::query()->create([
                        'channel' => $channel,
                        'version' => $version,
                        'download_url' => $url,
                        'download_type' => $type,
                        'is_latest' => true,
                        'first_seen_at' => $now,
                        'last_seen_at' => $now,
                    ]);
                }
            }

            $this->seedHistoricalIfEmpty();
            $this->blueprint->dbSet('bedrockversions', 'last_sync', $now->toDateTimeString());
        } catch (\Throwable $e) {
            Log::warning('[bedrockversions] sync failed: ' . $e->getMessage());
        }

        return $this->getCachedVersions();
    }

    public function getCachedVersions(): array
    {
        $this->seedHistoricalIfEmpty();

        $stable = BedrockVersion::query()
            ->where('channel', 'stable')
            ->orderByDesc('version')
            ->get()
            ->map(fn (BedrockVersion $v) => $this->serialize($v))
            ->values()
            ->all();

        $preview = BedrockVersion::query()
            ->where('channel', 'preview')
            ->orderByDesc('version')
            ->get()
            ->map(fn (BedrockVersion $v) => $this->serialize($v))
            ->values()
            ->all();

        // Sort versions properly (semver-ish)
        usort($stable, fn ($a, $b) => version_compare($b['version'], $a['version']));
        usort($preview, fn ($a, $b) => version_compare($b['version'], $a['version']));

        return [
            'stable' => $stable,
            'preview' => $preview,
            'latest_stable' => collect($stable)->firstWhere('is_latest')['version']
                ?? ($stable[0]['version'] ?? null),
            'latest_preview' => collect($preview)->firstWhere('is_latest')['version']
                ?? ($preview[0]['version'] ?? null),
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

    private function serialize(BedrockVersion $v): array
    {
        return [
            'channel' => $v->channel,
            'version' => $v->version,
            'download_url' => $v->download_url,
            'download_type' => $v->download_type,
            'is_latest' => (bool) $v->is_latest,
            'first_seen_at' => optional($v->first_seen_at)->toIso8601String(),
            'last_seen_at' => optional($v->last_seen_at)->toIso8601String(),
        ];
    }

    private function seedHistoricalIfEmpty(): void
    {
        if (BedrockVersion::query()->exists()) {
            return;
        }

        $seedPath = base_path('.blueprint/extensions/bedrockversions/private/seed-versions.json');
        if (!file_exists($seedPath)) {
            // Fallback bundled relative path during early install
            $seedPath = __DIR__ . '/../data/seed-versions.json';
        }

        if (!file_exists($seedPath)) {
            return;
        }

        $seed = json_decode(file_get_contents($seedPath), true) ?: [];
        $now = now();

        foreach ($seed as $row) {
            BedrockVersion::query()->updateOrCreate(
                [
                    'channel' => $row['channel'],
                    'version' => $row['version'],
                ],
                [
                    'download_url' => $row['download_url'],
                    'download_type' => $row['download_type'],
                    'is_latest' => (bool) ($row['is_latest'] ?? false),
                    'first_seen_at' => $now,
                    'last_seen_at' => $now,
                ]
            );
        }
    }
}
