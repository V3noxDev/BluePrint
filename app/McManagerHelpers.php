<?php

namespace Pterodactyl\BlueprintFramework\Extensions\{identifier};

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Pterodactyl\Models\Server;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;

trait McManagerHelpers
{
    protected function setting(string $key, ?string $default = null): string
    {
        /** @var SettingsRepositoryInterface $settings */
        $settings = app(SettingsRepositoryInterface::class);

        $value = $settings->get('{identifier}::' . $key);

        if ($value === null || $value === '') {
            return (string) $default;
        }

        return (string) $value;
    }

    protected function extensionEnabled(): bool
    {
        return $this->setting('enabled', '1') === '1';
    }

    protected function assertExtensionEnabled(): void
    {
        if (!$this->extensionEnabled()) {
            abort(403, 'MC Manager is disabled by the administrator.');
        }
    }

    protected function authorizeServer(Request $request, Server $server, string $ability): void
    {
        $user = $request->user();

        if (!$user) {
            throw new AuthorizationException();
        }

        if ($user->root_admin) {
            return;
        }

        // Owners and subusers are checked through Pterodactyl's ServerPolicy.
        if (!$user->can($ability, $server)) {
            throw new AuthorizationException();
        }
    }

    protected function normalizePath(string $path): string
    {
        $path = trim($path);
        if ($path === '') {
            return '/';
        }

        if ($path[0] !== '/') {
            $path = '/' . $path;
        }

        return rtrim($path, '/') === '' ? '/' : rtrim($path, '/');
    }

    protected function configPayload(): array
    {
        return [
            'enabled' => $this->extensionEnabled(),
            'default_tab' => $this->setting('default_tab', 'properties'),
            'plugins_path' => $this->normalizePath($this->setting('plugins_path', '/plugins')),
            'properties_path' => $this->normalizePath($this->setting('properties_path', '/server.properties')),
            'allow_addon_install' => $this->setting('allow_addon_install', '1') === '1',
            'allow_addon_remove' => $this->setting('allow_addon_remove', '1') === '1',
            'allow_properties_edit' => $this->setting('allow_properties_edit', '1') === '1',
            'modrinth_loaders' => array_values(array_filter(array_map(
                'trim',
                explode(',', $this->setting('modrinth_loaders', 'paper,purpur,spigot,bukkit,folia'))
            ))),
        ];
    }
}
