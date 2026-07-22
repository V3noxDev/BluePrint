<?php

namespace Pterodactyl\BlueprintFramework\Extensions\templates;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Pterodactyl\Http\Controllers\Controller;

class AdminTemplateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->assertAdmin($request);

        $templates = InstallerTemplate::query()
            ->withCount(['variables', 'steps'])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json(['success' => true, 'data' => $templates]);
    }

    public function variablesDoc(Request $request): JsonResponse
    {
        $this->assertAdmin($request);

        return response()->json([
            'success' => true,
            'data' => TemplateContextBuilder::availableVariablesDoc(),
        ]);
    }

    public function show(Request $request, int $template): JsonResponse
    {
        $this->assertAdmin($request);

        $model = InstallerTemplate::query()
            ->with(['variables', 'steps'])
            ->findOrFail($template);

        return response()->json(['success' => true, 'data' => $model]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->assertAdmin($request);

        $data = $this->validateTemplate($request);
        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $model = InstallerTemplate::query()->create($data);

        return response()->json(['success' => true, 'data' => $model], 201);
    }

    public function update(Request $request, int $template): JsonResponse
    {
        $this->assertAdmin($request);

        $model = InstallerTemplate::query()->findOrFail($template);
        $data = $this->validateTemplate($request, false);

        if (array_key_exists('password', $data)) {
            if ($data['password'] === '' || $data['password'] === null) {
                unset($data['password']);
            } else {
                $data['password'] = Hash::make($data['password']);
            }
        }

        $model->update($data);

        return response()->json(['success' => true, 'data' => $model->fresh()]);
    }

    public function destroy(Request $request, int $template): JsonResponse
    {
        $this->assertAdmin($request);

        InstallerTemplate::query()->findOrFail($template)->delete();

        return response()->json(['success' => true]);
    }

    public function export(Request $request, int $template): JsonResponse
    {
        $this->assertAdmin($request);

        $model = InstallerTemplate::query()->with(['variables', 'steps'])->findOrFail($template);
        $export = $model->toArray();
        unset($export['id'], $export['created_at'], $export['updated_at'], $export['password']);
        $export['variables'] = $model->variables->map(function ($v) {
            $arr = $v->toArray();
            unset($arr['id'], $arr['template_id'], $arr['created_at'], $arr['updated_at']);

            return $arr;
        });
        $export['steps'] = $model->steps->map(function ($s) {
            $arr = $s->toArray();
            unset($arr['id'], $arr['template_id'], $arr['created_at'], $arr['updated_at']);

            return $arr;
        });

        return response()->json(['success' => true, 'data' => $export]);
    }

    public function import(Request $request): JsonResponse
    {
        $this->assertAdmin($request);

        $payload = $request->input('template');
        if (!is_array($payload)) {
            return response()->json(['success' => false, 'error' => 'JSON inválido.'], 422);
        }

        return DB::transaction(function () use ($payload) {
            $template = InstallerTemplate::query()->create([
                'sort_order' => $payload['sort_order'] ?? 0,
                'name' => $payload['name'] ?? 'Imported Template',
                'icon_url' => $payload['icon_url'] ?? null,
                'category' => $payload['category'] ?? null,
                'description' => $payload['description'] ?? null,
                'full_description' => $payload['full_description'] ?? null,
                'version' => $payload['version'] ?? '1.0.0',
                'author' => $payload['author'] ?? null,
                'enabled' => $payload['enabled'] ?? true,
            ]);

            foreach ($payload['variables'] ?? [] as $var) {
                $template->variables()->create($var);
            }
            foreach ($payload['steps'] ?? [] as $step) {
                $template->steps()->create($step);
            }

            return response()->json(['success' => true, 'data' => $template->load(['variables', 'steps'])], 201);
        });
    }

    public function storeVariable(Request $request, int $template): JsonResponse
    {
        $this->assertAdmin($request);
        InstallerTemplate::query()->findOrFail($template);

        $data = $request->validate([
            'sort_order' => 'integer|min:0',
            'name' => 'required|string|max:191',
            'env_variable' => 'required|string|max:128',
            'description' => 'nullable|string',
            'default_value' => 'nullable|string',
            'rules' => 'nullable|string|max:512',
            'selectable' => 'boolean',
        ]);

        $var = InstallerTemplateVariable::query()->create(array_merge($data, ['template_id' => $template]));

        return response()->json(['success' => true, 'data' => $var], 201);
    }

    public function updateVariable(Request $request, int $template, int $variable): JsonResponse
    {
        $this->assertAdmin($request);

        $var = InstallerTemplateVariable::query()
            ->where('template_id', $template)
            ->findOrFail($variable);

        $data = $request->validate([
            'sort_order' => 'integer|min:0',
            'name' => 'sometimes|string|max:191',
            'env_variable' => 'sometimes|string|max:128',
            'description' => 'nullable|string',
            'default_value' => 'nullable|string',
            'rules' => 'nullable|string|max:512',
            'selectable' => 'boolean',
        ]);

        $var->update($data);

        return response()->json(['success' => true, 'data' => $var]);
    }

    public function destroyVariable(Request $request, int $template, int $variable): JsonResponse
    {
        $this->assertAdmin($request);

        InstallerTemplateVariable::query()
            ->where('template_id', $template)
            ->findOrFail($variable)
            ->delete();

        return response()->json(['success' => true]);
    }

    public function storeStep(Request $request, int $template): JsonResponse
    {
        $this->assertAdmin($request);
        InstallerTemplate::query()->findOrFail($template);

        $data = $request->validate([
            'sort_order' => 'integer|min:0',
            'action' => 'required|string|in:' . implode(',', array_keys(InstallerTemplateStep::ACTIONS)),
            'file_path' => 'nullable|string|max:512',
            'content' => 'nullable|string',
        ]);

        $step = InstallerTemplateStep::query()->create(array_merge($data, ['template_id' => $template]));

        return response()->json(['success' => true, 'data' => $step], 201);
    }

    public function updateStep(Request $request, int $template, int $step): JsonResponse
    {
        $this->assertAdmin($request);

        $model = InstallerTemplateStep::query()
            ->where('template_id', $template)
            ->findOrFail($step);

        $data = $request->validate([
            'sort_order' => 'integer|min:0',
            'action' => 'sometimes|string|in:' . implode(',', array_keys(InstallerTemplateStep::ACTIONS)),
            'file_path' => 'nullable|string|max:512',
            'content' => 'nullable|string',
        ]);

        $model->update($data);

        return response()->json(['success' => true, 'data' => $model]);
    }

    public function destroyStep(Request $request, int $template, int $step): JsonResponse
    {
        $this->assertAdmin($request);

        InstallerTemplateStep::query()
            ->where('template_id', $template)
            ->findOrFail($step)
            ->delete();

        return response()->json(['success' => true]);
    }

    public function actions(Request $request): JsonResponse
    {
        $this->assertAdmin($request);

        return response()->json(['success' => true, 'data' => InstallerTemplateStep::ACTIONS]);
    }

    private function validateTemplate(Request $request, bool $requireName = true): array
    {
        return $request->validate([
            'sort_order' => 'integer|min:0',
            'name' => ($requireName ? 'required' : 'sometimes') . '|string|max:191',
            'icon_url' => 'nullable|string|max:512',
            'category' => 'nullable|string|max:128',
            'description' => 'nullable|string',
            'full_description' => 'nullable|string',
            'password' => 'nullable|string|max:191',
            'password_description' => 'nullable|string',
            'version' => 'nullable|string|max:32',
            'author' => 'nullable|string|max:128',
            'enabled' => 'boolean',
        ]);
    }

    private function assertAdmin(Request $request): void
    {
        $user = $request->user();
        if (!$user || !$user->root_admin) {
            abort(403);
        }
    }
}
