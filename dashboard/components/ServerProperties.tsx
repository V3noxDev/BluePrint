import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { httpErrorToHuman } from '@/api/http';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import { ServerContext } from '@/state/server';

/*
 * Properties Editor — a Blueprint extension that renders a friendly, sectioned
 * editor for the Minecraft: Java Edition `server.properties` file.
 *
 * The component reads/writes the file through Pterodactyl's own client API
 * helpers so it respects the user's file permissions and the daemon.
 */

type FieldType = 'toggle' | 'select' | 'number' | 'text';

interface FieldDef {
    key: string;
    label: string;
    type: FieldType;
    help?: string;
    options?: { value: string; label: string }[];
    min?: number;
    max?: number;
    placeholder?: string;
}

interface GroupDef {
    title: string;
    icon: string;
    fields: FieldDef[];
}

// Curated groups of the most-used server.properties keys.
const GROUPS: GroupDef[] = [
    {
        title: 'Gameplay',
        icon: '🎮',
        fields: [
            {
                key: 'gamemode',
                label: 'Default Gamemode',
                type: 'select',
                help: 'The mode new players join in.',
                options: [
                    { value: 'survival', label: 'Survival' },
                    { value: 'creative', label: 'Creative' },
                    { value: 'adventure', label: 'Adventure' },
                    { value: 'spectator', label: 'Spectator' },
                ],
            },
            { key: 'force-gamemode', label: 'Force Gamemode', type: 'toggle', help: 'Force players into the default gamemode on join.' },
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
            { key: 'hardcore', label: 'Hardcore', type: 'toggle', help: 'Players are banned on death.' },
            { key: 'pvp', label: 'PvP', type: 'toggle', help: 'Allow players to damage each other.' },
            { key: 'allow-flight', label: 'Allow Flight', type: 'toggle', help: 'Permit flight for survival players with mods.' },
            { key: 'enable-command-block', label: 'Command Blocks', type: 'toggle' },
        ],
    },
    {
        title: 'World',
        icon: '🌍',
        fields: [
            { key: 'level-name', label: 'World Name', type: 'text', placeholder: 'world' },
            { key: 'level-seed', label: 'World Seed', type: 'text', placeholder: '(random)' },
            {
                key: 'level-type',
                label: 'World Type',
                type: 'select',
                options: [
                    { value: 'minecraft:normal', label: 'Normal' },
                    { value: 'minecraft:flat', label: 'Superflat' },
                    { value: 'minecraft:large_biomes', label: 'Large Biomes' },
                    { value: 'minecraft:amplified', label: 'Amplified' },
                ],
            },
            { key: 'generate-structures', label: 'Generate Structures', type: 'toggle' },
            { key: 'allow-nether', label: 'Allow Nether', type: 'toggle' },
            { key: 'spawn-monsters', label: 'Spawn Monsters', type: 'toggle' },
            { key: 'spawn-animals', label: 'Spawn Animals', type: 'toggle' },
            { key: 'spawn-npcs', label: 'Spawn NPCs (Villagers)', type: 'toggle' },
            { key: 'spawn-protection', label: 'Spawn Protection', type: 'number', min: 0, help: 'Radius (blocks) around spawn only ops can build in.' },
            { key: 'max-world-size', label: 'Max World Size', type: 'number', min: 1, max: 29999984 },
        ],
    },
    {
        title: 'Players',
        icon: '👥',
        fields: [
            { key: 'max-players', label: 'Max Players', type: 'number', min: 0, max: 2147483647 },
            { key: 'motd', label: 'MOTD', type: 'text', help: 'Message shown in the server list.', placeholder: 'A Minecraft Server' },
            { key: 'white-list', label: 'Whitelist', type: 'toggle' },
            { key: 'enforce-whitelist', label: 'Enforce Whitelist', type: 'toggle', help: 'Kick non-whitelisted players when the whitelist reloads.' },
            { key: 'online-mode', label: 'Online Mode', type: 'toggle', help: 'Verify players against Mojang. Disable only for offline/proxy setups.' },
            { key: 'player-idle-timeout', label: 'Idle Timeout (min)', type: 'number', min: 0, help: '0 disables auto-kick of idle players.' },
        ],
    },
    {
        title: 'Performance & Network',
        icon: '⚡',
        fields: [
            { key: 'server-port', label: 'Server Port', type: 'number', min: 1, max: 65535, help: 'Usually managed by Pterodactyl allocations.' },
            { key: 'view-distance', label: 'View Distance', type: 'number', min: 2, max: 32 },
            { key: 'simulation-distance', label: 'Simulation Distance', type: 'number', min: 2, max: 32 },
            { key: 'max-tick-time', label: 'Max Tick Time (ms)', type: 'number', min: -1, help: 'Watchdog timeout. -1 disables it.' },
            { key: 'network-compression-threshold', label: 'Compression Threshold', type: 'number', min: -1 },
            { key: 'entity-broadcast-range-percentage', label: 'Entity Broadcast Range %', type: 'number', min: 10, max: 1000 },
        ],
    },
];

