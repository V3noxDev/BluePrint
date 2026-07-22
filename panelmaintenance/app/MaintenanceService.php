<?php

namespace Pterodactyl\BlueprintFramework\Extensions\panelmaintenance;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;

class MaintenanceService
{
    private const CONFIG_FILE = 'panelmaintenance.json';

    public function isDown(): bool
    {
        return app()->isDownForMaintenance();
    }

    public function getSecret(): ?string
    {
        if (!$this->isDown()) {
            return null;
        }

        $payload = $this->readDownPayload();

        return $payload['secret'] ?? null;
    }

    public function getSettings(): array
    {
        return [
            'title' => (string) $this->setting('title', 'Estaremos de volta em breve!'),
            'headline_before' => (string) $this->setting('headline_before', 'Estaremos de volta em'),
            'headline_highlight' => (string) $this->setting('headline_highlight', 'breve!'),
            'message' => (string) $this->setting('message', 'O painel está em manutenção no momento. Volte mais tarde ou fique conectado:'),
            'retry_minutes' => max(1, (int) $this->setting('retry_minutes', 60)),
            'secret' => (string) $this->setting('secret', ''),
            'site_url' => (string) $this->setting('site_url', 'https://blackhosting.com.br'),
            'store_url' => (string) $this->setting('store_url', 'https://financeiro.blackhosting.com.br'),
            'discord_url' => (string) $this->setting('discord_url', 'https://discord.gg/blackhosting'),
            'brand_name' => (string) $this->setting('brand_name', 'BlackHosting'),
        ];
    }

    public function saveSettings(array $settings): void
    {
        foreach ($settings as $key => $value) {
            $this->writeSetting($key, $value);
        }
    }

    public function enable(array $settings): string
    {
        $this->saveSettings($settings);

        $secret = trim((string) ($settings['secret'] ?? ''));
        if ($secret === '') {
            $secret = Str::lower(Str::random(16));
            $this->writeSetting('secret', $secret);
        }

        $retryMinutes = max(1, (int) ($settings['retry_minutes'] ?? 60));
        $this->writeRuntimeConfig($settings, $secret, $retryMinutes);

        Artisan::call('down', [
            '--render' => 'blueprint.extensions.panelmaintenance.503',
            '--secret' => $secret,
            '--retry' => $retryMinutes * 60,
            '--status' => 503,
            '--except' => [
                'admin',
                'admin/*',
                'auth/*',
                'api/application/*',
            ],
        ]);

        return $secret;
    }

    public function disable(): void
    {
        if ($this->isDown()) {
            Artisan::call('up');
        }

        $path = $this->configPath();
        if (is_file($path)) {
            @unlink($path);
        }
    }

    private function writeRuntimeConfig(array $settings, string $secret, int $retryMinutes): void
    {
        $payload = [
            'title' => (string) ($settings['title'] ?? 'Estaremos de volta em breve!'),
            'headline_before' => (string) ($settings['headline_before'] ?? 'Estaremos de volta em'),
            'headline_highlight' => (string) ($settings['headline_highlight'] ?? 'breve!'),
            'message' => (string) ($settings['message'] ?? 'O painel está em manutenção no momento. Volte mais tarde ou fique conectado:'),
            'retry_minutes' => $retryMinutes,
            'secret' => $secret,
            'site_url' => (string) ($settings['site_url'] ?? 'https://blackhosting.com.br'),
            'store_url' => (string) ($settings['store_url'] ?? 'https://financeiro.blackhosting.com.br'),
            'discord_url' => (string) ($settings['discord_url'] ?? 'https://discord.gg/blackhosting'),
            'brand_name' => (string) ($settings['brand_name'] ?? 'BlackHosting'),
        ];

        file_put_contents($this->configPath(), json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    private function configPath(): string
    {
        return storage_path('framework/' . self::CONFIG_FILE);
    }

    private function readDownPayload(): array
    {
        $path = storage_path('framework/down');
        if (!is_file($path)) {
            return [];
        }

        $data = json_decode((string) file_get_contents($path), true);

        return is_array($data) ? $data : [];
    }

    private function settingsPath(): string
    {
        return storage_path('framework/panelmaintenance-settings.json');
    }

    private function readSettingsFile(): array
    {
        $path = $this->settingsPath();
        if (!is_file($path)) {
            return $this->defaultSettings();
        }

        $data = json_decode((string) file_get_contents($path), true);

        return is_array($data) ? array_merge($this->defaultSettings(), $data) : $this->defaultSettings();
    }

    private function defaultSettings(): array
    {
        return [
            'title' => 'Estaremos de volta em breve!',
            'headline_before' => 'Estaremos de volta em',
            'headline_highlight' => 'breve!',
            'message' => 'O painel está em manutenção no momento. Volte mais tarde ou fique conectado:',
            'retry_minutes' => 60,
            'secret' => '',
            'site_url' => 'https://blackhosting.com.br',
            'store_url' => 'https://financeiro.blackhosting.com.br',
            'discord_url' => 'https://discord.gg/blackhosting',
            'brand_name' => 'BlackHosting',
        ];
    }

    private function setting(string $key, mixed $default): mixed
    {
        $settings = $this->readSettingsFile();

        return $settings[$key] ?? $default;
    }

    private function writeSetting(string $key, mixed $value): void
    {
        $settings = $this->readSettingsFile();
        $settings[$key] = $value;
        file_put_contents($this->settingsPath(), json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
}
