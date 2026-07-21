import React, { useCallback, useEffect, useMemo, useState } from 'react';
import http, { httpErrorToHuman } from '@/api/http';
import { ServerContext } from '@/state/server';

type PropertyDefinition = {
    label?: string;
    category?: string;
    type?: 'boolean' | 'integer' | 'select' | 'secret' | 'string';
    options?: string[];
    min?: number | null;
    max?: number | null;
    description?: string;
};

type PropertyEntry = {
    key: string;
    value: string;
    line: number;
    label: string;
    category: string;
    type: 'boolean' | 'integer' | 'select' | 'secret' | 'string';
    options: string[];
    min?: number | null;
    max?: number | null;
    description?: string;
    secret?: boolean;
};

type PropertiesPayload = {
    path: string;
    backup_path: string;
    content: string;
    properties: PropertyEntry[];
    definitions: Record<string, PropertyDefinition>;
    categories: string[];
    stats: {
        properties: number;
        comments: number;
        bytes: number;
    };
};

type Preset = {
    name: string;
    description: string;
    values: Record<string, string>;
};

const PRESETS: Preset[] = [
    {
        name: 'Survival balanceado',
        description: 'Configuracao segura para servidores survival publicos.',
        values: {
            gamemode: 'survival',
            difficulty: 'normal',
            pvp: 'true',
            'online-mode': 'true',
            'enable-command-block': 'false',
            'spawn-protection': '16',
        },
    },
    {
        name: 'Criativo',
        description: 'Mundo criativo com voo liberado e modo de jogo forcado.',
        values: {
            gamemode: 'creative',
            difficulty: 'peaceful',
            'allow-flight': 'true',
            'force-gamemode': 'true',
            pvp: 'false',
        },
    },
    {
        name: 'Hardcore',
        description: 'Dificuldade alta, hardcore ativo e lista branca recomendada.',
        values: {
            hardcore: 'true',
            difficulty: 'hard',
            gamemode: 'survival',
            'white-list': 'true',
            'enforce-whitelist': 'true',
        },
    },
    {
        name: 'Performance',
        description: 'Reduz distancia de simulacao e alcance de entidades.',
        values: {
            'view-distance': '8',
            'simulation-distance': '6',
            'entity-broadcast-range-percentage': '75',
            'sync-chunk-writes': 'false',
        },
    },
];

const toMap = (properties: PropertyEntry[]): Record<string, string> =>
    properties.reduce<Record<string, string>>((result, property) => {
        result[property.key] = property.value;
        return result;
    }, {});

const fallbackEntry = (key: string, value: string, definition?: PropertyDefinition): PropertyEntry => ({
    key,
    value,
    line: 0,
    label: definition?.label || key,
    category: definition?.category || 'Custom',
    type: definition?.type || 'string',
    options: definition?.options || [],
    min: definition?.min,
    max: definition?.max,
    description: definition?.description || 'Custom or version-specific Minecraft property.',
    secret: definition?.type === 'secret',
});

const inputClass =
    'w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 shadow-inner transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20';

const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-400';

