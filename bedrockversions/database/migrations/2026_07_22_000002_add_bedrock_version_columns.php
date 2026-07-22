<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('bedrock_versions')) {
            return;
        }

        Schema::table('bedrock_versions', function (Blueprint $table) {
            if (!Schema::hasColumn('bedrock_versions', 'mojang_build_id')) {
                $table->string('mojang_build_id', 64)->nullable()->after('download_type');
            }
            if (!Schema::hasColumn('bedrock_versions', 'released_at')) {
                $table->timestamp('released_at')->nullable()->after(
                    Schema::hasColumn('bedrock_versions', 'mojang_build_id') ? 'mojang_build_id' : 'download_type'
                );
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('bedrock_versions')) {
            return;
        }

        Schema::table('bedrock_versions', function (Blueprint $table) {
            if (Schema::hasColumn('bedrock_versions', 'released_at')) {
                $table->dropColumn('released_at');
            }
            if (Schema::hasColumn('bedrock_versions', 'mojang_build_id')) {
                $table->dropColumn('mojang_build_id');
            }
        });
    }
};
