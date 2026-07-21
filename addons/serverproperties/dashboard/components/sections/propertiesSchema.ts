/**
 * Schema das propriedades do server.properties do Minecraft: Java Edition.
 * Cobrimos as propriedades oficiais mais comuns. Chaves desconhecidas ainda
 * aparecem em uma categoria "Outras" com input de texto genérico.
 */

export type PropertyType = 'string' | 'number' | 'boolean' | 'select';

export interface PropertySpec {
    key: string;
    label: string;
    description: string;
    category: CategoryId;
    type: PropertyType;
    default: string;
    options?: { value: string; label: string }[];
    min?: number;
    max?: number;
    sensitive?: boolean;
}

export type CategoryId =
    | 'geral'
    | 'jogo'
    | 'mundo'
    | 'rede'
    | 'rcon'
    | 'recursos'
    | 'seguranca'
    | 'performance'
    | 'outras';

export const CATEGORIES: { id: CategoryId; label: string; icon: string }[] = [
    { id: 'geral', label: 'Geral', icon: '⚙️' },
    { id: 'jogo', label: 'Jogo', icon: '🎮' },
    { id: 'mundo', label: 'Mundo', icon: '🌍' },
    { id: 'rede', label: 'Rede', icon: '🌐' },
    { id: 'rcon', label: 'RCON / Query', icon: '🔌' },
    { id: 'recursos', label: 'Resource Pack', icon: '📦' },
    { id: 'seguranca', label: 'Segurança', icon: '🛡️' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'outras', label: 'Outras', icon: '➕' },
];

