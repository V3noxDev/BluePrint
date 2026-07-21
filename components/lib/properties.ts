/**
 * MC Hub — parser & schema for `server.properties`.
 *
 * The Minecraft file is a plain Java properties file. We parse each line into
 * an entry preserving order + comments so we can round-trip changes without
 * losing the user's formatting. The schema below powers the GUI with typed
 * inputs, grouping, and per-key documentation.
 */

export type PropertyType =
  | { kind: 'boolean' }
  | { kind: 'int'; min?: number; max?: number }
  | { kind: 'string'; placeholder?: string }
  | { kind: 'enum'; options: string[] };

export interface PropertyDef {
  key: string;
  label: string;
  group: 'world' | 'gameplay' | 'network' | 'rcon' | 'performance' | 'misc';
  description?: string;
  type: PropertyType;
  default?: string;
}

export const PROPERTY_SCHEMA: PropertyDef[] = [
  // World
  { key: 'level-name',           label: 'World folder',        group: 'world',       description: 'Directory name used for the primary world.', type: { kind: 'string', placeholder: 'world' } },
  { key: 'level-seed',           label: 'World seed',          group: 'world',       description: 'Seed used to generate the world (blank = random).', type: { kind: 'string', placeholder: '' } },
  { key: 'level-type',           label: 'World type',          group: 'world',       type: { kind: 'enum', options: ['minecraft:normal','minecraft:flat','minecraft:large_biomes','minecraft:amplified','minecraft:single_biome_surface'] } },
  { key: 'generator-settings',   label: 'Generator settings',  group: 'world',       description: 'JSON options passed to the world generator.', type: { kind: 'string' } },
  { key: 'generate-structures',  label: 'Generate structures', group: 'world',       type: { kind: 'boolean' } },
  { key: 'max-world-size',       label: 'Max world size',      group: 'world',       description: 'World border radius (blocks).', type: { kind: 'int', min: 1, max: 29999984 } },
  { key: 'view-distance',        label: 'View distance',       group: 'world',       description: 'Chunks visible to players.', type: { kind: 'int', min: 3, max: 32 } },
  { key: 'simulation-distance',  label: 'Simulation distance', group: 'world',       description: 'Chunks that get ticked around each player.', type: { kind: 'int', min: 3, max: 32 } },

  // Gameplay
  { key: 'gamemode',             label: 'Default gamemode',    group: 'gameplay',    type: { kind: 'enum', options: ['survival','creative','adventure','spectator'] } },
  { key: 'force-gamemode',       label: 'Force gamemode',      group: 'gameplay',    description: 'Set players to the default gamemode every login.', type: { kind: 'boolean' } },
  { key: 'difficulty',           label: 'Difficulty',          group: 'gameplay',    type: { kind: 'enum', options: ['peaceful','easy','normal','hard'] } },
  { key: 'hardcore',             label: 'Hardcore',            group: 'gameplay',    type: { kind: 'boolean' } },
  { key: 'pvp',                  label: 'PvP',                 group: 'gameplay',    type: { kind: 'boolean' } },
  { key: 'allow-flight',         label: 'Allow flight',        group: 'gameplay',    description: 'Allow players in survival to keep flight-mode plugins working.', type: { kind: 'boolean' } },
  { key: 'allow-nether',         label: 'Allow the Nether',    group: 'gameplay',    type: { kind: 'boolean' } },
  { key: 'spawn-monsters',       label: 'Spawn monsters',      group: 'gameplay',    type: { kind: 'boolean' } },
  { key: 'spawn-animals',        label: 'Spawn animals',       group: 'gameplay',    type: { kind: 'boolean' } },
  { key: 'spawn-npcs',           label: 'Spawn NPCs',          group: 'gameplay',    type: { kind: 'boolean' } },
  { key: 'spawn-protection',     label: 'Spawn protection',    group: 'gameplay',    description: 'Radius, in blocks, around spawn that only OPs can modify.', type: { kind: 'int', min: 0, max: 16384 } },
  { key: 'op-permission-level',  label: 'Op permission level', group: 'gameplay',    type: { kind: 'enum', options: ['1','2','3','4'] } },
  { key: 'function-permission-level', label: 'Function perm level', group: 'gameplay', type: { kind: 'enum', options: ['1','2','3','4'] } },
  { key: 'player-idle-timeout',  label: 'Player idle timeout', group: 'gameplay',    description: 'Minutes before an idle player is kicked (0 disables).', type: { kind: 'int', min: 0, max: 1440 } },

  // Network
  { key: 'motd',                 label: 'MOTD',                group: 'network',     description: 'Message shown in the multiplayer server list.', type: { kind: 'string' } },
  { key: 'server-port',          label: 'Server port',         group: 'network',     type: { kind: 'int', min: 1, max: 65535 } },
  { key: 'server-ip',            label: 'Server IP',           group: 'network',     description: 'Leave blank to bind on all interfaces.', type: { kind: 'string' } },
  { key: 'max-players',          label: 'Max players',         group: 'network',     type: { kind: 'int', min: 1, max: 2147483647 } },
  { key: 'online-mode',          label: 'Online mode',         group: 'network',     description: 'Verify players against Mojang session servers.', type: { kind: 'boolean' } },
  { key: 'white-list',           label: 'Whitelist enabled',   group: 'network',     type: { kind: 'boolean' } },
  { key: 'enforce-whitelist',    label: 'Enforce whitelist',   group: 'network',     type: { kind: 'boolean' } },
  { key: 'enable-query',         label: 'Enable query',        group: 'network',     type: { kind: 'boolean' } },
  { key: 'query.port',           label: 'Query port',          group: 'network',     type: { kind: 'int', min: 1, max: 65535 } },
  { key: 'network-compression-threshold', label: 'Compression threshold', group: 'network', description: 'Packet size (bytes) above which compression kicks in. -1 disables.', type: { kind: 'int', min: -1, max: 65535 } },
  { key: 'prevent-proxy-connections', label: 'Prevent proxy connections', group: 'network', type: { kind: 'boolean' } },

  // RCON
  { key: 'enable-rcon',          label: 'Enable RCON',         group: 'rcon',        type: { kind: 'boolean' } },
  { key: 'rcon.port',            label: 'RCON port',           group: 'rcon',        type: { kind: 'int', min: 1, max: 65535 } },
  { key: 'rcon.password',        label: 'RCON password',       group: 'rcon',        type: { kind: 'string' } },
  { key: 'broadcast-rcon-to-ops',label: 'Broadcast RCON to OPs', group: 'rcon',      type: { kind: 'boolean' } },
  { key: 'broadcast-console-to-ops', label: 'Broadcast console to OPs', group: 'rcon', type: { kind: 'boolean' } },

  // Performance
  { key: 'entity-broadcast-range-percentage', label: 'Entity broadcast range %', group: 'performance', description: 'Percentage of vanilla range used to send entity updates. Lower = less bandwidth.', type: { kind: 'int', min: 10, max: 500 } },
  { key: 'max-tick-time',        label: 'Max tick time',       group: 'performance', description: 'Milliseconds a single tick can hang before the server watchdog aborts.', type: { kind: 'int', min: 1000, max: 600000 } },
  { key: 'sync-chunk-writes',    label: 'Sync chunk writes',   group: 'performance', type: { kind: 'boolean' } },
  { key: 'use-native-transport', label: 'Use native transport',group: 'performance', description: 'Linux epoll transport for the network stack.', type: { kind: 'boolean' } },

  // Misc
  { key: 'enable-command-block', label: 'Enable command blocks', group: 'misc',      type: { kind: 'boolean' } },
  { key: 'enable-jmx-monitoring',label: 'Enable JMX monitoring', group: 'misc',      type: { kind: 'boolean' } },
  { key: 'enable-status',        label: 'Enable server list ping', group: 'misc',    type: { kind: 'boolean' } },
  { key: 'hide-online-players',  label: 'Hide online players', group: 'misc',        type: { kind: 'boolean' } },
  { key: 'require-resource-pack',label: 'Require resource pack', group: 'misc',      type: { kind: 'boolean' } },
  { key: 'resource-pack',        label: 'Resource pack URL',   group: 'misc',        type: { kind: 'string' } },
  { key: 'resource-pack-sha1',   label: 'Resource pack SHA1',  group: 'misc',        type: { kind: 'string' } },
  { key: 'resource-pack-prompt', label: 'Resource pack prompt',group: 'misc',        type: { kind: 'string' } },
  { key: 'text-filtering-config',label: 'Text filtering config', group: 'misc',      type: { kind: 'string' } },
];

