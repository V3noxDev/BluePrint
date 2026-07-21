import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ServerContext } from '@/state/server';
import http from '@/api/http';
import tw from 'twin.macro';
import styled, { keyframes } from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSave,
    faUndo,
    faSearch,
    faSpinner,
    faCheck,
    faExclamationTriangle,
    faSlidersH,
    faCode,
    faRedo,
    faServer,
} from '@fortawesome/free-solid-svg-icons';

/* -------------------------------------------------------------------------- */
/*  Property schema                                                            */
/* -------------------------------------------------------------------------- */

type FieldType = 'boolean' | 'number' | 'string' | 'select' | 'password';

interface SelectOption {
    value: string;
    label: string;
}

interface Field {
    key: string;
    label: string;
    description?: string;
    type: FieldType;
    options?: SelectOption[];
    placeholder?: string;
    default: string;
}

interface Category {
    id: string;
    title: string;
    icon: string;
    fields: Field[];
}

const GAMEMODES: SelectOption[] = [
    { value: 'survival', label: 'Survival' },
    { value: 'creative', label: 'Creative' },
    { value: 'adventure', label: 'Adventure' },
    { value: 'spectator', label: 'Spectator' },
];

const DIFFICULTIES: SelectOption[] = [
    { value: 'peaceful', label: 'Peaceful' },
    { value: 'easy', label: 'Easy' },
    { value: 'normal', label: 'Normal' },
    { value: 'hard', label: 'Hard' },
];

const LEVEL_TYPES: SelectOption[] = [
    { value: 'minecraft:normal', label: 'Normal' },
    { value: 'minecraft:flat', label: 'Flat / Superflat' },
    { value: 'minecraft:large_biomes', label: 'Large Biomes' },
    { value: 'minecraft:amplified', label: 'Amplified' },
    { value: 'minecraft:single_biome_surface', label: 'Single Biome' },
];

const PERMISSION_LEVELS: SelectOption[] = [
    { value: '0', label: '0 - None' },
    { value: '1', label: '1 - Bypass spawn protection' },
    { value: '2', label: '2 - Commands & command blocks' },
    { value: '3', label: '3 - Multiplayer management' },
    { value: '4', label: '4 - Full server operator' },
];

