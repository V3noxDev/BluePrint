<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcmodpack;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ModpackPullController
{
    public function stream(Request $request, string $token): StreamedResponse|\Illuminate\Http\Response
    {
        $meta = ModpackPullToken::get($token);
        if (!$meta || empty($meta['path']) || !is_file($meta['path'])) {
            return response('Not found', 404);
        }

        $path = (string) $meta['path'];
        $size = (int) ($meta['size'] ?? filesize($path));
        if ($size < 1) {
            return response('Empty file', 410);
        }

        return response()->stream(function () use ($path) {
            $handle = @fopen($path, 'rb');
            if ($handle === false) {
                return;
            }

            while (!feof($handle)) {
                $chunk = fread($handle, 1048576);
                if ($chunk === false || $chunk === '') {
                    break;
                }
                echo $chunk;
                if (ob_get_level() > 0) {
                    @ob_flush();
                }
                flush();
            }

            fclose($handle);
        }, 200, array(
            'Content-Type' => 'application/octet-stream',
            'Content-Length' => (string) $size,
            'Cache-Control' => 'no-store',
        ));
    }
}
