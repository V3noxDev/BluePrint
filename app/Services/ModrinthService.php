<?php

namespace {appcontext}\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use RuntimeException;

final class ModrinthService
{
    private const API_URL = 'https://api.modrinth.com/v2';
    private const USER_AGENT = 'V3noxDev/MineFlow/1.0.0 (Pterodactyl Blueprint)';
    private const MAX_FILE_SIZE = 67_108_864;
    private const ALLOWED_DOWNLOAD_HOSTS = ['cdn.modrinth.com'];

    public function search(array $filters): array
    {
        $facets = [['project_type:' . $filters['kind']]];

        if (!empty($filters['game_version'])) {
            $facets[] = ['versions:' . $filters['game_version']];
        }

        if (!empty($filters['loader'])) {
            $facets[] = ['categories:' . $filters['loader']];
        }

        $response = $this->request('/search', [
            'query' => $filters['query'] ?? '',
            'facets' => json_encode($facets, JSON_THROW_ON_ERROR),
            'index' => $filters['index'] ?? 'relevance',
            'offset' => $filters['offset'] ?? 0,
            'limit' => $filters['limit'] ?? 20,
        ]);

        return [
            'hits' => array_map(fn (array $hit): array => $this->transformProject($hit), $response['hits'] ?? []),
            'offset' => (int) ($response['offset'] ?? 0),
            'limit' => (int) ($response['limit'] ?? 20),
            'total_hits' => (int) ($response['total_hits'] ?? 0),
        ];
    }

    public function versions(string $project, array $filters): array
    {
        $query = [];

        if (!empty($filters['game_version'])) {
            $query['game_versions'] = json_encode([$filters['game_version']], JSON_THROW_ON_ERROR);
        }

        if (!empty($filters['loader'])) {
            $query['loaders'] = json_encode([$filters['loader']], JSON_THROW_ON_ERROR);
        }

        $versions = $this->request('/project/' . rawurlencode($project) . '/version', $query);

        return array_map(fn (array $version): array => $this->transformVersion($version), $versions);
    }

    public function downloadableFile(string $project, string $version): array
    {
        $metadata = $this->request('/version/' . rawurlencode($version));

        if (($metadata['project_id'] ?? null) !== $project) {
            throw ValidationException::withMessages([
                'version_id' => 'A versão selecionada não pertence a este projeto.',
            ]);
        }

        $files = array_values(array_filter(
            $metadata['files'] ?? [],
            static fn ($file): bool => is_array($file) && str_ends_with(strtolower((string) ($file['filename'] ?? '')), '.jar')
        ));

        $file = collect($files)->firstWhere('primary', true) ?? ($files[0] ?? null);
        if (!is_array($file)) {
            throw ValidationException::withMessages([
                'version_id' => 'A versão selecionada não contém um arquivo JAR instalável.',
            ]);
        }

        $url = (string) ($file['url'] ?? '');
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        if (parse_url($url, PHP_URL_SCHEME) !== 'https' || !in_array($host, self::ALLOWED_DOWNLOAD_HOSTS, true)) {
            throw ValidationException::withMessages([
                'version_id' => 'O arquivo usa uma origem de download não permitida.',
            ]);
        }

        $size = (int) ($file['size'] ?? 0);
        if ($size < 1 || $size > self::MAX_FILE_SIZE) {
            throw ValidationException::withMessages([
                'version_id' => 'O arquivo excede o limite de 64 MiB do MineFlow.',
            ]);
        }

        $filename = $this->sanitizeFilename((string) ($file['filename'] ?? 'addon.jar'));

        return [
            'url' => $url,
            'filename' => $filename,
            'size' => $size,
            'sha512' => strtolower((string) ($file['hashes']['sha512'] ?? '')),
            'version_name' => (string) ($metadata['name'] ?? $metadata['version_number'] ?? $version),
            'project_id' => $project,
            'version_id' => $version,
        ];
    }

