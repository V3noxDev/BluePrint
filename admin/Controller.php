<?php

namespace Pterodactyl\Http\Controllers\Admin\Extensions\{identifier};

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\View\Factory as ViewFactory;
use Illuminate\View\View;
use Pterodactyl\BlueprintFramework\Extensions\{identifier}\Services\ServerPropertiesEditor;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Throwable;

class {identifier}ExtensionController extends Controller
{
    public function __construct(
        private ViewFactory $view,
        private BlueprintExtensionLibrary $blueprint,
        private DaemonFileRepository $files,
        private SettingsRepositoryInterface $settings,
        private ServerPropertiesEditor $editor,
    ) {
    }

    public function index(Request $request): View
    {
        $servers = $this->serverOptions();
        $content = (string) old(
            'properties_content',
            $this->settings->get('mcserverprops::draft_content', $this->editor->defaultContent())
        );

        $fieldValues = old('fields', $this->editor->extractEditableFields($content));
        if (!is_array($fieldValues)) {
            $fieldValues = $this->editor->extractEditableFields($content);
        }

        return $this->view->make('admin.extensions.{identifier}.index', [
            'root' => '/admin/extensions/{identifier}',
            'blueprint' => $this->blueprint,
            'servers' => $servers,
            'fieldDefinitions' => $this->editor->fieldDefinitions(),
            'fieldValues' => $fieldValues,
            'selectedServerId' => (string) old(
                'server_id',
                $this->settings->get('mcserverprops::last_server_id', '')
            ),
            'propertiesPath' => (string) old(
                'properties_path',
                $this->settings->get('mcserverprops::properties_path', 'server.properties')
            ),
            'propertiesContent' => $content,
            'statusType' => session('status_type', 'success'),
            'stats' => [
                'server_count' => count($servers),
                'field_count' => count($this->editor->fieldDefinitions()),
                'target_version' => 'beta-2026-05',
            ],
        ]);
    }

    public function post(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'server_id' => ['required', 'integer', 'exists:servers,id'],
            'properties_path' => ['required', 'string', 'max:255'],
        ]);

        $path = $this->normalizePath($data['properties_path']);
        $server = Server::query()->findOrFail((int) $data['server_id']);

        try {
            $content = $this->files
                ->setServer($server)
                ->setNode($server->node)
                ->getContent($path, config('panel.files.max_edit_size'));
        } catch (Throwable $exception) {
            Log::warning('mcserverprops failed to load file contents.', [
                'server_id' => $server->id,
                'path' => $path,
                'message' => $exception->getMessage(),
            ]);

            return redirect()
                ->route('admin.extensions.{identifier}.index')
                ->withInput([
                    'server_id' => (string) $server->id,
                    'properties_path' => $path,
                    'properties_content' => (string) old('properties_content', $this->editor->defaultContent()),
                    'fields' => old('fields', $this->editor->extractEditableFields($this->editor->defaultContent())),
                ])
                ->withErrors([
                    'properties_content' => 'Nao foi possivel carregar o arquivo selecionado. Confira o caminho e as permissoes do servidor.',
                ])
                ->with('status_type', 'danger');
        }

        if (trim($content) === '') {
            $content = $this->editor->defaultContent();
        }

        $this->persistDraft((string) $server->id, $path, $content);

        return redirect()
            ->route('admin.extensions.{identifier}.index')
            ->withInput($this->draftInput((string) $server->id, $path, $content))
            ->with('status', 'Arquivo carregado com sucesso. Revise os campos e salve quando estiver pronto.')
            ->with('status_type', 'success');
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'server_id' => ['required', 'integer', 'exists:servers,id'],
            'properties_path' => ['required', 'string', 'max:255'],
            'properties_content' => ['nullable', 'string'],
            'fields' => ['array'],
            'fields.motd' => ['nullable', 'string', 'max:255'],
            'fields.level-name' => ['nullable', 'string', 'max:100'],
            'fields.level-seed' => ['nullable', 'string', 'max:255'],
            'fields.gamemode' => ['nullable', 'in:survival,creative,adventure,spectator'],
            'fields.difficulty' => ['nullable', 'in:peaceful,easy,normal,hard'],
            'fields.pvp' => ['nullable', 'in:true,false'],
            'fields.hardcore' => ['nullable', 'in:true,false'],
            'fields.allow-flight' => ['nullable', 'in:true,false'],
            'fields.enable-command-block' => ['nullable', 'in:true,false'],
            'fields.online-mode' => ['nullable', 'in:true,false'],
            'fields.white-list' => ['nullable', 'in:true,false'],
            'fields.enforce-whitelist' => ['nullable', 'in:true,false'],
            'fields.server-port' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'fields.max-players' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'fields.view-distance' => ['nullable', 'integer', 'min:2', 'max:32'],
            'fields.simulation-distance' => ['nullable', 'integer', 'min:2', 'max:32'],
            'fields.spawn-protection' => ['nullable', 'integer', 'min:0', 'max:128'],
            'fields.max-world-size' => ['nullable', 'integer', 'min:1', 'max:29999984'],
            'fields.allow-nether' => ['nullable', 'in:true,false'],
        ]);

        $path = $this->normalizePath($data['properties_path']);
        $server = Server::query()->findOrFail((int) $data['server_id']);
        $rawContent = trim((string) ($data['properties_content'] ?? '')) === ''
            ? $this->editor->defaultContent()
            : (string) $data['properties_content'];
        $finalContent = $this->editor->mergeEditableFields($rawContent, $data['fields'] ?? []);

        try {
            $this->files
                ->setServer($server)
                ->setNode($server->node)
                ->putContent($path, $finalContent);
        } catch (Throwable $exception) {
            Log::error('mcserverprops failed to save file contents.', [
                'server_id' => $server->id,
                'path' => $path,
                'message' => $exception->getMessage(),
            ]);

            return redirect()
                ->route('admin.extensions.{identifier}.index')
                ->withInput($this->draftInput((string) $server->id, $path, $finalContent))
                ->withErrors([
                    'properties_content' => 'O Blueprint nao conseguiu gravar o arquivo no Wings. Verifique se o arquivo existe e se o painel tem permissao para editar conteudo.',
                ])
                ->with('status_type', 'danger');
        }

        $this->persistDraft((string) $server->id, $path, $finalContent);

        return redirect()
            ->route('admin.extensions.{identifier}.index')
            ->withInput($this->draftInput((string) $server->id, $path, $finalContent))
            ->with('status', 'server.properties salvo com sucesso no Wings.')
            ->with('status_type', 'success');
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function serverOptions(): array
    {
        return Server::query()
            ->orderBy('name')
            ->get(['id', 'name', 'uuid'])
            ->map(static fn (Server $server): array => [
                'id' => (string) $server->id,
                'name' => $server->name,
                'uuid' => $server->uuid,
                'short_uuid' => Str::limit($server->uuid, 8, ''),
            ])
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function draftInput(string $serverId, string $path, string $content): array
    {
        return [
            'server_id' => $serverId,
            'properties_path' => $path,
            'properties_content' => $content,
            'fields' => $this->editor->extractEditableFields($content),
        ];
    }

    private function normalizePath(string $path): string
    {
        $normalized = trim($path);
        $normalized = ltrim($normalized, '/');

        return $normalized === '' ? 'server.properties' : $normalized;
    }

    private function persistDraft(string $serverId, string $path, string $content): void
    {
        $this->settings->set('mcserverprops::last_server_id', $serverId);
        $this->settings->set('mcserverprops::properties_path', $path);
        $this->settings->set('mcserverprops::draft_content', $content);
    }
}