const KNOWN_KEYS = new Set(GROUPS.flatMap((g) => g.fields.map((f) => f.key)));

type Line =
    | { type: 'comment' | 'blank'; raw: string }
    | { type: 'entry'; raw: string; key: string };

interface ParsedFile {
    lines: Line[];
    values: Record<string, string>;
}

function parseProperties(text: string): ParsedFile {
    const values: Record<string, string> = {};
    const lines: Line[] = text.split('\n').map((raw) => {
        const trimmed = raw.trim();
        if (trimmed === '') return { type: 'blank', raw } as Line;
        if (trimmed.startsWith('#') || trimmed.startsWith('!')) return { type: 'comment', raw } as Line;
        const idx = raw.indexOf('=');
        if (idx === -1) return { type: 'comment', raw } as Line;
        const key = raw.slice(0, idx).trim();
        values[key] = raw.slice(idx + 1);
        return { type: 'entry', raw, key } as Line;
    });
    return { lines, values };
}

function serialize(parsed: ParsedFile, values: Record<string, string>): string {
    const seen = new Set<string>();
    const out = parsed.lines.map((line) => {
        if (line.type === 'entry') {
            seen.add(line.key);
            return `${line.key}=${values[line.key] ?? ''}`;
        }
        return line.raw;
    });
    // Append any keys that exist in the form but were not present in the file.
    Object.keys(values).forEach((key) => {
        if (!seen.has(key)) out.push(`${key}=${values[key]}`);
    });
    return out.join('\n');
}

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
        type={'button'}
        role={'switch'}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`mcpe-toggle${checked ? ' mcpe-toggle--on' : ''}`}
    >
        <span className={'mcpe-toggle__dot'} />
    </button>
);

