/**
 * MC Hub — built-in addon catalog.
 *
 * A curated list of popular Minecraft: Java addons (plugins & mods) that the
 * auto-installer can drop straight into the server via Pterodactyl's
 * `POST /files/pull` endpoint. Each entry is a stable public download URL.
 *
 * Admins can extend this catalog through the admin panel (Custom catalog
 * JSON). The result is merged with the built-in list at runtime.
 *
 * NOTE: URLs prefer the "latest" endpoint whenever the project provides one
 * so entries stay valid across upstream releases.
 */

export type AddonCategory =
  | 'core'
  | 'economy'
  | 'worldmgmt'
  | 'admin'
  | 'fun'
  | 'protection'
  | 'performance';

export type AddonBranch = 'paper' | 'spigot' | 'purpur' | 'forge' | 'fabric' | 'neoforge';

export interface Addon {
  id: string;
  name: string;
  author?: string;
  category: AddonCategory;
  branches: AddonBranch[];
  filename: string;
  url: string;
  description: string;
  website?: string;
}

export const CATEGORIES: { id: AddonCategory; label: string; hint: string }[] = [
  { id: 'core',        label: 'Essentials',   hint: 'Must-have basics' },
  { id: 'economy',     label: 'Economy',      hint: 'Money & shops' },
  { id: 'worldmgmt',   label: 'World',        hint: 'Terrain, backups, editing' },
  { id: 'admin',       label: 'Admin',        hint: 'Moderation & permissions' },
  { id: 'fun',         label: 'Fun',          hint: 'Gameplay & minigames' },
  { id: 'protection',  label: 'Protection',   hint: 'Anti-grief & security' },
  { id: 'performance', label: 'Performance',  hint: 'Optimization' },
];

