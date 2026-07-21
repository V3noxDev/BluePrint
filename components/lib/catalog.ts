export type PropertyInputType = 'boolean' | 'number' | 'select' | 'text' | 'password' | 'textarea';

export interface PropertyOption {
    value: string;
    label: string;
}

export interface PropertyDefinition {
    key: string;
    label: string;
    description: string;
    category: CategoryId;
    type: PropertyInputType;
    defaultValue: string;
    min?: number;
    max?: number;
    options?: PropertyOption[];
    placeholder?: string;
    warning?: string;
    legacy?: boolean;
    validate?: (value: string) => string | null;
}

export type CategoryId =
    | 'essential'
    | 'world'
    | 'performance'
    | 'access'
    | 'gameplay'
    | 'network'
    | 'resources'
    | 'advanced';

export interface PropertyCategory {
    id: CategoryId;
    label: string;
    description: string;
    accent: string;
}

export interface PropertyPreset {
    id: string;
    name: string;
    description: string;
    tone: string;
    values: Record<string, string>;
}

const option = (value: string, label: string = value): PropertyOption => ({ value, label });
const booleanOptions = [option('true', 'Ativado'), option('false', 'Desativado')];

export const categories: PropertyCategory[] = [
    { id: 'essential', label: 'Essenciais', description: 'Identidade e experiência principal', accent: '#34d399' },
    { id: 'world', label: 'Mundo', description: 'Geração, seed e dimensões', accent: '#a3e635' },
    { id: 'performance', label: 'Desempenho', description: 'Distâncias, ticks e otimização', accent: '#22d3ee' },
    { id: 'access', label: 'Acesso', description: 'Autenticação, whitelist e privacidade', accent: '#60a5fa' },
    { id: 'gameplay', label: 'Jogabilidade', description: 'Entidades, comandos e permissões', accent: '#c084fc' },
    { id: 'network', label: 'Rede', description: 'Portas, Query, RCON e conectividade', accent: '#fb923c' },
    { id: 'resources', label: 'Recursos', description: 'Pacotes, avisos e integrações', accent: '#f472b6' },
    { id: 'advanced', label: 'Avançado', description: 'Gerenciamento e opções técnicas', accent: '#94a3b8' },
];

