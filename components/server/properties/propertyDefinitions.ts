export type PropertyType = 'text' | 'number' | 'boolean' | 'select';

export interface PropertyDefinition {
  key: string;
  label: string;
  help?: string;
  type: PropertyType;
  options?: { value: string; label: string }[];
  placeholder?: string;
  readonly?: boolean;
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
        help: 'Mensagem exibida na lista de servidores.',
        type: 'text',
        placeholder: 'A Minecraft Server',
      },
      {
        key: 'max-players',
        label: 'Max players',
        type: 'number',
        placeholder: '20',
      },
      {
        key: 'online-mode',
        label: 'Online mode',
        help: 'Valida autenticação na conta Mojang/Microsoft.',
        type: 'boolean',
      },
      {
        key: 'white-list',
        label: 'Whitelist',
        type: 'boolean',
      },
      {
        key: 'enforce-whitelist',
        label: 'Enforce whitelist',
        type: 'boolean',
      },
      {
        key: 'enable-status',
        label: 'Enable status',
        type: 'boolean',
      },
      {
        key: 'hide-online-players',
        label: 'Hide online players',
        type: 'boolean',
      },
    ],
  },
  {
    id: 'gameplay',
    title: 'Gameplay',
    properties: [
      {
        key: 'gamemode',
        label: 'Gamemode',
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
        label: 'Force gamemode',
        type: 'boolean',
      },
      {
        key: 'difficulty',
        label: 'Difficulty',
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
        type: 'boolean',
      },
      {
        key: 'pvp',
        label: 'PvP',
        type: 'boolean',
      },
      {
        key: 'allow-flight',
        label: 'Allow flight',
        type: 'boolean',
      },
      {
        key: 'enable-command-block',
        label: 'Command blocks',
        type: 'boolean',
      },
      {
        key: 'spawn-monsters',
        label: 'Spawn monsters',
        type: 'boolean',
      },
      {
        key: 'spawn-animals',
        label: 'Spawn animals',
        type: 'boolean',
      },
      {
        key: 'spawn-npcs',
        label: 'Spawn NPCs',
        type: 'boolean',
      },
    ],
  },
  {
    id: 'world',
    title: 'Mundo',
    properties: [
      {
        key: 'level-name',
        label: 'Level name',
        type: 'text',
        placeholder: 'world',
      },
      {
        key: 'level-seed',
        label: 'Level seed',
        type: 'text',
        placeholder: '',
      },
      {
        key: 'level-type',
        label: 'Level type',
        type: 'select',
        options: [
          { value: 'minecraft:normal', label: 'Normal' },
          { value: 'minecraft:flat', label: 'Flat' },
          { value: 'minecraft:large_biomes', label: 'Large biomes' },
          { value: 'minecraft:amplified', label: 'Amplified' },
          { value: 'default', label: 'Default (legacy)' },
          { value: 'flat', label: 'Flat (legacy)' },
          { value: 'largeBiomes', label: 'Large biomes (legacy)' },
          { value: 'amplified', label: 'Amplified (legacy)' },
        ],
      },
      {
        key: 'allow-nether',
        label: 'Allow Nether',
        type: 'boolean',
      },
      {
        key: 'generate-structures',
        label: 'Generate structures',
        type: 'boolean',
      },
      {
        key: 'spawn-protection',
        label: 'Spawn protection',
        type: 'number',
        placeholder: '16',
      },
      {
        key: 'max-world-size',
        label: 'Max world size',
        type: 'number',
      },
    ],
  },
  {
    id: 'performance',
    title: 'Performance',
    properties: [
      {
        key: 'view-distance',
        label: 'View distance',
        type: 'number',
        placeholder: '10',
      },
      {
        key: 'simulation-distance',
        label: 'Simulation distance',
        type: 'number',
        placeholder: '10',
      },
      {
        key: 'entity-broadcast-range-percentage',
        label: 'Entity broadcast range %',
        type: 'number',
        placeholder: '100',
      },
      {
        key: 'max-tick-time',
        label: 'Max tick time',
        type: 'number',
      },
      {
        key: 'network-compression-threshold',
        label: 'Network compression threshold',
        type: 'number',
      },
    ],
  },
  {
    id: 'network',
    title: 'Rede / Avançado',
    properties: [
      {
        key: 'server-port',
        label: 'Server port',
        help: 'Geralmente gerenciado pelo Pterodactyl — altere com cuidado.',
        type: 'number',
        readonly: true,
      },
      {
        key: 'server-ip',
        label: 'Server IP',
        type: 'text',
        readonly: true,
      },
      {
        key: 'enable-query',
        label: 'Enable query',
        type: 'boolean',
      },
      {
        key: 'enable-rcon',
        label: 'Enable RCON',
        type: 'boolean',
      },
      {
        key: 'resource-pack',
        label: 'Resource pack URL',
        type: 'text',
      },
      {
        key: 'resource-pack-sha1',
        label: 'Resource pack SHA1',
        type: 'text',
      },
      {
        key: 'require-resource-pack',
        label: 'Require resource pack',
        type: 'boolean',
      },
      {
        key: 'player-idle-timeout',
        label: 'Player idle timeout',
        type: 'number',
      },
      {
        key: 'op-permission-level',
        label: 'OP permission level',
        type: 'select',
        options: [
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
        ],
      },
    ],
  },
];

export const boolValue = (value: string | undefined): boolean => {
  return String(value ?? '').toLowerCase() === 'true';
};

export const toBoolString = (checked: boolean): string => (checked ? 'true' : 'false');
