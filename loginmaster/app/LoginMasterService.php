<?php

namespace Pterodactyl\BlueprintFramework\Extensions\loginmaster;

use Illuminate\Http\Request;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

class LoginMasterService
{
    public function __construct(
        private BlueprintExtensionLibrary $blueprint,
    ) {}

    public function getSettings(): array
    {
        return [
            'enabled' => $this->flag('enabled', '1'),
            'site_key' => (string) $this->setting('site_key', ''),
            'secret_key' => (string) $this->setting('secret_key', ''),
            'theme' => $this->theme(),
            'protect_login' => $this->flag('protect_login', '1'),
            'protect_forgot' => $this->flag('protect_forgot', '1'),
            'disable_native_recaptcha' => $this->flag('disable_native_recaptcha', '1'),
            'brand_name' => (string) $this->setting('brand_name', 'Painel'),
            'welcome_text' => (string) $this->setting('welcome_text', 'Acesse sua conta com segurança'),
            'accent_color' => (string) $this->setting('accent_color', '#3b82f6'),
            'background_style' => (string) $this->setting('background_style', 'gradient'),
            'show_brand_header' => $this->flag('show_brand_header', '1'),
            'honeypot_enabled' => $this->flag('honeypot_enabled', '1'),
        ];
    }

    public function saveSettings(array $settings): void
    {
        foreach ($settings as $key => $value) {
            $this->blueprint->dbSet('loginmaster', $key, is_bool($value) ? ($value ? '1' : '0') : (string) $value);
        }
    }

    public function publicConfig(): array
    {
        $settings = $this->getSettings();

        return [
            'enabled' => $settings['enabled'] && $settings['site_key'] !== '',
            'site_key' => $settings['site_key'],
            'theme' => $settings['theme'],
            'protect_login' => $settings['protect_login'],
            'protect_forgot' => $settings['protect_forgot'],
            'brand_name' => $settings['brand_name'],
            'welcome_text' => $settings['welcome_text'],
            'accent_color' => $settings['accent_color'],
            'background_style' => $settings['background_style'],
            'show_brand_header' => $settings['show_brand_header'],
        ];
    }

    public function isConfigured(): bool
    {
        $settings = $this->getSettings();

        return $settings['enabled']
            && trim($settings['site_key']) !== ''
            && trim($settings['secret_key']) !== '';
    }

    public function shouldProtectRequest(Request $request): bool
    {
        if (!$this->isConfigured()) {
            return false;
        }

        $path = trim($request->path(), '/');

        if ($path === 'auth/login' && $request->isMethod('POST')) {
            return $this->flag('protect_login', '1');
        }

        if ($path === 'auth/password' && $request->isMethod('POST')) {
            return $this->flag('protect_forgot', '1');
        }

        return false;
    }

    public function getSecretKey(): string
    {
        return trim((string) $this->setting('secret_key', ''));
    }

    public function disableNativeRecaptchaIfNeeded(): void
    {
        if (!$this->flag('disable_native_recaptcha', '1')) {
            return;
        }

        try {
            \DB::table('settings')->updateOrInsert(
                ['key' => 'settings::recaptcha:enabled'],
                ['value' => serialize(false)]
            );
        } catch (\Throwable) {
            // Painel pode usar estrutura diferente; install.sh trata via artisan.
        }
    }

    private function setting(string $key, mixed $default): mixed
    {
        $value = $this->blueprint->dbGet('loginmaster', $key);

        return $value !== null && $value !== '' ? $value : $default;
    }

    private function flag(string $key, string $default = '0'): bool
    {
        $value = $this->blueprint->dbGet('loginmaster', $key);

        if ($value === null || $value === '') {
            return $default === '1';
        }

        return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on'], true);
    }

    private function theme(): string
    {
        $theme = strtolower((string) $this->setting('theme', 'auto'));

        return in_array($theme, ['auto', 'light', 'dark'], true) ? $theme : 'auto';
    }
}
