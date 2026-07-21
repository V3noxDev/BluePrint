<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

return new class extends Migration
{
    public function up(): void
    {
        $blueprint = app(BlueprintExtensionLibrary::class);
        $blueprint->dbSetMany('mcmodpack', [
            'curseforge_api_key' => '',
            'default_page_size' => '20',
            'default_loader' => '0',
        ]);
    }

    public function down(): void
    {
        DB::table('settings')->where('key', 'like', 'mcmodpack::%')->delete();
    }
};
