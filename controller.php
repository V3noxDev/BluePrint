<?php

namespace Pterodactyl\Http\Controllers\Admin\Extensions\serverproperties;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\View\Factory as ViewFactory;
use Illuminate\View\View;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Throwable;

class serverpropertiesExtensionController extends Controller
{
    private const ROOT = '/admin/extensions/serverproperties';
    private const FILE_PATH = '/server.properties';

    public function __construct(
        private ViewFactory $view,
        private BlueprintExtensionLibrary $blueprint,
        private DaemonFileRepository $files,
    ) {
    }

    public function index(Request $request): View
    {
        $search = trim((string) $request->query('search', ''));
        $selectedServerId = (int) $request->query('server_id', 0);
        $selectedServer = $selectedServerId > 0 ? $this->findServer($selectedServerId) : null;
        $readError = null;
        $rawContent = '';
        $properties = [];

        if ($selectedServer instanceof Server) {
            try {
                $rawContent = $this->files
                    ->setServer($selectedServer)
                    ->getContent(self::FILE_PATH, $this->maxFileSize());
                $properties = $this->parseProperties($rawContent);
            } catch (Throwable $exception) {
                $readError = 'Nao foi possivel ler o arquivo server.properties desse servidor. Confirme que o servidor esta instalado, que Wings esta online e que o arquivo existe.';
                Log::warning('Blueprint serverproperties failed to read server.properties', [
                    'server_id' => $selectedServer->id,
                    'exception' => $exception::class,
                    'message' => $exception->getMessage(),
                ]);
            }
        } elseif ($selectedServerId > 0) {
            $readError = 'Servidor nao encontrado.';
        }

        $displayContent = old('content', $rawContent);
        if ($displayContent !== $rawContent) {
            $properties = $this->parseProperties($displayContent);
        }

        return $this->view->make('admin.extensions.serverproperties.index', [
            'root' => self::ROOT,
            'blueprint' => $this->blueprint,
            'servers' => $this->servers($search),
            'search' => $search,
            'selectedServer' => $selectedServer,
            'readError' => $readError,
            'rawContent' => $displayContent,
            'properties' => $properties,
            'knownSettings' => $this->knownSettings(),
            'filePath' => self::FILE_PATH,
            'maxFileSize' => $this->maxFileSize(),
        ]);
    }

