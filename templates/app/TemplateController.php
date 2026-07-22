<?php

namespace Pterodactyl\BlueprintFramework\Extensions\templates;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\Server;

class TemplateController extends Controller
{
    public function __construct(
        private TemplateInstallService $installer,
    ) {}

    public function index(Request $request, Server $server): JsonResponse
    {
        $this->authorize('control.console', $server);

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
                'templates' => $templates,
                'categories' => $categories,
            ],
        ]);
    }

    public function show(Request $request, Server $server, int $template): JsonResponse
    {
        $this->authorize('control.console', $server);

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
        $this->authorize('control.console', $server);

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
        $this->authorize('control.console', $server);

        $templateId = (int) $request->input('template_id');
        $model = InstallerTemplate::query()->where('enabled', true)->with(['variables', 'steps'])->findOrFail($templateId);

        if ($model->password) {
            $password = (string) $request->input('password', '');
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
            $rules[$key] = $var->rules ?: 'nullable|string';
            $attributes[$key] = $var->name;
        }

        $validator = Validator::make($request->input('variables', []), $rules, [], $attributes);
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $userVars = [];
        foreach ($model->variables as $var) {
            $val = $request->input('variables.' . $var->env_variable, $var->default_value);
            $userVars[ltrim($var->env_variable, '$')] = is_bool($val) ? ($val ? '1' : '0') : (string) $val;
        }

        try {
            $result = $this->installer->install($server, $model, $userVars);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => 'Template instalado com sucesso.',
        ]);
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
                'rules' => $v->rules,
                'selectable' => $v->selectable,
            ]),
        ];

        $data['full_description'] = $t->full_description;

        return $data;
    }
}
