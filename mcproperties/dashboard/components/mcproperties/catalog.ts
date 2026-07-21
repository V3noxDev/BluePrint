export type PropertyType = 'boolean' | 'integer' | 'string' | 'enum';

export type CategoryId = 'general' | 'world' | 'players' | 'network' | 'resources' | 'security' | 'advanced' | 'other';

export interface Category {
    id: CategoryId;
    label: string;
}

export interface PropertyDefinition {
    key: string;
    label: string;
    description: string;
    category: CategoryId;
    type: PropertyType;
    options?: { value: string; label: string }[];
    min?: number;
    max?: number;
    placeholder?: string;
    defaultValue: string;
    dangerous?: boolean;
}

export const CATEGORIES: Category[] = [
    { id: 'general', label: 'Geral' },
    { id: 'world', label: 'Mundo' },
    { id: 'players', label: 'Jogadores' },
    { id: 'network', label: 'Rede' },
    { id: 'resources', label: 'Resource Pack' },
    { id: 'security', label: 'Segurança & RCON' },
    { id: 'advanced', label: 'Avançado' },
    { id: 'other', label: 'Outros' },
];

const bool = (
    key: string,
    label: string,
    description: string,
    category: CategoryId,
    defaultValue: string,
    dangerous = false
): PropertyDefinition => ({ key, label, description, category, type: 'boolean', defaultValue, dangerous });

const int = (
    key: string,
    label: string,
    description: string,
    category: CategoryId,
    defaultValue: string,
    min?: number,
    max?: number,
    dangerous = false
): PropertyDefinition => ({ key, label, description, category, type: 'integer', defaultValue, min, max, dangerous });

const str = (
    key: string,
    label: string,
    description: string,
    category: CategoryId,
    defaultValue: string,
    placeholder?: string,
    dangerous = false
): PropertyDefinition => ({ key, label, description, category, type: 'string', defaultValue, placeholder, dangerous });

