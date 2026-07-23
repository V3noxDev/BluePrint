import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ServerContext } from '@/state/server';
import http from '@/api/http';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';
import BiIcon from '../elements/BiIcon';

type View = 'home' | 'details';
type DetailsTab = 'description' | 'versions';

interface ModpackCard {
    id: number;
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
}

interface ModpackFile {
    id: number;
    display_name: string;
    file_name: string;
    download_count: number;
    file_date: string | null;
    loaders: string[];
    game_versions: string[];
    server_pack_file_id: number | null;
    is_server_pack: boolean;
}

interface InstalledPack {
    modpack_id: number;
    file_id: number;
    name: string;
    version: string;
    logo: string | null;
    author: string;
    summary: string;
    loaders: string[];
    game_versions: string[];
    installed_at: string;
}

interface FiltersMeta {
    loaders: Record<string, string>;
    sorts: Record<string, string>;
    page_sizes: number[];
    provider: string;
}

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

const formatApiError = (err: unknown): string => {
    const e = err as {
        response?: { status?: number; data?: { message?: string; error?: string } };
        message?: string;
    };
    const data = e.response?.data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (e.response?.status === 404) {
        return 'Addon MC Modpacks não encontrado. Rode blueprint -install mcmodpack.blueprint';
    }
    if (e.message) return e.message;
    return 'Erro ao carregar modpacks.';
};

