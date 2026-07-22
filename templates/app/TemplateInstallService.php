<?php

namespace Pterodactyl\BlueprintFramework\Extensions\templates;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Repositories\Wings\DaemonPowerRepository;

class TemplateInstallService
{
    public function __construct(
        private TemplateContextBuilder $contextBuilder,
        private TemplateRenderer $renderer,
        private DaemonFileRepository $files,
        private DaemonPowerRepository $power,
    ) {}

    public function install(Server $server, InstallerTemplate $template, array $userVariables): array
    {
        $template->load(['variables', 'steps']);
        $context = $this->contextBuilder->build($server, $userVariables);

        // Não para o servidor automaticamente — isso derruba o painel React quando
        // o servidor está online e pode deixar o Wings ocupado durante o stop.
        $executed = 0;
        $currentStep = null;

        try {
            foreach ($template->steps as $step) {
                $currentStep = $step;
                $this->executeStep($server, $step, $context);
                ++$executed;
            }
        } catch (\Throwable $e) {
            Log::error('[templates] step failed', [
                'server' => $server->uuid,
                'template' => $template->id,
                'step' => $executed + 1,
                'action' => $currentStep?->action,
                'file_path' => $currentStep?->file_path,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }

        Log::info('[templates] install concluído', [
            'server' => $server->uuid,
            'template' => $template->id,
            'steps' => $executed,
        ]);

        return [
            'template_id' => $template->id,
            'template_name' => $template->name,
            'steps_executed' => $executed,
        ];
    }

    private function executeStep(Server $server, InstallerTemplateStep $step, array $context): void
    {
        $path = $this->renderPath($step->file_path ?? '', $context);
        $content = $this->renderer->render($step->content ?? '', $context);

        if ($step->action === 'power') {
            $this->actionPower($server, $content);

            return;
        }

        $this->withWingsRetry(function () use ($server, $step, $path, $content) {
            $repo = $this->files->setServer($server);

            match ($step->action) {
                'write' => $this->actionWrite($repo, $path, $content),
                'replace' => $this->actionReplace($repo, $path, $content),
                'append' => $this->actionAppend($repo, $path, $content),
                'prepend' => $this->actionPrepend($repo, $path, $content),
                'mkdir' => $this->actionMkdir($repo, $path),
                'pull' => $this->actionPull($repo, $path, $content),
                'unzip' => $this->actionUnzip($repo, $path),
                'move' => $this->actionMove($repo, $path, $content, $context),
                'move_folder' => $this->actionMoveFolder($repo, $path, $content),
                'delete' => $this->actionDelete($repo, $path),
                default => throw new \RuntimeException('Ação desconhecida: ' . $step->action),
            };
        });
    }

    private function withWingsRetry(callable $callback, int $attempts = 3): void
    {
        $last = null;

        for ($i = 0; $i < $attempts; $i++) {
            try {
                $callback();

                return;
            } catch (\Throwable $e) {
                $last = $e;
                Log::warning('[templates] wings retry', [
                    'attempt' => $i + 1,
                    'error' => $e->getMessage(),
                ]);

                if ($i < $attempts - 1) {
                    usleep(800_000);
                }
            }
        }

        throw $last ?? new \RuntimeException('Falha ao comunicar com o Wings.');
    }

    private function renderPath(string $path, array $context): string
    {
        $rendered = $this->renderer->render($path, $context);
        $rendered = ltrim(str_replace('\\', '/', $rendered), '/');

        return $rendered === '' ? '/' : $rendered;
    }

    private function wingsPath(string $path): string
    {
        $path = '/' . ltrim($path, '/');

        return $path === '/' ? '/' : rtrim($path, '/');
    }

    private function actionWrite(DaemonFileRepository $repo, string $path, string $content): void
    {
        $fullPath = $this->wingsPath($path);
        $this->ensureParentDir($repo, $fullPath);
        $repo->putContent($fullPath, $content);
    }

    private function actionReplace(DaemonFileRepository $repo, string $path, string $content): void
    {
        $lines = explode("\n", $content, 2);
        $search = $lines[0] ?? '';
        $replace = $lines[1] ?? '';
        $fullPath = $this->wingsPath($path);

        try {
            $existing = $repo->getContent($fullPath);
            $updated = str_replace($search, $replace, $existing);
            $repo->putContent($fullPath, $updated);
        } catch (\Throwable) {
            // arquivo pode não existir ainda
        }
    }

    private function actionAppend(DaemonFileRepository $repo, string $path, string $content): void
    {
        $fullPath = $this->wingsPath($path);
        $existing = '';
        try {
            $existing = $repo->getContent($fullPath);
        } catch (\Throwable) {
        }
        $this->ensureParentDir($repo, $fullPath);
        $repo->putContent($fullPath, $existing . $content);
    }

    private function actionPrepend(DaemonFileRepository $repo, string $path, string $content): void
    {
        $fullPath = $this->wingsPath($path);
        $existing = '';
        try {
            $existing = $repo->getContent($fullPath);
        } catch (\Throwable) {
        }
        $this->ensureParentDir($repo, $fullPath);
        $repo->putContent($fullPath, $content . $existing);
    }

    private function actionMkdir(DaemonFileRepository $repo, string $path): void
    {
        $path = trim($path, '/');
        if ($path === '') {
            return;
        }

        $parts = explode('/', $path);
        $name = array_pop($parts);
        $parent = $parts ? '/' . implode('/', $parts) : '/';

        try {
            $repo->createDirectory($name, $parent);
        } catch (\Throwable) {
            // pasta pode já existir
        }
    }

    private function actionPull(DaemonFileRepository $repo, string $path, string $url): void
    {
        $url = trim($url);
        if ($url === '') {
            throw new \RuntimeException('URL vazia no step pull.');
        }

        $fullPath = $this->wingsPath($path);
        $this->ensureParentDir($repo, ltrim($fullPath, '/'));

        // Baixa pelo painel e envia via API de arquivos — não usa remote pull do Wings
        // (evita falhas de conexão e não mata o servidor).
        $response = Http::timeout(180)
            ->withOptions(['allow_redirects' => true])
            ->withHeaders(['User-Agent' => 'BluePrint-TemplateInstaller/1.0'])
            ->get($url);

        if (!$response->successful()) {
            throw new \RuntimeException('Falha ao baixar arquivo (HTTP ' . $response->status() . '): ' . $url);
        }

        $body = $response->body();
        if ($body === '') {
            throw new \RuntimeException('Download retornou arquivo vazio: ' . $url);
        }

        $repo->putContent($fullPath, $body);

        Log::info('[templates] pull via painel', [
            'path' => $fullPath,
            'bytes' => strlen($body),
        ]);
    }

    private function actionUnzip(DaemonFileRepository $repo, string $path): void
    {
        $fullPath = $this->wingsPath($path);
        $root = '/' . trim(dirname(ltrim($fullPath, '/')), '.');
        $repo->decompressFile($root === '/' ? '/' : $root, basename($fullPath));
    }

    private function actionMove(DaemonFileRepository $repo, string $from, string $content, array $context): void
    {
        $from = ltrim($this->renderPath($from, $context), '/');
        $to = ltrim($this->renderer->render($content, $context), '/');
        $root = '/';
        if (str_contains($from, '/')) {
            $root = '/' . dirname($from);
            $from = basename($from);
        }
        $repo->renameFiles($root, [['from' => $from, 'to' => $to]]);
    }

    private function actionMoveFolder(DaemonFileRepository $repo, string $fromFolder, string $toFolder): void
    {
        $from = '/' . trim($fromFolder, '/');
        $to = '/' . trim($toFolder, '/');
        $listing = $repo->getDirectory($from);
        $renames = [];
        foreach ($listing as $item) {
            $name = $item['name'] ?? null;
            if (!$name || ($item['is_file'] ?? true) === false && ($item['is_file'] ?? null) === false) {
                continue;
            }
            $renames[] = ['from' => $from . '/' . $name, 'to' => $to . '/' . $name];
        }
        if ($renames) {
            $repo->renameFiles('/', $renames);
        }
    }

    private function actionDelete(DaemonFileRepository $repo, string $path): void
    {
        $path = ltrim($path, '/');
        $root = '/';
        $name = $path;
        if (str_contains($path, '/')) {
            $root = '/' . dirname($path);
            $name = basename($path);
        }
        $repo->deleteFiles($root, [$name]);
    }

    private function actionPower(Server $server, string $signal): void
    {
        $signal = strtolower(trim($signal));
        if (!in_array($signal, ['start', 'stop', 'restart', 'kill'], true)) {
            $signal = 'restart';
        }
        $this->power->setServer($server)->send($signal);
    }

    private function ensureParentDir(DaemonFileRepository $repo, string $path): void
    {
        $dir = dirname(ltrim($path, '/'));
        if ($dir === '.' || $dir === '') {
            return;
        }
        $this->actionMkdir($repo, $dir);
    }
}
