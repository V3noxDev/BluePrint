<?php

namespace {appcontext};

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;

class PropertiesController extends Controller
{
    public function __construct(private DaemonFileRepository $files) {}

    public function show(Request $request): JsonResponse
    {
        $server = $this->resolveServer($request);
        $this->authorize('file.read-content', $server);

        $path = $this->propertiesPath($request);

        try {
            $raw = $this->files->setServer($server)->getContent($path);
        } catch (DaemonConnectionException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Não foi possível ler o server.properties. O arquivo existe e o node está online?',
                'error' => $e->getMessage(),
            ], 502);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Falha ao ler server.properties.',
                'error' => $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'path' => $path,
            'raw' => $raw,
            'properties' => $this->parseProperties($raw),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $server = $this->resolveServer($request);
        $this->authorize('file.update', $server);

        $validated = $request->validate([
            'properties' => 'required|array',
            'path' => 'nullable|string|max:255',
        ]);

        $path = $this->propertiesPath($request);

        try {
            $existing = '';
            try {
                $existing = $this->files->setServer($server)->getContent($path);
            } catch (\Throwable) {
                $existing = '';
            }

            $content = $this->mergeProperties($existing, $validated['properties']);
            $this->files->setServer($server)->putContent($path, $content);

            return response()->json([
                'success' => true,
                'path' => $path,
                'properties' => $this->parseProperties($content),
                'raw' => $content,
                'message' => 'server.properties atualizado com sucesso.',
            ]);
        } catch (DaemonConnectionException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Não foi possível salvar no daemon do servidor.',
                'error' => $e->getMessage(),
            ], 502);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Falha ao salvar server.properties.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function resolveServer(Request $request): Server
    {
        abort_unless($request->user(), 403);

        $request->validate([
            'serverUuid' => 'required|string|exists:servers,uuid',
        ]);

        return Server::where('uuid', $request->input('serverUuid'))->firstOrFail();
    }

    private function propertiesPath(Request $request): string
    {
        $path = (string) $request->input('path', '/server.properties');
        $path = '/' . ltrim($path, '/');

        if (!str_ends_with(strtolower($path), 'server.properties')) {
            abort(422, 'Somente arquivos server.properties são permitidos.');
        }

        return $path;
    }

    /**
     * @return array<string, string>
     */
    private function parseProperties(string $raw): array
    {
        $result = [];

        foreach (preg_split("/\r\n|\n|\r/", $raw) as $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || str_starts_with($trimmed, '#') || !str_contains($trimmed, '=')) {
                continue;
            }

            [$key, $value] = explode('=', $trimmed, 2);
            $result[trim($key)] = $value;
        }

        return $result;
    }

    /**
     * Preserve comments/order from the existing file while updating keys.
     *
     * @param  array<string, mixed>  $updates
     */
    private function mergeProperties(string $existing, array $updates): string
    {
        $normalized = [];
        foreach ($updates as $key => $value) {
            if (!is_string($key) || $key === '') {
                continue;
            }
            if (is_bool($value)) {
                $normalized[$key] = $value ? 'true' : 'false';
            } elseif (is_null($value)) {
                $normalized[$key] = '';
            } else {
                $normalized[$key] = (string) $value;
            }
        }

        $lines = $existing === ''
            ? ['#Minecraft server properties', '#Generated by MineSuite']
            : preg_split("/\r\n|\n|\r/", $existing);

        $seen = [];
        $output = [];

        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || str_starts_with($trimmed, '#') || !str_contains($trimmed, '=')) {
                $output[] = $line;
                continue;
            }

            [$key] = explode('=', $trimmed, 2);
            $key = trim($key);

            if (array_key_exists($key, $normalized)) {
                $output[] = $key . '=' . $normalized[$key];
                $seen[$key] = true;
            } else {
                $output[] = $line;
            }
        }

        foreach ($normalized as $key => $value) {
            if (!isset($seen[$key])) {
                $output[] = $key . '=' . $value;
            }
        }

        return rtrim(implode("\n", $output)) . "\n";
    }
}
