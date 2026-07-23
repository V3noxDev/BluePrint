<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcmodpack;

use Illuminate\Support\Facades\Cache;
use Pterodactyl\Models\Server;

class ModpackInstallProgress
{
    private const TTL = 3600;

    public static function key(Server $server): string
    {
        return 'mcmodpack:progress:' . $server->uuid;
    }

    public static function cancelKey(Server $server): string
    {
        return 'mcmodpack:cancel:' . $server->uuid;
    }

    public static function lockKey(Server $server): string
    {
        return 'mcmodpack:lock:' . $server->uuid;
    }

    public static function acquireLock(Server $server): bool
    {
        try {
            return Cache::add(self::lockKey($server), true, self::TTL);
        } catch (\Throwable $e) {
            return true;
        }
    }

    public static function releaseLock(Server $server): void
    {
        try {
            Cache::forget(self::lockKey($server));
        } catch (\Throwable $e) {
        }
    }

    public static function isLocked(Server $server): bool
    {
        try {
            return (bool) Cache::get(self::lockKey($server), false);
        } catch (\Throwable $e) {
            return false;
        }
    }

    public static function start(Server $server, string $modpackName): void
    {
        self::safeForget(self::cancelKey($server));
        self::put($server, array(
            'active' => true,
            'phase' => 'preparing',
            'step' => 1,
            'progress' => 2,
            'message' => 'Preparando instalação...',
            'modpack_name' => $modpackName,
            'bytes_done' => 0,
            'bytes_total' => 0,
            'started_at' => now()->toIso8601String(),
            'updated_at' => now()->toIso8601String(),
            'eta_seconds' => null,
            'error' => null,
        ));
    }

    public static function update(Server $server, array $data): void
    {
        $current = self::get($server) ?? array();
        $merged = array_merge($current, $data, array(
            'updated_at' => now()->toIso8601String(),
        ));

        if (!isset($merged['started_at'])) {
            $merged['started_at'] = now()->toIso8601String();
        }

        $progress = (int) ($merged['progress'] ?? 0);
        if ($progress > 0 && $progress < 100 && !empty($merged['started_at'])) {
            $started = strtotime((string) $merged['started_at']);
            $elapsed = $started ? max(1, time() - $started) : 1;
            $merged['eta_seconds'] = (int) round(($elapsed / $progress) * (100 - $progress));
        } elseif ($progress >= 100) {
            $merged['eta_seconds'] = 0;
        }

        self::put($server, $merged);
    }

    public static function phase(Server $server, string $phase, int $step, int $progress, string $message, array $extra = array()): void
    {
        self::update($server, array_merge(array(
            'active' => true,
            'phase' => $phase,
            'step' => $step,
            'progress' => max(0, min(100, $progress)),
            'message' => $message,
        ), $extra));
    }

    public static function complete(Server $server, string $message): void
    {
        self::update($server, array(
            'active' => false,
            'phase' => 'completed',
            'step' => 2,
            'progress' => 100,
            'message' => $message,
            'eta_seconds' => 0,
            'error' => null,
        ));
        self::releaseLock($server);
    }

    public static function fail(Server $server, string $error): void
    {
        self::update($server, array(
            'active' => false,
            'phase' => 'failed',
            'progress' => 0,
            'message' => 'Falha na instalação',
            'error' => $error,
            'eta_seconds' => null,
        ));
        self::releaseLock($server);
    }

    public static function cancelled(Server $server): void
    {
        self::update($server, array(
            'active' => false,
            'phase' => 'cancelled',
            'progress' => 0,
            'message' => 'Instalação cancelada',
            'error' => null,
            'eta_seconds' => null,
        ));
        self::safeForget(self::cancelKey($server));
        self::releaseLock($server);
    }

    public static function get(Server $server): ?array
    {
        try {
            $data = Cache::get(self::key($server));

            return is_array($data) ? $data : null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    public static function clear(Server $server): void
    {
        self::safeForget(self::key($server));
        self::safeForget(self::cancelKey($server));
        self::releaseLock($server);
    }

    public static function requestCancel(Server $server): void
    {
        try {
            Cache::put(self::cancelKey($server), true, self::TTL);
        } catch (\Throwable $e) {
        }
    }

    public static function isCancelled(Server $server): bool
    {
        try {
            return (bool) Cache::get(self::cancelKey($server), false);
        } catch (\Throwable $e) {
            return false;
        }
    }

    public static function assertNotCancelled(Server $server): void
    {
        if (self::isCancelled($server)) {
            throw new ModpackInstallCancelledException();
        }
    }

    private static function put(Server $server, array $data): void
    {
        try {
            Cache::put(self::key($server), $data, self::TTL);
        } catch (\Throwable $e) {
        }
    }

    private static function safeForget(string $key): void
    {
        try {
            Cache::forget($key);
        } catch (\Throwable $e) {
        }
    }
}