export const propertyDefinitions: PropertyDefinition[] = [
    {
        key: 'motd',
        label: 'Mensagem do servidor',
        description: 'Texto exibido na lista de servidores do Minecraft.',
        category: 'essential',
        type: 'text',
        defaultValue: 'A Minecraft Server',
        placeholder: 'Meu servidor Minecraft',
    },
    {
        key: 'gamemode',
        label: 'Modo de jogo',
        description: 'Modo padrão aplicado a novos jogadores.',
        category: 'essential',
        type: 'select',
        defaultValue: 'survival',
        options: [
            option('survival', 'Sobrevivência'),
            option('creative', 'Criativo'),
            option('adventure', 'Aventura'),
            option('spectator', 'Espectador'),
        ],
    },
    {
        key: 'difficulty',
        label: 'Dificuldade',
        description: 'Controla dano, fome e força dos monstros.',
        category: 'essential',
        type: 'select',
        defaultValue: 'easy',
        options: [
            option('peaceful', 'Pacífico'),
            option('easy', 'Fácil'),
            option('normal', 'Normal'),
            option('hard', 'Difícil'),
        ],
    },
    {
        key: 'max-players',
        label: 'Máximo de jogadores',
        description: 'Quantidade máxima de conexões simultâneas.',
        category: 'essential',
        type: 'number',
        defaultValue: '20',
        min: 0,
        max: 2147483647,
    },
    {
        key: 'hardcore',
        label: 'Modo hardcore',
        description: 'Jogadores entram como espectadores após morrer.',
        category: 'essential',
        type: 'boolean',
        defaultValue: 'false',
        options: booleanOptions,
        legacy: true,
    },
    {
        key: 'pvp',
        label: 'Combate entre jogadores',
        description: 'Permite que jogadores causem dano uns aos outros.',
        category: 'essential',
        type: 'boolean',
        defaultValue: 'true',
        options: booleanOptions,
        legacy: true,
    },
    {
        key: 'force-gamemode',
        label: 'Forçar modo de jogo',
        description: 'Reaplica o modo padrão sempre que o jogador entrar.',
        category: 'essential',
        type: 'boolean',
        defaultValue: 'false',
        options: booleanOptions,
    },
    {
        key: 'level-name',
        label: 'Nome do mundo',
        description: 'Diretório usado para armazenar o mundo principal.',
        category: 'world',
        type: 'text',
        defaultValue: 'world',
        placeholder: 'world',
    },
    {
        key: 'level-seed',
        label: 'Seed do mundo',
        description: 'Seed usada somente na criação de um mundo novo.',
        category: 'world',
        type: 'text',
        defaultValue: '',
        placeholder: 'Deixe vazio para uma seed aleatória',
    },
    {
        key: 'level-type',
        label: 'Tipo de mundo',
        description: 'Gerador usado ao criar um mundo novo.',
        category: 'world',
        type: 'select',
        defaultValue: 'minecraft:normal',
        options: [
            option('minecraft:normal', 'Normal'),
            option('minecraft:flat', 'Plano'),
            option('minecraft:large_biomes', 'Biomas grandes'),
            option('minecraft:amplified', 'Amplificado'),
            option('minecraft:single_biome_surface', 'Bioma único'),
        ],
    },
    {
        key: 'generator-settings',
        label: 'Configuração do gerador',
        description: 'Objeto JSON avançado passado ao gerador do mundo.',
        category: 'world',
        type: 'textarea',
        defaultValue: '{}',
        validate: (value) => {
            try {
                JSON.parse(value || '{}');
                return null;
            } catch {
                return 'Informe um JSON válido.';
            }
        },
    },
    {
        key: 'generate-structures',
        label: 'Gerar estruturas',
        description: 'Gera vilas, fortalezas, templos e outras estruturas.',
        category: 'world',
        type: 'boolean',
        defaultValue: 'true',
        options: booleanOptions,
    },
    {
        key: 'max-world-size',
        label: 'Tamanho máximo do mundo',
        description: 'Raio máximo da borda do mundo, em blocos.',
        category: 'world',
        type: 'number',
        defaultValue: '29999984',
        min: 1,
        max: 29999984,
    },
    {
        key: 'spawn-protection',
        label: 'Proteção do spawn',
        description: 'Raio protegido ao redor do spawn; 0 desativa.',
        category: 'world',
        type: 'number',
        defaultValue: '16',
        min: 0,
        max: 29999984,
    },
    {
        key: 'allow-nether',
        label: 'Permitir Nether',
        description: 'Habilita a dimensão Nether em versões compatíveis.',
        category: 'world',
        type: 'boolean',
        defaultValue: 'true',
        options: booleanOptions,
        legacy: true,
    },
    {
        key: 'view-distance',
        label: 'Distância de visão',
        description: 'Raio de chunks enviado para cada jogador.',
        category: 'performance',
        type: 'number',
        defaultValue: '10',
        min: 3,
        max: 32,
    },
    {
        key: 'simulation-distance',
        label: 'Distância de simulação',
        description: 'Raio de chunks que continua processando entidades e redstone.',
        category: 'performance',
        type: 'number',
        defaultValue: '10',
        min: 3,
        max: 32,
    },
    {
        key: 'entity-broadcast-range-percentage',
        label: 'Alcance de entidades',
        description: 'Percentual do alcance padrão em que entidades são enviadas.',
        category: 'performance',
        type: 'number',
        defaultValue: '100',
        min: 10,
        max: 1000,
    },
    {
        key: 'network-compression-threshold',
        label: 'Limite de compressão',
        description: 'Pacotes maiores que este valor são comprimidos; -1 desativa.',
        category: 'performance',
        type: 'number',
        defaultValue: '256',
        min: -1,
        max: 2147483647,
    },
    {
        key: 'max-tick-time',
        label: 'Tempo máximo de tick',
        description: 'Watchdog encerra o servidor após este tempo em ms; -1 desativa.',
        category: 'performance',
        type: 'number',
        defaultValue: '60000',
        min: -1,
        max: 2147483647,
    },
    {
        key: 'max-chained-neighbor-updates',
        label: 'Atualizações encadeadas',
        description: 'Limite de atualizações vizinhas antes de ignorar a cadeia.',
        category: 'performance',
        type: 'number',
        defaultValue: '1000000',
        min: -1,
        max: 2147483647,
    },
    {
        key: 'sync-chunk-writes',
        label: 'Escrita síncrona de chunks',
        description: 'Força gravações de chunks a terminarem em ordem.',
        category: 'performance',
        type: 'boolean',
        defaultValue: 'true',
        options: booleanOptions,
    },
    {
        key: 'use-native-transport',
        label: 'Transporte nativo',
        description: 'Usa otimizações de rede nativas do Linux quando disponíveis.',
        category: 'performance',
        type: 'boolean',
        defaultValue: 'true',
        options: booleanOptions,
    },
    {
        key: 'pause-when-empty-seconds',
        label: 'Pausar quando vazio',
        description: 'Segundos sem jogadores antes de pausar; -1 desativa.',
        category: 'performance',
        type: 'number',
        defaultValue: '60',
        min: -1,
        max: 2147483647,
    },
    {
        key: 'region-file-compression',
        label: 'Compressão de regiões',
        description: 'Algoritmo usado nos arquivos de região do mundo.',
        category: 'performance',
        type: 'select',
        defaultValue: 'deflate',
        options: [option('deflate', 'Deflate (compatível)'), option('lz4', 'LZ4 (rápido)'), option('none', 'Sem compressão')],
    },
    {
        key: 'online-mode',
        label: 'Autenticação oficial',
        description: 'Valida contas nos serviços da Mojang antes da entrada.',
        category: 'access',
        type: 'boolean',
        defaultValue: 'true',
        options: booleanOptions,
        warning: 'Desative apenas quando um proxy seguro fizer a autenticação. Caso contrário, qualquer pessoa pode imitar um administrador.',
    },
    {
        key: 'white-list',
        label: 'Whitelist',
        description: 'Permite entrada apenas de jogadores cadastrados.',
        category: 'access',
        type: 'boolean',
        defaultValue: 'false',
        options: booleanOptions,
    },
    {
        key: 'enforce-whitelist',
        label: 'Aplicar whitelist imediatamente',
        description: 'Remove jogadores não autorizados ao recarregar a whitelist.',
        category: 'access',
        type: 'boolean',
        defaultValue: 'false',
        options: booleanOptions,
    },
    {
        key: 'enforce-secure-profile',
        label: 'Exigir perfil seguro',
        description: 'Aceita somente perfis com chave pública assinada.',
        category: 'access',
        type: 'boolean',
        defaultValue: 'true',
        options: booleanOptions,
    },
    {
        key: 'prevent-proxy-connections',
        label: 'Bloquear conexões por proxy',
        description: 'Compara dados de rede retornados pelo serviço de autenticação.',
        category: 'access',
        type: 'boolean',
        defaultValue: 'false',
        options: booleanOptions,
    },
    {
        key: 'accepts-transfers',
        label: 'Aceitar transferências',
        description: 'Aceita jogadores enviados pelo pacote de transferência.',
        category: 'access',
        type: 'boolean',
        defaultValue: 'false',
        options: booleanOptions,
    },
    {
        key: 'hide-online-players',
        label: 'Ocultar jogadores online',
        description: 'Não inclui a lista de jogadores na resposta de status.',
        category: 'access',
        type: 'boolean',
        defaultValue: 'false',
        options: booleanOptions,
    },
    {
        key: 'enable-status',
        label: 'Responder ao status',
        description: 'Permite que o servidor apareça como online na lista.',
        category: 'access',
        type: 'boolean',
        defaultValue: 'true',
        options: booleanOptions,
    },
    {
        key: 'status-heartbeat-interval',
        label: 'Intervalo de heartbeat',
        description: 'Intervalo de atualização do status; 0 usa o padrão.',
        category: 'access',
        type: 'number',
        defaultValue: '0',
        min: 0,
        max: 2147483647,
    },
    {
        key: 'player-idle-timeout',
        label: 'Expulsar por inatividade',
        description: 'Minutos sem atividade antes da expulsão; 0 desativa.',
        category: 'access',
        type: 'number',
        defaultValue: '0',
        min: 0,
        max: 2147483647,
    },
    {
        key: 'log-ips',
        label: 'Registrar endereços IP',
        description: 'Inclui IPs dos jogadores nos logs do servidor.',
        category: 'access',
        type: 'boolean',
        defaultValue: 'true',
        options: booleanOptions,
    },
    {
        key: 'allow-flight',
        label: 'Permitir voo',
        description: 'Evita expulsão por voo fora do modo Criativo.',
        category: 'gameplay',
        type: 'boolean',
        defaultValue: 'false',
        options: booleanOptions,
    },
    {
        key: 'spawn-animals',
        label: 'Gerar animais',
        description: 'Permite o surgimento natural de animais.',
        category: 'gameplay',
        type: 'boolean',
        defaultValue: 'true',
        options: booleanOptions,
        legacy: true,
    },
    {
        key: 'spawn-monsters',
        label: 'Gerar monstros',
        description: 'Permite o surgimento natural de criaturas hostis.',
        category: 'gameplay',
        type: 'boolean',
        defaultValue: 'true',
        options: booleanOptions,
        legacy: true,
    },
    {
        key: 'spawn-npcs',
        label: 'Gerar aldeões',
        description: 'Permite o surgimento natural de NPCs.',
        category: 'gameplay',
        type: 'boolean',
        defaultValue: 'true',
        options: booleanOptions,
        legacy: true,
    },
    {
        key: 'enable-command-block',
        label: 'Command blocks',
        description: 'Habilita blocos de comando.',
        category: 'gameplay',
        type: 'boolean',
        defaultValue: 'false',
        options: booleanOptions,
        legacy: true,
    },
    {
        key: 'function-permission-level',
        label: 'Permissão de funções',
        description: 'Nível de operador usado por funções de datapacks.',
        category: 'gameplay',
        type: 'number',
        defaultValue: '2',
        min: 1,
        max: 4,
    },
    {
        key: 'op-permission-level',
        label: 'Permissão de operadores',
        description: 'Nível de comandos concedido a operadores.',
        category: 'gameplay',
        type: 'number',
        defaultValue: '4',
        min: 1,
        max: 4,
    },
    {
        key: 'broadcast-console-to-ops',
        label: 'Console para operadores',
        description: 'Envia a saída de comandos do console aos operadores.',
        category: 'gameplay',
        type: 'boolean',
        defaultValue: 'true',
        options: booleanOptions,
    },
    {
        key: 'broadcast-rcon-to-ops',
        label: 'RCON para operadores',
        description: 'Envia a saída dos comandos RCON aos operadores.',
        category: 'gameplay',
        type: 'boolean',
        defaultValue: 'true',
        options: booleanOptions,
    },
    {
        key: 'server-ip',
        label: 'Endereço de escuta',
        description: 'Normalmente deve ficar vazio para escutar em todas as interfaces.',
        category: 'network',
        type: 'text',
        defaultValue: '',
        placeholder: 'Deixe vazio',
        warning: 'Definir um IP que não existe no container impede o servidor de iniciar.',
    },
    {
        key: 'server-port',
        label: 'Porta do servidor',
        description: 'Porta TCP principal do Minecraft.',
        category: 'network',
        type: 'number',
        defaultValue: '25565',
        min: 1,
        max: 65535,
    },
    {
        key: 'rate-limit',
        label: 'Limite de conexões',
        description: 'Máximo de pacotes de conexão por segundo; 0 desativa.',
        category: 'network',
        type: 'number',
        defaultValue: '0',
        min: 0,
        max: 2147483647,
    },
    {
        key: 'enable-query',
        label: 'Habilitar Query',
        description: 'Expõe informações para ferramentas que usam GameSpy4.',
        category: 'network',
        type: 'boolean',
        defaultValue: 'false',
        options: booleanOptions,
    },
    {
        key: 'query.port',
        label: 'Porta Query',
        description: 'Porta UDP usada pelo protocolo Query.',
        category: 'network',
        type: 'number',
        defaultValue: '25565',
        min: 1,
        max: 65535,
    },
    {
        key: 'enable-rcon',
        label: 'Habilitar RCON',
        description: 'Permite controle remoto do console.',
        category: 'network',
        type: 'boolean',
        defaultValue: 'false',
        options: booleanOptions,
        warning: 'RCON não é criptografado. Restrinja a porta e use uma senha forte.',
    },
    {
        key: 'rcon.port',
        label: 'Porta RCON',
        description: 'Porta TCP usada pelo RCON.',
        category: 'network',
        type: 'number',
        defaultValue: '25575',
        min: 1,
        max: 65535,
    },
    {
        key: 'rcon.password',
        label: 'Senha RCON',
        description: 'Senha de acesso remoto ao console.',
        category: 'network',
        type: 'password',
        defaultValue: '',
        placeholder: 'Use uma senha longa e exclusiva',
    },
    {
        key: 'enable-jmx-monitoring',
        label: 'Monitoramento JMX',
        description: 'Expõe métricas de tempo de tick via MBean.',
        category: 'network',
        type: 'boolean',
        defaultValue: 'false',
        options: booleanOptions,
    },
    {
        key: 'resource-pack',
        label: 'URL do resource pack',
        description: 'URL HTTPS para o pacote de recursos do servidor.',
        category: 'resources',
        type: 'text',
        defaultValue: '',
        placeholder: 'https://exemplo.com/pacote.zip',
    },
    {
        key: 'resource-pack-id',
        label: 'UUID do resource pack',
        description: 'Identificador único do pacote nas versões atuais.',
        category: 'resources',
        type: 'text',
        defaultValue: '',
        validate: (value) =>
            value === '' || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
                ? null
                : 'Informe um UUID válido ou deixe vazio.',
    },
    {
        key: 'resource-pack-sha1',
        label: 'SHA-1 do resource pack',
        description: 'Hash de 40 caracteres usado para validar o download.',
        category: 'resources',
        type: 'text',
        defaultValue: '',
        validate: (value) => (value === '' || /^[0-9a-f]{40}$/i.test(value) ? null : 'O SHA-1 deve ter 40 caracteres hexadecimais.'),
    },
    {
        key: 'require-resource-pack',
        label: 'Exigir resource pack',
        description: 'Desconecta jogadores que recusarem o pacote.',
        category: 'resources',
        type: 'boolean',
        defaultValue: 'false',
        options: booleanOptions,
    },
    {
        key: 'resource-pack-prompt',
        label: 'Mensagem do resource pack',
        description: 'Componente de texto JSON exibido na confirmação.',
        category: 'resources',
        type: 'textarea',
        defaultValue: '',
        placeholder: '{"text":"Pacote recomendado"}',
        validate: (value) => {
            if (value === '') return null;
            try {
                JSON.parse(value);
                return null;
            } catch {
                return 'Informe um componente de texto JSON válido.';
            }
        },
    },
    {
        key: 'initial-enabled-packs',
        label: 'Datapacks habilitados',
        description: 'Lista separada por vírgulas de datapacks iniciais.',
        category: 'resources',
        type: 'text',
        defaultValue: 'vanilla',
    },
    {
        key: 'initial-disabled-packs',
        label: 'Datapacks desabilitados',
        description: 'Lista separada por vírgulas de datapacks desativados.',
        category: 'resources',
        type: 'text',
        defaultValue: '',
    },
    {
        key: 'bug-report-link',
        label: 'Link para reportar bugs',
        description: 'URL exibida no menu de links do servidor.',
        category: 'resources',
        type: 'text',
        defaultValue: '',
        placeholder: 'https://exemplo.com/suporte',
    },
    {
        key: 'enable-code-of-conduct',
        label: 'Código de conduta',
        description: 'Exibe arquivos localizados no diretório codeofconduct.',
        category: 'resources',
        type: 'boolean',
        defaultValue: 'false',
        options: booleanOptions,
    },
    {
        key: 'management-server-enabled',
        label: 'Servidor de gerenciamento',
        description: 'Habilita a API de gerenciamento nativa das versões recentes.',
        category: 'advanced',
        type: 'boolean',
        defaultValue: 'false',
        options: booleanOptions,
        warning: 'Exponha esta API somente em uma rede confiável e com TLS configurado.',
    },
    {
        key: 'management-server-host',
        label: 'Host de gerenciamento',
        description: 'Interface onde a API de gerenciamento escuta.',
        category: 'advanced',
        type: 'text',
        defaultValue: 'localhost',
    },
    {
        key: 'management-server-port',
        label: 'Porta de gerenciamento',
        description: 'Porta da API; 0 escolhe uma porta automaticamente.',
        category: 'advanced',
        type: 'number',
        defaultValue: '0',
        min: 0,
        max: 65535,
    },
    {
        key: 'management-server-allowed-origins',
        label: 'Origens permitidas',
        description: 'Lista de origens autorizadas a chamar a API de gerenciamento.',
        category: 'advanced',
        type: 'text',
        defaultValue: '',
    },
    {
        key: 'management-server-secret',
        label: 'Segredo de gerenciamento',
        description: 'Segredo de autenticação da API de gerenciamento.',
        category: 'advanced',
        type: 'password',
        defaultValue: '',
        placeholder: 'Gerado automaticamente pelo servidor',
    },
    {
        key: 'management-server-tls-enabled',
        label: 'TLS de gerenciamento',
        description: 'Protege a API de gerenciamento com TLS.',
        category: 'advanced',
        type: 'boolean',
        defaultValue: 'true',
        options: booleanOptions,
    },
    {
        key: 'management-server-tls-keystore',
        label: 'Keystore TLS',
        description: 'Caminho do arquivo keystore usado pela API.',
        category: 'advanced',
        type: 'text',
        defaultValue: '',
    },
    {
        key: 'management-server-tls-keystore-password',
        label: 'Senha do keystore',
        description: 'Senha do arquivo keystore TLS.',
        category: 'advanced',
        type: 'password',
        defaultValue: '',
    },
    {
        key: 'chat-spam-threshold-seconds',
        label: 'Limite de spam no chat',
        description: 'Contador anti-spam de mensagens; 0 desativa.',
        category: 'advanced',
        type: 'number',
        defaultValue: '10',
        min: 0,
        max: 2147483647,
    },
    {
        key: 'command-spam-threshold-seconds',
        label: 'Limite de spam em comandos',
        description: 'Contador anti-spam de comandos; 0 desativa.',
        category: 'advanced',
        type: 'number',
        defaultValue: '10',
        min: 0,
        max: 2147483647,
    },
    {
        key: 'text-filtering-config',
        label: 'Configuração de filtro de texto',
        description: 'Configuração externa do sistema de filtragem.',
        category: 'advanced',
        type: 'text',
        defaultValue: '',
    },
    {
        key: 'text-filtering-version',
        label: 'Versão do filtro de texto',
        description: 'Versão do protocolo de filtragem configurado.',
        category: 'advanced',
        type: 'number',
        defaultValue: '0',
        min: 0,
        max: 2147483647,
    },
];

