// Catálogo de propriedades conhecidas do server.properties (Minecraft Java Edition).
// Cada entrada define o tipo de campo, categoria e textos exibidos no editor.

export type PropertyType = 'boolean' | 'integer' | 'string' | 'enum' | 'motd';

export type CategoryKey =
    | 'geral'
    | 'mundo'
    | 'jogadores'
    | 'rede'
    | 'desempenho'
    | 'pacotes'
    | 'rcon'
    | 'avancado'
    | 'outros';

export interface PropertyChoice {
    value: string;
    label: string;
}

export interface PropertyDefinition {
    key: string;
    label: string;
    description: string;
    category: CategoryKey;
    type: PropertyType;
    choices?: PropertyChoice[];
    min?: number;
    max?: number;
    placeholder?: string;
    secret?: boolean;
}

export interface CategoryDefinition {
    key: CategoryKey;
    label: string;
}

export const CATEGORIES: CategoryDefinition[] = [
    { key: 'geral', label: 'Geral' },
    { key: 'mundo', label: 'Mundo' },
    { key: 'jogadores', label: 'Jogadores' },
    { key: 'rede', label: 'Rede' },
    { key: 'desempenho', label: 'Desempenho' },
    { key: 'pacotes', label: 'Resource Pack' },
    { key: 'rcon', label: 'RCON & Query' },
    { key: 'avancado', label: 'Avançado' },
    { key: 'outros', label: 'Outros' },
];

const GAMEMODE_CHOICES: PropertyChoice[] = [
    { value: 'survival', label: 'Sobrevivência' },
    { value: 'creative', label: 'Criativo' },
    { value: 'adventure', label: 'Aventura' },
    { value: 'spectator', label: 'Espectador' },
];

const DIFFICULTY_CHOICES: PropertyChoice[] = [
    { value: 'peaceful', label: 'Pacífico' },
    { value: 'easy', label: 'Fácil' },
    { value: 'normal', label: 'Normal' },
    { value: 'hard', label: 'Difícil' },
];

const LEVEL_TYPE_CHOICES: PropertyChoice[] = [
    { value: 'minecraft:normal', label: 'Normal (padrão)' },
    { value: 'minecraft:flat', label: 'Superplano (flat)' },
    { value: 'minecraft:large_biomes', label: 'Biomas gigantes' },
    { value: 'minecraft:amplified', label: 'Amplificado' },
    { value: 'minecraft:single_biome_surface', label: 'Bioma único' },
];

const PERMISSION_LEVEL_CHOICES: PropertyChoice[] = [
    { value: '1', label: 'Nível 1 — Bypass de spawn protection' },
    { value: '2', label: 'Nível 2 — Comandos de jogo (/gamemode, /give...)' },
    { value: '3', label: 'Nível 3 — Moderação (/ban, /kick, /op...)' },
    { value: '4', label: 'Nível 4 — Total (/stop e todos os comandos)' },
];

