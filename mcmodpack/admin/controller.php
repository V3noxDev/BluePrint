<?php

namespace Pterodactyl\Http\Controllers\Admin\Extensions\mcmodpack;

use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Illuminate\Http\RedirectResponse;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;

class mcmodpackExtensionController extends Controller
{
    public function __construct(
        private ViewFactory $view,
        private BlueprintExtensionLibrary $blueprint,
    ) {}

    public function index(): View
    {
        $apiKey = (string) ($this->blueprint->dbGet('mcmodpack', 'curseforge_api_key') ?: '');
        $masked = $apiKey === ''
            ? ''
            : substr($apiKey, 0, 6) . str_repeat('•', max(0, strlen($apiKey) - 10)) . substr($apiKey, -4);

        return $this->view->make('admin.extensions.mcmodpack.index', [
            'root' => '/admin/extensions/mcmodpack',
            'blueprint' => $this->blueprint,
            'api_key' => $apiKey,
            'api_key_masked' => $masked,
            'has_api_key' => $apiKey !== '',
        ]);
    }

    public function update(mcmodpackSettingsFormRequest $request): RedirectResponse
    {
        foreach ($request->normalize() as $key => $value) {
            $this->blueprint->dbSet('mcmodpack', $key, is_string($value) ? trim($value) : $value);
        }

        return redirect()
            ->route('admin.extensions.mcmodpack.index')
            ->with('success', 'Configurações do MC Modpacks salvas.');
    }
}

class mcmodpackSettingsFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'curseforge_api_key' => ['nullable', 'string', 'max:512'],
        ];
    }

    public function attributes(): array
    {
        return [
            'curseforge_api_key' => 'CurseForge API Key',
        ];
    }
}
