import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { ServerContext } from '@/state/server';
import http from '@/api/http';
import { PROPERTY_CATEGORIES, PropertyDefinition } from './propertySchema';

type TabId = 'properties' | 'addons';

interface AddonItem {
    id: string;
    name: string;
    description?: string;
    category?: string;
    destination?: string;
    filename_hint?: string;
    project?: string;
}

interface InstalledMap {
    [id: string]: {
        id: string;
        files: string[];
    };
}

interface JarFile {
    name: string;
    path: string;
    size?: number;
}

interface BannerState {
    type: 'info' | 'warn' | 'error';
    text: string;
}

const boolValue = (value: string | undefined): boolean => {
    if (value === undefined) return false;
    return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
};

const PropertyField = ({
    definition,
    value,
    onChange,
}: {
    definition: PropertyDefinition;
    value: string;
    onChange: (key: string, value: string) => void;
}) => {
    if (definition.type === 'boolean') {
        const on = boolValue(value);
        return (
            <div className={'minesuite-card'}>
                <div className={'minesuite-card-top'}>
                    <div>
                        <span className={'minesuite-field-label'}>{definition.label}</span>
                        <div className={'minesuite-card-title'} style={{ fontSize: '0.95rem' }}>
                            {definition.key}
                        </div>
                    </div>
                    <button
                        type={'button'}
                        className={`minesuite-toggle${on ? ' is-on' : ''}`}
                        onClick={() => onChange(definition.key, on ? 'false' : 'true')}
                        aria-pressed={on}
                    >
                        <span />
                    </button>
                </div>
                <p className={'minesuite-help'}>{definition.description}</p>
            </div>
        );
    }

    if (definition.type === 'select') {
        return (
            <div className={'minesuite-card'}>
                <label className={'minesuite-field-label'} htmlFor={definition.key}>
                    {definition.label}
                </label>
                <select
                    id={definition.key}
                    className={'minesuite-select'}
                    style={{ width: '100%' }}
                    value={value}
                    onChange={(e) => onChange(definition.key, e.target.value)}
                >
                    {!definition.options?.some((option) => option.value === value) && value !== '' && (
                        <option value={value}>{value}</option>
                    )}
                    {(definition.options || []).map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <p className={'minesuite-help'}>{definition.description}</p>
            </div>
        );
    }

    return (
        <div className={'minesuite-card'}>
            <label className={'minesuite-field-label'} htmlFor={definition.key}>
                {definition.label}
            </label>
            <input
                id={definition.key}
                className={'minesuite-input'}
                style={{ width: '100%' }}
                type={definition.type === 'number' ? 'number' : 'text'}
                min={definition.min}
                max={definition.max}
                step={definition.step ?? (definition.type === 'number' ? 1 : undefined)}
                placeholder={definition.placeholder}
                value={value}
                onChange={(e) => onChange(definition.key, e.target.value)}
            />
            <p className={'minesuite-help'}>{definition.description}</p>
        </div>
    );
};

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [tab, setTab] = useState<TabId>('properties');
    const [banner, setBanner] = useState<BannerState | null>(null);

    const [loadingProperties, setLoadingProperties] = useState(true);
    const [savingProperties, setSavingProperties] = useState(false);
    const [properties, setProperties] = useState<Record<string, string>>({});
    const [originalProperties, setOriginalProperties] = useState<Record<string, string>>({});
    const [propertyQuery, setPropertyQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const [loadingAddons, setLoadingAddons] = useState(true);
    const [busyAddons, setBusyAddons] = useState(false);
    const [addons, setAddons] = useState<AddonItem[]>([]);
    const [installed, setInstalled] = useState<InstalledMap>({});
    const [jarFiles, setJarFiles] = useState<JarFile[]>([]);
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
    const [selectedJars, setSelectedJars] = useState<string[]>([]);
    const [addonQuery, setAddonQuery] = useState('');
    const [addonCategory, setAddonCategory] = useState('all');
    const [loader, setLoader] = useState('paper');
    const [gameVersion, setGameVersion] = useState('');

    const showBanner = useCallback((type: BannerState['type'], text: string) => {
        setBanner({ type, text });
    }, []);

    const loadProperties = useCallback(async () => {
        setLoadingProperties(true);
        try {
            const { data } = await http.post('/extensions/minesuite/properties', {
                serverUuid: uuid,
            });
            const props = (data.properties || {}) as Record<string, string>;
            setProperties(props);
            setOriginalProperties(props);
            setBanner(null);
        } catch (error: any) {
            showBanner('error', error?.response?.data?.message || 'Falha ao carregar server.properties.');
        } finally {
            setLoadingProperties(false);
        }
    }, [showBanner, uuid]);

    const loadAddons = useCallback(async () => {
        setLoadingAddons(true);
        try {
            const [catalogRes, filesRes] = await Promise.all([
                http.post('/extensions/minesuite/addons/catalog', { serverUuid: uuid }),
                http.post('/extensions/minesuite/addons/files', {
                    serverUuid: uuid,
                    directory: 'plugins',
                }),
            ]);

            setAddons(catalogRes.data.addons || []);
            setInstalled(catalogRes.data.installed || {});
            setJarFiles(filesRes.data.files || []);
            setBanner(null);
        } catch (error: any) {
            showBanner('error', error?.response?.data?.message || 'Falha ao carregar catálogo de addons.');
        } finally {
            setLoadingAddons(false);
        }
    }, [showBanner, uuid]);

    useEffect(() => {
        loadProperties();
    }, [loadProperties]);

    useEffect(() => {
        if (tab === 'addons') {
            loadAddons();
        }
    }, [loadAddons, tab]);

    const dirtyCount = useMemo(() => {
        const keys = new Set([...Object.keys(properties), ...Object.keys(originalProperties)]);
        let count = 0;
        keys.forEach((key) => {
            if ((properties[key] ?? '') !== (originalProperties[key] ?? '')) {
                count += 1;
            }
        });
        return count;
    }, [originalProperties, properties]);

    const filteredCategories = useMemo(() => {
        const query = propertyQuery.trim().toLowerCase();
        return PROPERTY_CATEGORIES.map((category) => {
            if (categoryFilter !== 'all' && category.id !== categoryFilter) {
                return { ...category, properties: [] };
            }

            const propertiesInCategory = category.properties.filter((property) => {
                if (!query) return true;
                return (
                    property.key.toLowerCase().includes(query) ||
                    property.label.toLowerCase().includes(query) ||
                    property.description.toLowerCase().includes(query)
                );
            });

            return { ...category, properties: propertiesInCategory };
        }).filter((category) => category.properties.length > 0);
    }, [categoryFilter, propertyQuery]);

    const addonCategories = useMemo(() => {
        return Array.from(new Set(addons.map((addon) => addon.category).filter(Boolean))) as string[];
    }, [addons]);

    const filteredAddons = useMemo(() => {
        const query = addonQuery.trim().toLowerCase();
        return addons.filter((addon) => {
            if (addonCategory !== 'all' && addon.category !== addonCategory) return false;
            if (!query) return true;
            return (
                addon.name.toLowerCase().includes(query) ||
                (addon.description || '').toLowerCase().includes(query) ||
                addon.id.toLowerCase().includes(query)
            );
        });
    }, [addonCategory, addonQuery, addons]);

    const updateProperty = (key: string, value: string) => {
        setProperties((current) => ({ ...current, [key]: value }));
    };

    const saveProperties = async () => {
        setSavingProperties(true);
        try {
            const { data } = await http.put('/extensions/minesuite/properties', {
                serverUuid: uuid,
                properties,
            });
            const props = (data.properties || properties) as Record<string, string>;
            setProperties(props);
            setOriginalProperties(props);
            showBanner('info', data.message || 'server.properties salvo. Reinicie o servidor para aplicar.');
        } catch (error: any) {
            showBanner('error', error?.response?.data?.message || 'Não foi possível salvar as propriedades.');
        } finally {
            setSavingProperties(false);
        }
    };

    const resetProperties = () => {
        setProperties(originalProperties);
        showBanner('warn', 'Alterações locais descartadas.');
    };

    const toggleAddonSelection = (id: string) => {
        setSelectedAddons((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
        );
    };

    const toggleJarSelection = (path: string) => {
        setSelectedJars((current) =>
            current.includes(path) ? current.filter((item) => item !== path) : [...current, path]
        );
    };

    const installSelected = async () => {
        if (selectedAddons.length === 0) {
            showBanner('warn', 'Selecione ao menos um addon para instalar.');
            return;
        }

        setBusyAddons(true);
        try {
            const { data } = await http.post(
                '/extensions/minesuite/addons/install',
                {
                    serverUuid: uuid,
                    addonIds: selectedAddons,
                    loader,
                    gameVersion: gameVersion || undefined,
                },
                { timeout: 180000 }
            );
            showBanner(data.success ? 'info' : 'error', data.message || 'Instalação finalizada.');
            setSelectedAddons([]);
            await loadAddons();
        } catch (error: any) {
            showBanner('error', error?.response?.data?.message || 'Falha na instalação dos addons.');
        } finally {
            setBusyAddons(false);
        }
    };

    const removeSelected = async () => {
        const filesFromCatalog = selectedAddons.flatMap((id) => installed[id]?.files || []);
        const files = Array.from(new Set([...filesFromCatalog, ...selectedJars]));

        if (files.length === 0) {
            showBanner('warn', 'Selecione addons instalados ou jars para remover.');
            return;
        }

        setBusyAddons(true);
        try {
            const { data } = await http.post('/extensions/minesuite/addons/remove', {
                serverUuid: uuid,
                files,
            });
            showBanner('info', data.message || 'Addons removidos.');
            setSelectedAddons([]);
            setSelectedJars([]);
            await loadAddons();
        } catch (error: any) {
            showBanner('error', error?.response?.data?.message || 'Falha ao remover addons.');
        } finally {
            setBusyAddons(false);
        }
    };

    return (
        <PageContentBlock title={'MineSuite'}>
            <div className={'minesuite-root'}>
                <div className={'minesuite-shell'}>
                    <div className={'minesuite-header'}>
                        <div>
                            <div className={'minesuite-badge'}>Minecraft Java</div>
                            <h1 className={'minesuite-brand'}>
                                Mine<span>Suite</span>
                            </h1>
                            <p className={'minesuite-subtitle'}>
                                Edite o server.properties com segurança e instale ou remova addons com seleção
                                múltipla — sem abrir o gerenciador de arquivos.
                            </p>
                        </div>

                        <div className={'minesuite-tabs'} role={'tablist'}>
                            <button
                                type={'button'}
                                role={'tab'}
                                className={`minesuite-tab${tab === 'properties' ? ' is-active' : ''}`}
                                onClick={() => setTab('properties')}
                            >
                                Propriedades
                            </button>
                            <button
                                type={'button'}
                                role={'tab'}
                                className={`minesuite-tab${tab === 'addons' ? ' is-active' : ''}`}
                                onClick={() => setTab('addons')}
                            >
                                Addons
                            </button>
                        </div>
                    </div>

                    {banner && <div className={`minesuite-banner ${banner.type}`}>{banner.text}</div>}

                    {tab === 'properties' && (
                        <>
                            <div className={'minesuite-toolbar'}>
                                <input
                                    className={'minesuite-input'}
                                    placeholder={'Buscar propriedade (motd, pvp, view-distance...)'}
                                    value={propertyQuery}
                                    onChange={(e) => setPropertyQuery(e.target.value)}
                                />
                                <select
                                    className={'minesuite-select'}
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    <option value={'all'}>Todas categorias</option>
                                    {PROPERTY_CATEGORIES.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.title}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type={'button'}
                                    className={'minesuite-btn minesuite-btn-ghost'}
                                    onClick={loadProperties}
                                    disabled={loadingProperties || savingProperties}
                                >
                                    Recarregar
                                </button>
                            </div>

                            {loadingProperties ? (
                                <div className={'minesuite-loading'}>
                                    <div className={'minesuite-spinner'} />
                                    Carregando server.properties...
                                </div>
                            ) : filteredCategories.length === 0 ? (
                                <div className={'minesuite-empty'}>Nenhuma propriedade encontrada.</div>
                            ) : (
                                filteredCategories.map((category) => (
                                    <section key={category.id} className={'minesuite-section'}>
                                        <h2 className={'minesuite-section-title'}>{category.title}</h2>
                                        <div className={'minesuite-grid minesuite-props-grid'}>
                                            {category.properties.map((definition) => (
                                                <PropertyField
                                                    key={definition.key}
                                                    definition={definition}
                                                    value={properties[definition.key] ?? ''}
                                                    onChange={updateProperty}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                ))
                            )}

                            <div className={'minesuite-footer-bar'}>
                                <div className={'minesuite-card-meta'} style={{ margin: 0 }}>
                                    {dirtyCount > 0
                                        ? `${dirtyCount} alteração(ões) pendente(s)`
                                        : 'Nenhuma alteração pendente'}
                                </div>
                                <div className={'minesuite-actions'}>
                                    <button
                                        type={'button'}
                                        className={'minesuite-btn minesuite-btn-secondary'}
                                        onClick={resetProperties}
                                        disabled={savingProperties || dirtyCount === 0}
                                    >
                                        Descartar
                                    </button>
                                    <button
                                        type={'button'}
                                        className={'minesuite-btn minesuite-btn-primary'}
                                        onClick={saveProperties}
                                        disabled={savingProperties || dirtyCount === 0}
                                    >
                                        {savingProperties ? 'Salvando...' : 'Salvar propriedades'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {tab === 'addons' && (
                        <>
                            <div className={'minesuite-toolbar'}>
                                <input
                                    className={'minesuite-input'}
                                    placeholder={'Buscar addon...'}
                                    value={addonQuery}
                                    onChange={(e) => setAddonQuery(e.target.value)}
                                />
                                <select
                                    className={'minesuite-select'}
                                    value={addonCategory}
                                    onChange={(e) => setAddonCategory(e.target.value)}
                                >
                                    <option value={'all'}>Todas categorias</option>
                                    {addonCategories.map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className={'minesuite-select'}
                                    value={loader}
                                    onChange={(e) => setLoader(e.target.value)}
                                >
                                    {['paper', 'purpur', 'spigot', 'bukkit', 'fabric', 'forge', 'neoforge', 'quilt'].map(
                                        (item) => (
                                            <option key={item} value={item}>
                                                Loader: {item}
                                            </option>
                                        )
                                    )}
                                </select>
                                <input
                                    className={'minesuite-input'}
                                    style={{ flex: '0 1 140px' }}
                                    placeholder={'Versão MC (ex: 1.21.1)'}
                                    value={gameVersion}
                                    onChange={(e) => setGameVersion(e.target.value)}
                                />
                            </div>

                            {loadingAddons ? (
                                <div className={'minesuite-loading'}>
                                    <div className={'minesuite-spinner'} />
                                    Carregando catálogo...
                                </div>
                            ) : (
                                <>
                                    <section className={'minesuite-section'}>
                                        <h2 className={'minesuite-section-title'}>Catálogo</h2>
                                        {filteredAddons.length === 0 ? (
                                            <div className={'minesuite-empty'}>Nenhum addon no filtro atual.</div>
                                        ) : (
                                            <div className={'minesuite-grid minesuite-addons-grid'}>
                                                {filteredAddons.map((addon) => {
                                                    const isInstalled = Boolean(installed[addon.id]);
                                                    const selected = selectedAddons.includes(addon.id);

                                                    return (
                                                        <button
                                                            type={'button'}
                                                            key={addon.id}
                                                            className={`minesuite-card${selected ? ' is-selected' : ''}`}
                                                            onClick={() => toggleAddonSelection(addon.id)}
                                                            style={{ textAlign: 'left', cursor: 'pointer' }}
                                                        >
                                                            <div className={'minesuite-card-top'}>
                                                                <h3 className={'minesuite-card-title'}>{addon.name}</h3>
                                                                <input
                                                                    className={'minesuite-checkbox'}
                                                                    type={'checkbox'}
                                                                    checked={selected}
                                                                    readOnly
                                                                />
                                                            </div>
                                                            <div className={'minesuite-card-meta'}>
                                                                {addon.category && (
                                                                    <span className={'minesuite-badge category'}>
                                                                        {addon.category}
                                                                    </span>
                                                                )}{' '}
                                                                {isInstalled && (
                                                                    <span className={'minesuite-badge installed'}>
                                                                        Instalado
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className={'minesuite-help'} style={{ marginTop: 0 }}>
                                                                {addon.description}
                                                            </p>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </section>

                                    <section className={'minesuite-section'}>
                                        <h2 className={'minesuite-section-title'}>Jars em /plugins</h2>
                                        {jarFiles.length === 0 ? (
                                            <div className={'minesuite-empty'}>Nenhum .jar encontrado em /plugins.</div>
                                        ) : (
                                            <div className={'minesuite-grid minesuite-addons-grid'}>
                                                {jarFiles.map((file) => {
                                                    const selected = selectedJars.includes(file.path);
                                                    return (
                                                        <button
                                                            type={'button'}
                                                            key={file.path}
                                                            className={`minesuite-card${selected ? ' is-selected' : ''}`}
                                                            onClick={() => toggleJarSelection(file.path)}
                                                            style={{ textAlign: 'left', cursor: 'pointer' }}
                                                        >
                                                            <div className={'minesuite-card-top'}>
                                                                <h3 className={'minesuite-card-title'}>{file.name}</h3>
                                                                <input
                                                                    className={'minesuite-checkbox'}
                                                                    type={'checkbox'}
                                                                    checked={selected}
                                                                    readOnly
                                                                />
                                                            </div>
                                                            <p className={'minesuite-help'} style={{ marginTop: 0 }}>
                                                                {file.path}
                                                            </p>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </section>
                                </>
                            )}

                            <div className={'minesuite-footer-bar'}>
                                <div className={'minesuite-card-meta'} style={{ margin: 0 }}>
                                    {selectedAddons.length} addon(s) · {selectedJars.length} jar(s) selecionado(s)
                                </div>
                                <div className={'minesuite-actions'}>
                                    <button
                                        type={'button'}
                                        className={'minesuite-btn minesuite-btn-ghost'}
                                        onClick={loadAddons}
                                        disabled={busyAddons || loadingAddons}
                                    >
                                        Atualizar
                                    </button>
                                    <button
                                        type={'button'}
                                        className={'minesuite-btn minesuite-btn-danger'}
                                        onClick={removeSelected}
                                        disabled={busyAddons}
                                    >
                                        Remover selecionados
                                    </button>
                                    <button
                                        type={'button'}
                                        className={'minesuite-btn minesuite-btn-primary'}
                                        onClick={installSelected}
                                        disabled={busyAddons || selectedAddons.length === 0}
                                    >
                                        {busyAddons ? 'Processando...' : 'Instalar selecionados'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </PageContentBlock>
    );
};
