<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

return new class extends Migration
{
    public function up(): void
    {
        $blueprint = app(BlueprintExtensionLibrary::class);
        $blueprint->dbSetMany('loginmaster', [
            'enabled' => '0',
            'site_key' => '',
            'secret_key' => '',
            'theme' => 'auto',
            'protect_login' => '1',
            'protect_forgot' => '1',
            'disable_native_recaptcha' => '1',
            'brand_name' => 'Painel',
            'welcome_text' => 'Acesse sua conta com segurança',
            'accent_color' => '#3b82f6',
            'background_style' => 'gradient',
            'show_brand_header' => '1',
            'honeypot_enabled' => '1',
        ]);
    }

    public function down(): void
    {
        DB::table('settings')->where('key', 'like', 'loginmaster::%')->delete();
    }
};