const SCHEMA: Category[] = [
    {
        id: 'general',
        title: 'General',
        icon: '🎮',
        fields: [
            { key: 'motd', label: 'MOTD', description: 'Message shown in the server list.', type: 'string', placeholder: 'A Minecraft Server', default: 'A Minecraft Server' },
            { key: 'server-port', label: 'Server Port', description: 'Port the server listens on.', type: 'number', default: '25565' },
            { key: 'max-players', label: 'Max Players', description: 'Maximum simultaneous players.', type: 'number', default: '20' },
            { key: 'gamemode', label: 'Default Gamemode', type: 'select', options: GAMEMODES, default: 'survival' },
            { key: 'force-gamemode', label: 'Force Gamemode', description: 'Reset players to the default gamemode on join.', type: 'boolean', default: 'false' },
            { key: 'difficulty', label: 'Difficulty', type: 'select', options: DIFFICULTIES, default: 'easy' },
            { key: 'hardcore', label: 'Hardcore', description: 'Players are banned on death.', type: 'boolean', default: 'false' },
            { key: 'pvp', label: 'PvP', description: 'Allow players to damage each other.', type: 'boolean', default: 'true' },
            { key: 'online-mode', label: 'Online Mode', description: 'Verify players against Mojang auth servers.', type: 'boolean', default: 'true' },
            { key: 'white-list', label: 'Whitelist', description: 'Only allow whitelisted players.', type: 'boolean', default: 'false' },
            { key: 'enforce-whitelist', label: 'Enforce Whitelist', description: 'Kick non-whitelisted players when the whitelist reloads.', type: 'boolean', default: 'false' },
        ],
    },
    {
        id: 'world',
        title: 'World & Generation',
        icon: '🌍',
        fields: [
            { key: 'level-name', label: 'Level Name', description: 'World folder name.', type: 'string', placeholder: 'world', default: 'world' },
            { key: 'level-seed', label: 'Level Seed', description: 'Seed for world generation (leave blank for random).', type: 'string', placeholder: 'Leave blank for random', default: '' },
            { key: 'level-type', label: 'Level Type', type: 'select', options: LEVEL_TYPES, default: 'minecraft:normal' },
            { key: 'generator-settings', label: 'Generator Settings', description: 'JSON settings for custom generation.', type: 'string', placeholder: '{}', default: '{}' },
            { key: 'generate-structures', label: 'Generate Structures', description: 'Generate villages, temples, etc.', type: 'boolean', default: 'true' },
            { key: 'max-world-size', label: 'Max World Size', description: 'World border radius in blocks.', type: 'number', default: '29999984' },
            { key: 'spawn-protection', label: 'Spawn Protection', description: 'Radius (blocks) that only ops can edit.', type: 'number', default: '16' },
            { key: 'allow-nether', label: 'Allow Nether', type: 'boolean', default: 'true' },
        ],
    },
    {
        id: 'spawning',
        title: 'Players & Spawning',
        icon: '👾',
        fields: [
            { key: 'spawn-monsters', label: 'Spawn Monsters', type: 'boolean', default: 'true' },
            { key: 'spawn-animals', label: 'Spawn Animals', type: 'boolean', default: 'true' },
            { key: 'spawn-npcs', label: 'Spawn NPCs (Villagers)', type: 'boolean', default: 'true' },
            { key: 'allow-flight', label: 'Allow Flight', description: 'Prevents "flying is not enabled" kicks (needed for some plugins).', type: 'boolean', default: 'false' },
            { key: 'player-idle-timeout', label: 'Idle Timeout', description: 'Minutes before idle players are kicked (0 = never).', type: 'number', default: '0' },
        ],
    },
    {
        id: 'performance',
        title: 'Performance',
        icon: '⚡',
        fields: [
            { key: 'view-distance', label: 'View Distance', description: 'Chunk render distance sent to clients.', type: 'number', default: '10' },
            { key: 'simulation-distance', label: 'Simulation Distance', description: 'Chunk distance that entities/ticks are simulated.', type: 'number', default: '10' },
            { key: 'max-tick-time', label: 'Max Tick Time', description: 'Watchdog timeout in ms (-1 to disable).', type: 'number', default: '60000' },
            { key: 'network-compression-threshold', label: 'Compression Threshold', description: 'Packet size to compress (-1 disables).', type: 'number', default: '256' },
            { key: 'entity-broadcast-range-percentage', label: 'Entity Broadcast Range', description: 'Percentage of default entity view range.', type: 'number', default: '100' },
            { key: 'sync-chunk-writes', label: 'Sync Chunk Writes', type: 'boolean', default: 'true' },
            { key: 'use-native-transport', label: 'Use Native Transport', description: 'Linux packet send/receive optimizations.', type: 'boolean', default: 'true' },
            { key: 'max-chained-neighbor-updates', label: 'Max Chained Updates', description: 'Limit for consecutive neighbor updates.', type: 'number', default: '1000000' },
        ],
    },
    {
        id: 'commands',
        title: 'Commands & RCON',
        icon: '🛠️',
        fields: [
            { key: 'enable-command-block', label: 'Enable Command Blocks', type: 'boolean', default: 'false' },
            { key: 'op-permission-level', label: 'Op Permission Level', type: 'select', options: PERMISSION_LEVELS, default: '4' },
            { key: 'function-permission-level', label: 'Function Permission Level', type: 'select', options: PERMISSION_LEVELS, default: '2' },
            { key: 'broadcast-console-to-ops', label: 'Broadcast Console To Ops', type: 'boolean', default: 'true' },
            { key: 'broadcast-rcon-to-ops', label: 'Broadcast RCON To Ops', type: 'boolean', default: 'true' },
            { key: 'enable-rcon', label: 'Enable RCON', description: 'Remote console access.', type: 'boolean', default: 'false' },
            { key: 'rcon.port', label: 'RCON Port', type: 'number', default: '25575' },
            { key: 'rcon.password', label: 'RCON Password', type: 'password', placeholder: 'Set a strong password', default: '' },
        ],
    },
    {
        id: 'network',
        title: 'Query & Network',
        icon: '🌐',
        fields: [
            { key: 'server-ip', label: 'Server IP', description: 'Bind to a specific IP (leave blank for all).', type: 'string', placeholder: 'Leave blank for all interfaces', default: '' },
            { key: 'enable-query', label: 'Enable Query', description: 'GameSpy4 query protocol.', type: 'boolean', default: 'false' },
            { key: 'query.port', label: 'Query Port', type: 'number', default: '25565' },
            { key: 'prevent-proxy-connections', label: 'Prevent Proxy Connections', type: 'boolean', default: 'false' },
            { key: 'rate-limit', label: 'Rate Limit', description: 'Max packets/sec per player before kick (0 = disabled).', type: 'number', default: '0' },
            { key: 'enable-status', label: 'Enable Status', description: 'Show server as online in the list.', type: 'boolean', default: 'true' },
            { key: 'hide-online-players', label: 'Hide Online Players', type: 'boolean', default: 'false' },
        ],
    },
    {
        id: 'misc',
        title: 'Resource Pack & Security',
        icon: '🔒',
        fields: [
            { key: 'resource-pack', label: 'Resource Pack URL', type: 'string', placeholder: 'https://...', default: '' },
            { key: 'resource-pack-prompt', label: 'Resource Pack Prompt', type: 'string', placeholder: 'Optional message', default: '' },
            { key: 'resource-pack-sha1', label: 'Resource Pack SHA-1', type: 'string', placeholder: 'Optional hash', default: '' },
            { key: 'require-resource-pack', label: 'Require Resource Pack', type: 'boolean', default: 'false' },
            { key: 'enforce-secure-profile', label: 'Enforce Secure Profile', description: 'Require signed chat (Mojang keys).', type: 'boolean', default: 'true' },
            { key: 'log-ips', label: 'Log IPs', type: 'boolean', default: 'true' },
        ],
    },
];

