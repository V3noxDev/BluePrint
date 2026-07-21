<?php

namespace Pterodactyl\BlueprintFramework\Extensions\minecraftsuite;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Throwable;

class MinecraftSuiteController extends Controller
{
    private const SERVER_PROPERTIES_PATH = '/server.properties';
    private const SERVER_PROPERTIES_BACKUP_PATH = '/server.properties.bak';
    private const MAX_PROPERTIES_SIZE = 1024 * 1024;
    private const ALLOWED_DIRECTORIES = [
        'plugins',
        'mods',
        'config',
        'resourcepacks',
        'world/datapacks',
    ];

    public function __construct(
        private DaemonFileRepository $files,
        private ServerPropertiesEditor $propertiesEditor,
    ) {
    }

    public function properties(Request $request): JsonResponse
    {
        $server = $this->resolveServer($request, 'file.read');

        try {
            $raw = $this->files
                ->setServer($server)
                ->getContent(self::SERVER_PROPERTIES_PATH, self::MAX_PROPERTIES_SIZE);

            return response()->json([
                'success' => true,
                'raw' => $raw,
                'properties' => $this->propertiesEditor->parse($raw),
            ]);
        } catch (Throwable $exception) {
            return $this->errorResponse('Nao foi possivel ler o arquivo server.properties.', $exception);
        }
    }

    public function saveProperties(Request $request): JsonResponse
    {
        $request->validate([
            'serverUuid' => 'required|string|exists:servers,uuid',
            'raw' => 'nullable|string',
            'properties' => 'nullable|array',
            'createBackup' => 'nullable|boolean',
        ]);

        $server = $this->resolveServer($request, 'file.update');

        if (!$request->filled('raw') && !$request->has('properties')) {
            return response()->json([
                'success' => false,
                'message' => 'Envie um corpo raw ou um objeto properties para salvar.',
            ], 422);
        }

        try {
            $currentRaw = $this->files
                ->setServer($server)
                ->getContent(self::SERVER_PROPERTIES_PATH, self::MAX_PROPERTIES_SIZE);

            $nextRaw = $request->filled('raw')
                ? $this->propertiesEditor->normalizeRaw((string) $request->input('raw'))
                : $this->propertiesEditor->mergeAndSerialize($currentRaw, (array) $request->input('properties', []));

            if ($request->boolean('createBackup', true)) {
                $this->files
                    ->setServer($server)
                    ->putContent(self::SERVER_PROPERTIES_BACKUP_PATH, $currentRaw);
            }

            $this->files
                ->setServer($server)
                ->putContent(self::SERVER_PROPERTIES_PATH, $nextRaw);

            return response()->json([
                'success' => true,
                'message' => 'server.properties atualizado com sucesso.',
                'raw' => $nextRaw,
                'properties' => $this->propertiesEditor->parse($nextRaw),
            ]);
        } catch (Throwable $exception) {
            return $this->errorResponse('Nao foi possivel salvar o arquivo server.properties.', $exception);
        }
    }

    public function listAddons(Request $request): JsonResponse
    {
        $request->validate([
            'serverUuid' => 'required|string|exists:servers,uuid',
            'directory' => ['required', 'string', Rule::in(self::ALLOWED_DIRECTORIES)],
        ]);

        $server = $this->resolveServer($request, 'file.read');
        $directory = $this->normalizeDirectory((string) $request->input('directory'));

        try {
            $entries = $this->files
                ->setServer($server)
                ->getDirectory($directory);

            $files = collect($entries)
                ->filter(fn (array $entry) => !empty($entry['file']))
                ->map(fn (array $entry) => [
                    'name' => $entry['name'] ?? 'unknown',
                    'size' => $entry['size'] ?? 0,
                    'modified_at' => $entry['modified_at'] ?? null,
                    'mime' => $entry['mime'] ?? null,
                ])
                ->values()
                ->all();

            return response()->json([
                'success' => true,
                'directory' => trim($directory, '/'),
                'files' => $files,
            ]);
        } catch (Throwable $exception) {
            return $this->errorResponse('Nao foi possivel listar os addons do diretorio selecionado.', $exception);
        }
    }

    public function installAddon(Request $request): JsonResponse
    {
        $request->validate([
            'serverUuid' => 'required|string|exists:servers,uuid',
            'directory' => ['required', 'string', Rule::in(self::ALLOWED_DIRECTORIES)],
            'downloadUrl' => 'required|url',
            'fileName' => ['required', 'string', 'max:191', 'regex:/^[A-Za-z0-9._-]+$/'],
        ]);

        $server = $this->resolveServer($request, 'file.create');
        $directory = $this->normalizeDirectory((string) $request->input('directory'));

        try {
            $this->files
                ->setServer($server)
                ->pull(
                    (string) $request->input('downloadUrl'),
                    $directory,
                    [
                        'filename' => (string) $request->input('fileName'),
                        'foreground' => true,
                    ]
                );

            return response()->json([
                'success' => true,
                'message' => 'Addon enviado para instalacao com sucesso.',
            ]);
        } catch (Throwable $exception) {
            return $this->errorResponse('Nao foi possivel instalar o addon selecionado.', $exception);
        }
    }

    public function removeAddon(Request $request): JsonResponse
    {
        $request->validate([
            'serverUuid' => 'required|string|exists:servers,uuid',
            'directory' => ['required', 'string', Rule::in(self::ALLOWED_DIRECTORIES)],
            'fileName' => ['required', 'string', 'max:191', 'regex:/^[A-Za-z0-9._-]+$/'],
        ]);

        $server = $this->resolveServer($request, 'file.delete');
        $directory = $this->normalizeDirectory((string) $request->input('directory'));

        try {
            $this->files
                ->setServer($server)
                ->deleteFiles($directory, [(string) $request->input('fileName')]);

            return response()->json([
                'success' => true,
                'message' => 'Addon removido com sucesso.',
            ]);
        } catch (Throwable $exception) {
            return $this->errorResponse('Nao foi possivel remover o addon selecionado.', $exception);
        }
    }

    private function resolveServer(Request $request, string $permission): Server
    {
        $request->validate([
            'serverUuid' => 'required|string|exists:servers,uuid',
        ]);

        $server = Server::query()
            ->where('uuid', $request->input('serverUuid'))
            ->firstOrFail();

        $this->authorize($permission, $server);

        return $server;
    }

    private function normalizeDirectory(string $directory): string
    {
        return '/' . trim($directory, '/');
    }

    private function errorResponse(string $message, Throwable $exception): JsonResponse
    {
        $status = $exception instanceof DaemonConnectionException ? 502 : 500;

        return response()->json([
            'success' => false,
            'message' => $message,
            'error' => $exception->getMessage(),
        ], $status);
    }
}