const Field = ({
    def,
    value,
    onChange,
}: {
    def: FieldDef;
    value: string | undefined;
    onChange: (v: string) => void;
}) => {
    const present = value !== undefined;
    return (
        <div className={`mcpe-field${present ? '' : ' mcpe-field--missing'}`}>
            <div className={'mcpe-field__label'}>
                <span>{def.label}</span>
                <code className={'mcpe-field__key'}>{def.key}</code>
            </div>
            <div className={'mcpe-field__control'}>
                {def.type === 'toggle' && (
                    <Toggle checked={(value ?? 'false').toLowerCase() === 'true'} onChange={(v) => onChange(v ? 'true' : 'false')} />
                )}
                {def.type === 'select' && (
                    <select className={'mcpe-input'} value={value ?? ''} onChange={(e) => onChange(e.currentTarget.value)}>
                        {value !== undefined && !def.options?.some((o) => o.value === value) && (
                            <option value={value}>{value} (custom)</option>
                        )}
                        {def.options?.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                )}
                {def.type === 'number' && (
                    <input
                        className={'mcpe-input'}
                        type={'number'}
                        min={def.min}
                        max={def.max}
                        value={value ?? ''}
                        placeholder={def.placeholder}
                        onChange={(e) => onChange(e.currentTarget.value)}
                    />
                )}
                {def.type === 'text' && (
                    <input
                        className={'mcpe-input'}
                        type={'text'}
                        value={value ?? ''}
                        placeholder={def.placeholder}
                        onChange={(e) => onChange(e.currentTarget.value)}
                    />
                )}
            </div>
            {def.help && <p className={'mcpe-field__help'}>{def.help}</p>}
        </div>
    );
};

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const [filePath, setFilePath] = useState('/server.properties');
    const [parsed, setParsed] = useState<ParsedFile>({ lines: [], values: {} });
    const [values, setValues] = useState<Record<string, string>>({});
    const [raw, setRaw] = useState('');
    const [mode, setMode] = useState<'form' | 'raw'>('form');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        setNotice(null);
        getFileContents(uuid, filePath)
            .then((content) => {
                const p = parseProperties(content);
                setParsed(p);
                setValues(p.values);
                setRaw(content);
                setDirty(false);
                setMode('form');
            })
            .catch((err) => {
                console.error(err);
                setError(httpErrorToHuman(err));
            })
            .then(() => setLoading(false));
    }, [uuid, filePath]);

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updateValue = (key: string, value: string) => {
        setValues((prev) => ({ ...prev, [key]: value }));
        setDirty(true);
        setNotice(null);
    };

    const switchToRaw = () => {
        setRaw(serialize(parsed, values));
        setMode('raw');
    };

    const switchToForm = () => {
        const p = parseProperties(raw);
        setParsed(p);
        setValues(p.values);
        setMode('form');
    };

    const save = async () => {
        setSaving(true);
        setError(null);
        setNotice(null);
        const content = mode === 'raw' ? raw : serialize(parsed, values);
        try {
            await saveFileContents(uuid, filePath, content);
            if (mode === 'raw') {
                const p = parseProperties(content);
                setParsed(p);
                setValues(p.values);
            }
            setRaw(content);
            setDirty(false);
            setNotice('Saved! Restart the server to apply the changes.');
        } catch (err) {
            console.error(err);
            setError(httpErrorToHuman(err));
        } finally {
            setSaving(false);
        }
    };

    const extraKeys = useMemo(
        () => Object.keys(values).filter((k) => !KNOWN_KEYS.has(k)).sort(),
        [values]
    );

    return (
        <div className={'mcpe'}>
            <div className={'mcpe-hero'}>
                <div className={'mcpe-hero__icon'}>⚙️</div>
                <div className={'mcpe-hero__text'}>
                    <h1>Server Properties</h1>
                    <p>Edit your Minecraft: Java Edition configuration without touching the file manager.</p>
                </div>
                <span className={'mcpe-badge'}>Blueprint</span>
            </div>

            <div className={'mcpe-bar'}>
                <div className={'mcpe-bar__file'}>
                    <label>File</label>
                    <input
                        className={'mcpe-input'}
                        value={filePath}
                        spellCheck={false}
                        onChange={(e) => setFilePath(e.currentTarget.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') load();
                        }}
                    />
                </div>
                <div className={'mcpe-bar__actions'}>
                    <div className={'mcpe-tabs'}>
                        <button
                            type={'button'}
                            className={`mcpe-tab${mode === 'form' ? ' mcpe-tab--active' : ''}`}
                            onClick={switchToForm}
                        >
                            Editor
                        </button>
                        <button
                            type={'button'}
                            className={`mcpe-tab${mode === 'raw' ? ' mcpe-tab--active' : ''}`}
                            onClick={switchToRaw}
                        >
                            Raw
                        </button>
                    </div>
                    <button type={'button'} className={'mcpe-btn mcpe-btn--ghost'} onClick={load} disabled={loading || saving}>
                        Reload
                    </button>
                    <button type={'button'} className={'mcpe-btn mcpe-btn--primary'} onClick={save} disabled={saving || loading || !dirty}>
                        {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
                    </button>
                </div>
            </div>

            {error && <div className={'mcpe-alert mcpe-alert--danger'}>{error}</div>}
            {notice && <div className={'mcpe-alert mcpe-alert--success'}>{notice}</div>}

            {loading ? (
                <div className={'mcpe-loading'}>Loading {filePath}…</div>
            ) : mode === 'raw' ? (
                <div className={'mcpe-card'}>
                    <textarea
                        className={'mcpe-raw'}
                        spellCheck={false}
                        value={raw}
                        onChange={(e) => {
                            setRaw(e.currentTarget.value);
                            setDirty(true);
                            setNotice(null);
                        }}
                    />
                </div>
            ) : (
                <>
                    <div className={'mcpe-grid'}>
                        {GROUPS.map((group) => (
                            <section key={group.title} className={'mcpe-card'}>
                                <header className={'mcpe-card__head'}>
                                    <span className={'mcpe-card__icon'}>{group.icon}</span>
                                    <h2>{group.title}</h2>
                                </header>
                                <div className={'mcpe-card__body'}>
                                    {group.fields.map((def) => (
                                        <Field key={def.key} def={def} value={values[def.key]} onChange={(v) => updateValue(def.key, v)} />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>

                    {extraKeys.length > 0 && (
                        <section className={'mcpe-card mcpe-card--wide'}>
                            <header className={'mcpe-card__head'}>
                                <span className={'mcpe-card__icon'}>🧩</span>
                                <h2>Other Properties</h2>
                            </header>
                            <div className={'mcpe-card__body mcpe-card__body--dense'}>
                                {extraKeys.map((key) => (
                                    <Field
                                        key={key}
                                        def={{ key, label: key, type: 'text' }}
                                        value={values[key]}
                                        onChange={(v) => updateValue(key, v)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
};
