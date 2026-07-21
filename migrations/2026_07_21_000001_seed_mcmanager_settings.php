<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Migrations\Migration;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

return new class extends Migration
{
    public function up(): void
    {
        $blueprint = app(BlueprintExtensionLibrary::class);

        $blueprint->dbSetMany('{identifier}', [
            'enabled' => '1',
            'default_tab' => 'properties',
            'plugins_path' => '/plugins',
            'properties_path' => '/server.properties',
            'allow_addon_install' => '1',
            'allow_addon_remove' => '1',
            'allow_properties_edit' => '1',
            'modrinth_loaders' => 'paper,purpur,spigot,bukkit,folia',
        ]);
    }

    public function down(): void
    {
        DB::table('settings')->where('key', 'like', '{identifier}::%')->delete();
    }
};