export const propertyDefinitionByKey = propertyDefinitions.reduce<Record<string, PropertyDefinition>>((definitions, property) => {
    definitions[property.key] = property;
    return definitions;
}, {});

export const presets: PropertyPreset[] = [
    {
        id: 'smp',
        name: 'SMP equilibrado',
        description: 'Base segura e equilibrada para sobrevivência com amigos.',
        tone: '#34d399',
        values: {
            gamemode: 'survival',
            difficulty: 'normal',
            hardcore: 'false',
            pvp: 'true',
            'online-mode': 'true',
            'view-distance': '10',
            'simulation-distance': '8',
            'spawn-protection': '16',
        },
    },
    {
        id: 'performance',
        name: 'Mais desempenho',
        description: 'Reduz carga de chunks e entidades sem alterar o mundo.',
        tone: '#22d3ee',
        values: {
            'view-distance': '8',
            'simulation-distance': '6',
            'entity-broadcast-range-percentage': '80',
            'network-compression-threshold': '256',
            'use-native-transport': 'true',
            'sync-chunk-writes': 'true',
        },
    },
    {
        id: 'creative',
        name: 'Servidor criativo',
        description: 'Voo, comandos e dificuldade pacífica para construir.',
        tone: '#c084fc',
        values: {
            gamemode: 'creative',
            difficulty: 'peaceful',
            'force-gamemode': 'true',
            'allow-flight': 'true',
            'spawn-monsters': 'false',
            'enable-command-block': 'true',
        },
    },
    {
        id: 'private',
        name: 'Servidor privado',
        description: 'Whitelist aplicada e jogadores ocultos no status.',
        tone: '#60a5fa',
        values: {
            'online-mode': 'true',
            'white-list': 'true',
            'enforce-whitelist': 'true',
            'hide-online-players': 'true',
            'enforce-secure-profile': 'true',
        },
    },
    {
        id: 'hardcore',
        name: 'Hardcore',
        description: 'Sobrevivência difícil, sem segunda chance.',
        tone: '#fb7185',
        values: {
            gamemode: 'survival',
            difficulty: 'hard',
            hardcore: 'true',
            'force-gamemode': 'true',
            pvp: 'true',
            'online-mode': 'true',
        },
    },
];

