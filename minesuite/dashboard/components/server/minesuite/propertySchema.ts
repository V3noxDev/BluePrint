export type PropertyType = 'boolean' | 'string' | 'number' | 'select';

export interface PropertyDefinition {
    key: string;
    label: string;
    description: string;
    type: PropertyType;
    options?: { value: string; label: string }[];
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
}

export interface PropertyCategory {
    id: string;
    title: string;
    properties: PropertyDefinition[];
}

export const PROPERTY_CATEGORIES: PropertyCategory[] = [
    {
        id: 'general',
        title: 'Geral',
        properties: [
            {
                key: 'motd',
                label: 'MOTD',
                description: 'Mensagem exibida na lista de servidores.',
                type: 'string',
                placeholder: 'A Minecraft Server',
            },
            {
                key: 'gamemode',
                label: 'Gamemode',
                description: 'Modo de jogo padrão para novos jogadores.',
                type: 'select',
                options: [
                    { value: 'survival', label: 'Survival' },
                    { value: 'creative', label: 'Creative' },
                    { value: 'adventure', label: 'Adventure' },
                    { value: 'spectator', label: 'Spectator' },
                ],
            },
            {
                key: 'force-gamemode',
                label: 'Forçar gamemode',
                description: 'Força o gamemode ao entrar no servidor.',
                type: 'boolean',
            },
            {
                key: 'difficulty',
                label: 'Dificuldade',
                description: 'Dificuldade global do mundo.',
                type: 'select',
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
                description: 'Jogadores vão para spectator ao morrer.',
                type: 'boolean',
            },
            {
                key: 'pvp',
                label: 'PvP',
                description: 'Permite combate entre jogadores.',
                type: 'boolean',
            },
            {
                key: 'max-players',
                label: 'Máx. jogadores',
                description: 'Limite de jogadores online.',
                type: 'number',
                min: 1,
                max: 1000,
            },
        ],
    },
    {
        id: 'world',
        title: 'Mundo',
        properties: [
            {
                key: 'level-name',
                label: 'Nome do mundo',
                description: 'Pasta/mundo principal carregado.',
                type: 'string',
            },
            {
                key: 'level-seed',
                label: 'Seed',
                description: 'Seed de geração (vazio = aleatória).',
                type: 'string',
                placeholder: '',
            },
            {
                key: 'level-type',
                label: 'Tipo de mundo',
                description: 'Preset de geração do mundo.',
                type: 'select',
                options: [
                    { value: 'minecraft:normal', label: 'Normal' },
                    { value: 'minecraft:flat', label: 'Flat' },
                    { value: 'minecraft:large_biomes', label: 'Large Biomes' },
                    { value: 'minecraft:amplified', label: 'Amplified' },
                    { value: 'minecraft:single_biome_surface', label: 'Single Biome' },
                    { value: 'default', label: 'Default (legacy)' },
                    { value: 'flat', label: 'Flat (legacy)' },
                ],
            },
            {
                key: 'generate-structures',
                label: 'Gerar estruturas',
                description: 'Vilas, templos, strongholds, etc.',
                type: 'boolean',
            },
            {
                key: 'allow-nether',
                label: 'Permitir Nether',
                description: 'Habilita portais e dimensão Nether.',
                type: 'boolean',
            },
            {
                key: 'spawn-monsters',
                label: 'Spawn de monstros',
                description: 'Permite spawn natural de hostis.',
                type: 'boolean',
            },
            {
                key: 'spawn-animals',
                label: 'Spawn de animais',
                description: 'Permite spawn natural de animais.',
                type: 'boolean',
            },
            {
                key: 'spawn-npcs',
                label: 'Spawn de NPCs',
                description: 'Permite villagers e NPCs.',
                type: 'boolean',
            },
            {
                key: 'view-distance',
                label: 'View distance',
                description: 'Chunks enviados ao cliente.',
                type: 'number',
                min: 2,
                max: 32,
            },
            {
                key: 'simulation-distance',
                label: 'Simulation distance',
                description: 'Chunks com entidades/redstone ativas.',
                type: 'number',
                min: 2,
                max: 32,
            },
            {
                key: 'max-world-size',
                label: 'Tamanho máx. do mundo',
                description: 'Raio máximo do world border.',
                type: 'number',
                min: 1,
                max: 29999984,
            },
        ],
    },
    {
        id: 'network',
        title: 'Rede',
        properties: [
            {
                key: 'server-port',
                label: 'Porta',
                description: 'Porta do servidor Minecraft.',
                type: 'number',
                min: 1,
                max: 65535,
            },
            {
                key: 'server-ip',
                label: 'IP bind',
                description: 'IP de bind (geralmente vazio no Pterodactyl).',
                type: 'string',
            },
            {
                key: 'online-mode',
                label: 'Online mode',
                description: 'Autenticação Mojang/Microsoft.',
                type: 'boolean',
            },
            {
                key: 'prevent-proxy-connections',
                label: 'Bloquear proxies',
                description: 'Impede conexões via proxy conhecidas.',
                type: 'boolean',
            },
            {
                key: 'network-compression-threshold',
                label: 'Compressão de rede',
                description: 'Bytes mínimos para comprimir pacotes (-1 desliga).',
                type: 'number',
                min: -1,
                max: 1024,
            },
            {
                key: 'rate-limit',
                label: 'Rate limit',
                description: 'Limite de pacotes (0 = desativado).',
                type: 'number',
                min: 0,
                max: 1000,
            },
            {
                key: 'enable-status',
                label: 'Status query',
                description: 'Responde ping na lista de servidores.',
                type: 'boolean',
            },
            {
                key: 'hide-online-players',
                label: 'Ocultar jogadores',
                description: 'Esconde lista de online no ping.',
                type: 'boolean',
            },
        ],
    },
    {
        id: 'security',
        title: 'Segurança',
        properties: [
            {
                key: 'white-list',
                label: 'Whitelist',
                description: 'Só jogadores na whitelist entram.',
                type: 'boolean',
            },
            {
                key: 'enforce-whitelist',
                label: 'Enforce whitelist',
                description: 'Kicka quem for removido da whitelist.',
                type: 'boolean',
            },
            {
                key: 'spawn-protection',
                label: 'Proteção do spawn',
                description: 'Raio protegido ao redor do spawn (ops ignoram).',
                type: 'number',
                min: 0,
                max: 1024,
            },
            {
                key: 'op-permission-level',
                label: 'Nível de OP',
                description: 'Nível padrão ao dar /op.',
                type: 'number',
                min: 1,
                max: 4,
            },
            {
                key: 'function-permission-level',
                label: 'Nível de functions',
                description: 'Permissão exigida para functions.',
                type: 'number',
                min: 1,
                max: 4,
            },
            {
                key: 'enable-command-block',
                label: 'Command blocks',
                description: 'Habilita command blocks no mundo.',
                type: 'boolean',
            },
            {
                key: 'allow-flight',
                label: 'Permitir flight',
                description: 'Evita kick por falso positivo de fly.',
                type: 'boolean',
            },
        ],
    },
    {
        id: 'performance',
        title: 'Performance',
        properties: [
            {
                key: 'max-tick-time',
                label: 'Max tick time',
                description: 'Watchdog (ms). -1 desativa.',
                type: 'number',
                min: -1,
                max: 180000,
            },
            {
                key: 'entity-broadcast-range-percentage',
                label: 'Entity broadcast %',
                description: 'Alcance de broadcast de entidades.',
                type: 'number',
                min: 10,
                max: 1000,
            },
            {
                key: 'sync-chunk-writes',
                label: 'Sync chunk writes',
                description: 'Escrita síncrona de chunks (mais seguro, mais lento).',
                type: 'boolean',
            },
            {
                key: 'use-native-transport',
                label: 'Native transport',
                description: 'Usa transporte nativo Linux quando disponível.',
                type: 'boolean',
            },
            {
                key: 'player-idle-timeout',
                label: 'Idle timeout (min)',
                description: 'Kick por inatividade. 0 desativa.',
                type: 'number',
                min: 0,
                max: 1440,
            },
            {
                key: 'max-chained-neighbor-updates',
                label: 'Neighbor updates',
                description: 'Limite de updates encadeados de blocos.',
                type: 'number',
                min: 0,
                max: 10000000,
            },
        ],
    },
    {
        id: 'resourcepack',
        title: 'Resource Pack',
        properties: [
            {
                key: 'require-resource-pack',
                label: 'Exigir resource pack',
                description: 'Obriga o client a aceitar o pack.',
                type: 'boolean',
            },
            {
                key: 'resource-pack',
                label: 'URL do pack',
                description: 'URL direta do resource pack.',
                type: 'string',
                placeholder: 'https://...',
            },
            {
                key: 'resource-pack-sha1',
                label: 'SHA1 do pack',
                description: 'Hash SHA-1 para validação.',
                type: 'string',
            },
            {
                key: 'resource-pack-prompt',
                label: 'Prompt do pack',
                description: 'Mensagem exibida ao pedir o pack.',
                type: 'string',
            },
        ],
    },
];

export const flattenPropertyKeys = (): string[] =>
    PROPERTY_CATEGORIES.flatMap((category) => category.properties.map((property) => property.key));