export const BUILTIN_CATALOG: Addon[] = [
  // ==== Essentials (Paper / Spigot) ====
  {
    id: 'essentialsx',
    name: 'EssentialsX',
    author: 'EssentialsX Team',
    category: 'core',
    branches: ['paper', 'spigot', 'purpur'],
    filename: 'EssentialsX.jar',
    url: 'https://ci.ender.zone/job/EssentialsX/lastSuccessfulBuild/artifact/jars/EssentialsX-2.20.1.jar',
    description: 'The definitive essentials plugin: /home, /warp, /tpa, kits, spawn, sign shops and 100+ commands.',
    website: 'https://essentialsx.net/',
  },
  {
    id: 'vault',
    name: 'Vault',
    author: 'MilkBowl',
    category: 'core',
    branches: ['paper', 'spigot', 'purpur'],
    filename: 'Vault.jar',
    url: 'https://github.com/MilkBowl/Vault/releases/latest/download/Vault.jar',
    description: 'Abstraction API that lets other plugins talk to any economy/permission plugin.',
    website: 'https://github.com/MilkBowl/Vault',
  },
  {
    id: 'placeholderapi',
    name: 'PlaceholderAPI',
    author: 'PlaceholderAPI',
    category: 'core',
    branches: ['paper', 'spigot', 'purpur'],
    filename: 'PlaceholderAPI.jar',
    url: 'https://github.com/PlaceholderAPI/PlaceholderAPI/releases/latest/download/PlaceholderAPI.jar',
    description: 'Adds placeholder support to any plugin. Required by hundreds of other addons.',
    website: 'https://github.com/PlaceholderAPI/PlaceholderAPI',
  },
  {
    id: 'protocollib',
    name: 'ProtocolLib',
    author: 'dmulloy2',
    category: 'core',
    branches: ['paper', 'spigot'],
    filename: 'ProtocolLib.jar',
    url: 'https://github.com/dmulloy2/ProtocolLib/releases/latest/download/ProtocolLib.jar',
    description: 'Low-level packet manipulation library required by many plugins.',
    website: 'https://github.com/dmulloy2/ProtocolLib',
  },

  // ==== Permissions / Admin ====
  {
    id: 'luckperms',
    name: 'LuckPerms',
    author: 'lucko',
    category: 'admin',
    branches: ['paper', 'spigot', 'purpur'],
    filename: 'LuckPerms.jar',
    url: 'https://download.luckperms.net/1571/bukkit/loader/LuckPerms-Bukkit-5.4.161.jar',
    description: 'The gold-standard permissions plugin. Web UI, contexts, tracks, and lightning-fast.',
    website: 'https://luckperms.net/',
  },
  {
    id: 'discordsrv',
    name: 'DiscordSRV',
    author: 'Scarsz',
    category: 'admin',
    branches: ['paper', 'spigot', 'purpur'],
    filename: 'DiscordSRV.jar',
    url: 'https://github.com/DiscordSRV/DiscordSRV/releases/latest/download/DiscordSRV.jar',
    description: 'Bridges in-game chat with your Discord server, plus role sync and rich embeds.',
    website: 'https://discordsrv.com/',
  },

  // ==== Economy ====
  {
    id: 'coinsengine',
    name: 'CoinsEngine',
    author: 'nightexpress',
    category: 'economy',
    branches: ['paper', 'spigot', 'purpur'],
    filename: 'CoinsEngine.jar',
    url: 'https://github.com/nightexpressdev/CoinsEngine/releases/latest/download/CoinsEngine.jar',
    description: 'Multi-currency economy plugin with per-world balances and vault integration.',
    website: 'https://github.com/nightexpressdev/CoinsEngine',
  },

  // ==== World management ====
  {
    id: 'worldedit',
    name: 'WorldEdit',
    author: 'EngineHub',
    category: 'worldmgmt',
    branches: ['paper', 'spigot', 'purpur', 'forge', 'fabric', 'neoforge'],
    filename: 'worldedit.jar',
    url: 'https://mediafilez.forgecdn.net/files/6089/47/worldedit-bukkit-7.3.14.jar',
    description: 'The most powerful in-game map editor: brushes, schematics, mass block ops.',
    website: 'https://enginehub.org/worldedit',
  },
  {
    id: 'worldguard',
    name: 'WorldGuard',
    author: 'EngineHub',
    category: 'protection',
    branches: ['paper', 'spigot', 'purpur'],
    filename: 'worldguard.jar',
    url: 'https://mediafilez.forgecdn.net/files/6006/232/worldguard-bukkit-7.0.13-dist.jar',
    description: 'Region protection, flag-based zoning and blacklist system for your world.',
    website: 'https://enginehub.org/worldguard',
  },
  {
    id: 'multiverse',
    name: 'Multiverse-Core',
    author: 'Multiverse',
    category: 'worldmgmt',
    branches: ['paper', 'spigot', 'purpur'],
    filename: 'Multiverse-Core.jar',
    url: 'https://dev.bukkit.org/projects/multiverse-core/files/latest',
    description: 'Host multiple worlds with different settings on a single Minecraft server.',
    website: 'https://dev.bukkit.org/projects/multiverse-core',
  },
  {
    id: 'coreprotect',
    name: 'CoreProtect',
    author: 'Intelli',
    category: 'protection',
    branches: ['paper', 'spigot', 'purpur'],
    filename: 'CoreProtect.jar',
    url: 'https://github.com/PlayPro/CoreProtect/releases/latest/download/CoreProtect.jar',
    description: 'Fast rollback / logging plugin. Restore griefed builds in seconds.',
    website: 'https://coreprotect.net/',
  },

  // ==== Protection & security ====
  {
    id: 'authme',
    name: 'AuthMeReloaded',
    author: 'AuthMe Team',
    category: 'protection',
    branches: ['paper', 'spigot', 'purpur'],
    filename: 'AuthMe.jar',
    url: 'https://github.com/AuthMe/AuthMeReloaded/releases/latest/download/AuthMe.jar',
    description: 'Offline-mode login/register system with encrypted passwords.',
    website: 'https://github.com/AuthMe/AuthMeReloaded',
  },

  // ==== Performance ====
  {
    id: 'spark',
    name: 'spark',
    author: 'lucko',
    category: 'performance',
    branches: ['paper', 'spigot', 'purpur', 'forge', 'fabric', 'neoforge'],
    filename: 'spark.jar',
    url: 'https://spark.lucko.me/download/stable',
    description: 'The go-to performance profiler for Minecraft. Flamegraphs, tick monitoring, GC stats.',
    website: 'https://spark.lucko.me/',
  },
  {
    id: 'chunky',
    name: 'Chunky',
    author: 'pop4959',
    category: 'performance',
    branches: ['paper', 'spigot', 'purpur', 'fabric', 'forge'],
    filename: 'Chunky.jar',
    url: 'https://github.com/pop4959/Chunky/releases/latest/download/Chunky.jar',
    description: 'Pre-generate chunks so your players never lag from world generation again.',
    website: 'https://github.com/pop4959/Chunky',
  },

  // ==== Fun / gameplay ====
  {
    id: 'mcmmo',
    name: 'mcMMO',
    author: 'nossr50',
    category: 'fun',
    branches: ['paper', 'spigot', 'purpur'],
    filename: 'mcMMO.jar',
    url: 'https://mcmmo.org/download/latest',
    description: 'The classic RPG skills plugin: mining, swords, herbalism, archery and more.',
    website: 'https://mcmmo.org/',
  },
  {
    id: 'citizens',
    name: 'Citizens',
    author: 'CitizensDev',
    category: 'fun',
    branches: ['paper', 'spigot', 'purpur'],
    filename: 'Citizens.jar',
    url: 'https://ci.citizensnpcs.co/job/Citizens2/lastSuccessfulBuild/artifact/dist/target/Citizens-2.0.36-b3813.jar',
    description: 'Persistent NPCs, shopkeepers, and scriptable characters.',
    website: 'https://www.spigotmc.org/resources/citizens.13811/',
  },

  // ==== Web maps ====
  {
    id: 'bluemap',
    name: 'BlueMap',
    author: 'Blue',
    category: 'worldmgmt',
    branches: ['paper', 'spigot', 'purpur', 'fabric', 'forge'],
    filename: 'BlueMap.jar',
    url: 'https://github.com/BlueMap-Minecraft/BlueMap/releases/latest/download/bluemap-3.20-paper.jar',
    description: 'Beautiful 3D web-map viewer for your world.',
    website: 'https://bluemap.bluecolored.de/',
  },
  {
    id: 'dynmap',
    name: 'Dynmap',
    author: 'webbukkit',
    category: 'worldmgmt',
    branches: ['paper', 'spigot', 'purpur'],
    filename: 'Dynmap.jar',
    url: 'https://github.com/webbukkit/dynmap/releases/latest/download/Dynmap-3.7-beta-9-spigot.jar',
    description: 'Classic 2D real-time web-map plugin with markers & regions overlay.',
    website: 'https://github.com/webbukkit/dynmap',
  },

  // ==== Fun (Purpur) ====
  {
    id: 'griefprevention',
    name: 'GriefPrevention',
    author: 'MrKloan',
    category: 'protection',
    branches: ['paper', 'spigot', 'purpur'],
    filename: 'GriefPrevention.jar',
    url: 'https://github.com/GriefPrevention/GriefPrevention/releases/latest/download/GriefPrevention.jar',
    description: 'Self-service land claims with a shovel. Zero-config anti-grief.',
    website: 'https://github.com/GriefPrevention/GriefPrevention',
  },

  // ==== Fabric / Forge examples ====
  {
    id: 'lithium',
    name: 'Lithium',
    author: 'CaffeineMC',
    category: 'performance',
    branches: ['fabric', 'neoforge'],
    filename: 'lithium.jar',
    url: 'https://cdn.modrinth.com/data/gvQqBUqZ/versions/wxU3XlHT/lithium-fabric-mc1.21.4-0.14.0.jar',
    description: 'General-purpose optimization mod that keeps parity with vanilla behavior.',
    website: 'https://modrinth.com/mod/lithium',
  },
  {
    id: 'ferritecore',
    name: 'FerriteCore',
    author: 'malte0811',
    category: 'performance',
    branches: ['fabric', 'forge', 'neoforge'],
    filename: 'ferritecore.jar',
    url: 'https://cdn.modrinth.com/data/uXXizFIs/versions/dK9zwXbi/ferritecore-8.0.0-fabric.jar',
    description: 'Reduces memory usage by de-duplicating blockstate data.',
    website: 'https://modrinth.com/mod/ferrite-core',
  },
  {
    id: 'krypton',
    name: 'Krypton',
    author: 'astei',
    category: 'performance',
    branches: ['fabric'],
    filename: 'krypton.jar',
    url: 'https://cdn.modrinth.com/data/fQEb0iXm/versions/oO2ihxTa/krypton-0.2.6.jar',
    description: 'Optimizes the Minecraft networking stack.',
    website: 'https://modrinth.com/mod/krypton',
  },
  {
    id: 'fabricapi',
    name: 'Fabric API',
    author: 'FabricMC',
    category: 'core',
    branches: ['fabric'],
    filename: 'fabric-api.jar',
    url: 'https://cdn.modrinth.com/data/P7dR8mSH/versions/pnbCcHZs/fabric-api-0.115.0%2B1.21.4.jar',
    description: 'Baseline API required by nearly every Fabric mod.',
    website: 'https://modrinth.com/mod/fabric-api',
  },
];

/** Merge the built-in catalog with admin-provided custom entries. */
export function mergeCatalog(extra: unknown): Addon[] {
  if (!Array.isArray(extra)) return BUILTIN_CATALOG;
  const valid: Addon[] = [];
  for (const item of extra) {
    if (
      item &&
      typeof item === 'object' &&
      typeof (item as any).id === 'string' &&
      typeof (item as any).name === 'string' &&
      typeof (item as any).url === 'string' &&
      typeof (item as any).filename === 'string'
    ) {
      valid.push({
        id: String((item as any).id),
        name: String((item as any).name),
        author: (item as any).author,
        category: ((item as any).category || 'core') as AddonCategory,
        branches: Array.isArray((item as any).branches)
          ? (item as any).branches
          : (item as any).branch
            ? [(item as any).branch as AddonBranch]
            : ['paper'],
        filename: String((item as any).filename),
        url: String((item as any).url),
        description: String((item as any).description ?? ''),
        website: (item as any).website,
      });
    }
  }
  const seen = new Set(BUILTIN_CATALOG.map(a => a.id));
  const extras = valid.filter(v => !seen.has(v.id));
  return [...BUILTIN_CATALOG, ...extras];
}
