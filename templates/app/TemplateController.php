<?php

namespace Pterodactyl\BlueprintFramework\Extensions\templates;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\Server;

class TemplateController extends Controller
{
    public function __construct(
        private TemplateInstallService $installer,
    ) {}

    public function index(Request $request, Server $server): JsonResponse
    {
        $this->authorize('file.read', $server);

        $templates = InstallerTemplate::query()
            ->where('enabled', true)
            ->with('variables')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (InstallerTemplate $t) => $this->formatTemplate($t));

        $categories = $templates->pluck('category')->filter()->unique()->values();

        return response()->json([
            'success' => true,
            'data' => [
                'templates' => $templates->values()->all(),
                'categories' => $categories->values()->all(),
            ],
        ]);
    }

    public function show(Request $request, Server $server, int $template): JsonResponse
    {
        $this->authorize('file.read', $server);

        $model = InstallerTemplate::query()
            ->where('enabled', true)
            ->with('variables')
            ->findOrFail($template);

        return response()->json([
            'success' => true,
            'data' => $this->formatTemplate($model, true),
        ]);
    }

    public function allocations(Request $request, Server $server): JsonResponse
    {
        $this->authorize('file.read', $server);

        $server->load('allocations');

        return response()->json([
            'success' => true,
            'data' => $server->allocations->map(fn ($a) => [
                'id' => $a->id,
                'text' => ($a->ip_alias ?: $a->ip) . ':' . $a->port,
                'port' => $a->port,
            ])->values(),
        ]);
    }

    public function install(Request $request, Server $server): JsonResponse
    {
        $this->authorize('file.update', $server);

        $validated = $request->validate([
            'template_id' => 'required|integer|min:1',
            'password' => 'nullable|string|max:191',
            'variables' => 'nullable|array',
        ]);

        $templateId = (int) $validated['template_id'];
        $model = InstallerTemplate::query()
            ->where('enabled', true)
            ->with(['variables', 'steps'])
            ->findOrFail($templateId);

        if ($model->password) {
            $password = (string) ($validated['password'] ?? '');
            if (!Hash::check($password, $model->password)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Senha do template incorreta.',
                ], 403);
            }
        }

        $rules = [];
        $attributes = [];
        foreach ($model->variables as $var) {
            $key = $var->env_variable;
            $rules[$key] = $this->normalizeRules($var->rules ?: 'nullable|string');
            $attributes[$key] = $var->name;
        }

        $validator = Validator::make($validated['variables'] ?? [], $rules, [], $attributes);
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $userVars = [];
        foreach ($model->variables as $var) {
            $val = $validated['variables'][$var->env_variable] ?? $var->default_value;
            $userVars[ltrim($var->env_variable, '$')] = is_bool($val) ? ($val ? '1' : '0') : (string) $val;
        }

        if ($model->steps->isEmpty()) {
            return response()->json([
                'success' => false,
                'error' => 'Este template não possui steps de instalação configurados.',
            ], 422);
        }

        try {
            $result = $this->installer->install($server, $model, $userVars);
        } catch (DaemonConnectionException $e) {
            Log::warning('[templates] daemon offline', [
                'server' => $server->uuid,
                'template' => $model->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Não foi possível comunicar com o Wings. Verifique se o node está online e se api.disable_remote_download está false no config.yml do Wings.',
            ], 502);
        } catch (\Throwable $e) {
            Log::error('[templates] install failed', [
                'server' => $server->uuid,
                'template' => $model->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Erro ao instalar: ' . $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => 'Template instalado com sucesso.',
        ]);
    }

  /**
   * Aceita valores 0/1 enviados pelo painel em campos boolean.
   */
    private function normalizeRules(string $rules): string
    {
        if (!str_contains($rules, 'boolean')) {
            return $rules;
        }

        return str_replace('boolean', 'in:0,1,true,false', $rules);
    }

    private function formatTemplate(InstallerTemplate $t, bool $detailed = false): array
    {
        $data = [
            'id' => $t->id,
            'name' => $t->name,
            'icon_url' => $t->icon_url,
            'category' => $t->category,
            'description' => $t->description,
            'version' => $t->version,
            'author' => $t->author,
            'has_password' => !empty($t->password),
            'password_description' => $t->password_description,
            'variables' => $t->variables->map(fn ($v) => [
                'id' => $v->id,
                'name' => $v->name,
                'env_variable' => $v->env_variable,
                'description' => $v->description,
                'default_value' => $v->default_value,
                'rules' => $v->rules ?? '',
                'selectable' => (bool) $v->selectable,
            ])->values()->all(),
        ];

        $data['full_description'] = $t->full_description;

        return $data;
    }
}