const ModpacksSection = () => {
    const uuid = ServerContext.useStoreState((s) => s.server.data!.uuid);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [apiConfigured, setApiConfigured] = useState(true);
    const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
    const [modpacks, setModpacks] = useState<ModpackCard[]>([]);
    const [installed, setInstalled] = useState<InstalledPack | null>(null);
    const [filtersMeta, setFiltersMeta] = useState<FiltersMeta | null>(null);
    const [pagination, setPagination] = useState({ index: 0, pageSize: 20, totalCount: 0 });

    const [search, setSearch] = useState('');
    const [searchDraft, setSearchDraft] = useState('');
    const [loader, setLoader] = useState('0');
    const [sort, setSort] = useState('2');
    const [pageSize, setPageSize] = useState('20');
    const [gameVersion, setGameVersion] = useState('');

    const [view, setView] = useState<View>('home');
    const [detailsTab, setDetailsTab] = useState<DetailsTab>('description');
    const [selected, setSelected] = useState<ModpackCard | null>(null);
    const [files, setFiles] = useState<ModpackFile[]>([]);
    const [filesLoading, setFilesLoading] = useState(false);

    const [modal, setModal] = useState<{ pack: ModpackCard; files: ModpackFile[] } | null>(null);
    const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
    const [wipe, setWipe] = useState(false);
    const [acceptEula, setAcceptEula] = useState(false);
    const [installing, setInstalling] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        window.setTimeout(() => setToast(null), 4500);
    };

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
            });
            if (gameVersion.trim()) params.set('game_version', gameVersion.trim());

            const { data: res } = await http.get(
                `/api/client/extensions/mcmodpack/servers/${uuid}/modpacks?${params}`
            );
            if (!res.success) {
                setError(res.message || 'Falha ao carregar modpacks.');
                setModpacks([]);
                return;
            }
            setApiConfigured(!!res.data.api_configured);
            setEmptyMessage(res.data.message || null);
            setModpacks(Array.isArray(res.data.modpacks) ? res.data.modpacks : []);
            setInstalled(res.data.installed || null);
            setFiltersMeta(res.data.filters || null);
            setPagination({
                index: res.data.pagination?.index ?? 0,
                pageSize: res.data.pagination?.pageSize ?? 20,
                totalCount: res.data.pagination?.totalCount ?? 0,
            });
        } catch (err: unknown) {
            setError(formatApiError(err));
            setModpacks([]);
        } finally {
            setLoading(false);
        }
    }, [uuid, search, loader, sort, pageSize, gameVersion, pagination.index]);

    useEffect(() => {
        loadList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uuid, search, loader, sort, pageSize, gameVersion, pagination.index]);

    const openDetails = async (pack: ModpackCard) => {
        setView('details');
        setDetailsTab('description');
        setSelected(pack);
        setFiles([]);
        try {
            const { data: res } = await http.get(
                `/api/client/extensions/mcmodpack/servers/${uuid}/modpacks/${pack.id}`
            );
            if (res.success) setSelected(res.data);
        } catch {
            // keep card data
        }
    };

    const loadFiles = async (packId: number) => {
        setFilesLoading(true);
        try {
            const { data: res } = await http.get(
                `/api/client/extensions/mcmodpack/servers/${uuid}/modpacks/${packId}/files`
            );
            if (res.success) setFiles(res.data.data || []);
        } catch {
            setFiles([]);
        } finally {
            setFilesLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'details' && detailsTab === 'versions' && selected) {
            loadFiles(selected.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, detailsTab, selected?.id]);

    const openInstall = async (pack: ModpackCard, presetFiles?: ModpackFile[]) => {
        let list = presetFiles;
        if (!list) {
            try {
                const { data: res } = await http.get(
                    `/api/client/extensions/mcmodpack/servers/${uuid}/modpacks/${pack.id}/files`
                );
                list = res.data?.data || [];
            } catch {
                list = [];
            }
        }
        setSelectedFileId(list?.[0]?.id ?? null);
        setWipe(false);
        setAcceptEula(false);
        setModal({ pack, files: list || [] });
    };

    const handleInstall = async () => {
        if (!modal || !selectedFileId) return;
        setInstalling(true);
        try {
            const { data: res } = await http.post(
                `/api/client/extensions/mcmodpack/servers/${uuid}/modpacks/install`,
                {
                    modpack_id: modal.pack.id,
                    file_id: selectedFileId,
                    wipe,
                    accept_eula: acceptEula,
                }
            );
            if (res.success) {
                showToast('success', res.message || 'Modpack instalado!');
                setModal(null);
                setView('home');
                await loadList();
            } else {
                showToast('error', res.message || 'Falha na instalação.');
            }
        } catch (err: any) {
            showToast('error', err?.response?.data?.message || 'Erro ao instalar o modpack.');
        } finally {
            setInstalling(false);
        }
    };

    const selectedFile = useMemo(
        () => modal?.files.find((f) => f.id === selectedFileId) || null,
        [modal, selectedFileId]
    );

    const totalPages = Math.max(1, Math.ceil(pagination.totalCount / pagination.pageSize));
    const currentPage = Math.floor(pagination.index / pagination.pageSize) + 1;

    if (loading && modpacks.length === 0 && !error) {
        return (
            <PageContentBlock title={'Modpacks'}>
                <div className={'mp-loading'}>
                    <Spinner size={'large'} />
                    <span>Carregando modpacks...</span>
                </div>
            </PageContentBlock>
        );
    }

    return (
        <PageContentBlock title={'Modpacks'}>
            <div className={'mp-page'}>
                {toast && (
                    <div className={`mp-toast mp-toast--${toast.type}`}>
                        {toast.message}
                    </div>
                )}

                {view === 'home' ? (
                    <>
                        {installed && (
                            <>
                                <div className={'mp-section-label'}>
                                    Modpack instalado recentemente
                                </div>
                                <div className={'mp-installed'}>
                                    <img
                                        className={'mp-installed__logo'}
                                        src={installed.logo || ''}
                                        alt={installed.name}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                    <div className={'mp-installed__body'}>
                                        <div className={'mp-installed__name'}>{installed.name}</div>
                                        <div className={'mp-installed__meta'}>
                                            {installed.version} · Instalado{' '}
                                            {timeAgo(installed.installed_at)}
                                            {installed.loaders?.[0] && (
                                                <> · {installed.loaders[0].toUpperCase()}</>
                                            )}
                                            {installed.game_versions?.[0] && (
                                                <> · {installed.game_versions[0]}</>
                                            )}
                                        </div>
                                        <div className={'mp-installed__summary'}>
                                            {installed.summary}
                                        </div>
                                    </div>
                                    <button
                                        type={'button'}
                                        className={'mp-btn mp-btn--primary'}
                                        onClick={() =>
                                            openDetails({
                                                id: installed.modpack_id,
                                                name: installed.name,
                                                slug: '',
                                                summary: installed.summary,
                                                author: installed.author,
                                                authors: [installed.author],
                                                download_count: 0,
                                                thumbs_up: 0,
                                                logo: installed.logo,
                                                url: null,
                                                categories: [],
                                                loaders: installed.loaders || [],
                                                game_versions: installed.game_versions || [],
                                                date_created: null,
                                                date_modified: null,
                                            })
                                        }
                                    >
                                        Trocar versão
                                    </button>
                                </div>
                            </>
                        )}

                        <div className={'mp-filters'}>
                            <select
                                className={'mp-select'}
                                value={'curseforge'}
                                disabled
                                title={'Provedor'}
                            >
                                <option value={'curseforge'}>CurseForge</option>
                            </select>
                            <select
                                className={'mp-select'}
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(e.target.value);
                                    setPagination((p) => ({ ...p, index: 0 }));
                                }}
                            >
                                {(filtersMeta?.page_sizes || [12, 20, 30, 50]).map((n) => (
                                    <option key={n} value={n}>
                                        {n} por página
                                    </option>
                                ))}
                            </select>
                            <select
                                className={'mp-select'}
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
                                className={'mp-select'}
                                value={loader}
                                onChange={(e) => {
                                    setLoader(e.target.value);
                                    setPagination((p) => ({ ...p, index: 0 }));
                                }}
                            >
                                {Object.entries(filtersMeta?.loaders || { 0: 'Qualquer' }).map(
                                    ([k, v]) => (
                                        <option key={k} value={k}>
                                            {v}
                                        </option>
                                    )
                                )}
                            </select>
                            <input
                                className={'mp-input'}
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
                            <div className={'mp-search'}>
                                <input
                                    className={'mp-input'}
                                    placeholder={'Buscar modpacks...'}
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
                                    className={'mp-btn mp-btn--ghost'}
                                    onClick={() => {
                                        setSearch(searchDraft);
                                        setPagination((p) => ({ ...p, index: 0 }));
                                    }}
                                >
                                    Buscar
                                </button>
                            </div>
                        </div>

                        {error && <div className={'mp-alert mp-alert--error'}>{error}</div>}

                        {!error && !apiConfigured && (
                            <div className={'mp-empty'}>
                                <h3>Não encontramos nenhum modpack</h3>
                                <p>
                                    Configure a API Key do CurseForge em{' '}
                                    <strong>Admin → Extensions → MC Modpacks</strong>.
                                </p>
                            </div>
                        )}

                        {!error && apiConfigured && modpacks.length === 0 && (
                            <div className={'mp-empty'}>
                                <h3>Não encontramos nenhum modpack</h3>
                                <p>{emptyMessage || 'Tente outros filtros ou outra busca.'}</p>
                            </div>
                        )}

                        <div className={'mp-grid'}>
                            {modpacks.map((pack) => (
                                <div key={pack.id} className={'mp-card'}>
                                    <div className={'mp-card__top'}>
                                        <img
                                            className={'mp-card__logo'}
                                            src={pack.logo || ''}
                                            alt={pack.name}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.opacity = '0.2';
                                            }}
                                        />
                                        <div>
                                            <div className={'mp-card__name'}>{pack.name}</div>
                                            <div className={'mp-card__stats'}>
                                                <span>
                                                    <BiIcon name={'download'} className={'mp-stat-icon'} />
                                                    {formatCount(pack.download_count)}
                                                </span>
                                                <span>
                                                    <BiIcon name={'heart-fill'} className={'mp-stat-icon'} />
                                                    {formatCount(pack.thumbs_up)}
                                                </span>
                                            </div>
                                            <div className={'mp-card__author'}>
                                                por {pack.author}
                                            </div>
                                        </div>
                                    </div>
                                    <p className={'mp-card__summary'}>{pack.summary}</p>
                                    <div className={'mp-card__actions'}>
                                        {pack.url && (
                                            <a
                                                className={'mp-icon-btn'}
                                                href={pack.url}
                                                target={'_blank'}
                                                rel={'noreferrer'}
                                                title={'Abrir no CurseForge'}
                                            >
                                                <BiIcon name={'box-arrow-up-right'} />
                                            </a>
                                        )}
                                        <button
                                            type={'button'}
                                            className={'mp-btn mp-btn--ghost'}
                                            onClick={() => openDetails(pack)}
                                        >
                                            Detalhes
                                        </button>
                                        <button
                                            type={'button'}
                                            className={'mp-btn mp-btn--primary'}
                                            onClick={() => openInstall(pack)}
                                        >
                                            Instalar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {apiConfigured && pagination.totalCount > pagination.pageSize && (
                            <div className={'mp-pager'}>
                                <button
                                    type={'button'}
                                    className={'mp-btn mp-btn--ghost'}
                                    disabled={pagination.index <= 0}
                                    onClick={() =>
                                        setPagination((p) => ({
                                            ...p,
                                            index: Math.max(0, p.index - p.pageSize),
                                        }))
                                    }
                                >
                                    <BiIcon name={'arrow-left'} className={'mp-inline-icon'} />
                                    Anterior
                                </button>
                                <span>
                                    Página {currentPage} de {totalPages}
                                </span>
                                <button
                                    type={'button'}
                                    className={'mp-btn mp-btn--ghost'}
                                    disabled={currentPage >= totalPages}
                                    onClick={() =>
                                        setPagination((p) => ({
                                            ...p,
                                            index: p.index + p.pageSize,
                                        }))
                                    }
                                >
                                    Próxima
                                    <BiIcon name={'arrow-right'} className={'mp-inline-icon'} />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    selected && (
                        <>
                            <button
                                type={'button'}
                                className={'mp-back'}
                                onClick={() => setView('home')}
                            >
                                <BiIcon name={'arrow-left'} className={'mp-inline-icon'} />
                                Voltar aos Modpacks
                            </button>

                            <div className={'mp-detail-head'}>
                                <img
                                    className={'mp-detail-head__logo'}
                                    src={selected.logo || ''}
                                    alt={selected.name}
                                />
                                <div className={'mp-detail-head__body'}>
                                    <h2>{selected.name}</h2>
                                    <div className={'mp-card__stats'}>
                                        <span>
                                            <BiIcon name={'download'} className={'mp-stat-icon'} />
                                            {formatCount(selected.download_count)}
                                        </span>
                                        <span>
                                            <BiIcon name={'heart-fill'} className={'mp-stat-icon'} />
                                            {formatCount(selected.thumbs_up)}
                                        </span>
                                    </div>
                                    <p>{selected.summary}</p>
                                </div>
                                <div className={'mp-detail-head__actions'}>
                                    {selected.url && (
                                        <a
                                            className={'mp-icon-btn'}
                                            href={selected.url}
                                            target={'_blank'}
                                            rel={'noreferrer'}
                                            aria-label={'Abrir página do modpack'}
                                        >
                                            <BiIcon name={'box-arrow-up-right'} />
                                        </a>
                                    )}
                                    <button
                                        type={'button'}
                                        className={'mp-btn mp-btn--primary'}
                                        onClick={() => openInstall(selected, files)}
                                    >
                                        Instalar
                                    </button>
                                </div>
                            </div>

                            <div className={'mp-detail-layout'}>
                                <div>
                                    <div className={'mp-tabs'}>
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
                                        selected.description_html ? (
                                            <div
                                                className={'mp-description'}
                                                dangerouslySetInnerHTML={{ __html: selected.description_html }}
                                            />
                                        ) : (
                                            <div className={'mp-description'}>
                                                <p>{selected.summary || 'Sem descrição.'}</p>
                                            </div>
                                        )
                                    ) : filesLoading ? (
                                        <div className={'mp-loading'}>
                                            <Spinner size={'large'} />
                                        </div>
                                    ) : (
                                        <div className={'mp-versions'}>
                                            {files.map((f) => (
                                                <div key={f.id} className={'mp-version'}>
                                                    <div>
                                                        <div className={'mp-version__name'}>
                                                            {f.display_name}
                                                        </div>
                                                        <div className={'mp-version__meta'}>
                                                            <BiIcon name={'download'} className={'mp-stat-icon'} />
                                                            {formatCount(f.download_count)} ·{' '}
                                                            {timeAgo(f.file_date)}
                                                            {f.loaders[0] && (
                                                                <> · Loader: {f.loaders[0]}</>
                                                            )}
                                                            {f.game_versions[0] && (
                                                                <>
                                                                    {' '}
                                                                    · MC: {f.game_versions[0]}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type={'button'}
                                                        className={'mp-btn mp-btn--primary'}
                                                        onClick={() => {
                                                            setSelectedFileId(f.id);
                                                            setWipe(false);
                                                            setAcceptEula(false);
                                                            setModal({ pack: selected, files });
                                                        }}
                                                    >
                                                        Instalar
                                                    </button>
                                                </div>
                                            ))}
                                            {files.length === 0 && (
                                                <div className={'mp-empty'}>
                                                    Nenhuma versão encontrada.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <aside className={'mp-side'}>
                                    <div className={'mp-side__block'}>
                                        <div className={'mp-side__title'}>Categorias</div>
                                        <div className={'mp-tags'}>
                                            {(selected.categories || []).map((c) => (
                                                <span key={c} className={'mp-tag'}>
                                                    {c}
                                                </span>
                                            ))}
                                            {!selected.categories?.length && (
                                                <span className={'mp-muted'}>—</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={'mp-side__block'}>
                                        <div className={'mp-side__title'}>Loaders</div>
                                        <div className={'mp-tags'}>
                                            {(selected.loaders || []).map((c) => (
                                                <span key={c} className={'mp-tag'}>
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={'mp-side__block'}>
                                        <div className={'mp-side__title'}>Versões do jogo</div>
                                        <div className={'mp-tags'}>
                                            {(selected.game_versions || []).slice(0, 8).map((c) => (
                                                <span key={c} className={'mp-tag'}>
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={'mp-side__block'}>
                                        <div className={'mp-side__title'}>Detalhes</div>
                                        <div className={'mp-side__row'}>
                                            Atualizado {timeAgo(selected.date_modified)}
                                        </div>
                                        <div className={'mp-side__row'}>
                                            Publicado {timeAgo(selected.date_created)}
                                        </div>
                                    </div>
                                </aside>
                            </div>
                        </>
                    )
                )}

                {modal && (
                    <div
                        className={'mp-modal-backdrop'}
                        onClick={() => !installing && setModal(null)}
                    >
                        <div className={'mp-modal'} onClick={(e) => e.stopPropagation()}>
                            <div className={'mp-modal__header'}>
                                <h3>Instalar Modpack</h3>
                                <button
                                    type={'button'}
                                    className={'mp-modal__close'}
                                    disabled={installing}
                                    onClick={() => setModal(null)}
                                >
                                    <BiIcon name={'x-lg'} />
                                </button>
                            </div>

                            <div className={'mp-modal__pack'}>
                                <img src={modal.pack.logo || ''} alt={modal.pack.name} />
                                <div>
                                    <div className={'mp-modal__name'}>{modal.pack.name}</div>
                                    <div className={'mp-muted'}>por {modal.pack.author}</div>
                                    <div className={'mp-card__stats'}>
                                        <BiIcon name={'download'} className={'mp-stat-icon'} />
                                        {formatCount(modal.pack.download_count)}
                                    </div>
                                </div>
                            </div>

                            <label className={'mp-field-label'}>Selecionar versão</label>
                            <select
                                className={'mp-select mp-select--full'}
                                value={selectedFileId ?? ''}
                                onChange={(e) => setSelectedFileId(Number(e.target.value))}
                            >
                                {modal.files.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.display_name}
                                    </option>
                                ))}
                            </select>
                            {selectedFile && (
                                <div className={'mp-build-meta'}>
                                    <BiIcon name={'download'} className={'mp-stat-icon'} />
                                    {formatCount(selectedFile.download_count)} · Publicado{' '}
                                    {timeAgo(selectedFile.file_date)}
                                    {selectedFile.server_pack_file_id
                                        ? ' · Server pack disponível'
                                        : ''}
                                </div>
                            )}

                            <div className={'mp-option'}>
                                <div>
                                    <div className={'mp-option__title'}>
                                        APAGAR ARQUIVOS DO SERVIDOR
                                    </div>
                                    <div className={'mp-option__desc'}>
                                        Opcional. Apaga tudo antes de instalar. Desligado = extrai
                                        por cima (replace).
                                    </div>
                                </div>
                                <button
                                    type={'button'}
                                    className={`mp-toggle ${wipe ? 'is-on' : ''}`}
                                    onClick={() => setWipe((v) => !v)}
                                >
                                    <span />
                                </button>
                            </div>

                            <div className={'mp-option'}>
                                <div>
                                    <div className={'mp-option__title'}>ACEITAR EULA</div>
                                    <div className={'mp-option__desc'}>
                                        Opcional. Grava <code>eula=true</code> no eula.txt.
                                    </div>
                                </div>
                                <button
                                    type={'button'}
                                    className={`mp-toggle ${acceptEula ? 'is-on' : ''}`}
                                    onClick={() => setAcceptEula((v) => !v)}
                                >
                                    <span />
                                </button>
                            </div>

                            <div className={'mp-modal__actions'}>
                                <button
                                    type={'button'}
                                    className={'mp-btn mp-btn--ghost'}
                                    disabled={installing}
                                    onClick={() => setModal(null)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type={'button'}
                                    className={'mp-btn mp-btn--primary'}
                                    disabled={installing || !selectedFileId}
                                    onClick={handleInstall}
                                >
                                    {installing ? 'Baixando e instalando...' : 'Instalar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageContentBlock>
    );
};

export default ModpacksSection;
