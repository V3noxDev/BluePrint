<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcmodpack;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class ModpackPullToken
{
    private const TTL = 3600;
    private const PREFIX = 'mcmodpack:pull:';

    public static function create(string $serverUuid, string $tempPath): string
    {
        $token = Str::random(64);
        $size = filesize($tempPath);

        Cache::put(self::PREFIX . $token, array(
            'server_uuid' => $serverUuid,
            'path' => $tempPath,
            'size' => $size !== false ? (int) $size : 0,
            'created_at' => time(),
        ), self::TTL);

        return $token;
    }

    public static function get(string $token): ?array
    {
        $data = Cache::get(self::PREFIX . $token);

        return is_array($data) ? $data : null;
    }

    public static function revoke(string $token): void
    {
        try {
            Cache::forget(self::PREFIX . $token);
        } catch (\Throwable $e) {
        }
    }

    public static function publicUrl(string $token): string
    {
        return rtrim((string) config('app.url'), '/') . '/extensions/mcmodpack/pull/' . $token;
    }
}
