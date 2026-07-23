<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcmodpack;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;

/**
 * Envia arquivos ao Wings via stream (suporta zips grandes de modpack).
 */
class WingsFileUploader
{
    private const WRITE_TIMEOUT = 900;

    public function uploadFromPath(Server $server, string $remotePath, string $localPath): void
    {
        if (!is_file($localPath)) {
            throw new \RuntimeException('Arquivo local não encontrado para upload.');
        }

        $size = filesize($localPath);
        if ($size === false || $size < 1) {
            throw new \RuntimeException('Arquivo local está vazio.');
        }

        $server->loadMissing('node');
        $node = $server->node;
        $remotePath = '/' . ltrim(str_replace('\\', '/', $remotePath), '/');

        $handle = fopen($localPath, 'rb');
        if ($handle === false) {
            throw new \RuntimeException('Não foi possível abrir o arquivo para upload.');
        }

        try {
            $client = new Client([
                'verify' => app()->environment('production'),
                'base_uri' => $node->getConnectionAddress(),
                'timeout' => self::WRITE_TIMEOUT,
                'connect_timeout' => 30,
                'headers' => [
                    'Authorization' => 'Bearer ' . $node->getDecryptedKey(),
                    'Accept' => 'application/json',
                ],
            ]);

            $response = $client->post(
                sprintf('/api/servers/%s/files/write', $server->uuid),
                [
                    'query' => ['file' => $remotePath],
                    'body' => $handle,
                ]
            );

            if ($response->getStatusCode() >= 400) {
                throw new \RuntimeException('Wings recusou o upload (HTTP ' . $response->getStatusCode() . ').');
            }

            Log::info('[mcmodpack] upload stream concluído', [
                'server' => $server->uuid,
                'path' => $remotePath,
                'bytes' => $size,
            ]);
        } catch (GuzzleException $e) {
            throw new \RuntimeException('Falha ao enviar arquivo ao Wings: ' . $e->getMessage(), 0, $e);
        } finally {
            fclose($handle);
        }
    }

    public function uploadSmall(Server $server, string $remotePath, string $content, DaemonFileRepository $files): void
    {
        $remotePath = ltrim(str_replace('\\', '/', $remotePath), '/');
        $files->setServer($server)->putContent($remotePath, $content);
    }
}
