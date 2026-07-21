import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBoxOpen,
    faCheck,
    faCube,
    faDownload,
    faPuzzlePiece,
    faSearch,
    faTrash,
} from '@fortawesome/free-solid-svg-icons';
import http from '@/api/http';

interface Props {
    uuid: string;
    canInstall: boolean;
    canRemove: boolean;
    onToast: (type: 'ok' | 'err', message: string) => void;
}

interface InstalledAddon {
    name: string;
    path: string;
    size: number;
    modified_at?: string | null;
}

interface SearchHit {
    id: string;
    slug: string;
    title: string;
    description: string;
    author: string;
    downloads: number;
    icon_url?: string | null;
    categories: string[];
}

interface AddonVersion {
    id: string;
    name: string;
    version_number: string;
    version_type: string;
    downloads: number;
    game_versions: string[];
    loaders: string[];
    files: {
        url: string;
        filename: string;
        primary: boolean;
        size: number;
    }[];
}

const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let idx = 0;
    while (value >= 1024 && idx < units.length - 1) {
        value /= 1024;
        idx += 1;
    }
    return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
};

const formatDownloads = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
};

export default ({ uuid, canInstall, canRemove, onToast }: Props) => {
    const [mode, setMode] = useState<'installed' | 'browse'>('installed');
    const [installed, setInstalled] = useState<InstalledAddon[]>([]);
    const [selectedInstalled, setSelectedInstalled] = useState<string[]>([]);
    const [loadingInstalled, setLoadingInstalled] = useState(true);
    const [removing, setRemoving] = useState(false);

    const [query, setQuery] = useState('');
    const [hits, setHits] = useState<SearchHit[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedHit, setSelectedHit] = useState<SearchHit | null>(null);
    const [versions, setVersions] = useState<AddonVersion[]>([]);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [installing, setInstalling] = useState<string | null>(null);

    const loadInstalled = async () => {
        setLoadingInstalled(true);
        try {
            const { data } = await http.get(`/api/client/extensions/mcmanager/${uuid}/addons/installed`);
            setInstalled(data.addons || []);
            setSelectedInstalled([]);
        } catch (error: any) {
            onToast('err', error?.response?.data?.error || 'Falha ao listar plugins instalados.');
            setInstalled([]);
        } finally {
            setLoadingInstalled(false);
        }
    };

    useEffect(() => {
        loadInstalled();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uuid]);

    const allSelected = useMemo(
        () => installed.length > 0 && selectedInstalled.length === installed.length,
        [installed, selectedInstalled]
    );

    const toggleInstalled = (name: string) => {
        setSelectedInstalled((prev) =>
            prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
        );
    };

    const toggleAll = () => {
        if (allSelected) {
            setSelectedInstalled([]);
        } else {
            setSelectedInstalled(installed.map((item) => item.name));
        }
    };

    const removeSelected = async () => {
        if (!canRemove) {
            onToast('err', 'Remoção de addons desabilitada pelo administrador.');
            return;
        }
        if (selectedInstalled.length === 0) return;

        setRemoving(true);
        try {
            const { data } = await http.post(`/api/client/extensions/mcmanager/${uuid}/addons/remove`, {
                files: selectedInstalled,
            });
            onToast('ok', data.message || 'Addons removidos.');
            await loadInstalled();
        } catch (error: any) {
            onToast('err', error?.response?.data?.error || error?.response?.data?.message || 'Falha ao remover addons.');
        } finally {
            setRemoving(false);
        }
    };

    const runSearch = async () => {
        setSearching(true);
        setSelectedHit(null);
        setVersions([]);
        try {
            const { data } = await http.get(`/api/client/extensions/mcmanager/${uuid}/addons/search`, {
                params: { query, limit: 24, offset: 0 },
            });
            setHits(data.hits || []);
        } catch (error: any) {
            onToast('err', error?.response?.data?.error || 'Falha na busca Modrinth.');
            setHits([]);
        } finally {
            setSearching(false);
        }
    };

    const openVersions = async (hit: SearchHit) => {
        setSelectedHit(hit);
        setLoadingVersions(true);
        setVersions([]);
        try {
            const { data } = await http.get(
                `/api/client/extensions/mcmanager/${uuid}/addons/versions/${encodeURIComponent(hit.id)}`
            );
            setVersions(data.versions || []);
        } catch (error: any) {
            onToast('err', error?.response?.data?.error || 'Falha ao carregar versões.');
        } finally {
            setLoadingVersions(false);
        }
    };

    const installFile = async (version: AddonVersion, file: AddonVersion['files'][0]) => {
        if (!canInstall) {
            onToast('err', 'Instalação de addons desabilitada pelo administrador.');
            return;
        }

        setInstalling(version.id);
        try {
            const { data } = await http.post(`/api/client/extensions/mcmanager/${uuid}/addons/install`, {
                download_url: file.url,
                filename: file.filename,
            });
            onToast('ok', data.message || `${file.filename} instalado.`);
            await loadInstalled();
            setMode('installed');
        } catch (error: any) {
            onToast('err', error?.response?.data?.error || error?.response?.data?.message || 'Falha ao instalar addon.');
        } finally {
            setInstalling(null);
        }
    };

    return (
        <div className="mcm-panel">
            <div className="mcm-panel-head">
                <div>
                    <h3>
                        <FontAwesomeIcon icon={faPuzzlePiece} style={{ marginRight: 8 }} />
                        Instalador de Addons
                    </h3>
                    <p>Instale plugins do Modrinth ou remova JARs selecionados da pasta /plugins.</p>
                </div>
                <div className="mcm-tabs" style={{ marginBottom: 0 }}>
                    <button
                        type="button"
                        className={`mcm-tab ${mode === 'installed' ? 'is-active' : ''}`}
                        onClick={() => setMode('installed')}
                    >
                        Instalados
                    </button>
                    <button
                        type="button"
                        className={`mcm-tab ${mode === 'browse' ? 'is-active' : ''}`}
                        onClick={() => setMode('browse')}
                    >
                        Buscar / Instalar
                    </button>
                </div>
            </div>

            {mode === 'installed' && (
                <>
                    <div className="mcm-actions" style={{ marginTop: 0, marginBottom: '0.85rem' }}>
                        <button type="button" className="mcm-btn mcm-btn-secondary" onClick={toggleAll} disabled={installed.length === 0}>
                            {allSelected ? 'Limpar seleção' : 'Selecionar todos'}
                        </button>
                        <button
                            type="button"
                            className="mcm-btn mcm-btn-danger"
                            onClick={removeSelected}
                            disabled={!canRemove || selectedInstalled.length === 0 || removing}
                        >
                            {removing ? <span className="mcm-spinner" /> : <FontAwesomeIcon icon={faTrash} />}
                            Remover selecionados ({selectedInstalled.length})
                        </button>
                    </div>

                    {loadingInstalled ? (
                        <div className="mcm-status">
                            <span className="mcm-spinner" /> Carregando plugins…
                        </div>
                    ) : installed.length === 0 ? (
                        <div className="mcm-empty">
                            <FontAwesomeIcon icon={faBoxOpen} style={{ marginRight: 8 }} />
                            Nenhum plugin .jar encontrado em /plugins.
                        </div>
                    ) : (
                        <div className="mcm-card-list">
                            {installed.map((addon) => {
                                const selected = selectedInstalled.includes(addon.name);
                                return (
                                    <label key={addon.name} className={`mcm-card ${selected ? 'is-selected' : ''}`}>
                                        <input
                                            className="mcm-check"
                                            type="checkbox"
                                            checked={selected}
                                            onChange={() => toggleInstalled(addon.name)}
                                        />
                                        <div>
                                            <h4>{addon.name}</h4>
                                            <p>{formatBytes(addon.size)}</p>
                                        </div>
                                        <FontAwesomeIcon icon={selected ? faCheck : faCube} style={{ color: selected ? '#5eead4' : '#64748b' }} />
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {mode === 'browse' && (
                <>
                    <div className="mcm-search-row">
                        <input
                            className="mcm-input"
                            type="search"
                            placeholder="Buscar plugins no Modrinth…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') runSearch();
                            }}
                        />
                        <button type="button" className="mcm-btn mcm-btn-primary" onClick={runSearch} disabled={searching}>
                            {searching ? <span className="mcm-spinner" /> : <FontAwesomeIcon icon={faSearch} />}
                            Buscar
                        </button>
                    </div>

                    {!selectedHit && (
                        <div className="mcm-card-list">
                            {hits.length === 0 && !searching && (
                                <div className="mcm-empty">Pesquise um plugin para ver resultados do Modrinth.</div>
                            )}
                            {hits.map((hit) => (
                                <button
                                    type="button"
                                    key={hit.id}
                                    className="mcm-card"
                                    style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                                    onClick={() => openVersions(hit)}
                                >
                                    {hit.icon_url ? (
                                        <img className="mcm-card-icon" src={hit.icon_url} alt="" />
                                    ) : (
                                        <div className="mcm-card-icon placeholder">
                                            <FontAwesomeIcon icon={faCube} />
                                        </div>
                                    )}
                                    <div>
                                        <h4>{hit.title}</h4>
                                        <p>{hit.description}</p>
                                        <div className="mcm-meta">
                                            <span className="mcm-chip">{hit.author || 'unknown'}</span>
                                            <span className="mcm-chip">
                                                <FontAwesomeIcon icon={faDownload} /> {formatDownloads(hit.downloads)}
                                            </span>
                                            {(hit.categories || []).slice(0, 3).map((cat) => (
                                                <span className="mcm-chip" key={cat}>
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <FontAwesomeIcon icon={faDownload} style={{ color: '#5eead4' }} />
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedHit && (
                        <div>
                            <div className="mcm-actions" style={{ marginTop: 0 }}>
                                <button type="button" className="mcm-btn mcm-btn-secondary" onClick={() => setSelectedHit(null)}>
                                    Voltar
                                </button>
                            </div>
                            <div className="mcm-panel-head" style={{ marginTop: '0.75rem' }}>
                                <div>
                                    <h3>{selectedHit.title}</h3>
                                    <p>Selecione uma versão para instalar em /plugins.</p>
                                </div>
                            </div>

                            {loadingVersions ? (
                                <div className="mcm-status">
                                    <span className="mcm-spinner" /> Carregando versões…
                                </div>
                            ) : versions.length === 0 ? (
                                <div className="mcm-empty">Nenhuma versão compatível encontrada.</div>
                            ) : (
                                <div className="mcm-card-list">
                                    {versions.map((version) => {
                                        const file = version.files.find((f) => f.primary) || version.files[0];
                                        if (!file) return null;

                                        return (
                                            <div className="mcm-card" key={version.id}>
                                                <div className="mcm-card-icon placeholder">
                                                    <FontAwesomeIcon icon={faCube} />
                                                </div>
                                                <div>
                                                    <h4>
                                                        {version.name || version.version_number}{' '}
                                                        <span style={{ color: '#64748b', fontWeight: 500 }}>
                                                            ({version.version_type})
                                                        </span>
                                                    </h4>
                                                    <p>{file.filename} · {formatBytes(file.size)}</p>
                                                    <div className="mcm-meta">
                                                        {(version.game_versions || []).slice(0, 4).map((gv) => (
                                                            <span className="mcm-chip" key={gv}>
                                                                {gv}
                                                            </span>
                                                        ))}
                                                        {(version.loaders || []).slice(0, 3).map((loader) => (
                                                            <span className="mcm-chip" key={loader}>
                                                                {loader}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="mcm-btn mcm-btn-primary"
                                                    disabled={!canInstall || installing === version.id}
                                                    onClick={() => installFile(version, file)}
                                                >
                                                    {installing === version.id ? (
                                                        <span className="mcm-spinner" />
                                                    ) : (
                                                        <FontAwesomeIcon icon={faDownload} />
                                                    )}
                                                    Instalar
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