export const CATALOG: PropertyDefinition[] = [
    // ── Geral ────────────────────────────────────────────────────────────────
    str(
        'motd',
        'MOTD',
        'Mensagem exibida na lista de servidores do cliente Minecraft. Suporta códigos de cor (\\u00A7) e formatação.',
        'general',
        'A Minecraft Server',
        'Meu servidor incrível'
    ),
    {
        key: 'gamemode',
        label: 'Modo de jogo',
        description: 'Modo de jogo padrão aplicado a novos jogadores que entram no servidor.',
        category: 'general',
        type: 'enum',
        defaultValue: 'survival',
        options: [
            { value: 'survival', label: 'Sobrevivência' },
            { value: 'creative', label: 'Criativo' },
            { value: 'adventure', label: 'Aventura' },
            { value: 'spectator', label: 'Espectador' },
        ],
    },
    {
        key: 'difficulty',
        label: 'Dificuldade',
        description: 'Dificuldade do servidor. Afeta dano de mobs, fome e outros mecanismos.',
        category: 'general',
        type: 'enum',
        defaultValue: 'easy',
        options: [
            { value: 'peaceful', label: 'Pacífico' },
            { value: 'easy', label: 'Fácil' },
            { value: 'normal', label: 'Normal' },
            { value: 'hard', label: 'Difícil' },
        ],
    },
    bool('hardcore', 'Hardcore', 'Se ativado, jogadores que morrerem são banidos automaticamente (modo hardcore).', 'general', 'false'),
    bool('pvp', 'PvP', 'Permite que jogadores causem dano uns aos outros.', 'general', 'true'),
    bool('force-gamemode', 'Forçar modo de jogo', 'Força os jogadores a entrarem sempre no modo de jogo padrão do servidor.', 'general', 'false'),
    int('max-players', 'Máximo de jogadores', 'Número máximo de jogadores online simultaneamente.', 'general', '20', 0, 2147483647),
    bool(
        'online-mode',
        'Modo online (premium)',
        'Verifica as contas na Mojang/Microsoft. Desative apenas se usar proxy (BungeeCord/Velocity) ou servidor pirata.',
        'general',
        'true'
    ),
    bool('white-list', 'Whitelist', 'Somente jogadores na whitelist podem entrar no servidor.', 'general', 'false'),
    bool('enforce-whitelist', 'Forçar whitelist', 'Expulsa imediatamente jogadores online que não estejam na whitelist quando ela é recarregada.', 'general', 'false'),

    // ── Mundo ────────────────────────────────────────────────────────────────
    str('level-name', 'Nome do mundo', 'Nome da pasta do mundo que o servidor irá carregar. Alterar pode gerar um novo mundo.', 'world', 'world', 'world', true),
    str('level-seed', 'Seed do mundo', 'Seed usada na geração do mundo. Só tem efeito ao gerar um mundo novo.', 'world', '', 'Deixe vazio para aleatória'),
    {
        key: 'level-type',
        label: 'Tipo de mundo',
        description: 'Tipo de geração do mundo. Só tem efeito ao gerar um mundo novo.',
        category: 'world',
        type: 'enum',
        defaultValue: 'minecraft:normal',
        options: [
            { value: 'minecraft:normal', label: 'Normal' },
            { value: 'minecraft:flat', label: 'Plano (Flat)' },
            { value: 'minecraft:large_biomes', label: 'Biomas grandes' },
            { value: 'minecraft:amplified', label: 'Amplificado' },
            { value: 'minecraft:single_biome_surface', label: 'Bioma único' },
        ],
    },
    bool('generate-structures', 'Gerar estruturas', 'Gera estruturas como vilas, templos e fortalezas em chunks novos.', 'world', 'true'),
    str('generator-settings', 'Configuração do gerador', 'JSON com configurações customizadas de geração (superflat, etc). Avançado.', 'world', '{}'),
    int('max-world-size', 'Tamanho máximo do mundo', 'Raio máximo do mundo em blocos (borda do mundo).', 'world', '29999984', 1, 29999984),
    int('spawn-protection', 'Proteção do spawn', 'Raio (em blocos) ao redor do spawn onde apenas OPs podem construir. 0 desativa.', 'world', '16', 0),
    bool('allow-nether', 'Permitir Nether', 'Habilita o Nether e os portais para ele.', 'world', 'true'),
    bool('spawn-monsters', 'Spawn de monstros', 'Permite que monstros hostis apareçam naturalmente.', 'world', 'true'),
    bool('spawn-animals', 'Spawn de animais', 'Permite que animais apareçam naturalmente (versões antigas).', 'world', 'true'),
    bool('spawn-npcs', 'Spawn de aldeões', 'Permite que aldeões (NPCs) apareçam naturalmente (versões antigas).', 'world', 'true'),
    int('view-distance', 'Distância de visão', 'Distância de renderização (em chunks) enviada aos jogadores. Impacta muito a performance.', 'world', '10', 3, 32),
    int('simulation-distance', 'Distância de simulação', 'Distância (em chunks) em que entidades e mecânicas são processadas. Impacta a performance.', 'world', '10', 3, 32),

    // ── Jogadores ────────────────────────────────────────────────────────────
    bool('allow-flight', 'Permitir voo', 'Permite voo em modo sobrevivência (com mods/plugins). Evita kick por "Flying is not enabled".', 'players', 'false'),
    int('player-idle-timeout', 'Timeout por inatividade', 'Minutos até um jogador inativo ser expulso. 0 desativa.', 'players', '0', 0),
    bool('hide-online-players', 'Ocultar jogadores online', 'Oculta a lista de jogadores online no status do servidor.', 'players', 'false'),
    {
        key: 'op-permission-level',
        label: 'Nível de permissão de OP',
        description: 'Nível de permissão padrão concedido a operadores (1 a 4).',
        category: 'players',
        type: 'enum',
        defaultValue: '4',
        options: [
            { value: '1', label: 'Nível 1 — Bypass de spawn' },
            { value: '2', label: 'Nível 2 — Comandos básicos' },
            { value: '3', label: 'Nível 3 — Moderação' },
            { value: '4', label: 'Nível 4 — Total' },
        ],
    },
    {
        key: 'function-permission-level',
        label: 'Nível de permissão de functions',
        description: 'Nível de permissão usado por functions de datapacks (1 a 4).',
        category: 'players',
        type: 'enum',
        defaultValue: '2',
        options: [
            { value: '1', label: 'Nível 1' },
            { value: '2', label: 'Nível 2' },
            { value: '3', label: 'Nível 3' },
            { value: '4', label: 'Nível 4' },
        ],
    },
    bool('enable-command-block', 'Blocos de comando', 'Habilita o funcionamento de blocos de comando no servidor.', 'players', 'false'),
    int(
        'pause-when-empty-seconds',
        'Pausar servidor vazio',
        'Segundos até o servidor pausar quando não há jogadores online (1.21.2+). Valores negativos desativam.',
        'players',
        '60'
    ),

    // ── Rede ─────────────────────────────────────────────────────────────────
    str('server-ip', 'IP do servidor', 'IP em que o servidor escuta. Gerenciado pelo painel — normalmente deve ficar como está.', 'network', '', '0.0.0.0', true),
    int('server-port', 'Porta do servidor', 'Porta em que o servidor escuta. Gerenciada pelo painel — alterar pode derrubar o servidor.', 'network', '25565', 1, 65535, true),
    int(
        'network-compression-threshold',
        'Limite de compressão',
        'Pacotes maiores que este valor (bytes) são comprimidos. -1 desativa, 0 comprime tudo.',
        'network',
        '256',
        -1
    ),
    int('rate-limit', 'Rate limit de pacotes', 'Máximo de pacotes por segundo antes do jogador ser expulso. 0 desativa.', 'network', '0', 0),
    bool('use-native-transport', 'Transporte nativo', 'Usa otimizações de rede nativas do Linux (epoll). Recomendado manter ativado.', 'network', 'true'),
    bool('prevent-proxy-connections', 'Bloquear proxies', 'Expulsa jogadores cujo ISP/AS difere do resolvido pela Mojang (bloqueia VPN/proxy).', 'network', 'false'),
    bool('enable-status', 'Responder status', 'Permite que o servidor apareça como online na lista de servidores.', 'network', 'true'),
    bool('accepts-transfers', 'Aceitar transferências', 'Aceita jogadores transferidos de outro servidor via pacote de transfer (1.20.5+).', 'network', 'false'),
    int(
        'max-tick-time',
        'Tempo máximo de tick',
        'Milissegundos que um tick pode demorar antes do watchdog derrubar o servidor. -1 desativa.',
        'network',
        '60000',
        -1
    ),
    bool('sync-chunk-writes', 'Escrita síncrona de chunks', 'Grava chunks em disco de forma síncrona (mais seguro, porém mais lento).', 'network', 'true'),

    // ── Resource Pack ────────────────────────────────────────────────────────
    str('resource-pack', 'URL do resource pack', 'URL direta do resource pack enviado aos jogadores ao entrar.', 'resources', '', 'https://exemplo.com/pack.zip'),
    str('resource-pack-sha1', 'SHA-1 do resource pack', 'Hash SHA-1 do arquivo do resource pack, usado para validar o download.', 'resources', ''),
    str('resource-pack-id', 'UUID do resource pack', 'UUID do resource pack (1.20.3+).', 'resources', ''),
    str('resource-pack-prompt', 'Mensagem do prompt', 'Mensagem customizada exibida ao pedir para o jogador baixar o resource pack (JSON text).', 'resources', ''),
    bool('require-resource-pack', 'Exigir resource pack', 'Desconecta jogadores que recusarem o resource pack.', 'resources', 'false'),
    str('initial-enabled-packs', 'Datapacks habilitados', 'Datapacks habilitados na criação do mundo, separados por vírgula.', 'resources', 'vanilla'),
    str('initial-disabled-packs', 'Datapacks desabilitados', 'Datapacks que não devem ser habilitados automaticamente, separados por vírgula.', 'resources', ''),

    // ── Segurança & RCON ─────────────────────────────────────────────────────
    bool('enable-rcon', 'Habilitar RCON', 'Permite acesso remoto ao console via protocolo RCON. Exige senha forte.', 'security', 'false', true),
    int('rcon.port', 'Porta RCON', 'Porta usada pelo RCON.', 'security', '25575', 1, 65535, true),
    str('rcon.password', 'Senha RCON', 'Senha do RCON. Nunca compartilhe este valor.', 'security', '', '', true),
    bool('enable-query', 'Habilitar Query', 'Habilita o protocolo GameSpy4 de consulta de informações do servidor.', 'security', 'false', true),
    int('query.port', 'Porta Query', 'Porta usada pelo protocolo de query.', 'security', '25565', 1, 65535, true),
    bool('broadcast-console-to-ops', 'Console para OPs', 'Envia a saída de comandos do console para todos os OPs online.', 'security', 'true'),
    bool('broadcast-rcon-to-ops', 'RCON para OPs', 'Envia a saída de comandos executados via RCON para os OPs online.', 'security', 'true'),
    bool(
        'enforce-secure-profile',
        'Perfil seguro obrigatório',
        'Exige que jogadores tenham chave de assinatura de chat da Mojang. Necessário para report de chat.',
        'security',
        'true'
    ),
    bool('log-ips', 'Registrar IPs', 'Registra o IP dos jogadores no log ao conectarem.', 'security', 'true'),
    str('text-filtering-config', 'Config de filtro de texto', 'Configuração do serviço de filtragem de chat (uso corporativo).', 'security', ''),

    // ── Avançado ─────────────────────────────────────────────────────────────
    bool('enable-jmx-monitoring', 'Monitoramento JMX', 'Expõe métricas de tick via JMX (javax.management). Requer flags extras na JVM.', 'advanced', 'false'),
    int(
        'entity-broadcast-range-percentage',
        'Alcance de entidades (%)',
        'Percentual da distância padrão em que entidades são enviadas aos clientes (10–1000).',
        'advanced',
        '100',
        10,
        1000
    ),
    int(
        'max-chained-neighbor-updates',
        'Máx. de updates encadeados',
        'Limite de atualizações de blocos vizinhos em cadeia antes de serem ignoradas. Valores negativos desativam.',
        'advanced',
        '1000000'
    ),
    {
        key: 'region-file-compression',
        label: 'Compressão de regiões',
        description: 'Algoritmo de compressão usado nos arquivos de região do mundo (1.20.5+).',
        category: 'advanced',
        type: 'enum',
        defaultValue: 'deflate',
        options: [
            { value: 'deflate', label: 'Deflate (padrão)' },
            { value: 'lz4', label: 'LZ4 (mais rápido)' },
            { value: 'none', label: 'Sem compressão' },
        ],
    },
    str('bug-report-link', 'Link de report de bugs', 'URL exibida ao jogador em telas de desconexão por erro (1.21+).', 'advanced', ''),
];

export const CATALOG_MAP: Record<string, PropertyDefinition> = CATALOG.reduce((acc, def) => {
    acc[def.key] = def;
    return acc;
}, {} as Record<string, PropertyDefinition>);
