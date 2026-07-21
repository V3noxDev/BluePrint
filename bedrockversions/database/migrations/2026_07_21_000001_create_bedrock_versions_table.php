<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('bedrock_versions')) {
            Schema::create('bedrock_versions', function (Blueprint $table) {
                $table->id();
                $table->string('channel', 32); // stable | preview
                $table->string('version', 64);
                $table->string('download_url', 512);
                $table->string('download_type', 64);
                $table->boolean('is_latest')->default(false);
                $table->timestamp('first_seen_at')->useCurrent();
                $table->timestamp('last_seen_at')->useCurrent();
                $table->timestamps();

                $table->unique(['channel', 'version']);
                $table->index(['channel', 'is_latest']);
            });
        }

        $blueprint = app(BlueprintExtensionLibrary::class);
        $blueprint->dbSetMany('bedrockversions', [
            'auto_sync' => 'true',
            'last_sync' => '',
            'api_url' => 'https://net-secondary.web.minecraft-services.net/api/v1.0/download/links',
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('bedrock_versions');
    }
};