export default function MinecraftPropertiesPage() {
    const serverId = ServerContext.useStoreState((state) => state.server.data?.id);
    const [data, setData] = useState<PropertiesPayload | null>(null);
    const [values, setValues] = useState<Record<string, string>>({});
    const [rawContent, setRawContent] = useState('');
    const [category, setCategory] = useState('All');
    const [search, setSearch] = useState('');
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [createBackup, setCreateBackup] = useState(true);
    const [rawMode, setRawMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadProperties = useCallback(() => {
        if (!serverId) {
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        http.get(`/api/client/extensions/minecraftproperties/servers/${serverId}/properties`)
            .then(({ data: response }) => {
                const payload = response.data as PropertiesPayload;
                setData(payload);
                setValues(toMap(payload.properties));
                setRawContent(payload.content);
            })
            .catch((error) => setError(httpErrorToHuman(error)))
            .finally(() => setLoading(false));
    }, [serverId]);

    useEffect(() => {
        loadProperties();
    }, [loadProperties]);

    const entries = useMemo(() => {
        if (!data) {
            return [];
        }

        const byKey = new Map<string, PropertyEntry>();
        data.properties.forEach((property) => {
            byKey.set(property.key, { ...property, value: values[property.key] ?? property.value });
        });

        Object.entries(values).forEach(([key, value]) => {
            if (!byKey.has(key)) {
                byKey.set(key, fallbackEntry(key, value, data.definitions[key]));
            }
        });

        return Array.from(byKey.values()).sort((a, b) => {
            if (a.category === b.category) {
                return a.key.localeCompare(b.key);
            }

            return a.category.localeCompare(b.category);
        });
    }, [data, values]);

    const filteredEntries = useMemo(() => {
        const term = search.trim().toLowerCase();

        return entries.filter((property) => {
            const matchesCategory = category === 'All' || property.category === category;
            const matchesSearch =
                term === '' ||
                property.key.toLowerCase().includes(term) ||
                property.label.toLowerCase().includes(term) ||
                (property.description || '').toLowerCase().includes(term);

            return matchesCategory && matchesSearch;
        });
    }, [category, entries, search]);

    const categories = useMemo(() => {
        const unique = new Set(['All']);
        entries.forEach((entry) => unique.add(entry.category));
        return Array.from(unique);
    }, [entries]);

    const updateValue = useCallback((key: string, value: string) => {
        setValues((current) => ({ ...current, [key]: value }));
    }, []);

    const applyPreset = useCallback((preset: Preset) => {
        setValues((current) => ({ ...current, ...preset.values }));
        setSuccess(`${preset.name} aplicado. Revise e salve para gravar no servidor.`);
    }, []);

    const addCustomProperty = useCallback(() => {
        const key = newKey.trim();
        if (!/^[A-Za-z0-9._-]+$/.test(key)) {
            setError('Use apenas letras, numeros, ponto, hifen ou underline na chave.');
            return;
        }

        setValues((current) => ({ ...current, [key]: newValue }));
        setNewKey('');
        setNewValue('');
        setError('');
        setCategory('All');
    }, [newKey, newValue]);

    const saveProperties = useCallback(() => {
        if (!serverId) {
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        const request = rawMode
            ? http.put(`/api/client/extensions/minecraftproperties/servers/${serverId}/properties/raw`, {
                  content: rawContent,
                  create_backup: createBackup,
              })
            : http.patch(`/api/client/extensions/minecraftproperties/servers/${serverId}/properties`, {
                  properties: values,
                  create_backup: createBackup,
              });

        request
            .then(({ data: response }) => {
                const payload = response.data as PropertiesPayload;
                setData(payload);
                setValues(toMap(payload.properties));
                setRawContent(payload.content);
                setSuccess(`server.properties salvo. Backup: ${payload.backup_path}`);
            })
            .catch((error) => setError(httpErrorToHuman(error)))
            .finally(() => setSaving(false));
    }, [createBackup, rawContent, rawMode, serverId, values]);

    if (loading) {
        return (
            <div className='minecraft-properties-shell rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-neutral-200'>
                Carregando server.properties...
            </div>
        );
    }

    if (!data) {
        return (
            <div className='rounded-2xl border border-red-500/40 bg-red-950/30 p-6 text-red-100'>
                {error || 'Nao foi possivel carregar o arquivo server.properties.'}
            </div>
        );
    }

    return (
        <div className='minecraft-properties-shell space-y-6 text-neutral-100'>
            <section className='minecraft-properties-card-glow overflow-hidden rounded-3xl border border-emerald-500/20 bg-neutral-950'>
                <div className='bg-gradient-to-br from-emerald-500/20 via-neutral-900 to-cyan-500/10 p-6 md:p-8'>
                    <div className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
                        <div>
                            <p className='text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300'>Minecraft Java</p>
                            <h1 className='mt-2 text-3xl font-black text-white md:text-4xl'>Editor server.properties</h1>
                            <p className='mt-3 max-w-2xl text-sm text-neutral-300'>
                                Edite configuracoes do servidor com presets, validacao, backup automatico e modo avancado.
                            </p>
                        </div>
                        <div className='grid grid-cols-3 gap-3 text-center'>
                            <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                                <div className='text-2xl font-black text-white'>{data.stats.properties}</div>
                                <div className='text-xs uppercase text-neutral-400'>Chaves</div>
                            </div>
                            <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                                <div className='text-2xl font-black text-white'>{data.stats.comments}</div>
                                <div className='text-xs uppercase text-neutral-400'>Comentarios</div>
                            </div>
                            <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                                <div className='text-2xl font-black text-white'>{Math.ceil(data.stats.bytes / 1024)}KB</div>
                                <div className='text-xs uppercase text-neutral-400'>Arquivo</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {error && <div className='rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-100'>{error}</div>}
            {success && (
                <div className='rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 text-sm text-emerald-100'>
                    {success}
                </div>
            )}

            <section className='grid gap-4 lg:grid-cols-4'>
                {PRESETS.map((preset) => (
                    <button
                        key={preset.name}
                        type='button'
                        onClick={() => applyPreset(preset)}
                        className='rounded-2xl border border-neutral-800 bg-neutral-900 p-5 text-left transition hover:-translate-y-0.5 hover:border-emerald-400/60 hover:bg-neutral-800'
                    >
                        <span className='text-sm font-bold text-white'>{preset.name}</span>
                        <span className='mt-2 block text-xs leading-5 text-neutral-400'>{preset.description}</span>
                    </button>
                ))}
            </section>

            <section className='rounded-2xl border border-neutral-800 bg-neutral-900 p-5'>
                <div className='grid gap-4 md:grid-cols-4'>
                    <div>
                        <label className={labelClass}>Buscar</label>
                        <input className={inputClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder='motd, pvp, view...' />
                    </div>
                    <div>
                        <label className={labelClass}>Categoria</label>
                        <select className={inputClass} value={category} onChange={(event) => setCategory(event.target.value)}>
                            {categories.map((item) => (
                                <option key={item} value={item}>
                                    {item === 'All' ? 'Todas' : item}
                                </option>
                            ))}
                        </select>
                    </div>
                    <label className='flex items-end gap-3 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-300'>
                        <input
                            type='checkbox'
                            checked={createBackup}
                            onChange={(event) => setCreateBackup(event.target.checked)}
                            className='h-4 w-4 rounded border-neutral-600 bg-neutral-900 text-emerald-500'
                        />
                        Criar backup antes de salvar
                    </label>
                    <label className='flex items-end gap-3 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-300'>
                        <input
                            type='checkbox'
                            checked={rawMode}
                            onChange={(event) => setRawMode(event.target.checked)}
                            className='h-4 w-4 rounded border-neutral-600 bg-neutral-900 text-emerald-500'
                        />
                        Modo raw avancado
                    </label>
                </div>
            </section>

            {rawMode ? (
                <section className='rounded-2xl border border-neutral-800 bg-neutral-900 p-5'>
                    <label className={labelClass}>Conteudo bruto de {data.path}</label>
                    <textarea
                        className={`${inputClass} min-h-[520px] font-mono`}
                        value={rawContent}
                        onChange={(event) => setRawContent(event.target.value)}
                        spellCheck={false}
                    />
                </section>
            ) : (
                <>
                    <section className='grid minecraft-properties-grid gap-4'>
                        {filteredEntries.map((property) => (
                            <article key={property.key} className='rounded-2xl border border-neutral-800 bg-neutral-900 p-5'>
                                <div className='mb-4 flex items-start justify-between gap-3'>
                                    <div>
                                        <h3 className='font-bold text-white'>{property.label}</h3>
                                        <p className='mt-1 font-mono text-xs text-emerald-300'>{property.key}</p>
                                    </div>
                                    <span className='rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400'>{property.category}</span>
                                </div>

                                {property.description && <p className='mb-4 text-xs leading-5 text-neutral-400'>{property.description}</p>}

                                {property.type === 'boolean' ? (
                                    <select className={inputClass} value={values[property.key] ?? ''} onChange={(event) => updateValue(property.key, event.target.value)}>
                                        <option value='true'>true</option>
                                        <option value='false'>false</option>
                                    </select>
                                ) : property.type === 'select' ? (
                                    <select className={inputClass} value={values[property.key] ?? ''} onChange={(event) => updateValue(property.key, event.target.value)}>
                                        {property.options.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        className={inputClass}
                                        type={property.secret ? 'password' : property.type === 'integer' ? 'number' : 'text'}
                                        min={property.min ?? undefined}
                                        max={property.max ?? undefined}
                                        value={values[property.key] ?? ''}
                                        onChange={(event) => updateValue(property.key, event.target.value)}
                                    />
                                )}

                                {property.line > 0 && <p className='mt-3 text-xs text-neutral-500'>Linha {property.line}</p>}
                            </article>
                        ))}
                    </section>

                    <section className='rounded-2xl border border-dashed border-neutral-700 bg-neutral-900 p-5'>
                        <h3 className='font-bold text-white'>Adicionar chave customizada</h3>
                        <div className='mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]'>
                            <input className={inputClass} value={newKey} onChange={(event) => setNewKey(event.target.value)} placeholder='custom-property' />
                            <input className={inputClass} value={newValue} onChange={(event) => setNewValue(event.target.value)} placeholder='valor' />
                            <button
                                type='button'
                                onClick={addCustomProperty}
                                className='rounded-lg bg-neutral-100 px-5 py-2 text-sm font-bold text-neutral-950 transition hover:bg-white'
                            >
                                Adicionar
                            </button>
                        </div>
                    </section>
                </>
            )}

            <div className='sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/95 p-4 shadow-2xl backdrop-blur md:flex-row md:items-center md:justify-between'>
                <p className='text-xs text-neutral-400'>
                    Salvar reinicia apenas o arquivo. Reinicie o servidor Minecraft para aplicar alteracoes que o jogo carrega no boot.
                </p>
                <div className='flex gap-3'>
                    <button
                        type='button'
                        onClick={loadProperties}
                        disabled={saving}
                        className='rounded-lg border border-neutral-700 px-5 py-2 text-sm font-bold text-neutral-200 transition hover:border-neutral-500 disabled:opacity-50'
                    >
                        Recarregar
                    </button>
                    <button
                        type='button'
                        onClick={saveProperties}
                        disabled={saving}
                        className='rounded-lg bg-emerald-500 px-5 py-2 text-sm font-black text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50'
                    >
                        {saving ? 'Salvando...' : 'Salvar alteracoes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