export const PROPERTIES: PropertySpec[] = [
    // ---------- Geral ----------
    {
        key: 'motd',
        label: 'MOTD',
        description: 'Mensagem exibida na lista de servidores. Suporta códigos §.',
        category: 'geral',
        type: 'string',
        default: 'A Minecraft Server',
    },
    {
        key: 'server-port',
        label: 'Porta do servidor',
        description: 'Porta TCP em que o servidor Java escuta.',
        category: 'geral',
        type: 'number',
        default: '25565',
        min: 1,
        max: 65535,
    },
    {
        key: 'server-ip',
        label: 'IP do servidor',
        description: 'Deixe vazio para escutar em todos os endereços.',
        category: 'geral',
        type: 'string',
        default: '',
    },
    {
        key: 'max-players',
        label: 'Máximo de jogadores',
        description: 'Quantidade máxima de jogadores simultâneos.',
        category: 'geral',
        type: 'number',
        default: '20',
        min: 1,
        max: 2147483647,
    },
    {
        key: 'level-name',
        label: 'Nome do mundo',
        description: 'Pasta do mundo carregado pelo servidor.',
        category: 'geral',
        type: 'string',
        default: 'world',
    },

    // ---------- Jogo ----------
    {
        key: 'gamemode',
        label: 'Modo de jogo',
        description: 'Modo padrão para novos jogadores.',
        category: 'jogo',
        type: 'select',
        default: 'survival',
        options: [
            { value: 'survival', label: 'Survival' },
            { value: 'creative', label: 'Creative' },
            { value: 'adventure', label: 'Adventure' },
            { value: 'spectator', label: 'Spectator' },
        ],
    },
    {
        key: 'force-gamemode',
        label: 'Forçar modo de jogo',
        description: 'Força o modo padrão sempre que o jogador entra.',
        category: 'jogo',
        type: 'boolean',
        default: 'false',
    },
    {
        key: 'difficulty',
        label: 'Dificuldade',
        description: 'Dificuldade do mundo.',
        category: 'jogo',
        type: 'select',
        default: 'easy',
        options: [
            { value: 'peaceful', label: 'Peaceful' },
            { value: 'easy', label: 'Easy' },
            { value: 'normal', label: 'Normal' },
            { value: 'hard', label: 'Hard' },
        ],
    },
    {
        key: 'hardcore',
        label: 'Hardcore',
        description: 'Uma vida por jogador; morte = banimento do mundo.',
        category: 'jogo',
        type: 'boolean',
        default: 'false',
    },
    {
        key: 'pvp',
        label: 'PvP habilitado',
        description: 'Permite dano entre jogadores.',
        category: 'jogo',
        type: 'boolean',
        default: 'true',
    },
    {
        key: 'allow-flight',
        label: 'Permitir voo',
        description: 'Permite voo (necessário para mods/plugins).',
        category: 'jogo',
        type: 'boolean',
        default: 'false',
    },
    {
        key: 'spawn-animals',
        label: 'Spawn de animais',
        description: 'Gera animais passivos no mundo.',
        category: 'jogo',
        type: 'boolean',
        default: 'true',
    },
    {
        key: 'spawn-monsters',
        label: 'Spawn de monstros',
        description: 'Gera monstros hostis.',
        category: 'jogo',
        type: 'boolean',
        default: 'true',
    },
    {
        key: 'spawn-npcs',
        label: 'Spawn de NPCs',
        description: 'Gera aldeões e outros NPCs.',
        category: 'jogo',
        type: 'boolean',
        default: 'true',
    },
    {
        key: 'enable-command-block',
        label: 'Command Blocks',
        description: 'Habilita blocos de comando dentro do mundo.',
        category: 'jogo',
        type: 'boolean',
        default: 'false',
    },
    {
        key: 'player-idle-timeout',
        label: 'Timeout de inatividade (min)',
        description: 'Chuta jogadores AFK após X minutos. 0 = desativado.',
        category: 'jogo',
        type: 'number',
        default: '0',
        min: 0,
    },
    {
        key: 'op-permission-level',
        label: 'Nível de permissão dos OPs',
        description: '1 = bypass spawn, 2 = comandos básicos, 3 = kick/ban, 4 = tudo.',
        category: 'jogo',
        type: 'select',
        default: '4',
        options: [
            { value: '1', label: '1 — Bypass spawn' },
            { value: '2', label: '2 — Comandos básicos' },
            { value: '3', label: '3 — Multiplayer' },
            { value: '4', label: '4 — Todos' },
        ],
    },
    {
        key: 'function-permission-level',
        label: 'Nível de permissão das functions',
        description: 'Mesmos níveis do OP, mas para comandos executados por functions.',
        category: 'jogo',
        type: 'select',
        default: '2',
        options: [
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
            { value: '4', label: '4' },
        ],
    },

    // ---------- Mundo ----------
    {
        key: 'level-seed',
        label: 'Seed do mundo',
        description: 'Semente para geração. Vazio = aleatório.',
        category: 'mundo',
        type: 'string',
        default: '',
    },
    {
        key: 'level-type',
        label: 'Tipo do mundo',
        description: 'Tipo do gerador de mundo. Ex: minecraft:normal, minecraft:flat.',
        category: 'mundo',
        type: 'select',
        default: 'minecraft:normal',
        options: [
            { value: 'minecraft:normal', label: 'Normal' },
            { value: 'minecraft:flat', label: 'Superflat' },
            { value: 'minecraft:large_biomes', label: 'Large Biomes' },
            { value: 'minecraft:amplified', label: 'Amplified' },
            { value: 'minecraft:single_biome_surface', label: 'Single Biome' },
        ],
    },
    {
        key: 'generator-settings',
        label: 'Configurações do gerador',
        description: 'JSON com configurações customizadas do gerador. Ex: superflat.',
        category: 'mundo',
        type: 'string',
        default: '{}',
    },
    {
        key: 'generate-structures',
        label: 'Gerar estruturas',
        description: 'Vilarejos, templos, fortalezas etc.',
        category: 'mundo',
        type: 'boolean',
        default: 'true',
    },
    {
        key: 'allow-nether',
        label: 'Permitir Nether',
        description: 'Se falso, o portal do Nether não funciona.',
        category: 'mundo',
        type: 'boolean',
        default: 'true',
    },
    {
        key: 'max-world-size',
        label: 'Tamanho máximo do mundo (blocos)',
        description: 'Raio máximo do worldborder. Máximo: 29999984.',
        category: 'mundo',
        type: 'number',
        default: '29999984',
        min: 1,
        max: 29999984,
    },
    {
        key: 'spawn-protection',
        label: 'Proteção do spawn (blocos)',
        description: 'Raio protegido no spawn. 0 = desativado.',
        category: 'mundo',
        type: 'number',
        default: '16',
        min: 0,
    },

    // ---------- Rede ----------
    {
        key: 'online-mode',
        label: 'Modo online (autenticação Mojang)',
        description: 'Se ativado, exige contas premium. Desative com cuidado.',
        category: 'rede',
        type: 'boolean',
        default: 'true',
    },
    {
        key: 'prevent-proxy-connections',
        label: 'Bloquear conexões via proxy',
        description: 'Bloqueia VPNs/proxies pela API da Mojang.',
        category: 'rede',
        type: 'boolean',
        default: 'false',
    },
    {
        key: 'network-compression-threshold',
        label: 'Threshold de compressão (bytes)',
        description: 'Pacotes maiores que N são comprimidos. -1 = desabilitado.',
        category: 'rede',
        type: 'number',
        default: '256',
        min: -1,
    },
    {
        key: 'use-native-transport',
        label: 'Usar transporte nativo (epoll)',
        description: 'Melhora performance em Linux. Deixe true.',
        category: 'rede',
        type: 'boolean',
        default: 'true',
    },
    {
        key: 'rate-limit',
        label: 'Rate limit de pacotes',
        description: 'Limite de pacotes por segundo por jogador. 0 = desabilitado.',
        category: 'rede',
        type: 'number',
        default: '0',
        min: 0,
    },
    {
        key: 'enable-status',
        label: 'Aparecer na lista pública',
        description: 'Servidor responde ao ping da lista de servidores.',
        category: 'rede',
        type: 'boolean',
        default: 'true',
    },
    {
        key: 'hide-online-players',
        label: 'Ocultar jogadores online',
        description: 'Não expõe a lista de players no ping do servidor.',
        category: 'rede',
        type: 'boolean',
        default: 'false',
    },

    // ---------- RCON / Query ----------
    {
        key: 'enable-rcon',
        label: 'Habilitar RCON',
        description: 'Console remoto via protocolo RCON.',
        category: 'rcon',
        type: 'boolean',
        default: 'false',
    },
    {
        key: 'rcon.port',
        label: 'Porta do RCON',
        description: 'Porta TCP para o RCON.',
        category: 'rcon',
        type: 'number',
        default: '25575',
        min: 1,
        max: 65535,
    },
    {
        key: 'rcon.password',
        label: 'Senha do RCON',
        description: 'Não deixe vazia se o RCON estiver ligado!',
        category: 'rcon',
        type: 'string',
        default: '',
        sensitive: true,
    },
    {
        key: 'broadcast-rcon-to-ops',
        label: 'Broadcast RCON para OPs',
        description: 'Mostra comandos do RCON para OPs no chat.',
        category: 'rcon',
        type: 'boolean',
        default: 'true',
    },
    {
        key: 'enable-query',
        label: 'Habilitar Query (GameSpy4)',
        description: 'Permite monitoramento externo via protocolo Query.',
        category: 'rcon',
        type: 'boolean',
        default: 'false',
    },
    {
        key: 'query.port',
        label: 'Porta Query',
        description: 'Porta UDP para o Query.',
        category: 'rcon',
        type: 'number',
        default: '25565',
        min: 1,
        max: 65535,
    },

    // ---------- Resource Pack ----------
    {
        key: 'resource-pack',
        label: 'URL do resource pack',
        description: 'URL direto para o .zip do pack. Vazio = nenhum.',
        category: 'recursos',
        type: 'string',
        default: '',
    },
    {
        key: 'resource-pack-sha1',
        label: 'SHA-1 do resource pack',
        description: 'Hash SHA-1 do arquivo. Recomendado para cache.',
        category: 'recursos',
        type: 'string',
        default: '',
    },
    {
        key: 'resource-pack-prompt',
        label: 'Mensagem do prompt',
        description: 'Texto exibido quando o pack é oferecido ao jogador.',
        category: 'recursos',
        type: 'string',
        default: '',
    },
    {
        key: 'require-resource-pack',
        label: 'Exigir resource pack',
        description: 'Jogadores que recusarem serão desconectados.',
        category: 'recursos',
        type: 'boolean',
        default: 'false',
    },

    // ---------- Segurança ----------
    {
        key: 'white-list',
        label: 'Whitelist habilitada',
        description: 'Somente jogadores da whitelist podem entrar.',
        category: 'seguranca',
        type: 'boolean',
        default: 'false',
    },
    {
        key: 'enforce-whitelist',
        label: 'Aplicar whitelist agora',
        description: 'Chuta imediatamente todos os jogadores fora da whitelist.',
        category: 'seguranca',
        type: 'boolean',
        default: 'false',
    },
    {
        key: 'enforce-secure-profile',
        label: 'Exigir perfil seguro (chat)',
        description: 'Requer chave criptográfica para o chat 1.19+.',
        category: 'seguranca',
        type: 'boolean',
        default: 'true',
    },
    {
        key: 'log-ips',
        label: 'Registrar IPs no log',
        description: 'Grava o IP dos jogadores no server log.',
        category: 'seguranca',
        type: 'boolean',
        default: 'true',
    },
    {
        key: 'text-filtering-config',
        label: 'Config de filtro de texto',
        description: 'URL do serviço de filtragem de chat. Vazio = padrão.',
        category: 'seguranca',
        type: 'string',
        default: '',
    },

    // ---------- Performance ----------
    {
        key: 'view-distance',
        label: 'View distance (chunks)',
        description: 'Distância em chunks enviada aos jogadores. 8–12 é o ideal.',
        category: 'performance',
        type: 'number',
        default: '10',
        min: 3,
        max: 32,
    },
    {
        key: 'simulation-distance',
        label: 'Simulation distance (chunks)',
        description: 'Distância em que entidades/tick são simulados.',
        category: 'performance',
        type: 'number',
        default: '10',
        min: 3,
        max: 32,
    },
    {
        key: 'entity-broadcast-range-percentage',
        label: 'Alcance de entidades (%)',
        description: 'Percentual do range padrão para broadcast de entidades.',
        category: 'performance',
        type: 'number',
        default: '100',
        min: 10,
        max: 1000,
    },
    {
        key: 'max-tick-time',
        label: 'Max tick time (ms)',
        description: 'Watchdog: -1 desabilita, senão mata o server em travas > N ms.',
        category: 'performance',
        type: 'number',
        default: '60000',
        min: -1,
    },
    {
        key: 'max-chained-neighbor-updates',
        label: 'Max chained neighbor updates',
        description: 'Limite de updates em cascata. -1 = ilimitado.',
        category: 'performance',
        type: 'number',
        default: '1000000',
        min: -1,
    },
    {
        key: 'sync-chunk-writes',
        label: 'Sync de chunks (fsync)',
        description: 'Grava chunks de forma síncrona (mais seguro, mais lento).',
        category: 'performance',
        type: 'boolean',
        default: 'true',
    },
    {
        key: 'region-file-compression',
        label: 'Compressão dos region files',
        description: 'Algoritmo de compressão dos .mca.',
        category: 'performance',
        type: 'select',
        default: 'deflate',
        options: [
            { value: 'deflate', label: 'Deflate (padrão)' },
            { value: 'lz4', label: 'LZ4 (rápido)' },
            { value: 'none', label: 'Sem compressão' },
        ],
    },
    {
        key: 'enable-jmx-monitoring',
        label: 'Habilitar JMX Monitoring',
        description: 'Expõe métricas JMX (avançado).',
        category: 'performance',
        type: 'boolean',
        default: 'false',
    },
    {
        key: 'broadcast-console-to-ops',
        label: 'Broadcast do console para OPs',
        description: 'Mostra comandos do console aos operadores.',
        category: 'performance',
        type: 'boolean',
        default: 'true',
    },
];

export const PROPERTY_MAP: Record<string, PropertySpec> = PROPERTIES.reduce(
    (acc, p) => {
        acc[p.key] = p;
        return acc;
    },
    {} as Record<string, PropertySpec>,
);