export const PROPERTY_CATALOG: PropertyDefinition[] = [
    // ── Geral ────────────────────────────────────────────────────────────────
    {
        key: 'motd',
        label: 'MOTD (mensagem do servidor)',
        description: 'Mensagem exibida na lista de servidores do jogo. Suporta códigos de cor (§) e duas linhas.',
        category: 'geral',
        type: 'motd',
        placeholder: 'Um servidor de Minecraft',
    },
    {
        key: 'gamemode',
        label: 'Modo de jogo padrão',
        description: 'Modo de jogo aplicado a novos jogadores que entram no servidor.',
        category: 'geral',
        type: 'enum',
        choices: GAMEMODE_CHOICES,
    },
    {
        key: 'force-gamemode',
        label: 'Forçar modo de jogo',
        description: 'Força os jogadores a entrarem sempre no modo de jogo padrão, mesmo que tenham saído em outro.',
        category: 'geral',
        type: 'boolean',
    },
    {
        key: 'difficulty',
        label: 'Dificuldade',
        description: 'Define a dificuldade do jogo: dano de monstros, fome, etc.',
        category: 'geral',
        type: 'enum',
        choices: DIFFICULTY_CHOICES,
    },
    {
        key: 'hardcore',
        label: 'Modo hardcore',
        description: 'Ao morrer, o jogador vira espectador permanentemente. A dificuldade é travada em "Difícil".',
        category: 'geral',
        type: 'boolean',
    },
    {
        key: 'pvp',
        label: 'PvP habilitado',
        description: 'Permite que jogadores causem dano uns aos outros.',
        category: 'geral',
        type: 'boolean',
    },
    {
        key: 'allow-flight',
        label: 'Permitir voo',
        description: 'Permite voo no modo sobrevivência (com mods/plugins). Desativado, o anti-cheat expulsa quem "flutuar".',
        category: 'geral',
        type: 'boolean',
    },
    {
        key: 'allow-nether',
        label: 'Permitir Nether',
        description: 'Habilita a dimensão do Nether e seus portais.',
        category: 'geral',
        type: 'boolean',
    },
    {
        key: 'enable-command-block',
        label: 'Blocos de comando',
        description: 'Habilita o funcionamento de blocos de comando no servidor.',
        category: 'geral',
        type: 'boolean',
    },

    // ── Mundo ────────────────────────────────────────────────────────────────
    {
        key: 'level-name',
        label: 'Nome do mundo',
        description: 'Nome da pasta do mundo. Alterar cria/carrega outro mundo — o atual não é apagado.',
        category: 'mundo',
        type: 'string',
        placeholder: 'world',
    },
    {
        key: 'level-seed',
        label: 'Seed do mundo',
        description: 'Seed usada na geração do mundo. Só tem efeito na criação de um mundo novo.',
        category: 'mundo',
        type: 'string',
        placeholder: 'Deixe vazio para aleatória',
    },
    {
        key: 'level-type',
        label: 'Tipo de mundo',
        description: 'Preset de geração do terreno. Só tem efeito na criação de um mundo novo.',
        category: 'mundo',
        type: 'enum',
        choices: LEVEL_TYPE_CHOICES,
    },
    {
        key: 'generate-structures',
        label: 'Gerar estruturas',
        description: 'Gera vilas, templos, fortalezas e outras estruturas no mundo.',
        category: 'mundo',
        type: 'boolean',
    },
    {
        key: 'generator-settings',
        label: 'Configurações do gerador',
        description: 'JSON com opções de geração customizada (usado com mundos superplanos, por exemplo).',
        category: 'mundo',
        type: 'string',
        placeholder: '{}',
    },
    {
        key: 'max-world-size',
        label: 'Tamanho máximo do mundo',
        description: 'Raio máximo da borda do mundo, em blocos.',
        category: 'mundo',
        type: 'integer',
        min: 1,
        max: 29999984,
    },
    {
        key: 'spawn-protection',
        label: 'Proteção do spawn',
        description: 'Raio (em blocos) ao redor do spawn onde apenas OPs podem construir. 0 desativa.',
        category: 'mundo',
        type: 'integer',
        min: 0,
        max: 29999984,
    },
    {
        key: 'spawn-monsters',
        label: 'Gerar monstros',
        description: 'Permite o spawn natural de criaturas hostis (zumbis, esqueletos, creepers...).',
        category: 'mundo',
        type: 'boolean',
    },
    {
        key: 'spawn-animals',
        label: 'Gerar animais',
        description: 'Permite o spawn natural de animais. (Removida nas versões mais recentes do jogo.)',
        category: 'mundo',
        type: 'boolean',
    },
    {
        key: 'spawn-npcs',
        label: 'Gerar aldeões',
        description: 'Permite o spawn de aldeões (NPCs). (Removida nas versões mais recentes do jogo.)',
        category: 'mundo',
        type: 'boolean',
    },

    // ── Jogadores ────────────────────────────────────────────────────────────
    {
        key: 'max-players',
        label: 'Máximo de jogadores',
        description: 'Quantidade máxima de jogadores conectados ao mesmo tempo.',
        category: 'jogadores',
        type: 'integer',
        min: 1,
        max: 2147483647,
    },
    {
        key: 'online-mode',
        label: 'Modo online (premium)',
        description: 'Verifica as contas na Mojang. Desative apenas se souber o que está fazendo (servidor pirata/proxy).',
        category: 'jogadores',
        type: 'boolean',
    },
    {
        key: 'white-list',
        label: 'Whitelist',
        description: 'Apenas jogadores na whitelist podem entrar no servidor.',
        category: 'jogadores',
        type: 'boolean',
    },
    {
        key: 'enforce-whitelist',
        label: 'Aplicar whitelist imediatamente',
        description: 'Ao recarregar a whitelist, expulsa na hora os jogadores online que não estiverem nela.',
        category: 'jogadores',
        type: 'boolean',
    },
    {
        key: 'player-idle-timeout',
        label: 'Timeout de inatividade (min)',
        description: 'Expulsa jogadores inativos após esse tempo em minutos. 0 desativa.',
        category: 'jogadores',
        type: 'integer',
        min: 0,
        max: 2147483647,
    },
    {
        key: 'op-permission-level',
        label: 'Nível de permissão de OP',
        description: 'Nível de permissão padrão concedido a operadores via /op.',
        category: 'jogadores',
        type: 'enum',
        choices: PERMISSION_LEVEL_CHOICES,
    },
    {
        key: 'function-permission-level',
        label: 'Permissão de functions',
        description: 'Nível de permissão usado por functions de datapacks.',
        category: 'jogadores',
        type: 'enum',
        choices: PERMISSION_LEVEL_CHOICES,
    },
    {
        key: 'hide-online-players',
        label: 'Ocultar jogadores online',
        description: 'Esconde a lista de jogadores na consulta de status do servidor (server list).',
        category: 'jogadores',
        type: 'boolean',
    },

    // ── Rede ─────────────────────────────────────────────────────────────────
    {
        key: 'server-port',
        label: 'Porta do servidor',
        description: 'Porta TCP em que o servidor escuta. Em painéis (Pterodactyl) isso é gerenciado pela alocação — altere com cuidado.',
        category: 'rede',
        type: 'integer',
        min: 1,
        max: 65535,
    },
    {
        key: 'server-ip',
        label: 'IP do servidor',
        description: 'IP em que o servidor escuta. Em painéis, normalmente definido automaticamente (0.0.0.0).',
        category: 'rede',
        type: 'string',
        placeholder: '0.0.0.0',
    },
    {
        key: 'network-compression-threshold',
        label: 'Limite de compressão de rede',
        description: 'Pacotes acima desse tamanho (bytes) são comprimidos. -1 desativa; 256 é um bom padrão.',
        category: 'rede',
        type: 'integer',
        min: -1,
        max: 65535,
    },
    {
        key: 'rate-limit',
        label: 'Limite de pacotes (rate limit)',
        description: 'Máximo de pacotes por segundo que um jogador pode enviar antes de ser expulso. 0 desativa.',
        category: 'rede',
        type: 'integer',
        min: 0,
        max: 2147483647,
    },
    {
        key: 'prevent-proxy-connections',
        label: 'Bloquear proxies/VPN',
        description: 'Expulsa jogadores cuja conexão parece vir de proxy ou VPN.',
        category: 'rede',
        type: 'boolean',
    },
    {
        key: 'enable-status',
        label: 'Responder status (ping)',
        description: 'Faz o servidor aparecer como online na lista de servidores e responder pings.',
        category: 'rede',
        type: 'boolean',
    },
    {
        key: 'use-native-transport',
        label: 'Transporte nativo (Linux)',
        description: 'Usa otimizações nativas de rede do Linux (epoll). Recomendado deixar ativado.',
        category: 'rede',
        type: 'boolean',
    },

    // ── Desempenho ───────────────────────────────────────────────────────────
    {
        key: 'view-distance',
        label: 'Distância de renderização',
        description: 'Raio de chunks enviados aos jogadores. Valores altos consomem muito mais RAM/CPU.',
        category: 'desempenho',
        type: 'integer',
        min: 3,
        max: 32,
    },
    {
        key: 'simulation-distance',
        label: 'Distância de simulação',
        description: 'Raio de chunks em que entidades e mecânicas são processadas (ticks).',
        category: 'desempenho',
        type: 'integer',
        min: 3,
        max: 32,
    },
    {
        key: 'max-tick-time',
        label: 'Tempo máximo de tick (ms)',
        description: 'Watchdog: derruba o servidor se um tick travar por mais que esse tempo. -1 desativa.',
        category: 'desempenho',
        type: 'integer',
        min: -1,
        max: 2147483647,
    },
    {
        key: 'max-chained-neighbor-updates',
        label: 'Atualizações de blocos em cadeia',
        description: 'Limita reações em cadeia de atualizações de blocos (ex.: máquinas de redstone gigantes).',
        category: 'desempenho',
        type: 'integer',
        min: -1,
        max: 2147483647,
    },
    {
        key: 'entity-broadcast-range-percentage',
        label: 'Alcance de entidades (%)',
        description: 'Percentual da distância padrão em que entidades ficam visíveis para os clientes.',
        category: 'desempenho',
        type: 'integer',
        min: 10,
        max: 1000,
    },
    {
        key: 'sync-chunk-writes',
        label: 'Escrita síncrona de chunks',
        description: 'Grava chunks de forma síncrona (mais seguro contra corrupção, porém mais lento).',
        category: 'desempenho',
        type: 'boolean',
    },
    {
        key: 'region-file-compression',
        label: 'Compressão dos arquivos de região',
        description: 'Algoritmo de compressão usado nos arquivos de região do mundo.',
        category: 'desempenho',
        type: 'enum',
        choices: [
            { value: 'deflate', label: 'Deflate (padrão)' },
            { value: 'lz4', label: 'LZ4 (mais rápido)' },
            { value: 'none', label: 'Sem compressão' },
        ],
    },

    // ── Resource Pack ────────────────────────────────────────────────────────
    {
        key: 'resource-pack',
        label: 'URL do resource pack',
        description: 'Link direto (http/https) do .zip do resource pack oferecido aos jogadores.',
        category: 'pacotes',
        type: 'string',
        placeholder: 'https://exemplo.com/pack.zip',
    },
    {
        key: 'resource-pack-prompt',
        label: 'Mensagem do resource pack',
        description: 'Texto (JSON de chat) exibido na tela que pede para aceitar o resource pack.',
        category: 'pacotes',
        type: 'string',
    },
    {
        key: 'resource-pack-sha1',
        label: 'SHA-1 do resource pack',
        description: 'Hash SHA-1 do arquivo .zip, usado para validar e cachear o pack no cliente.',
        category: 'pacotes',
        type: 'string',
    },
    {
        key: 'resource-pack-id',
        label: 'UUID do resource pack',
        description: 'Identificador único (UUID) do resource pack, usado nas versões mais recentes.',
        category: 'pacotes',
        type: 'string',
    },
    {
        key: 'require-resource-pack',
        label: 'Resource pack obrigatório',
        description: 'Jogadores que recusarem o resource pack são desconectados.',
        category: 'pacotes',
        type: 'boolean',
    },

    // ── RCON & Query ─────────────────────────────────────────────────────────
    {
        key: 'enable-rcon',
        label: 'Habilitar RCON',
        description: 'Permite administração remota via protocolo RCON. Use senha forte!',
        category: 'rcon',
        type: 'boolean',
    },
    {
        key: 'rcon.port',
        label: 'Porta RCON',
        description: 'Porta TCP usada pelo RCON.',
        category: 'rcon',
        type: 'integer',
        min: 1,
        max: 65535,
    },
    {
        key: 'rcon.password',
        label: 'Senha RCON',
        description: 'Senha exigida para conexões RCON. Nunca deixe em branco com RCON ativado.',
        category: 'rcon',
        type: 'string',
        secret: true,
    },
    {
        key: 'broadcast-rcon-to-ops',
        label: 'Transmitir RCON aos OPs',
        description: 'Mostra aos operadores os comandos executados via RCON.',
        category: 'rcon',
        type: 'boolean',
    },
    {
        key: 'broadcast-console-to-ops',
        label: 'Transmitir console aos OPs',
        description: 'Mostra aos operadores os comandos executados pelo console.',
        category: 'rcon',
        type: 'boolean',
    },
    {
        key: 'enable-query',
        label: 'Habilitar Query',
        description: 'Ativa o protocolo GameSpy4 de consulta de informações do servidor.',
        category: 'rcon',
        type: 'boolean',
    },
    {
        key: 'query.port',
        label: 'Porta Query',
        description: 'Porta UDP usada pelo protocolo Query.',
        category: 'rcon',
        type: 'integer',
        min: 1,
        max: 65535,
    },

    // ── Avançado ─────────────────────────────────────────────────────────────
    {
        key: 'enforce-secure-profile',
        label: 'Exigir perfil seguro',
        description: 'Exige assinatura de chat da Mojang. Necessário desativar em algumas redes com proxy.',
        category: 'avancado',
        type: 'boolean',
    },
    {
        key: 'enable-jmx-monitoring',
        label: 'Monitoramento JMX',
        description: 'Expõe métricas de desempenho (tick times) via JMX para ferramentas de profiling.',
        category: 'avancado',
        type: 'boolean',
    },
    {
        key: 'log-ips',
        label: 'Registrar IPs no log',
        description: 'Inclui o endereço IP dos jogadores nas mensagens de log de conexão.',
        category: 'avancado',
        type: 'boolean',
    },
    {
        key: 'pause-when-empty-seconds',
        label: 'Pausar servidor vazio (s)',
        description: 'Pausa o processamento do servidor após ficar vazio por esse tempo em segundos. -1 desativa.',
        category: 'avancado',
        type: 'integer',
        min: -1,
        max: 2147483647,
    },
    {
        key: 'accepts-transfers',
        label: 'Aceitar transferências',
        description: 'Permite receber jogadores transferidos de outros servidores (pacote de transfer).',
        category: 'avancado',
        type: 'boolean',
    },
    {
        key: 'bug-report-link',
        label: 'Link de report de bugs',
        description: 'URL exibida aos jogadores para reportar problemas do servidor.',
        category: 'avancado',
        type: 'string',
        placeholder: 'https://...',
    },
    {
        key: 'initial-enabled-packs',
        label: 'Datapacks habilitados',
        description: 'Datapacks ativados na criação do mundo, separados por vírgula.',
        category: 'avancado',
        type: 'string',
        placeholder: 'vanilla',
    },
    {
        key: 'initial-disabled-packs',
        label: 'Datapacks desabilitados',
        description: 'Datapacks desativados na criação do mundo, separados por vírgula.',
        category: 'avancado',
        type: 'string',
    },
    {
        key: 'text-filtering-config',
        label: 'Config. de filtro de texto',
        description: 'Caminho/JSON da configuração de filtragem de chat (uso avançado).',
        category: 'avancado',
        type: 'string',
    },
    {
        key: 'debug',
        label: 'Modo debug',
        description: 'Ativa logs de depuração detalhados do servidor.',
        category: 'avancado',
        type: 'boolean',
    },
];

const catalogIndex: Record<string, PropertyDefinition> = {};
for (const def of PROPERTY_CATALOG) {
    catalogIndex[def.key] = def;
}

export const findDefinition = (propKey: string): PropertyDefinition | undefined => catalogIndex[propKey];

export const definitionFor = (propKey: string): PropertyDefinition =>
    catalogIndex[propKey] || {
        key: propKey,
        label: propKey,
        description: 'Propriedade personalizada encontrada no arquivo (fora do catálogo padrão).',
        category: 'outros',
        type: 'string',
    };
