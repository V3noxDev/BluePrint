<?php

namespace Pterodactyl\BlueprintFramework\Extensions\minehub;

class AddonCatalogService
{
    public static function getCatalogPath(): string
    {
        return base_path('.blueprint/extensions/minehub/private/catalog.json');
    }

    public static function getCatalog(): array
    {
        $path = self::getCatalogPath();

        if (!file_exists($path)) {
            $default = base_path('.blueprint/extensions/minehub/private/default-catalog.json');
            if (file_exists($default)) {
                return json_decode(file_get_contents($default), true) ?: [];
            }

            return [];
        }

        return json_decode(file_get_contents($path), true) ?: [];
    }

    public static function getAddonPath(): string
    {
        $path = '/plugins';

        try {
            $value = app(\Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary::class)
                ->dbGet('minehub', 'addon_path');
            if ($value) {
                $path = $value;
            }
        } catch (\Throwable) {
            // Fallback to default path.
        }

        return $path;
    }

    public static function getEnabledModules(): array
    {
        try {
            $modules = app(\Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary::class)
                ->dbGet('minehub', 'modules');
            if ($modules) {
                return explode(',', $modules);
            }
        } catch (\Throwable) {
            // Fallback.
        }

        return ['properties', 'addons'];
    }
}
