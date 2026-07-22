import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ServerContext } from '@/state/server';
import http from '@/api/http';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';

type TopMode = 'browse' | 'manage';
type View = 'home' | 'details';
type DetailsTab = 'description' | 'versions';

type Provider = 'modrinth' | 'hangar' | 'spigot' | 'curseforge';

interface PluginCard {
    id: string | number;
    name: string;
    slug: string;
    summary: string;
    author: string;
    authors: string[];
    download_count: number;
    thumbs_up: number;
    logo: string | null;
    url: string | null;
    categories: string[];
    loaders: string[];
    game_versions: string[];
    date_created: string | null;
    date_modified: string | null;
    description_html?: string;
    main_file_id?: number;
    provider?: Provider;
}

interface PluginFile {
    id: string | number;
    display_name: string;
    file_name: string;
    download_count: number;
    file_date: string | null;
    loaders: string[];
    game_versions: string[];
}

interface InstalledPlugin {
    file_name: string;
    name: string;
    version: string | null;
    provider: Provider | null;
    plugin_id: string | number | null;
    file_id: string | number | null;
    logo: string | null;
    installed_at: string | null;
    tracked: boolean;
    update_available: boolean;
    latest_file_id: string | number | null;
    latest_version: string | null;
}

interface FiltersMeta {
    loaders: Record<string, string>;
    sorts: Record<string, string>;
    page_sizes: number[];
    providers: Record<string, string>;
    provider: Provider;
    curseforge_configured?: boolean;
}

const pluginInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    return (name.slice(0, 2) || 'PL').toUpperCase();
};

const PluginLogo = ({
    name,
    logo,
    className,
}: {
    name: string;
    logo: string | null;
    className: string;
}) => {
    const [failed, setFailed] = useState(false);

    if (logo && !failed) {
        return (
            <img
                className={className}
                src={logo}
                alt={name}
                onError={() => setFailed(true)}
            />
        );
    }

    return <div className={`${className} pl-logo-fallback`}>{pluginInitials(name)}</div>;
};

const formatCount = (n: number) =>
    new Intl.NumberFormat('pt-BR', { notation: n >= 10000 ? 'compact' : 'standard' }).format(n);