const KNOWN_KEYS = new Set(SCHEMA.flatMap(c => c.fields.map(f => f.key)));
const FIELD_MAP: Record<string, Field> = Object.fromEntries(SCHEMA.flatMap(c => c.fields.map(f => [f.key, f])));
const DEFAULTS: Record<string, string> = Object.fromEntries(SCHEMA.flatMap(c => c.fields.map(f => [f.key, f.default])));

/* -------------------------------------------------------------------------- */
/*  Parsing / serialization                                                    */
/* -------------------------------------------------------------------------- */

interface ParseResult {
    lines: string[];
    values: Record<string, string>;
    present: Set<string>;
    extras: string[];
}

function parse(content: string): ParseResult {
    const lines = content.replace(/\r\n/g, '\n').split('\n');
    const values: Record<string, string> = { ...DEFAULTS };
    const present = new Set<string>();
    const extras: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = line.indexOf('=');
        if (eq === -1) continue;
        const key = line.slice(0, eq).trim();
        const value = line.slice(eq + 1);
        values[key] = value;
        present.add(key);
        if (!KNOWN_KEYS.has(key)) extras.push(key);
    }

    return { lines, values, present, extras };
}

function serialize(lines: string[], values: Record<string, string>, present: Set<string>): string {
    const written = new Set<string>();
    const output = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        const eq = line.indexOf('=');
        if (eq === -1) return line;
        const key = line.slice(0, eq).trim();
        if (key in values) {
            written.add(key);
            return `${key}=${values[key]}`;
        }
        return line;
    });

    // Append keys the user changed that were not originally present in the file.
    for (const key of Object.keys(values)) {
        if (written.has(key) || present.has(key)) continue;
        if (values[key] !== (DEFAULTS[key] ?? '')) {
            output.push(`${key}=${values[key]}`);
        }
    }

    return output.join('\n');
}

/* -------------------------------------------------------------------------- */
/*  Styled components                                                          */
/* -------------------------------------------------------------------------- */

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
`;

const Page = styled.div`
    ${tw`min-h-screen text-neutral-200`};
    background: radial-gradient(1200px 600px at 20% -10%, rgba(34, 197, 94, 0.10), transparent),
        radial-gradient(900px 500px at 100% 0%, rgba(16, 185, 129, 0.08), transparent), #0f1016;
`;

const Panel = styled.div`
    ${tw`rounded-2xl p-6 mb-6`};
    background: rgba(30, 41, 59, 0.4);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 10px 30px -12px rgba(0, 0, 0, 0.5);
    animation: ${fadeIn} 0.4s ease;
`;

const CategoryCard = styled.div`
    ${tw`rounded-2xl p-6 mb-6`};
    background: rgba(23, 31, 46, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.06);
    animation: ${fadeIn} 0.4s ease;
