<?php

namespace Pterodactyl\BlueprintFramework\Extensions\templates;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
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

        $executed = 0;
        foreach ($template->steps as $step) {
            $this->executeStep($server, $step, $context);
            ++$executed;
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
        $repo = $this->files->setServer($server);

        match ($step->action) {
            'write' => $this->actionWrite($repo, $path, $content),
            'replace' => $this->actionReplace($repo, $path, $content),
            'append' => $this->actionAppend($repo, $path, $content),
            'prepend' => $this->actionPrepend($repo, $path, $content),
            'mkdir' => $this->actionMkdir($repo, $path),
            'pull' => $this->actionPull($repo, $path, $content),
            'unzip' => $this->actionUnzip($repo, $path),
            'move' => $this->actionMove($repo, $path, $content),
            'move_folder' => $this->actionMoveFolder($repo, $path, $content),
            'delete' => $this->actionDelete($repo, $path),
            'power' => $this->actionPower($server, $content),
            default => throw new \RuntimeException('Ação desconhecida: ' . $step->action),
        };
    }

    private function renderPath(string $path, array $context): string
    {
        $rendered = $this->renderer->render($path, $context);
        $rendered = ltrim(str_replace('\\', '/', $rendered), '/');

        return $rendered === '' ? '/' : $rendered;
    }

    private function actionWrite(DaemonFileRepository $repo, string $path, string $content): void
    {
        $this->ensureParentDir($repo, $path);
        $repo->putContent('/' . ltrim($path, '/'), $content);
    }

    private function actionReplace(DaemonFileRepository $repo, string $path, string $content): void
    {
        $lines = explode("\n", $content, 2);
        $search = $lines[0] ?? '';
        $replace = $lines[1] ?? '';
        $fullPath = '/' . ltrim($path, '/');

        try {
            $existing = $repo->getContent($fullPath);
            $updated = str_replace($search, $replace, $existing);
            $repo->putContent($fullPath, $updated);
        } catch (\Throwable) {
            // file may not exist yet
        }
    }

    private function actionAppend(DaemonFileRepository $repo, string $path, string $content): void
    {
        $fullPath = '/' . ltrim($path, '/');
        $existing = '';
        try {
            $existing = $repo->getContent($fullPath);
        } catch (\Throwable) {
        }
        $this->ensureParentDir($repo, $path);
        $repo->putContent($fullPath, $existing . $content);
    }

    private function actionPrepend(DaemonFileRepository $repo, string $path, string $content): void
    {
        $fullPath = '/' . ltrim($path, '/');
        $existing = '';
        try {
            $existing = $repo->getContent($fullPath);
        } catch (\Throwable) {
        }
        $this->ensureParentDir($repo, $path);
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
        $parent = '/' . implode('/', $parts);
        $repo->createDirectory($name, $parent === '/' ? '/' : $parent);
    }

    private function actionPull(DaemonFileRepository $repo, string $path, string $url): void
    {
        $url = trim($url);
        if ($url === '') {
            throw new \RuntimeException('URL vazia no step pull.');
        }

        $directory = '/';
        $filename = null;

        if (str_contains($path, '/')) {
            $directory = '/' . dirname($path);
            $filename = basename($path);
            if ($directory === '/.') {
                $directory = '/';
            }
        } elseif ($path !== '' && $path !== '/') {
            $filename = $path;
        }

        $repo->pull($url, $directory, array_filter([
            'filename' => $filename,
            'foreground' => true,
        ]));
    }

    private function actionUnzip(DaemonFileRepository $repo, string $path): void
    {
        $fullPath = '/' . ltrim($path, '/');
        $root = '/' . trim(dirname($fullPath), '.');
        $repo->decompressFile($root === '/' ? '/' : $root, basename($fullPath));
    }

    private function actionMove(DaemonFileRepository $repo, string $from, string $to): void
    {
        $from = ltrim($from, '/');
        $to = ltrim($this->renderer->render($to, []), '/');
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
        $parts = explode('/', $dir);
        $current = '';
        foreach ($parts as $part) {
            if ($part === '') {
                continue;
            }
            try {
                $repo->createDirectory($part, $current === '' ? '/' : '/' . $current);
            } catch (\Throwable) {
            }
            $current = $current === '' ? $part : $current . '/' . $part;
        }
    }
}