    public function post(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'server_id' => ['required', 'integer', 'exists:servers,id'],
            'content' => ['required', 'string'],
        ]);

        $server = $this->findServer((int) $validated['server_id']);
        if (!$server instanceof Server) {
            throw ValidationException::withMessages([
                'server_id' => 'Servidor nao encontrado.',
            ]);
        }

        $content = $this->normalizePropertiesContent((string) $validated['content']);
        if (str_contains($content, "\0")) {
            throw ValidationException::withMessages([
                'content' => 'O arquivo contem bytes nulos e nao pode ser salvo como server.properties.',
            ]);
        }

        if (strlen($content) > $this->maxFileSize()) {
            throw ValidationException::withMessages([
                'content' => sprintf(
                    'O arquivo passou do limite configurado no painel (%s bytes).',
                    number_format($this->maxFileSize())
                ),
            ]);
        }

        $backupCreated = false;

        try {
            $repository = $this->files->setServer($server);
            $current = null;

            try {
                $current = $repository->getContent(self::FILE_PATH, $this->maxFileSize());
            } catch (Throwable $exception) {
                Log::notice('Blueprint serverproperties could not read original file before save', [
                    'server_id' => $server->id,
                    'exception' => $exception::class,
                    'message' => $exception->getMessage(),
                ]);
            }

            if ($current !== null) {
                $backupPath = sprintf('/server.properties.blueprint-backup-%s', now()->format('Ymd-His'));
                $repository->putContent($backupPath, $current);
                $backupCreated = true;
            }

            $repository->putContent(self::FILE_PATH, $content);
        } catch (Throwable $exception) {
            Log::warning('Blueprint serverproperties failed to write server.properties', [
                'server_id' => $server->id,
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'content' => 'Nao foi possivel salvar o arquivo. Verifique a conexao com Wings e as permissoes do servidor.',
            ]);
        }

        $message = $backupCreated
            ? 'server.properties salvo com sucesso. Um backup foi criado na raiz do servidor.'
            : 'server.properties salvo com sucesso. Nenhum backup foi criado porque o arquivo original nao pode ser lido antes da escrita.';

        return redirect()
            ->to(self::ROOT . '?server_id=' . $server->id)
            ->with('success', $message);
    }

    private function servers(string $search): Collection
    {
        if ($search !== '') {
            return $this->baseServerQuery()
                ->where(function ($query) use ($search) {
                    $query
                        ->where('name', 'LIKE', '%' . $search . '%')
                        ->orWhere('uuid', 'LIKE', '%' . $search . '%')
                        ->orWhereHas('node', fn ($node) => $node->where('name', 'LIKE', '%' . $search . '%'))
                        ->orWhereHas('nest', fn ($nest) => $nest->where('name', 'LIKE', '%' . $search . '%'))
                        ->orWhereHas('egg', fn ($egg) => $egg->where('name', 'LIKE', '%' . $search . '%'));
                })
                ->limit(200)
                ->get();
        }

        $minecraftServers = $this->baseServerQuery()
            ->where(function ($query) {
                $query
                    ->whereHas('nest', fn ($nest) => $nest->where('name', 'LIKE', '%minecraft%'))
                    ->orWhereHas('egg', fn ($egg) => $egg->where('name', 'LIKE', '%minecraft%'));
            })
            ->limit(200)
            ->get();

        if ($minecraftServers->isNotEmpty()) {
            return $minecraftServers;
        }

        return $this->baseServerQuery()->limit(200)->get();
    }

    private function baseServerQuery()
    {
        return Server::query()
            ->with(['allocation', 'egg', 'nest', 'node'])
            ->orderBy('name');
    }

    private function findServer(int $serverId): ?Server
    {
        return Server::query()
            ->with(['allocation', 'egg', 'nest', 'node'])
            ->find($serverId);
    }

    private function normalizePropertiesContent(string $content): string
    {
        $content = str_replace(["\r\n", "\r"], "\n", $content);

        return rtrim($content, "\n") . "\n";
    }

    private function parseProperties(string $content): array
    {
        $rows = [];
        $lines = preg_split('/\n/', str_replace(["\r\n", "\r"], "\n", $content));

        foreach ($lines as $lineNumber => $line) {
            $trimmed = trim($line);

            if ($trimmed === '' || str_starts_with($trimmed, '#') || str_starts_with($trimmed, '!')) {
                continue;
            }

            $parts = $this->splitPropertyLine($line);
            if ($parts === null) {
                continue;
            }

            [$key, $value] = $parts;
            $rows[] = [
                'line' => $lineNumber + 1,
                'key' => $key,
                'value' => $value,
                'known' => array_key_exists($key, $this->knownSettings()),
            ];
        }

        return $rows;
    }

    private function splitPropertyLine(string $line): ?array
    {
        if (preg_match('/(?<!\\\\)(=|:)/', $line, $matches, PREG_OFFSET_CAPTURE) === 1) {
            $position = $matches[0][1];

            return [
                trim(substr($line, 0, $position)),
                trim(substr($line, $position + 1)),
            ];
        }

        if (preg_match('/\s+/', trim($line), $matches, PREG_OFFSET_CAPTURE) === 1) {
            $position = $matches[0][1];

            return [
                trim(substr($line, 0, $position)),
                trim(substr($line, $position + strlen($matches[0][0]))),
            ];
        }

        return [trim($line), ''];
    }

    private function knownSettings(): array
    {
        return [
            'motd' => ['label' => 'MOTD', 'type' => 'text', 'hint' => 'Nome/descricao exibida na lista de servidores.'],
            'server-port' => ['label' => 'Porta', 'type' => 'number', 'hint' => 'Normalmente deve ser a porta primaria do allocation.'],
            'max-players' => ['label' => 'Max players', 'type' => 'number', 'hint' => 'Quantidade maxima de jogadores simultaneos.'],
            'gamemode' => ['label' => 'Game mode', 'type' => 'select', 'options' => ['survival', 'creative', 'adventure', 'spectator'], 'hint' => 'Modo padrao do mundo.'],
            'difficulty' => ['label' => 'Difficulty', 'type' => 'select', 'options' => ['peaceful', 'easy', 'normal', 'hard'], 'hint' => 'Dificuldade do servidor.'],
            'hardcore' => ['label' => 'Hardcore', 'type' => 'boolean', 'hint' => 'Ativa morte permanente.'],
            'pvp' => ['label' => 'PvP', 'type' => 'boolean', 'hint' => 'Permite dano entre jogadores.'],
            'online-mode' => ['label' => 'Online mode', 'type' => 'boolean', 'hint' => 'Valida contas oficiais da Mojang/Microsoft.'],
            'white-list' => ['label' => 'Whitelist', 'type' => 'boolean', 'hint' => 'Restringe entrada a jogadores liberados.'],
            'enforce-whitelist' => ['label' => 'Enforce whitelist', 'type' => 'boolean', 'hint' => 'Expulsa jogadores que sairem da whitelist.'],
            'enable-command-block' => ['label' => 'Command blocks', 'type' => 'boolean', 'hint' => 'Permite blocos de comando.'],
            'spawn-protection' => ['label' => 'Spawn protection', 'type' => 'number', 'hint' => 'Raio protegido ao redor do spawn.'],
            'view-distance' => ['label' => 'View distance', 'type' => 'number', 'hint' => 'Distancia de renderizacao enviada aos clientes.'],
            'simulation-distance' => ['label' => 'Simulation distance', 'type' => 'number', 'hint' => 'Distancia de simulacao do mundo.'],
            'allow-nether' => ['label' => 'Allow Nether', 'type' => 'boolean', 'hint' => 'Habilita o Nether.'],
            'level-name' => ['label' => 'World folder', 'type' => 'text', 'hint' => 'Nome da pasta do mundo.'],
            'enable-rcon' => ['label' => 'RCON', 'type' => 'boolean', 'hint' => 'Habilita RCON. Configure senha forte se ativar.'],
            'rcon.port' => ['label' => 'RCON port', 'type' => 'number', 'hint' => 'Porta do RCON.'],
            'rcon.password' => ['label' => 'RCON password', 'type' => 'password', 'hint' => 'Senha do RCON.'],
            'enable-query' => ['label' => 'Query', 'type' => 'boolean', 'hint' => 'Habilita GameSpy query.'],
            'query.port' => ['label' => 'Query port', 'type' => 'number', 'hint' => 'Porta do query.'],
        ];
    }

    private function maxFileSize(): int
    {
        return (int) config('pterodactyl.files.max_edit_size', 1024 * 1024 * 4);
    }
}
