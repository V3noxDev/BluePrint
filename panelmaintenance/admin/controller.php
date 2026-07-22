<?php

namespace Pterodactyl\Http\Controllers\Admin\Extensions\panelmaintenance;

use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;
use Pterodactyl\BlueprintFramework\Extensions\panelmaintenance\MaintenanceService;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

class panelmaintenanceExtensionController extends Controller
{
    public function __construct(
        private ViewFactory $view,
        private BlueprintExtensionLibrary $blueprint,
        private MaintenanceService $maintenance,
    ) {}

    public function index(): View
    {
        $settings = $this->maintenance->getSettings();
        $isDown = $this->maintenance->isDown();
        $activeSecret = $isDown ? $this->maintenance->getSecret() : null;

        return $this->view->make('admin.extensions.panelmaintenance.index', [
            'root' => '/admin/extensions/panelmaintenance',
            'blueprint' => $this->blueprint,
            'is_down' => $isDown,
            'active_secret' => $activeSecret,
            'bypass_url' => $activeSecret ? rtrim(config('app.url'), '/') . '/' . $activeSecret : null,
            'settings' => $settings,
        ]);
    }

    public function update(panelmaintenanceSettingsFormRequest $request): RedirectResponse
    {
        $action = (string) $request->input('action', 'save');

        try {
            if ($action === 'enable') {
                $secret = $this->maintenance->enable($request->normalizedSettings());
                $url = rtrim(config('app.url'), '/') . '/' . $secret;

                return redirect()
                    ->route('admin.extensions.panelmaintenance.index')
                    ->with('success', "Manutenção ativada. Bypass: {$url}");
            }

            if ($action === 'disable') {
                $this->maintenance->disable();

                return redirect()
                    ->route('admin.extensions.panelmaintenance.index')
                    ->with('success', 'Manutenção desativada. O painel está online.');
            }

            $this->maintenance->saveSettings($request->normalizedSettings());

            return redirect()
                ->route('admin.extensions.panelmaintenance.index')
                ->with('success', 'Configurações salvas.');
        } catch (\Throwable $e) {
            return redirect()
                ->route('admin.extensions.panelmaintenance.index')
                ->with('error', 'Erro: ' . $e->getMessage());
        }
    }
}

class panelmaintenanceSettingsFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'action' => ['nullable', 'in:save,enable,disable'],
            'title' => ['required', 'string', 'max:120'],
            'headline_before' => ['required', 'string', 'max:80'],
            'headline_highlight' => ['required', 'string', 'max:40'],
            'message' => ['required', 'string', 'max:1000'],
            'retry_minutes' => ['required', 'integer', 'min:1', 'max:10080'],
            'secret' => ['nullable', 'string', 'max:64', 'regex:/^[a-zA-Z0-9\-_]*$/'],
            'site_url' => ['required', 'url', 'max:255'],
            'store_url' => ['required', 'url', 'max:255'],
            'discord_url' => ['required', 'url', 'max:255'],
            'brand_name' => ['required', 'string', 'max:64'],
        ];
    }

    public function attributes(): array
    {
        return [
            'title' => 'Título da aba',
            'headline_before' => 'Título (parte 1)',
            'headline_highlight' => 'Título destacado',
            'message' => 'Mensagem',
            'retry_minutes' => 'Tentar novamente (minutos)',
            'secret' => 'Token de bypass',
            'site_url' => 'URL do site',
            'store_url' => 'URL da loja',
            'discord_url' => 'URL do Discord',
            'brand_name' => 'Nome da marca',
        ];
    }

    public function normalizedSettings(): array
    {
        return [
            'title' => trim((string) $this->input('title')),
            'headline_before' => trim((string) $this->input('headline_before')),
            'headline_highlight' => trim((string) $this->input('headline_highlight')),
            'message' => trim((string) $this->input('message')),
            'retry_minutes' => (int) $this->input('retry_minutes'),
            'secret' => trim((string) $this->input('secret', '')),
            'site_url' => trim((string) $this->input('site_url')),
            'store_url' => trim((string) $this->input('store_url')),
            'discord_url' => trim((string) $this->input('discord_url')),
            'brand_name' => trim((string) $this->input('brand_name')),
        ];
    }
}