`;

const Row = styled.div`
    ${tw`flex items-center justify-between gap-4 py-3`};
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    &:last-child { border-bottom: none; }
`;

const TextInput = styled.input`
    ${tw`bg-neutral-900 border border-neutral-700 text-neutral-100 text-sm rounded-lg px-3 py-2 outline-none transition-all w-64 max-w-full`};
    background-color: rgba(15, 23, 42, 0.6);
    &:focus { border-color: rgb(34, 197, 94); box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2); }
`;

const Select = styled.select`
    ${tw`bg-neutral-900 border border-neutral-700 text-neutral-100 text-sm rounded-lg px-3 py-2 outline-none transition-all w-64 max-w-full cursor-pointer`};
    background-color: rgba(15, 23, 42, 0.6);
    &:focus { border-color: rgb(34, 197, 94); box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2); }
`;

const Toggle = styled.button<{ on: boolean }>`
    ${tw`relative inline-flex items-center rounded-full transition-colors duration-200`};
    width: 46px;
    height: 26px;
    background: ${props => (props.on ? 'rgb(34, 197, 94)' : 'rgba(75, 85, 99, 0.6)')};
    flex-shrink: 0;
    &::after {
        content: '';
        ${tw`absolute rounded-full bg-white transition-all duration-200`};
        width: 20px;
        height: 20px;
        top: 3px;
        left: ${props => (props.on ? '23px' : '3px')};
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    }
`;

const Tab = styled.button<{ active: boolean }>`
    ${tw`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2`};
    background: ${props => (props.active ? 'rgb(34, 197, 94)' : 'rgba(30, 41, 59, 0.5)')};
    color: ${props => (props.active ? '#03130a' : 'rgb(156, 163, 175)')};
    border: 1px solid ${props => (props.active ? 'rgb(34, 197, 94)' : 'rgba(255, 255, 255, 0.06)')};
    &:hover { color: ${props => (props.active ? '#03130a' : 'white')}; }
`;

const PrimaryButton = styled.button`
    ${tw`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all`};
    background: linear-gradient(135deg, rgb(34, 197, 94), rgb(16, 185, 129));
    color: #03130a;
    &:hover { filter: brightness(1.08); transform: translateY(-1px); }
    &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