    public function download(array $file): string
    {
        $response = Http::withHeaders(['User-Agent' => self::USER_AGENT])
            ->accept('application/octet-stream')
            ->connectTimeout(10)
            ->timeout(120)
            ->get($file['url']);

        $this->ensureSuccessful($response);
        $contents = $response->body();

        if (strlen($contents) > self::MAX_FILE_SIZE) {
            throw ValidationException::withMessages([
                'version_id' => 'O arquivo baixado excede o limite de 64 MiB.',
            ]);
        }

        if ($file['sha512'] !== '' && !hash_equals($file['sha512'], hash('sha512', $contents))) {
            throw new RuntimeException('A verificação de integridade SHA-512 do arquivo falhou.');
        }

        return $contents;
    }

    private function request(string $path, array $query = []): array
    {
        $response = Http::withHeaders(['User-Agent' => self::USER_AGENT])
            ->acceptJson()
            ->connectTimeout(10)
            ->timeout(30)
            ->get(self::API_URL . $path, $query);

        $this->ensureSuccessful($response);

        $payload = $response->json();
        if (!is_array($payload)) {
            throw new RuntimeException('O Modrinth retornou uma resposta inválida.');
        }

        return $payload;
    }

    private function ensureSuccessful(Response $response): void
    {
        if ($response->successful()) {
            return;
        }

        if ($response->status() === 404) {
            throw ValidationException::withMessages([
                'project' => 'O projeto ou a versão não foi encontrado no Modrinth.',
            ]);
        }

        throw new RuntimeException(sprintf('O Modrinth respondeu com o código HTTP %d.', $response->status()));
    }

    private function transformProject(array $project): array
    {
        return [
            'project_id' => (string) ($project['project_id'] ?? ''),
            'slug' => (string) ($project['slug'] ?? ''),
            'title' => (string) ($project['title'] ?? ''),
            'description' => (string) ($project['description'] ?? ''),
            'author' => (string) ($project['author'] ?? ''),
            'icon_url' => $project['icon_url'] ?? null,
            'downloads' => (int) ($project['downloads'] ?? 0),
            'follows' => (int) ($project['follows'] ?? 0),
            'date_modified' => $project['date_modified'] ?? null,
            'latest_version' => $project['latest_version'] ?? null,
            'project_type' => (string) ($project['project_type'] ?? ''),
            'categories' => array_values($project['categories'] ?? []),
            'versions' => array_values($project['versions'] ?? []),
            'display_categories' => array_values($project['display_categories'] ?? []),
        ];
    }

    private function transformVersion(array $version): array
    {
        $files = array_map(fn (array $file): array => [
            'filename' => $this->sanitizeFilename((string) ($file['filename'] ?? 'addon.jar')),
            'size' => (int) ($file['size'] ?? 0),
            'primary' => (bool) ($file['primary'] ?? false),
        ], array_values(array_filter(
            $version['files'] ?? [],
            static fn ($file): bool => is_array($file) && str_ends_with(strtolower((string) ($file['filename'] ?? '')), '.jar')
        )));

        return [
            'id' => (string) ($version['id'] ?? ''),
            'project_id' => (string) ($version['project_id'] ?? ''),
            'name' => (string) ($version['name'] ?? ''),
            'version_number' => (string) ($version['version_number'] ?? ''),
            'version_type' => (string) ($version['version_type'] ?? 'release'),
            'date_published' => $version['date_published'] ?? null,
            'downloads' => (int) ($version['downloads'] ?? 0),
            'game_versions' => array_values($version['game_versions'] ?? []),
            'loaders' => array_values($version['loaders'] ?? []),
            'files' => $files,
        ];
    }

    private function sanitizeFilename(string $filename): string
    {
        $filename = basename(str_replace('\\', '/', $filename));
        $stem = str_ends_with(strtolower($filename), '.jar') ? substr($filename, 0, -4) : $filename;
        $stem = preg_replace('/[^A-Za-z0-9._+() -]/', '_', $stem) ?: 'addon';

        return rtrim(mb_substr($stem, 0, 176), '. ') . '.jar';
    }
}
