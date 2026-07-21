import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { ServerContext } from '@/state/server';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import http from '@/api/http';

import {
    CATEGORIES,
    CategoryId,
    PROPERTIES,
    PROPERTY_MAP,
    PropertySpec,
} from './propertiesSchema';
import { parseProperties, serializeProperties, ParsedFile } from './propertiesParser';

const PROPERTIES_PATH = '/server.properties';

type Status = { kind: 'idle' | 'loading' | 'saving' | 'restarting' | 'error' | 'success'; message?: string };

const ServerPropertiesEditor: React.FC = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const [status, setStatus] = useState<Status>({ kind: 'loading' });
    const [parsed, setParsed] = useState<ParsedFile | null>(null);
    const [values, setValues] = useState<Record<string, string>>({});
    const [originalValues, setOriginalValues] = useState<Record<string, string>>({});
    const [activeCategory, setActiveCategory] = useState<CategoryId | 'todas'>('todas');
    const [search, setSearch] = useState('');

    const load = useCallback(() => {
        setStatus({ kind: 'loading' });
        getFileContents(uuid, PROPERTIES_PATH)
            .then((content) => {
                const p = parseProperties(content);
                setParsed(p);
                setValues({ ...p.values });
                setOriginalValues({ ...p.values });
                setStatus({ kind: 'idle' });
            })
            .catch((err) => {
                console.error(err);
                setStatus({
                    kind: 'error',
                    message:
                        'Não foi possível ler o arquivo server.properties. Verifique se o servidor é Minecraft: Java Edition e se já foi iniciado ao menos uma vez.',
                });
            });
    }, [uuid]);

    useEffect(() => {
        load();
    }, [load]);

    const dirtyKeys = useMemo(() => {
        const keys: string[] = [];
        for (const k of Object.keys(values)) {
            if (originalValues[k] !== values[k]) keys.push(k);
        }
        for (const k of Object.keys(originalValues)) {
            if (!(k in values)) keys.push(k);
        }
        return keys;
    }, [values, originalValues]);

    const unknownKeys = useMemo(() => {
        if (!parsed) return [] as string[];
        return parsed.order.filter((k) => !PROPERTY_MAP[k]);
    }, [parsed]);

    const filteredEntries: PropertySpec[] = useMemo(() => {
        const q = search.trim().toLowerCase();
        const known = PROPERTIES.filter((p) => {
            if (activeCategory !== 'todas' && p.category !== activeCategory) return false;
            if (!q) return true;
            return (
                p.key.toLowerCase().includes(q) ||
                p.label.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q)
            );
        });

        const unknown: PropertySpec[] =
            activeCategory === 'todas' || activeCategory === 'outras'
                ? unknownKeys
                      .filter((k) => (q ? k.toLowerCase().includes(q) : true))
                      .map((k) => ({
                          key: k,
                          label: k,
                          description: 'Chave adicional detectada (plugin/mod). Editada como texto livre.',
                          category: 'outras' as CategoryId,
                          type: 'string' as const,
                          default: '',
                      }))
                : [];

        return [...known, ...unknown];
    }, [activeCategory, search, unknownKeys]);

    const counts = useMemo(() => {
        const c: Record<string, number> = { todas: PROPERTIES.length + unknownKeys.length };
        for (const cat of CATEGORIES) {
            c[cat.id] = PROPERTIES.filter((p) => p.category === cat.id).length;
        }
        c['outras'] = (c['outras'] || 0) + unknownKeys.length;
        return c;
    }, [unknownKeys]);

    const updateValue = (key: string, next: string) => {
        setValues((prev) => ({ ...prev, [key]: next }));
    };

    const resetAll = () => {
        if (!parsed) return;
        setValues({ ...originalValues });
    };

    const resetKey = (key: string) => {
        if (!(key in originalValues)) return;
        setValues((prev) => ({ ...prev, [key]: originalValues[key] }));
    };

    const save = async () => {
        if (!parsed) return;
        setStatus({ kind: 'saving' });
        try {
            const content = serializeProperties(parsed, values);
            await saveFileContents(uuid, PROPERTIES_PATH, content);
            const newParsed = parseProperties(content);
            setParsed(newParsed);
            setOriginalValues({ ...newParsed.values });
            setValues({ ...newParsed.values });
            setStatus({ kind: 'success', message: 'Alterações salvas. Reinicie o servidor para aplicar.' });
        } catch (err) {
            console.error(err);
            setStatus({ kind: 'error', message: 'Falha ao salvar server.properties. Verifique suas permissões.' });
        }
    };

    const saveAndRestart = async () => {
        if (!parsed) return;
        setStatus({ kind: 'saving' });
        try {
            const content = serializeProperties(parsed, values);
            await saveFileContents(uuid, PROPERTIES_PATH, content);
            setStatus({ kind: 'restarting' });
            await http.post(`/api/client/servers/${uuid}/power`, { signal: 'restart' });
            const newParsed = parseProperties(content);
            setParsed(newParsed);
            setOriginalValues({ ...newParsed.values });
            setValues({ ...newParsed.values });
            setStatus({ kind: 'success', message: 'Salvo e reinício enviado. Novas configurações serão aplicadas.' });
        } catch (err) {
            console.error(err);
            setStatus({ kind: 'error', message: 'Salvo, mas não foi possível reiniciar o servidor.' });
        }
    };

    return (
        <PageContentBlock title={'Server Properties'}>
            <div className={'sp-root'}>
                <div className={'sp-header'}>
                    <div>
                        <h1 className={'sp-title'}>
                            <span className={'sp-dot'} />
                            Server Properties
                        </h1>
                        <div className={'sp-subtitle'}>
                            Edição visual do <code>server.properties</code> — Minecraft: Java Edition
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <button className={'sp-btn sp-btn-secondary'} onClick={load} disabled={status.kind === 'loading'}>
                            {status.kind === 'loading' ? <span className={'sp-spinner'} /> : '↻'} Recarregar
                        </button>
                    </div>
                </div>

                {status.kind === 'error' && (
                    <div className={'sp-alert sp-alert-danger'} role={'alert'}>
                        <span>⚠️</span>
                        <div>{status.message}</div>
                    </div>
                )}
                {status.kind === 'success' && (
                    <div className={'sp-alert sp-alert-success'}>
                        <span>✓</span>
                        <div>{status.message}</div>
                    </div>
                )}
                {status.kind === 'loading' && (
                    <div className={'sp-empty'}>
                        <span className={'sp-spinner'} /> Carregando <code>server.properties</code>…
                    </div>
                )}

                {parsed && (
                    <>
                        <div className={'sp-toolbar'}>
                            <div className={'sp-search'}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="7" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                <input
                                    placeholder="Buscar por nome, chave ou descrição…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={'sp-tabs'}>
                            <button
                                className={`sp-tab ${activeCategory === 'todas' ? 'active' : ''}`}
                                onClick={() => setActiveCategory('todas')}
                            >
                                Todas <span className={'sp-badge'}>{counts.todas}</span>
                            </button>
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    className={`sp-tab ${activeCategory === cat.id ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(cat.id)}
                                >
                                    <span style={{ marginRight: 6 }}>{cat.icon}</span>
                                    {cat.label}
                                    <span className={'sp-badge'}>{counts[cat.id] ?? 0}</span>
                                </button>
                            ))}
                        </div>

                        {filteredEntries.length === 0 ? (
                            <div className={'sp-empty'}>Nenhuma propriedade encontrada com esses filtros.</div>
                        ) : (
                            <div className={'sp-grid'}>
                                {filteredEntries.map((spec) => (
                                    <PropertyCard
                                        key={spec.key}
                                        spec={spec}
                                        value={values[spec.key] ?? spec.default}
                                        dirty={originalValues[spec.key] !== values[spec.key] && spec.key in originalValues}
                                        onChange={(v) => updateValue(spec.key, v)}
                                        onReset={() => resetKey(spec.key)}
                                    />
                                ))}
                            </div>
                        )}

                        {dirtyKeys.length > 0 && (
                            <div className={'sp-floating'}>
                                <div className={'sp-changes'}>
                                    ● {dirtyKeys.length} alteraç{dirtyKeys.length === 1 ? 'ão' : 'ões'} não salv
                                    {dirtyKeys.length === 1 ? 'a' : 'as'}
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <button className={'sp-btn sp-btn-danger'} onClick={resetAll}>
                                        Descartar
                                    </button>
                                    <button
                                        className={'sp-btn sp-btn-secondary'}
                                        onClick={save}
                                        disabled={status.kind === 'saving' || status.kind === 'restarting'}
                                    >
                                        {status.kind === 'saving' ? <span className={'sp-spinner'} /> : '💾'} Salvar
                                    </button>
                                    <button
                                        className={'sp-btn sp-btn-primary'}
                                        onClick={saveAndRestart}
                                        disabled={status.kind === 'saving' || status.kind === 'restarting'}
                                    >
                                        {status.kind === 'restarting' ? <span className={'sp-spinner'} /> : '⟳'} Salvar & reiniciar
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </PageContentBlock>
    );
};

interface CardProps {
    spec: PropertySpec;
    value: string;
    dirty: boolean;
    onChange: (next: string) => void;
    onReset: () => void;
}

const PropertyCard: React.FC<CardProps> = ({ spec, value, dirty, onChange, onReset }) => {
    return (
        <div className={'sp-card'} style={dirty ? { borderColor: 'var(--sp-warning)' } : undefined}>
            <div className={'sp-card-head'}>
                <div>
                    <div className={'sp-card-label'}>{spec.label}</div>
                    <div className={'sp-card-key'}>{spec.key}</div>
                </div>
                {dirty && (
                    <button
                        onClick={onReset}
                        title={'Reverter para o valor salvo'}
                        className={'sp-btn sp-btn-danger'}
                        style={{ padding: '4px 10px', fontSize: 11 }}
                    >
                        Reverter
                    </button>
                )}
            </div>
            {spec.description && <div className={'sp-card-desc'}>{spec.description}</div>}
            <div className={'sp-card-value'}>
                <PropertyInput spec={spec} value={value} onChange={onChange} />
            </div>
        </div>
    );
};

const PropertyInput: React.FC<{ spec: PropertySpec; value: string; onChange: (v: string) => void }> = ({
    spec,
    value,
    onChange,
}) => {
    if (spec.type === 'boolean') {
        const checked = value === 'true';
        return (
            <div className={'sp-switch-row'}>
                <label className={'sp-switch'}>
                    <input
                        type={'checkbox'}
                        checked={checked}
                        onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
                    />
                    <span className={'sp-switch-slider'} />
                </label>
                <span className={'sp-switch-value'}>{checked ? 'true' : 'false'}</span>
            </div>
        );
    }

    if (spec.type === 'select' && spec.options) {
        const hasValue = spec.options.some((o) => o.value === value);
        return (
            <select className={'sp-select'} value={value} onChange={(e) => onChange(e.target.value)}>
                {!hasValue && <option value={value}>{value || '— vazio —'}</option>}
                {spec.options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        );
    }

    if (spec.type === 'number') {
        return (
            <input
                type={'number'}
                className={'sp-input'}
                value={value}
                min={spec.min}
                max={spec.max}
                onChange={(e) => onChange(e.target.value)}
            />
        );
    }

    return (
        <input
            type={spec.sensitive ? 'password' : 'text'}
            className={'sp-input'}
            value={value}
            placeholder={spec.default}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            autoComplete={'off'}
        />
    );
};

export default ServerPropertiesEditor;
