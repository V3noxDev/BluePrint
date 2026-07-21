<?php

namespace {appcontext}\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use {appcontext}\Http\Requests\CatalogRequest;
use {appcontext}\Http\Requests\InstallAddonRequest;
use {appcontext}\Http\Requests\ListInstalledRequest;
use {appcontext}\Http\Requests\ReadPropertiesRequest;
use {appcontext}\Http\Requests\RemoveAddonRequest;
use {appcontext}\Http\Requests\UpdatePropertiesRequest;
use {appcontext}\Http\Requests\VersionsRequest;
use {appcontext}\Services\ModrinthService;
use {appcontext}\Services\ServerPropertiesService;

final class MineFlowController extends ClientApiController
{
    private const DIRECTORIES = [
        'plugin' => '/plugins',
        'mod' => '/mods',
    ];

    public function __construct(
        private DaemonFileRepository $files,
        private ModrinthService $modrinth,
        private ServerPropertiesService $propertiesService,
    ) {
        parent::__construct();
    }

    public function catalog(CatalogRequest $request, Server $server): array
    {
        return $this->modrinth->search($request->validated());
    }

    public function versions(VersionsRequest $request, Server $server, string $project): array
    {
        return [
            'versions' => $this->modrinth->versions($project, $request->validated()),
        ];
    }

    public function installed(ListInstalledRequest $request, Server $server): array
    {
        $kind = $request->validated('kind');
        $directory = self::DIRECTORIES[$kind];

        try {
            $entries = $this->files->setServer($server)->getDirectory($directory);
        } catch (DaemonConnectionException $exception) {
            if ($exception->getStatusCode() !== Response::HTTP_NOT_FOUND) {
                throw $exception;
            }

            $entries = [];
        }

        $addons = array_values(array_filter(array_map(
            static fn (array $entry): array => [
                'name' => (string) ($entry['name'] ?? ''),
                'size' => (int) ($entry['size'] ?? 0),
                'modified_at' => $entry['modified'] ?? null,
            ],
            $entries
        ), static fn (array $entry): bool => str_ends_with(strtolower($entry['name']), '.jar')));

        usort($addons, static fn (array $left, array $right): int => strnatcasecmp($left['name'], $right['name']));

        return [
            'kind' => $kind,
            'directory' => $directory,
            'addons' => $addons,
        ];
    }

    public function install(InstallAddonRequest $request, Server $server): JsonResponse
    {
        set_time_limit(180);

        $data = $request->validated();
        $directory = self::DIRECTORIES[$data['kind']];
        $file = $this->modrinth->downloadableFile($data['project_id'], $data['version_id'], $data['kind']);
        $entries = $this->ensureDirectory($server, $directory);

        $this->assertFilenameAvailable($entries, $directory, $file['filename']);

        $contents = $this->modrinth->download($file);
        $latestEntries = $this->files->setServer($server)->getDirectory($directory);
        $this->assertFilenameAvailable($latestEntries, $directory, $file['filename']);

        $path = $directory . '/' . $file['filename'];
        $this->files->setServer($server)->putContent($path, $contents);

        Activity::event('server:file.write')
            ->property('file', $path)
            ->property('source', 'mineflow')
            ->property('project_id', $file['project_id'])
            ->property('version_id', $file['version_id'])
            ->log();

        return new JsonResponse([
            'message' => 'Addon instalado com sucesso.',
            'addon' => [
                'name' => $file['filename'],
                'path' => $path,
                'size' => $file['size'],
                'version' => $file['version_name'],
            ],
        ], Response::HTTP_CREATED);
    }

    public function remove(RemoveAddonRequest $request, Server $server): JsonResponse
    {
        $data = $request->validated();
        $directory = self::DIRECTORIES[$data['kind']];
        $filename = basename($data['filename']);

        $this->files->setServer($server)->deleteFiles($directory, [$filename]);

        Activity::event('server:file.delete')
            ->property('directory', $directory)
            ->property('files', [$filename])
            ->property('source', 'mineflow')
            ->log();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    public function properties(ReadPropertiesRequest $request, Server $server): array
    {
        $content = $this->readProperties($server);

        Activity::event('server:file.read')
            ->property('file', '/server.properties')
            ->property('source', 'mineflow')
            ->log();

        return [
            'path' => '/server.properties',
            'exists' => $content !== null,
            'properties' => $this->propertiesService->parse($content ?? ''),
        ];
    }

    public function updateProperties(UpdatePropertiesRequest $request, Server $server): JsonResponse
    {
        $data = $request->validated();
        $content = $this->readProperties($server) ?? "#Minecraft server properties\n";
        $updates = array_map(static fn ($value): string => $value ?? '', $data['properties']);
        $updated = $this->propertiesService->update($content, $updates, $data['remove'] ?? []);

        if (strlen($updated) > 524_288) {
            return new JsonResponse([
                'message' => 'O server.properties resultante excede o limite de 512 KiB.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->files->setServer($server)->putContent('/server.properties', $updated);

        Activity::event('server:file.write')
            ->property('file', '/server.properties')
            ->property('source', 'mineflow')
            ->property('changed_keys', array_keys($data['properties']))
            ->property('removed_keys', $data['remove'] ?? [])
            ->log();

        return new JsonResponse([
            'message' => 'server.properties salvo com sucesso.',
            'properties' => $this->propertiesService->parse($updated),
        ]);
    }

    private function readProperties(Server $server): ?string
    {
        try {
            return $this->files
                ->setServer($server)
                ->getContent('/server.properties', 524_288);
        } catch (DaemonConnectionException $exception) {
            if ($exception->getStatusCode() === Response::HTTP_NOT_FOUND) {
                return null;
            }

            throw $exception;
        }
    }

    private function ensureDirectory(Server $server, string $directory): array
    {
        try {
            return $this->files->setServer($server)->getDirectory($directory);
        } catch (DaemonConnectionException $exception) {
            if ($exception->getStatusCode() !== Response::HTTP_NOT_FOUND) {
                throw $exception;
            }

            $this->files->setServer($server)->createDirectory(ltrim($directory, '/'), '/');

            return [];
        }
    }

    private function assertFilenameAvailable(array $entries, string $directory, string $filename): void
    {
        foreach ($entries as $entry) {
            if (strcasecmp((string) ($entry['name'] ?? ''), $filename) === 0) {
                throw ValidationException::withMessages([
                    'version_id' => sprintf(
                        '%s já existe em %s. Remova o arquivo instalado antes de substituí-lo.',
                        $filename,
                        $directory
                    ),
                ]);
            }
        }
    }
}