const currentPropertyKeys = [
    'accepts-transfers',
    'allow-flight',
    'broadcast-console-to-ops',
    'broadcast-rcon-to-ops',
    'bug-report-link',
    'chat-spam-threshold-seconds',
    'command-spam-threshold-seconds',
    'difficulty',
    'enable-code-of-conduct',
    'enable-jmx-monitoring',
    'enable-query',
    'enable-rcon',
    'enable-status',
    'enforce-secure-profile',
    'enforce-whitelist',
    'entity-broadcast-range-percentage',
    'force-gamemode',
    'function-permission-level',
    'gamemode',
    'generate-structures',
    'generator-settings',
    'hardcore',
    'hide-online-players',
    'initial-disabled-packs',
    'initial-enabled-packs',
    'level-name',
    'level-seed',
    'level-type',
    'log-ips',
    'management-server-allowed-origins',
    'management-server-enabled',
    'management-server-host',
    'management-server-port',
    'management-server-secret',
    'management-server-tls-enabled',
    'management-server-tls-keystore',
    'management-server-tls-keystore-password',
    'max-chained-neighbor-updates',
    'max-players',
    'max-tick-time',
    'max-world-size',
    'motd',
    'network-compression-threshold',
    'online-mode',
    'op-permission-level',
    'pause-when-empty-seconds',
    'player-idle-timeout',
    'prevent-proxy-connections',
    'query.port',
    'rate-limit',
    'rcon.password',
    'rcon.port',
    'region-file-compression',
    'require-resource-pack',
    'resource-pack',
    'resource-pack-id',
    'resource-pack-prompt',
    'resource-pack-sha1',
    'server-ip',
    'server-port',
    'simulation-distance',
    'spawn-protection',
    'status-heartbeat-interval',
    'sync-chunk-writes',
    'text-filtering-config',
    'text-filtering-version',
    'use-native-transport',
    'view-distance',
    'white-list',
];

export const buildDefaultProperties = (): string => {
    const lines = ['#Minecraft server properties', '#Generated by CraftProperties'];

    currentPropertyKeys.forEach((key) => {
        const definition = propertyDefinitionByKey[key];
        if (definition) {
            lines.push(`${key}=${definition.defaultValue}`);
        }
    });

    return `${lines.join('\n')}\n`;
};

export const validateProperty = (definition: PropertyDefinition, value: string): string | null => {
    if (definition.type === 'number') {
        if (!/^-?\d+$/.test(value)) {
            return 'Informe um número inteiro.';
        }

        const number = Number(value);
        if (definition.min !== undefined && number < definition.min) {
            return `O valor mínimo é ${definition.min}.`;
        }
        if (definition.max !== undefined && number > definition.max) {
            return `O valor máximo é ${definition.max}.`;
        }
    }

    if (definition.type === 'boolean' && value !== 'true' && value !== 'false') {
        return 'Use true ou false.';
    }

    if (definition.type === 'select' && !definition.options?.some((item) => item.value === value)) {
        return 'Selecione uma opção válida.';
    }

    return definition.validate?.(value) || null;
};
