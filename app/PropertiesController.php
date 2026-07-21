<?php

namespace Pterodactyl\BlueprintFramework\Extensions\{identifier};

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

class PropertiesController extends ClientApiController
{
    use McManagerHelpers;

    public function __construct(private DaemonFileRepository $files)
    {
        parent::__construct();
    }

    public function show(Request $request, Server $server): JsonResponse
    {
        $this->assertExtensionEnabled();
        $this->authorizeServer($request, $server, 'file.read');

        $path = $this->configPayload()['properties_path'];

        try {
            $raw = $this->files->setServer($server)->getContent($path);
        } catch (DaemonConnectionException $exception) {
            return response()->json([
                'error' => 'Could not read server.properties from the daemon.',
                'message' => $exception->getMessage(),
            ], 502);
        } catch (\Throwable $exception) {
            return response()->json([
                'error' => 'server.properties was not found or could not be read.',
                'message' => $exception->getMessage(),
                'path' => $path,
                'properties' => new \stdClass(),
                'raw' => '',
                'config' => $this->configPayload(),
            ], 404);
        }

        return response()->json([
            'path' => $path,
            'properties' => $this->parseProperties($raw),
            'raw' => $raw,
            'config' => $this->configPayload(),
        ]);
    }

    public function update(Request $request, Server $server): JsonResponse
    {
        $this->assertExtensionEnabled();
        $this->authorizeServer($request, $server, 'file.update');

        if (!$this->configPayload()['allow_properties_edit']) {
            abort(403, 'Editing server.properties is disabled by the administrator.');
        }

        $validated = $request->validate([
            'properties' => ['required', 'array'],
            'properties.*' => ['nullable'],
        ]);

        $path = $this->configPayload()['properties_path'];
        $incoming = [];
        foreach ($validated['properties'] as $key => $value) {
            $incoming[(string) $key] = $value === null ? '' : (string) $value;
        }

        try {
            $existingRaw = '';
            try {
                $existingRaw = $this->files->setServer($server)->getContent($path);
            } catch (\Throwable $ignored) {
                $existingRaw = '';
            }

            $content = $this->mergeProperties($existingRaw, $incoming);
            $this->files->setServer($server)->putContent($path, $content);
        } catch (DaemonConnectionException $exception) {
            return response()->json([
                'error' => 'Could not write server.properties to the daemon.',
                'message' => $exception->getMessage(),
            ], 502);
        }

        return response()->json([
            'success' => true,
            'path' => $path,
            'properties' => $this->parseProperties($content),
            'message' => 'server.properties updated successfully. Restart the server for some changes to apply.',
        ]);
    }

    private function parseProperties(string $raw): array
    {
        $result = [];

        foreach (preg_split("/\r\n|\n|\r/", $raw) as $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || str_starts_with($trimmed, '#')) {
                continue;
            }

            $pos = strpos($trimmed, '=');
            if ($pos === false) {
                continue;
            }

            $key = trim(substr($trimmed, 0, $pos));
            $value = substr($trimmed, $pos + 1);
            if ($key !== '') {
                $result[$key] = $value;
            }
        }

        return $result;
    }

    /**
     * Preserve comments and key order from the existing file when possible.
     *
     * @param  array<string, string>  $incoming
     */
    private function mergeProperties(string $existingRaw, array $incoming): string
    {
        $remaining = [];
        foreach ($incoming as $key => $value) {
            $remaining[strtolower($key)] = [
                'key' => $key,
                'value' => $value,
            ];
        }

        $lines = preg_split("/\r\n|\n|\r/", $existingRaw) ?: [];
        $output = [];

        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || str_starts_with($trimmed, '#')) {
                $output[] = $line;
                continue;
            }

            $pos = strpos($line, '=');
            if ($pos === false) {
                $output[] = $line;
                continue;
            }

            $key = trim(substr($line, 0, $pos));
            $lower = strtolower($key);

            if (isset($remaining[$lower])) {
                $output[] = $key . '=' . $remaining[$lower]['value'];
                unset($remaining[$lower]);
            } else {
                $output[] = $line;
            }
        }

        foreach ($remaining as $item) {
            $output[] = $item['key'] . '=' . $item['value'];
        }

        $content = implode("\n", $output);
        if ($content !== '' && !str_ends_with($content, "\n")) {
            $content .= "\n";
        }

        return $content;
    }
}