export const GROUP_LABEL: Record<PropertyDef['group'], string> = {
  world: 'World',
  gameplay: 'Gameplay',
  network: 'Network',
  rcon: 'RCON',
  performance: 'Performance',
  misc: 'Miscellaneous',
};

/** A single parsed line from server.properties. */
export type PropertyLine =
  | { kind: 'kv'; key: string; value: string }
  | { kind: 'comment'; raw: string }
  | { kind: 'blank' };

/**
 * Parse a `server.properties` file. Preserves comments and blank lines so
 * we can serialize back without touching untouched lines. Unknown keys are
 * still round-tripped and shown in the "Miscellaneous" group.
 */
export function parseProperties(input: string): PropertyLine[] {
  return input.split(/\r?\n/).map<PropertyLine>((line) => {
    if (line.trim() === '') return { kind: 'blank' };
    if (line.trimStart().startsWith('#')) return { kind: 'comment', raw: line };
    const eq = line.indexOf('=');
    if (eq === -1) return { kind: 'comment', raw: line };
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1);
    return { kind: 'kv', key, value };
  });
}

/** Serialize back to `server.properties` format (Java-properties style). */
export function serializeProperties(lines: PropertyLine[]): string {
  return lines
    .map((l) => {
      if (l.kind === 'kv') return `${l.key}=${l.value}`;
      if (l.kind === 'comment') return l.raw;
      return '';
    })
    .join('\n');
}

/** Build a map of key -> value for the UI to bind to. */
export function toMap(lines: PropertyLine[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const l of lines) if (l.kind === 'kv') map[l.key] = l.value;
  return map;
}

/** Apply the map back onto the parsed lines, preserving comments/order. */
export function applyMap(
  lines: PropertyLine[],
  map: Record<string, string>,
): PropertyLine[] {
  const seen = new Set<string>();
  const patched = lines.map<PropertyLine>((l) => {
    if (l.kind === 'kv' && Object.prototype.hasOwnProperty.call(map, l.key)) {
      seen.add(l.key);
      return { kind: 'kv', key: l.key, value: map[l.key] };
    }
    return l;
  });
  // Add any keys the user set that weren't in the file yet.
  for (const [k, v] of Object.entries(map)) {
    if (!seen.has(k)) patched.push({ kind: 'kv', key: k, value: v });
  }
  return patched;
}
