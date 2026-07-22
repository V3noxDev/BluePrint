<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('template_installer_templates')) {
            Schema::create('template_installer_templates', function (Blueprint $table) {
                $table->id();
                $table->unsignedInteger('sort_order')->default(0);
                $table->string('name');
                $table->string('icon_url', 512)->nullable();
                $table->string('category', 128)->nullable();
                $table->text('description')->nullable();
                $table->longText('full_description')->nullable();
                $table->string('password')->nullable();
                $table->text('password_description')->nullable();
                $table->string('version', 32)->default('1.0.0');
                $table->string('author', 128)->nullable();
                $table->boolean('enabled')->default(true);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('template_installer_variables')) {
            Schema::create('template_installer_variables', function (Blueprint $table) {
                $table->id();
                $table->foreignId('template_id')->constrained('template_installer_templates')->cascadeOnDelete();
                $table->unsignedInteger('sort_order')->default(0);
                $table->string('name');
                $table->string('env_variable', 128);
                $table->text('description')->nullable();
                $table->text('default_value')->nullable();
                $table->string('rules', 512)->default('nullable|string');
                $table->boolean('selectable')->default(true);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('template_installer_steps')) {
            Schema::create('template_installer_steps', function (Blueprint $table) {
                $table->id();
                $table->foreignId('template_id')->constrained('template_installer_templates')->cascadeOnDelete();
                $table->unsignedInteger('sort_order')->default(0);
                $table->string('action', 32);
                $table->string('file_path', 512)->nullable();
                $table->longText('content')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('template_installer_steps');
        Schema::dropIfExists('template_installer_variables');
        Schema::dropIfExists('template_installer_templates');
    }
};