const timeAgo = (iso?: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso).getTime();
    if (Number.isNaN(d)) return '—';
    const diff = Date.now() - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${Math.max(1, mins)} min atrás`;
    const hours = Math.floor(mins / 60);
    if (hours < 48) return `${hours} h atrás`;
    const days = Math.floor(hours / 24);
    if (days < 60) return `${days} dias atrás`;
    const months = Math.floor(days / 30);
    if (months < 24) return `${months} meses atrás`;
    return `${Math.floor(months / 12)} anos atrás`;
};

const cardFromInstalled = (item: InstalledPlugin): PluginCard => ({
    id: item.plugin_id ?? '',
    name: item.name,
    slug: '',
    summary: '',
    author: '',
    authors: [],
    download_count: 0,
    thumbs_up: 0,
    logo: item.logo,
    url: null,
    categories: [],
    loaders: [],
    game_versions: [],
    date_created: null,
    date_modified: null,
    provider: item.provider ?? undefined,
});

const PluginsSection = () => {
    const uuid = ServerContext.useStoreState((s) => s.server.data!.uuid);

    const [topMode, setTopMode] = useState<TopMode>('browse');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [apiConfigured, setApiConfigured] = useState(true);
    const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
    const [plugins, setPlugins] = useState<PluginCard[]>([]);
    const [filtersMeta, setFiltersMeta] = useState<FiltersMeta | null>(null);
    const [pagination, setPagination] = useState({ index: 0, pageSize: 48, totalCount: 0 });

    const [provider, setProvider] = useState<Provider>('modrinth');
    const [search, setSearch] = useState('');
    const [searchDraft, setSearchDraft] = useState('');
    const [loader, setLoader] = useState('');
    const [sort, setSort] = useState('downloads');
    const [pageSize, setPageSize] = useState('48');
    const [gameVersion, setGameVersion] = useState('');

    const [view, setView] = useState<View>('home');
    const [detailsReturn, setDetailsReturn] = useState<TopMode>('browse');
    const [detailsTab, setDetailsTab] = useState<DetailsTab>('description');
    const [selected, setSelected] = useState<PluginCard | null>(null);
    const [files, setFiles] = useState<PluginFile[]>([]);
    const [filesLoading, setFilesLoading] = useState(false);

    const [installedLoading, setInstalledLoading] = useState(false);
    const [installed, setInstalled] = useState<InstalledPlugin[]>([]);
    const [installedError, setInstalledError] = useState<string | null>(null);
    const [manageSearch, setManageSearch] = useState('');
    const [manageSort, setManageSort] = useState<'name' | 'updates'>('name');

    const [installModal, setInstallModal] = useState<{ plugin: PluginCard; files: PluginFile[] } | null>(
        null
    );
    const [updateModal, setUpdateModal] = useState<{
        item: InstalledPlugin;
        plugin: PluginCard | null;
        files: PluginFile[];
    } | null>(null);
    const [deleteModal, setDeleteModal] = useState<InstalledPlugin | null>(null);

    const [selectedFileId, setSelectedFileId] = useState<string | number | null>(null);
    const [installing, setInstalling] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const apiBase = `/api/client/extensions/mcplugins/servers/${uuid}/plugins`;

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        window.setTimeout(() => setToast(null), 4500);
    };

    const providerQuery = (p: Provider = provider) => `provider=${encodeURIComponent(p)}`;

    const filteredInstalled = useMemo(() => {
        let list = [...installed];
        const q = manageSearch.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (item) =>
                    item.name.toLowerCase().includes(q) ||
                    item.file_name.toLowerCase().includes(q) ||
                    (item.version || '').toLowerCase().includes(q)
            );
        }
        if (manageSort === 'updates') {
            list.sort((a, b) => Number(b.update_available) - Number(a.update_available));
        } else {
            list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        }

        return list;
    }, [installed, manageSearch, manageSort]);

    const loadList = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                search,
                loader,
                sort,
                page_size: pageSize,
                index: String(pagination.index),
                provider,
            });
            if (gameVersion.trim()) params.set('game_version', gameVersion.trim());

            const { data: res } = await http.get(`${apiBase}?${params}`);
            if (!res.success) {
                setError(res.message || 'Falha ao carregar plugins.');
                return;
            }
            const configured = provider === 'curseforge' ? !!res.data.api_configured : true;
            setApiConfigured(configured);
            setEmptyMessage(res.data.message || null);
            setPlugins(
                (res.data.plugins || []).map((p: PluginCard) => ({
                    ...p,
                    provider: p.provider || provider,
                }))
            );
            setFiltersMeta(res.data.filters || null);
            setPagination({
                index: res.data.pagination?.index ?? 0,
                pageSize: res.data.pagination?.pageSize ?? 48,
                totalCount: res.data.pagination?.totalCount ?? 0,
            });
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Erro ao carregar plugins.');
        } finally {
            setLoading(false);
        }
    }, [apiBase, search, loader, sort, pageSize, gameVersion, pagination.index, provider]);

    const loadInstalled = useCallback(async () => {
        setInstalledLoading(true);
        setInstalledError(null);
        try {
            const { data: res } = await http.get(`${apiBase}/installed`);
            if (!res.success) {
                setInstalledError(res.message || 'Falha ao carregar plugins instalados.');
                return;
            }
            setApiConfigured(true);
            setInstalled(res.data.plugins || []);
        } catch (err: any) {
            setInstalledError(err?.response?.data?.message || 'Erro ao carregar plugins instalados.');
        } finally {
            setInstalledLoading(false);
        }
    }, [apiBase]);

    useEffect(() => {
        if (topMode === 'browse' && view === 'home') {
            loadList();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topMode, view, uuid, search, loader, sort, pageSize, gameVersion, pagination.index, provider]);

    useEffect(() => {
        if (topMode === 'manage') {
            loadInstalled();
        }
    }, [topMode, loadInstalled]);

    const resolveProvider = (plugin?: PluginCard | null, item?: InstalledPlugin | null): Provider =>
        plugin?.provider || item?.provider || provider;

    const openDetails = async (plugin: PluginCard, from: TopMode = 'browse') => {
        const itemProvider = resolveProvider(plugin);
        setDetailsReturn(from);
        setView('details');
        setDetailsTab('description');
        setSelected({ ...plugin, provider: itemProvider });
        setFiles([]);
        if (!plugin.id) return;
        try {
            const { data: res } = await http.get(
                `${apiBase}/${encodeURIComponent(String(plugin.id))}?${providerQuery(itemProvider)}`
            );
            if (res.success) setSelected({ ...res.data, provider: itemProvider });
        } catch {
            // keep card data
        }
    };

    const loadFiles = async (pluginId: string | number, itemProvider: Provider = provider) => {
        setFilesLoading(true);
        try {
            const { data: res } = await http.get(
                `${apiBase}/${encodeURIComponent(String(pluginId))}/files?${providerQuery(itemProvider)}`
            );
            if (res.success) setFiles(res.data.data || []);
        } catch {
            setFiles([]);
        } finally {
            setFilesLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'details' && detailsTab === 'versions' && selected?.id) {
            loadFiles(selected.id, resolveProvider(selected));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, detailsTab, selected?.id, selected?.provider]);

    const fetchPluginFiles = async (
        pluginId: string | number,
        itemProvider: Provider = provider
    ): Promise<PluginFile[]> => {
        try {
            const { data: res } = await http.get(
                `${apiBase}/${encodeURIComponent(String(pluginId))}/files?${providerQuery(itemProvider)}`
            );
            return res.data?.data || [];
        } catch {
            return [];
        }
    };

    const openInstall = async (plugin: PluginCard, presetFiles?: PluginFile[]) => {
        const itemProvider = resolveProvider(plugin);
        const list = presetFiles ?? (await fetchPluginFiles(plugin.id, itemProvider));
        setSelectedFileId(list?.[0]?.id ?? null);
        setInstallModal({ plugin: { ...plugin, provider: itemProvider }, files: list || [] });
    };

    const handleInstall = async () => {
        if (!installModal || selectedFileId === null || selectedFileId === '') return;
        const itemProvider = resolveProvider(installModal.plugin);
        setInstalling(true);
        try {
            const { data: res } = await http.post(`${apiBase}/install`, {
                provider: itemProvider,
                plugin_id: installModal.plugin.id,
                file_id: selectedFileId,
            });
            if (res.success) {
                showToast('success', res.message || 'Plugin instalado!');
                setInstallModal(null);
                setView('home');
                await loadList();
            } else {
                showToast('error', res.message || 'Falha na instalação.');
            }
        } catch (err: any) {
            showToast('error', err?.response?.data?.message || 'Erro ao instalar o plugin.');
        } finally {
            setInstalling(false);
        }
    };

    const openUpdate = async (item: InstalledPlugin) => {
        if (!item.plugin_id) {
            showToast('error', 'Este plugin não foi instalado pelo gerenciador e não pode ser atualizado.');
            return;
        }
        const itemProvider = item.provider || 'modrinth';
        let plugin: PluginCard | null = { ...cardFromInstalled(item), provider: itemProvider };
        try {
            const { data: res } = await http.get(
                `${apiBase}/${encodeURIComponent(String(item.plugin_id))}?${providerQuery(itemProvider)}`
            );
            if (res.success) plugin = { ...res.data, provider: itemProvider };
        } catch {
            // keep minimal data
        }
        const list = await fetchPluginFiles(item.plugin_id, itemProvider);
        const defaultId =
            item.latest_file_id && list.some((f) => String(f.id) === String(item.latest_file_id))
                ? item.latest_file_id
                : list[0]?.id ?? null;
        setSelectedFileId(defaultId);
        setUpdateModal({ item, plugin, files: list });
    };

    const handleUpdate = async () => {
        if (!updateModal?.item.plugin_id || selectedFileId === null || selectedFileId === '') return;
        const itemProvider = updateModal.item.provider || 'modrinth';
        setUpdating(true);
        try {
            const { data: res } = await http.post(`${apiBase}/update`, {
                provider: itemProvider,
                plugin_id: updateModal.item.plugin_id,
                file_id: selectedFileId,
            });
            if (res.success) {
                showToast('success', res.message || 'Plugin atualizado!');
                setUpdateModal(null);
                await loadInstalled();
            } else {
                showToast('error', res.message || 'Falha na atualização.');
            }
        } catch (err: any) {
            showToast('error', err?.response?.data?.message || 'Erro ao atualizar o plugin.');
        } finally {
            setUpdating(false);
        }
    };

    const handleRemove = async () => {
        if (!deleteModal) return;
        setRemoving(true);
        try {
            const { data: res } = await http.post(`${apiBase}/remove`, {
                file_name: deleteModal.file_name,
            });
            if (res.success) {
                showToast('success', res.message || 'Plugin removido!');
                setDeleteModal(null);
                await loadInstalled();
            } else {
                showToast('error', res.message || 'Falha ao remover.');
            }
        } catch (err: any) {
            showToast('error', err?.response?.data?.message || 'Erro ao remover o plugin.');
        } finally {
            setRemoving(false);
        }
    };

    const installSelectedFile = useMemo(
        () => installModal?.files.find((f) => String(f.id) === String(selectedFileId)) || null,
        [installModal, selectedFileId]
    );

    const updateSelectedFile = useMemo(
        () => updateModal?.files.find((f) => String(f.id) === String(selectedFileId)) || null,
        [updateModal, selectedFileId]
    );

    const defaultSortFor = (p: Provider) => {
        switch (p) {
            case 'hangar':
                return 'downloads';
            case 'spigot':
                return '-downloads';
            case 'curseforge':
                return '2';
            default:
                return 'downloads';
        }
    };

    const providerLabel = (p: Provider) => {
        switch (p) {
            case 'modrinth':
                return 'Modrinth';
            case 'hangar':
                return 'Hangar';
            case 'spigot':
                return 'SpigotMC';
            default:
                return 'CurseForge';
        }
    };

    const totalPages = Math.max(1, Math.ceil(pagination.totalCount / pagination.pageSize));
    const currentPage = Math.floor(pagination.index / pagination.pageSize) + 1;

    const switchTopMode = (mode: TopMode) => {
        setTopMode(mode);
        setView('home');
        setSelected(null);
        setError(null);
    };

    const handleBackFromDetails = () => {
        setView('home');
        setSelected(null);
        if (detailsReturn === 'manage') {
            setTopMode('manage');
        }
    };

    if (topMode === 'browse' && loading && plugins.length === 0 && !error && view === 'home') {
        return (
            <PageContentBlock title={'Plugins'}>
                <div className={'pl-loading'}>
                    <Spinner size={'large'} />
                    <span>Carregando plugins...</span>
                </div>
            </PageContentBlock>
        );
    }

    return (
        <PageContentBlock title={'Plugins'}>
            <div className={'pl-page'}>
                {toast && (
                    <div className={`pl-toast pl-toast--${toast.type}`}>{toast.message}</div>
                )}

                <div className={'pl-mode-tabs'}>
                    <button
                        type={'button'}
                        className={`pl-mode-btn${topMode === 'browse' ? ' is-on' : ''}`}
                        onClick={() => switchTopMode('browse')}
                    >
                        Buscar Plugins
                    </button>
                    <button
                        type={'button'}
                        className={`pl-mode-btn${topMode === 'manage' ? ' is-on' : ''}`}
                        onClick={() => switchTopMode('manage')}
                    >
                        Gerenciar Plugins
                    </button>
                </div>

                {view === 'details' && selected ? (
                    <>
                        <button type={'button'} className={'pl-back'} onClick={handleBackFromDetails}>
                            ← Voltar {detailsReturn === 'manage' ? 'ao Gerenciamento' : 'aos Plugins'}
                        </button>

                        <div className={'pl-detail-head'}>
                            <PluginLogo
                                name={selected.name}
                                logo={selected.logo}
                                className={'pl-detail-head__logo'}
                            />
                            <div className={'pl-detail-head__body'}>
                                <h2>{selected.name}</h2>
                                <div className={'pl-card__stats'}>
                                    <span>↓ {formatCount(selected.download_count)}</span>
                                    <span>♥ {formatCount(selected.thumbs_up)}</span>
                                </div>
                                <p>{selected.summary}</p>
                            </div>
                            <div className={'pl-detail-head__actions'}>
                                {selected.url && (
                                    <a
                                        className={'pl-icon-btn'}
                                        href={selected.url}
                                        target={'_blank'}
                                        rel={'noreferrer'}
                                    >
                                        ↗
                                    </a>
                                )}
                                {selected.id && (
                                    <button
                                        type={'button'}
                                        className={'pl-btn pl-btn--primary'}
                                        onClick={() => openInstall(selected, files)}
                                    >
                                        Instalar
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className={'pl-detail-layout'}>
                            <div>
                                <div className={'pl-tabs'}>
                                    <button
                                        type={'button'}
                                        className={detailsTab === 'description' ? 'is-on' : ''}
                                        onClick={() => setDetailsTab('description')}
                                    >
                                        Descrição
                                    </button>
                                    <button
                                        type={'button'}
                                        className={detailsTab === 'versions' ? 'is-on' : ''}
                                        onClick={() => setDetailsTab('versions')}
                                    >
                                        Versões {files.length ? `(${files.length})` : ''}
                                    </button>
                                </div>

                                {detailsTab === 'description' ? (
                                    <div
                                        className={'pl-description'}
                                        dangerouslySetInnerHTML={{
                                            __html:
                                                selected.description_html ||
                                                `<p>${selected.summary || 'Sem descrição.'}</p>`,
                                        }}
                                    />
                                ) : filesLoading ? (
                                    <div className={'pl-loading'}>
                                        <Spinner size={'large'} />
                                    </div>
                                ) : (
                                    <div className={'pl-versions'}>
                                        {files.map((f) => (
                                            <div key={f.id} className={'pl-version'}>
                                                <div>
                                                    <div className={'pl-version__name'}>
                                                        {f.display_name}
                                                    </div>
                                                    <div className={'pl-version__meta'}>
                                                        ↓ {formatCount(f.download_count)} ·{' '}
                                                        {timeAgo(f.file_date)}
                                                        {f.loaders[0] && (
                                                            <> · Loader: {f.loaders[0]}</>
                                                        )}
                                                        {f.game_versions[0] && (
                                                            <> · MC: {f.game_versions[0]}</>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    type={'button'}
                                                    className={'pl-btn pl-btn--primary'}
                                                    onClick={() => {
                                                        setSelectedFileId(f.id);
                                                        setInstallModal({
                                                            plugin: selected,
                                                            files,
                                                        });
                                                    }}
                                                >
                                                    Instalar
                                                </button>
                                            </div>
                                        ))}
                                        {files.length === 0 && (
                                            <div className={'pl-empty'}>
                                                Nenhuma versão encontrada.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <aside className={'pl-side'}>
                                <div className={'pl-side__block'}>
                                    <div className={'pl-side__title'}>Categorias</div>
                                    <div className={'pl-tags'}>
                                        {(selected.categories || []).map((c) => (
                                            <span key={c} className={'pl-tag'}>
                                                {c}
                                            </span>
                                        ))}
                                        {!selected.categories?.length && (
                                            <span className={'pl-muted'}>—</span>
                                        )}
                                    </div>
                                </div>
                                <div className={'pl-side__block'}>
                                    <div className={'pl-side__title'}>Loaders</div>
                                    <div className={'pl-tags'}>
                                        {(selected.loaders || []).map((c) => (
                                            <span key={c} className={'pl-tag'}>
                                                {c}
                                            </span>
                                        ))}
                                        {!selected.loaders?.length && (
                                            <span className={'pl-muted'}>—</span>
                                        )}
                                    </div>
                                </div>
                                <div className={'pl-side__block'}>
                                    <div className={'pl-side__title'}>Versões do jogo</div>
                                    <div className={'pl-tags'}>
                                        {(selected.game_versions || []).slice(0, 8).map((c) => (
                                            <span key={c} className={'pl-tag'}>
                                                {c}
                                            </span>
                                        ))}
                                        {!selected.game_versions?.length && (
                                            <span className={'pl-muted'}>—</span>
                                        )}
                                    </div>
                                </div>
                                <div className={'pl-side__block'}>
                                    <div className={'pl-side__title'}>Detalhes</div>
                                    <div className={'pl-side__row'}>
                                        Atualizado {timeAgo(selected.date_modified)}
                                    </div>
                                    <div className={'pl-side__row'}>
                                        Publicado {timeAgo(selected.date_created)}
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </>
                ) : topMode === 'manage' ? (
                    <>
                        {installedLoading && installed.length === 0 && (
                            <div className={'pl-loading'}>
                                <Spinner size={'large'} />
                                <span>Carregando plugins instalados...</span>
                            </div>
                        )}

                        {installedError && (
                            <div className={'pl-alert pl-alert--error'}>{installedError}</div>
                        )}

                        {!installedLoading && installed.length === 0 && (
                            <div className={'pl-empty'}>
                                <h3>Nenhum plugin instalado</h3>
                                <p>
                                    Não há arquivos <code>.jar</code> na pasta{' '}
                                    <code>/plugins</code> deste servidor.
                                </p>
                            </div>
                        )}

                        {installed.length > 0 && (
                            <div className={'pl-manage-toolbar'}>
                                <div className={'pl-manage-field'}>
                                    <label>Ordenar</label>
                                    <select
                                        className={'pl-select'}
                                        value={manageSort}
                                        onChange={(e) =>
                                            setManageSort(e.target.value as 'name' | 'updates')
                                        }
                                    >
                                        <option value={'name'}>
                                            Todos os plugins ({installed.length})
                                        </option>
                                        <option value={'updates'}>Atualizações primeiro</option>
                                    </select>
                                </div>
                                <div className={'pl-manage-field pl-manage-field--grow'}>
                                    <label>Buscar</label>
                                    <input
                                        className={'pl-input'}
                                        placeholder={'Buscar plugins instalados...'}
                                        value={manageSearch}
                                        onChange={(e) => setManageSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div className={'pl-manage-grid'}>
                            {filteredInstalled.map((item) => (
                                <div
                                    key={item.file_name}
                                    className={`pl-manage-card${item.update_available ? ' pl-manage-card--update' : ''}`}
                                >
                                    <div className={'pl-manage-card__head'}>
                                        <PluginLogo
                                            name={item.name}
                                            logo={item.logo}
                                            className={'pl-manage-card__logo'}
                                        />
                                        <div className={'pl-manage-card__info'}>
                                            <div className={'pl-manage-card__name'}>{item.name}</div>
                                            <div className={'pl-manage-card__versions'}>
                                                {item.version && (
                                                    <span className={'pl-ver pl-ver--current'}>
                                                        <span className={'pl-ver__icon'}>📌</span>
                                                        {item.version}
                                                    </span>
                                                )}
                                                {item.update_available && item.latest_version && (
                                                    <span className={'pl-ver pl-ver--new'}>
                                                        <span className={'pl-ver__icon'}>↻</span>
                                                        {item.latest_version}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={'pl-manage-card__file'}>
                                                {item.file_name}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={'pl-manage-card__footer'}>
                                        <button
                                            type={'button'}
                                            className={`pl-btn pl-btn--ghost pl-btn--block${item.update_available ? ' pl-btn--update-ready' : ''}`}
                                            disabled={!item.update_available || !item.plugin_id}
                                            onClick={() => item.plugin_id && openUpdate(item)}
                                        >
                                            ↻ Atualizar
                                        </button>
                                        <button
                                            type={'button'}
                                            className={'pl-btn pl-btn--ghost pl-btn--block'}
                                            disabled={!item.plugin_id}
                                            onClick={() =>
                                                item.plugin_id &&
                                                openDetails(cardFromInstalled(item), 'manage')
                                            }
                                        >
                                            ℹ Detalhes
                                        </button>
                                        <button
                                            type={'button'}
                                            className={'pl-btn pl-btn--danger pl-btn--block'}
                                            onClick={() => setDeleteModal(item)}
                                        >
                                            🗑 Remover
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {installed.length > 0 && filteredInstalled.length === 0 && (
                            <div className={'pl-empty'}>
                                <p>Nenhum plugin encontrado com essa busca.</p>
                            </div>
                        )}
                    </>
                ) : view === 'home' ? (
                    <>
                        <div className={'pl-filters'}>
                            <select
                                className={'pl-select'}
                                value={provider}
                                title={'Provedor'}
                                onChange={(e) => {
                                    const next = e.target.value as Provider;
                                    setProvider(next);
                                    setSort(defaultSortFor(next));
                                    setLoader('');
                                    setPagination((p) => ({ ...p, index: 0 }));
                                }}
                            >
                                {Object.entries(filtersMeta?.providers || {
                                    modrinth: 'Modrinth',
                                    hangar: 'Hangar',
                                    spigot: 'SpigotMC',
                                    curseforge: 'CurseForge',
                                }).map(([k, v]) => (
                                    <option key={k} value={k}>
                                        {v}
                                    </option>
                                ))}
                            </select>
                            <select
                                className={'pl-select'}
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(e.target.value);
                                    setPagination((p) => ({ ...p, index: 0 }));
                                }}
                            >
                                {(filtersMeta?.page_sizes || [24, 48]).map((n) => (
                                    <option key={n} value={n}>
                                        {n} por página
                                    </option>
                                ))}
                            </select>
                            <select
                                className={'pl-select'}
                                value={sort}
                                onChange={(e) => {
                                    setSort(e.target.value);
                                    setPagination((p) => ({ ...p, index: 0 }));
                                }}
                            >
                                {Object.entries(filtersMeta?.sorts || {}).map(([k, v]) => (
                                    <option key={k} value={k}>
                                        {v}
                                    </option>
                                ))}
                            </select>
                            <select
                                className={'pl-select'}
                                value={loader}
                                onChange={(e) => {
                                    setLoader(e.target.value);
                                    setPagination((p) => ({ ...p, index: 0 }));
                                }}
                            >
                                {Object.entries(filtersMeta?.loaders || { '': 'Qualquer' }).map(
                                    ([k, v]) => (
                                        <option key={k || 'any'} value={k}>
                                            {v}
                                        </option>
                                    )
                                )}
                            </select>
                            <input
                                className={'pl-input'}
                                placeholder={'Versão MC (ex: 1.20.1)'}
                                value={gameVersion}
                                onChange={(e) => setGameVersion(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setPagination((p) => ({ ...p, index: 0 }));
                                        loadList();
                                    }
                                }}
                            />
                            <div className={'pl-search'}>
                                <input
                                    className={'pl-input'}
                                    placeholder={'Buscar plugins...'}
                                    value={searchDraft}
                                    onChange={(e) => setSearchDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setSearch(searchDraft);
                                            setPagination((p) => ({ ...p, index: 0 }));
                                        }
                                    }}
                                />
                                <button
                                    type={'button'}
                                    className={'pl-btn pl-btn--ghost'}
                                    onClick={() => {
                                        setSearch(searchDraft);
                                        setPagination((p) => ({ ...p, index: 0 }));
                                    }}
                                >
                                    Buscar
                                </button>
                            </div>
                        </div>

                        {error && <div className={'pl-alert pl-alert--error'}>{error}</div>}

                        {!apiConfigured && provider === 'curseforge' && (
                            <div className={'pl-empty'}>
                                <h3>Não encontramos nenhum plugin</h3>
                                <p>
                                    Configure a API Key do CurseForge em{' '}
                                    <strong>Admin → Extensions → MC Plugins</strong>.
                                </p>
                            </div>
                        )}

                        {apiConfigured && plugins.length === 0 && (
                            <div className={'pl-empty'}>
                                <h3>Não encontramos nenhum plugin</h3>
                                <p>{emptyMessage || 'Tente outros filtros ou outra busca.'}</p>
                            </div>
                        )}

                        <div className={'pl-grid'}>
                            {plugins.map((plugin) => (
                                <div key={`${provider}-${plugin.id}`} className={'pl-card'}>
                                    <div className={'pl-card__top'}>
                                        <PluginLogo
                                            name={plugin.name}
                                            logo={plugin.logo}
                                            className={'pl-card__logo'}
                                        />
                                        <div>
                                            <div className={'pl-card__name'}>{plugin.name}</div>
                                            <div className={'pl-card__stats'}>
                                                <span>↓ {formatCount(plugin.download_count)}</span>
                                                <span>♥ {formatCount(plugin.thumbs_up)}</span>
                                            </div>
                                            <div className={'pl-card__author'}>
                                                por {plugin.author}
                                            </div>
                                        </div>
                                    </div>
                                    <p className={'pl-card__summary'}>{plugin.summary}</p>
                                    <div className={'pl-card__actions'}>
                                        {plugin.url && (
                                            <a
                                                className={'pl-icon-btn'}
                                                href={plugin.url}
                                                target={'_blank'}
                                                rel={'noreferrer'}
                                                title={`Abrir no ${providerLabel(resolveProvider(plugin))}`}
                                            >
                                                ↗
                                            </a>
                                        )}
                                        <button
                                            type={'button'}
                                            className={'pl-btn pl-btn--ghost'}
                                            onClick={() => openDetails(plugin)}
                                        >
                                            Detalhes
                                        </button>
                                        <button
                                            type={'button'}
                                            className={'pl-btn pl-btn--primary'}
                                            onClick={() => openInstall(plugin)}
                                        >
                                            Instalar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {apiConfigured && pagination.totalCount > pagination.pageSize && (
                            <div className={'pl-pager'}>
                                <button
                                    type={'button'}
                                    className={'pl-btn pl-btn--ghost'}
                                    disabled={pagination.index <= 0}
                                    onClick={() =>
                                        setPagination((p) => ({
                                            ...p,
                                            index: Math.max(0, p.index - p.pageSize),
                                        }))
                                    }
                                >
                                    ← Anterior
                                </button>
                                <span>
                                    Página {currentPage} de {totalPages}
                                </span>
                                <button
                                    type={'button'}
                                    className={'pl-btn pl-btn--ghost'}
                                    disabled={currentPage >= totalPages}
                                    onClick={() =>
                                        setPagination((p) => ({
                                            ...p,
                                            index: p.index + p.pageSize,
                                        }))
                                    }
                                >
                                    Próxima →
                                </button>
                            </div>
                        )}
                    </>
                ) : null}

                {installModal && (
                    <div
                        className={'pl-modal-backdrop'}
                        onClick={() => !installing && setInstallModal(null)}
                    >
                        <div className={'pl-modal'} onClick={(e) => e.stopPropagation()}>
                            <div className={'pl-modal__header'}>
                                <h3>Instalar Plugin</h3>
                                <button
                                    type={'button'}
                                    className={'pl-modal__close'}
                                    disabled={installing}
                                    onClick={() => setInstallModal(null)}
                                >
                                    ×
                                </button>
                            </div>

                            <div className={'pl-modal__pack'}>
                                <img src={installModal.plugin.logo || ''} alt={installModal.plugin.name} />
                                <div>
                                    <div className={'pl-modal__name'}>{installModal.plugin.name}</div>
                                    <div className={'pl-muted'}>por {installModal.plugin.author}</div>
                                    <div className={'pl-card__stats'}>
                                        ↓ {formatCount(installModal.plugin.download_count)}
                                    </div>
                                </div>
                            </div>

                            <label className={'pl-field-label'}>Selecionar versão</label>
                            <select
                                className={'pl-select pl-select--full'}
                                value={selectedFileId ?? ''}
                                onChange={(e) => setSelectedFileId(e.target.value)}
                            >
                                {installModal.files.map((f) => (
                                    <option key={String(f.id)} value={String(f.id)}>
                                        {f.display_name}
                                    </option>
                                ))}
                            </select>
                            {installSelectedFile && (
                                <div className={'pl-build-meta'}>
                                    ↓ {formatCount(installSelectedFile.download_count)} · Publicado{' '}
                                    {timeAgo(installSelectedFile.file_date)}
                                </div>
                            )}

                            <div className={'pl-modal__actions'}>
                                <button
                                    type={'button'}
                                    className={'pl-btn pl-btn--ghost'}
                                    disabled={installing}
                                    onClick={() => setInstallModal(null)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type={'button'}
                                    className={'pl-btn pl-btn--primary'}
                                    disabled={installing || !selectedFileId}
                                    onClick={handleInstall}
                                >
                                    {installing ? 'Baixando e instalando...' : 'Instalar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {updateModal && (
                    <div
                        className={'pl-modal-backdrop'}
                        onClick={() => !updating && setUpdateModal(null)}
                    >
                        <div className={'pl-modal'} onClick={(e) => e.stopPropagation()}>
                            <div className={'pl-modal__header'}>
                                <h3>Atualizar Plugin</h3>
                                <button
                                    type={'button'}
                                    className={'pl-modal__close'}
                                    disabled={updating}
                                    onClick={() => setUpdateModal(null)}
                                >
                                    ×
                                </button>
                            </div>

                            <div className={'pl-modal__pack'}>
                                {updateModal.plugin?.logo || updateModal.item.logo ? (
                                    <img
                                        src={updateModal.plugin?.logo || updateModal.item.logo || ''}
                                        alt={updateModal.item.name}
                                    />
                                ) : (
                                    <div className={'pl-manage-card__logo-placeholder'}>PL</div>
                                )}
                                <div>
                                    <div className={'pl-modal__name'}>{updateModal.item.name}</div>
                                    {updateModal.item.version && (
                                        <div className={'pl-muted'}>
                                            Versão atual: {updateModal.item.version}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <label className={'pl-field-label'}>Selecionar versão</label>
                            <select
                                className={'pl-select pl-select--full'}
                                value={selectedFileId ?? ''}
                                onChange={(e) => setSelectedFileId(e.target.value)}
                            >
                                {updateModal.files.map((f) => (
                                    <option key={String(f.id)} value={String(f.id)}>
                                        {f.display_name}
                                    </option>
                                ))}
                            </select>
                            {updateSelectedFile && (
                                <div className={'pl-build-meta'}>
                                    ↓ {formatCount(updateSelectedFile.download_count)} · Publicado{' '}
                                    {timeAgo(updateSelectedFile.file_date)}
                                </div>
                            )}

                            <div className={'pl-modal__actions'}>
                                <button
                                    type={'button'}
                                    className={'pl-btn pl-btn--ghost'}
                                    disabled={updating}
                                    onClick={() => setUpdateModal(null)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type={'button'}
                                    className={'pl-btn pl-btn--primary'}
                                    disabled={updating || !selectedFileId}
                                    onClick={handleUpdate}
                                >
                                    {updating ? 'Atualizando...' : 'Atualizar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {deleteModal && (
                    <div
                        className={'pl-modal-backdrop'}
                        onClick={() => !removing && setDeleteModal(null)}
                    >
                        <div className={'pl-modal pl-modal--sm'} onClick={(e) => e.stopPropagation()}>
                            <div className={'pl-modal__header'}>
                                <h3>Remover Plugin</h3>
                                <button
                                    type={'button'}
                                    className={'pl-modal__close'}
                                    disabled={removing}
                                    onClick={() => setDeleteModal(null)}
                                >
                                    ×
                                </button>
                            </div>

                            <p className={'pl-modal__text'}>
                                Tem certeza que deseja remover <strong>{deleteModal.name}</strong> (
                                <code>{deleteModal.file_name}</code>) do servidor? O arquivo será
                                excluído da pasta <code>/plugins</code>.
                            </p>

                            <div className={'pl-modal__actions'}>
                                <button
                                    type={'button'}
                                    className={'pl-btn pl-btn--ghost'}
                                    disabled={removing}
                                    onClick={() => setDeleteModal(null)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type={'button'}
                                    className={'pl-btn pl-btn--danger'}
                                    disabled={removing}
                                    onClick={handleRemove}
                                >
                                    {removing ? 'Removendo...' : 'Remover'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageContentBlock>
    );
};

export default PluginsSection;
