<?php

namespace Pterodactyl\Http\Controllers\Admin\Extensions\admininfra;

use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Illuminate\Http\RedirectResponse;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

class admininfraExtensionController extends Controller
{
    public function __construct(
        private ViewFactory $view,
        private BlueprintExtensionLibrary $blueprint,
    ) {}

    public function index(): View
    {
        return $this->view->make('admin.extensions.admininfra.index', [
            'root' => '/admin/extensions/admininfra',
            'blueprint' => $this->blueprint,
            'accent_color' => (string) ($this->blueprint->dbGet('admininfra', 'accent_color') ?: '#3b82f6'),
            'compact_mode' => ((string) ($this->blueprint->dbGet('admininfra', 'compact_mode') ?: '1')) === '1',
        ]);
    }

    public function update(admininfraSettingsFormRequest $request): RedirectResponse
    {
        foreach ($request->normalize() as $key => $value) {
            $this->blueprint->dbSet('admininfra', $key, is_string($value) ? trim($value) : $value);
        }

        return redirect()
            ->route('admin.extensions.admininfra.index')
            ->with('success', 'Configurações do Admin Infra salvas. Recarregue o painel admin para aplicar.');
    }
}

class admininfraSettingsFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'accent_color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'compact_mode' => ['nullable', 'in:0,1'],
        ];
    }

    public function attributes(): array
    {
        return [
            'accent_color' => 'Cor de destaque',
            'compact_mode' => 'Tabelas compactas',
        ];
    }

    public function normalize(): array
    {
        return [
            'accent_color' => strtolower((string) $this->input('accent_color', '#3b82f6')),
            'compact_mode' => $this->input('compact_mode', '1') === '1' ? '1' : '0',
        ];
    }
}
