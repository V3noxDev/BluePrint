<?php

namespace Pterodactyl\Http\Controllers\Admin\Extensions\loginmaster;

use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;
use Pterodactyl\BlueprintFramework\Extensions\loginmaster\LoginMasterService;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

class loginmasterExtensionController extends Controller
{
    public function __construct(
        private ViewFactory $view,
        private BlueprintExtensionLibrary $blueprint,
        private LoginMasterService $loginMaster,
    ) {}

    public function index(): View
    {
        $settings = $this->loginMaster->getSettings();
        $secret = (string) ($settings['secret_key'] ?? '');
        $maskedSecret = $secret === ''
            ? ''
            : substr($secret, 0, 4) . str_repeat('•', max(0, strlen($secret) - 8)) . substr($secret, -4);

        return $this->view->make('admin.extensions.loginmaster.index', [
            'root' => '/admin/extensions/loginmaster',
            'blueprint' => $this->blueprint,
            'settings' => $settings,
            'configured' => $this->loginMaster->isConfigured(),
            'secret_masked' => $maskedSecret,
        ]);
    }

    public function update(loginmasterSettingsFormRequest $request): RedirectResponse
    {
        $data = $request->normalizedSettings();

        if (trim((string) $request->input('secret_key', '')) === '') {
            unset($data['secret_key']);
        }

        $this->loginMaster->saveSettings($data);

        if (($data['disable_native_recaptcha'] ?? '0') === '1') {
            $this->loginMaster->disableNativeRecaptchaIfNeeded();
        }

        return redirect()
            ->route('admin.extensions.loginmaster.index')
            ->with('success', 'Configurações do Login Master salvas. Execute blueprint -build se alterou a interface.');
    }
}

class loginmasterSettingsFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'enabled' => ['nullable', 'in:0,1'],
            'site_key' => ['nullable', 'string', 'max:512'],
            'secret_key' => ['nullable', 'string', 'max:512'],
            'theme' => ['required', 'in:auto,light,dark'],
            'protect_login' => ['nullable', 'in:0,1'],
            'protect_forgot' => ['nullable', 'in:0,1'],
            'disable_native_recaptcha' => ['nullable', 'in:0,1'],
            'brand_name' => ['required', 'string', 'max:64'],
            'welcome_text' => ['required', 'string', 'max:160'],
            'accent_color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'background_style' => ['required', 'in:gradient,solid,minimal'],
            'show_brand_header' => ['nullable', 'in:0,1'],
            'honeypot_enabled' => ['nullable', 'in:0,1'],
        ];
    }

    public function attributes(): array
    {
        return [
            'enabled' => 'Turnstile ativo',
            'site_key' => 'Site Key',
            'secret_key' => 'Secret Key',
            'theme' => 'Tema do widget',
            'protect_login' => 'Proteger login',
            'protect_forgot' => 'Proteger recuperação de senha',
            'disable_native_recaptcha' => 'Desativar reCAPTCHA nativo',
            'brand_name' => 'Nome da marca',
            'welcome_text' => 'Texto de boas-vindas',
            'accent_color' => 'Cor de destaque',
            'background_style' => 'Estilo de fundo',
            'show_brand_header' => 'Mostrar cabeçalho da marca',
            'honeypot_enabled' => 'Campo honeypot anti-bot',
        ];
    }

    public function normalizedSettings(): array
    {
        $data = [
            'enabled' => $this->input('enabled', '0') === '1' ? '1' : '0',
            'site_key' => trim((string) $this->input('site_key', '')),
            'theme' => (string) $this->input('theme', 'auto'),
            'protect_login' => $this->input('protect_login', '0') === '1' ? '1' : '0',
            'protect_forgot' => $this->input('protect_forgot', '0') === '1' ? '1' : '0',
            'disable_native_recaptcha' => $this->input('disable_native_recaptcha', '0') === '1' ? '1' : '0',
            'brand_name' => trim((string) $this->input('brand_name', 'Painel')),
            'welcome_text' => trim((string) $this->input('welcome_text', 'Acesse sua conta com segurança')),
            'accent_color' => strtolower((string) $this->input('accent_color', '#3b82f6')),
            'background_style' => (string) $this->input('background_style', 'gradient'),
            'show_brand_header' => $this->input('show_brand_header', '0') === '1' ? '1' : '0',
            'honeypot_enabled' => $this->input('honeypot_enabled', '0') === '1' ? '1' : '0',
        ];

        $secret = trim((string) $this->input('secret_key', ''));
        if ($secret !== '') {
            $data['secret_key'] = $secret;
        }

        return $data;
    }
}