`;

const GhostButton = styled.button`
    ${tw`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all`};
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgb(203, 213, 225);
    &:hover { background: rgba(51, 65, 85, 0.7); color: white; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const RawArea = styled.textarea`
    ${tw`w-full rounded-xl p-4 text-sm outline-none`};
    background: rgba(9, 12, 20, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #a5f3c4;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    min-height: 480px;
    resize: vertical;
    &:focus { border-color: rgb(34, 197, 94); }
`;

/* -------------------------------------------------------------------------- */
/*  Component                                                                   */
/* -------------------------------------------------------------------------- */

type Status = { type: 'idle' | 'success' | 'error'; message?: string };

export default () => {
    const uuid = ServerContext.useStoreState(state => state.server.data?.uuid);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [status, setStatus] = useState<Status>({ type: 'idle' });

    const [tab, setTab] = useState<'form' | 'raw'>('form');
    const [search, setSearch] = useState('');

    const [lines, setLines] = useState<string[]>([]);
    const [present, setPresent] = useState<Set<string>>(new Set());
    const [extras, setExtras] = useState<string[]>([]);
    const [values, setValues] = useState<Record<string, string>>({ ...DEFAULTS });
    const [savedValues, setSavedValues] = useState<Record<string, string>>({ ...DEFAULTS });
    const [rawDraft, setRawDraft] = useState('');

    const applyParse = useCallback((content: string) => {
        const result = parse(content);
        setLines(result.lines);
        setPresent(result.present);
        setExtras(result.extras);
        setValues(result.values);
        setSavedValues(result.values);
    }, []);

    const load = useCallback(async () => {
        if (!uuid) return;
        setLoading(true);
        setLoadError(null);
        try {
            const { data } = await http.post('/extensions/mcproperties/read', { serverUuid: uuid });
            if (!data.success) {
                setLoadError(data.message || 'Failed to read server.properties.');
            } else {
                applyParse(data.content || '');
            }
        } catch (e: any) {
            setLoadError(e?.response?.data?.message || 'Failed to read server.properties.');
        } finally {
            setLoading(false);
        }
    }, [uuid, applyParse]);

    useEffect(() => {
        load();
    }, [load]);

    const dirty = useMemo(
        () => JSON.stringify(values) !== JSON.stringify(savedValues),
        [values, savedValues],
    );

    const setValue = (key: string, value: string) => {
        setValues(prev => ({ ...prev, [key]: value }));
        setStatus({ type: 'idle' });
    };

    const switchTab = (next: 'form' | 'raw') => {
        if (next === tab) return;
        if (next === 'raw') {
            setRawDraft(serialize(lines, values, present));
        } else {
            // Re-parse the raw draft back into the structured editor.
            applyParseKeepSaved(rawDraft);
        }
        setTab(next);
    };

    // Re-parse but keep the "savedValues" baseline so the dirty flag stays meaningful.
    const applyParseKeepSaved = (content: string) => {
        const result = parse(content);
        setLines(result.lines);
        setPresent(result.present);
        setExtras(result.extras);
        setValues(result.values);
    };

    const save = async () => {
        if (!uuid) return;
        setSaving(true);
        setStatus({ type: 'idle' });
        const content = tab === 'raw' ? rawDraft : serialize(lines, values, present);
        try {
            const { data } = await http.post('/extensions/mcproperties/write', {
                serverUuid: uuid,
                content,
            });
            if (!data.success) {
                setStatus({ type: 'error', message: data.message || 'Failed to save.' });
            } else {
                // Refresh internal state from what we just wrote.
                applyParse(content);
                if (tab === 'raw') setRawDraft(content);
                setStatus({ type: 'success', message: 'Saved! Restart the server to apply changes.' });
            }
        } catch (e: any) {
            setStatus({ type: 'error', message: e?.response?.data?.message || 'Failed to save.' });
        } finally {
            setSaving(false);
        }
    };

    const reset = () => {
        setValues({ ...savedValues });
        setStatus({ type: 'idle' });
    };

    const filteredSchema = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return SCHEMA;
        return SCHEMA.map(cat => ({
            ...cat,
            fields: cat.fields.filter(
                f =>
                    f.key.toLowerCase().includes(q) ||
                    f.label.toLowerCase().includes(q) ||
                    (f.description || '').toLowerCase().includes(q),
            ),
        })).filter(cat => cat.fields.length > 0);
    }, [search]);

    const renderField = (field: Field) => {
        const value = values[field.key] ?? field.default;
        switch (field.type) {
            case 'boolean': {
                const on = value === 'true';
                return <Toggle on={on} onClick={() => setValue(field.key, on ? 'false' : 'true')} aria-label={field.label} />;
            }
            case 'select':
                return (
                    <Select value={value} onChange={e => setValue(field.key, e.target.value)}>
                        {field.options?.map(o => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </Select>
                );
            case 'number':
                return (
                    <TextInput
                        type="number"
                        value={value}
                        placeholder={field.placeholder}
                        onChange={e => setValue(field.key, e.target.value)}
                    />
                );
            case 'password':
                return (
                    <TextInput
                        type="password"
                        value={value}
                        placeholder={field.placeholder}
                        onChange={e => setValue(field.key, e.target.value)}
                    />
                );
            default:
                return (
                    <TextInput
                        type="text"
                        value={value}
                        placeholder={field.placeholder}
                        onChange={e => setValue(field.key, e.target.value)}
                    />
                );
        }
    };

    return (
        <Page>
            <div className="max-w-6xl mx-auto p-4 md:p-8">
                {/* Header */}
                <Panel className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)', color: 'rgb(74,222,128)' }}>
                            <FontAwesomeIcon icon={faServer} className="text-2xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Server Properties</h1>
                            <p className="text-neutral-400 text-sm">Edit your Minecraft: Java Edition server.properties without touching a config file.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Tab active={tab === 'form'} onClick={() => switchTab('form')}>
                            <FontAwesomeIcon icon={faSlidersH} /> Editor
                        </Tab>
                        <Tab active={tab === 'raw'} onClick={() => switchTab('raw')}>
                            <FontAwesomeIcon icon={faCode} /> Raw
                        </Tab>
                    </div>
                </Panel>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                        <p className="text-neutral-400 text-sm">Loading server.properties…</p>
                    </div>
                ) : loadError ? (
                    <Panel className="text-center py-16">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-4xl text-amber-400 mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">Could not load server.properties</h3>
                        <p className="text-neutral-400 text-sm mb-6 max-w-lg mx-auto">{loadError}</p>
                        <GhostButton onClick={load} className="mx-auto">
                            <FontAwesomeIcon icon={faRedo} /> Try again
                        </GhostButton>
                    </Panel>
                ) : (
                    <>
                        {/* Toolbar */}
                        <Panel className="flex flex-col md:flex-row md:items-center gap-3 !py-4">
                            {tab === 'form' && (
                                <div className="relative flex-1">
                                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search properties…"
                                        className="w-full bg-neutral-900/60 border border-neutral-700 text-neutral-100 text-sm rounded-xl pl-10 pr-3 py-2.5 outline-none focus:border-green-500"
                                    />
                                </div>
                            )}
                            <div className="flex items-center gap-2 md:ml-auto">
                                {status.type === 'success' && (
                                    <span className="text-green-400 text-sm flex items-center gap-2 mr-1">
                                        <FontAwesomeIcon icon={faCheck} /> {status.message}
                                    </span>
                                )}
                                {status.type === 'error' && (
                                    <span className="text-red-400 text-sm flex items-center gap-2 mr-1">
                                        <FontAwesomeIcon icon={faExclamationTriangle} /> {status.message}
                                    </span>
                                )}
                                {tab === 'form' && (
                                    <GhostButton onClick={reset} disabled={!dirty || saving}>
                                        <FontAwesomeIcon icon={faUndo} /> Reset
                                    </GhostButton>
                                )}
                                <PrimaryButton onClick={save} disabled={saving || (tab === 'form' && !dirty)}>
                                    <FontAwesomeIcon icon={saving ? faSpinner : faSave} spin={saving} />
                                    {saving ? 'Saving…' : 'Save Changes'}
                                </PrimaryButton>
                            </div>
                        </Panel>

                        {tab === 'form' ? (
                            <>
                                {filteredSchema.map(cat => (
                                    <CategoryCard key={cat.id}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-xl">{cat.icon}</span>
                                            <h2 className="text-lg font-semibold text-white">{cat.title}</h2>
                                        </div>
                                        {cat.fields.map(field => (
                                            <Row key={field.key}>
                                                <div className="min-w-0 pr-2">
                                                    <div className="text-sm font-medium text-neutral-100">{field.label}</div>
                                                    {field.description && (
                                                        <div className="text-xs text-neutral-500 mt-0.5">{field.description}</div>
                                                    )}
                                                    <code className="text-[10px] text-neutral-600">{field.key}</code>
                                                </div>
                                                <div className="flex-shrink-0">{renderField(field)}</div>
                                            </Row>
                                        ))}
                                    </CategoryCard>
                                ))}

                                {extras.length > 0 && !search && (
                                    <CategoryCard>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-xl">🧩</span>
                                            <h2 className="text-lg font-semibold text-white">Other Properties</h2>
                                        </div>
                                        <p className="text-xs text-neutral-500 mb-2">
                                            Properties found in your file that aren’t part of vanilla Minecraft (e.g. added by plugins or mods).
                                        </p>
                                        {extras.map(key => (
                                            <Row key={key}>
                                                <div className="min-w-0 pr-2">
                                                    <code className="text-sm text-neutral-200">{key}</code>
                                                </div>
                                                <TextInput
                                                    type="text"
                                                    value={values[key] ?? ''}
                                                    onChange={e => setValue(key, e.target.value)}
                                                />
                                            </Row>
                                        ))}
                                    </CategoryCard>
                                )}

                                {filteredSchema.length === 0 && (
                                    <Panel className="text-center py-12 text-neutral-400 text-sm">
                                        No properties match “{search}”.
                                    </Panel>
                                )}
                            </>
                        ) : (
                            <Panel>
                                <p className="text-xs text-neutral-500 mb-3">
                                    Advanced mode — edit the raw file directly. Switching back to the editor will parse your changes.
                                </p>
                                <RawArea value={rawDraft} onChange={e => setRawDraft(e.target.value)} spellCheck={false} />
                            </Panel>
                        )}

                        <p className="text-center text-neutral-600 text-xs mt-2 mb-8">
                            Changes are written to <code>server.properties</code>. Restart the server for them to take effect.
                        </p>
                    </>
                )}
            </div>
        </Page>
    );
};
