import React, { useEffect, useState, useCallback } from 'react';
import { ServerContext } from '@/state/server';
import http from '@/api/http';
import useFlash from '@/plugins/useFlash';
import Spinner from '@/components/elements/Spinner';

interface Addon {
    id: string;
    name: string;
    description: string;
    version: string;
    type: string;
    loader: string;
    download_url: string;
    filename: string;
    icon: string;
    featured: boolean;
    installed: boolean;
}

interface CatalogResponse {
    success: boolean;
    data?: {
        catalog: Addon[];
        installed: string[];
        addon_path: string;
        modules: string[];
    };
    message?: string;
}

const AddonManager = () => {
    const { id } = ServerContext.useStoreState((state) => state.server.data!);
    const { clearFlashes, addFlash } = useFlash();

    const [loading, setLoading] = useState(true);
    const [catalog, setCatalog] = useState<Addon[]>([]);
    const [installed, setInstalled] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [installing, setInstalling] = useState<string | null>(null);
    const [removing, setRemoving] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadCatalog = useCallback(async () => {
        setLoading(true);
        setError(null);
        clearFlashes('minehub:addons');

        try {
            const { data } = await http.get<CatalogResponse>(
                `/api/client/extensions/minehub/servers/${id}/addons/catalog`
            );

            if (data.success && data.data) {
                setCatalog(data.data.catalog);
                setInstalled(data.data.installed);
            } else {
                setError(data.message || 'Erro ao carregar catálogo.');
            }
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    'Não foi possível carregar o catálogo de addons.'
            );
        } finally {
            setLoading(false);
        }
    }, [id, clearFlashes]);

    useEffect(() => {
        loadCatalog();
    }, [loadCatalog]);

    const handleInstall = async (addon: Addon) => {
        setInstalling(addon.id);
        clearFlashes('minehub:addons');

        try {
            const { data } = await http.post(
                `/api/client/extensions/minehub/servers/${id}/addons/install`,
                { addon_id: addon.id }
            );

            if (data.success) {
                addFlash({
                    key: 'minehub:addons',
                    type: 'success',
                    message: data.message || `${addon.name} instalado!`,
                });
                await loadCatalog();
            }
        } catch (err: any) {
            addFlash({
                key: 'minehub:addons',
                type: 'error',
                message:
                    err?.response?.data?.message ||
                    `Erro ao instalar ${addon.name}.`,
            });
        } finally {
            setInstalling(null);
        }
    };

    const handleRemove = async (filename: string) => {
        setRemoving(filename);
        clearFlashes('minehub:addons');

        try {
            const { data } = await http.delete(
                `/api/client/extensions/minehub/servers/${id}/addons/${encodeURIComponent(filename)}`
            );

            if (data.success) {
                addFlash({
                    key: 'minehub:addons',
                    type: 'success',
                    message: data.message || `${filename} removido!`,
                });
                await loadCatalog();
            }
        } catch (err: any) {
            addFlash({
                key: 'minehub:addons',
                type: 'error',
                message:
                    err?.response?.data?.message ||
                    `Erro ao remover ${filename}.`,
            });
        } finally {
            setRemoving(null);
        }
    };

    const filtered = catalog.filter(
        (addon) =>
            addon.name.toLowerCase().includes(search.toLowerCase()) ||
            addon.description.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className={'minehub-loading'}>
                <Spinner size={'large'} />
                <span>Carregando catálogo de addons...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className={'minehub-alert minehub-alert--error'}>
                {error}
                <div style={{ marginTop: '12px' }}>
                    <button className={'minehub-btn minehub-btn--ghost'} onClick={loadCatalog}>
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {installed.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ color: 'var(--mh-text)', fontSize: '15px', marginBottom: '12px' }}>
                        📥 Instalados ({installed.length})
                    </h3>
                    <div className={'minehub-installed-list'}>
                        {installed.map((filename) => (
                            <div key={filename} className={'minehub-installed-item'}>
                                <span className={'minehub-installed-item__name'}>
                                    <span>📦</span> {filename}
                                </span>
                                <button
                                    className={'minehub-btn minehub-btn--danger'}
                                    onClick={() => handleRemove(filename)}
                                    disabled={removing === filename}
                                >
                                    {removing === filename ? 'Removendo...' : '🗑️ Remover'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className={'minehub-search'}>
                <input
                    type={'text'}
                    placeholder={'Buscar addons...'}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {filtered.length === 0 ? (
                <div className={'minehub-empty'}>
                    <div className={'minehub-empty__icon'}>📭</div>
                    <p>Nenhum addon encontrado no catálogo.</p>
                </div>
            ) : (
                <div className={'minehub-grid'}>
                    {filtered.map((addon) => (
                        <div
                            key={addon.id}
                            className={`minehub-card ${addon.featured ? 'minehub-card--featured' : ''}`}
                        >
                            <div className={'minehub-card__header'}>
                                <span className={'minehub-card__icon'}>{addon.icon || '📦'}</span>
                                <div>
                                    <p className={'minehub-card__name'}>{addon.name}</p>
                                    <span className={'minehub-card__version'}>v{addon.version}</span>
                                </div>
                            </div>
                            <p className={'minehub-card__desc'}>{addon.description}</p>
                            <div className={'minehub-card__actions'}>
                                {addon.installed ? (
                                    <>
                                        <span className={'minehub-badge minehub-badge--installed'}>
                                            ✓ Instalado
                                        </span>
                                        <button
                                            className={'minehub-btn minehub-btn--danger'}
                                            onClick={() => handleRemove(addon.filename)}
                                            disabled={removing === addon.filename}
                                        >
                                            {removing === addon.filename ? '...' : 'Remover'}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className={'minehub-btn minehub-btn--primary'}
                                        onClick={() => handleInstall(addon)}
                                        disabled={installing === addon.id}
                                    >
                                        {installing === addon.id ? (
                                            <span className={'minehub-badge minehub-badge--loading'}>
                                                Instalando...
                                            </span>
                                        ) : (
                                            '⬇️ Instalar'
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AddonManager;
