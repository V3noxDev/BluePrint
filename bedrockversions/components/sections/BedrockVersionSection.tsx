import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ServerContext } from '@/state/server';
import http from '@/api/http';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';

type Channel = 'stable' | 'preview';
type View = 'home' | 'stable' | 'preview';

interface VersionItem {
    channel: string;
    version: string;
    download_url: string;
    is_latest: boolean;
}

interface SoftwareCard {
    id: string;
    name: string;
    description: string;
    status: 'available' | 'coming_soon';
    versions_count: number;
    latest: string | null;
}

interface IndexData {
    is_bedrock: boolean;
    current_version: string | null;
    current_channel: Channel;
    latest_for_channel: string | null;
    outdated: boolean;
    catalog: {
        stable: VersionItem[];
        preview: VersionItem[];
        latest_stable: string | null;
        latest_preview: string | null;
        last_sync: string | null;
    };
    software: SoftwareCard[];
}

const BedrockVersionSection = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [installing, setInstalling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<IndexData | null>(null);
    const [view, setView] = useState<View>('home');
    const [modal, setModal] = useState<{ channel: Channel; version: string } | null>(null);
    const [wipe, setWipe] = useState(false);
    const [acceptEula, setAcceptEula] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        window.setTimeout(() => setToast(null), 4000);
    };

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: res } = await http.get(
                `/api/client/extensions/bedrockversions/servers/${uuid}/versions`
            );
            if (res.success) {
                setData(res.data);
            } else {
                setError(res.message || 'Não foi possível carregar as versões.');
            }
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    'Falha ao carregar o gerenciador de versões Bedrock.'
            );
        } finally {
            setLoading(false);
        }
    }, [uuid]);

    useEffect(() => {
        load();
    }, [load]);

    const handleSync = async () => {
        setSyncing(true);
        try {
            await http.post(`/api/client/extensions/bedrockversions/servers/${uuid}/versions/sync`);
            await load();
            showToast('success', 'Lista de versões atualizada.');
        } catch (err: any) {
            showToast('error', err?.response?.data?.message || 'Falha ao sincronizar.');
        } finally {
            setSyncing(false);
        }
    };

    const handleInstall = async () => {
        if (!modal || !acceptEula) return;
        setInstalling(true);
        try {
            const { data: res } = await http.post(
                `/api/client/extensions/bedrockversions/servers/${uuid}/versions/install`,
                {
                    channel: modal.channel,
                    version: modal.version,
                    wipe,
                    accept_eula: acceptEula,
                    restart: true,
                }
            );
            if (res.success) {
                showToast('success', res.message || 'Versão instalada com sucesso!');
                setModal(null);
                setWipe(false);
                setAcceptEula(false);
                await load();
            } else {
                showToast('error', res.message || 'Falha na instalação.');
            }
        } catch (err: any) {
            showToast('error', err?.response?.data?.message || 'Erro ao instalar versão.');
        } finally {
            setInstalling(false);
        }
    };

    const versions = useMemo(() => {
        if (!data) return [];
        if (view === 'stable') return data.catalog.stable;
        if (view === 'preview') return data.catalog.preview;
        return [];
    }, [data, view]);

    if (loading) {
        return (
            <PageContentBlock title={'Bedrock Version'}>
                <div className={'bv-loading'}>
                    <Spinner size={'large'} />
                    <span>Carregando versões Bedrock...</span>
                </div>
            </PageContentBlock>
        );
    }

    if (error || !data) {
        return (
            <PageContentBlock title={'Bedrock Version'}>
                <div className={'bv-alert bv-alert--error'}>
                    <p>{error || 'Erro desconhecido.'}</p>
                    <button type={'button'} className={'bv-btn bv-btn--ghost'} onClick={load}>
                        Tentar novamente
                    </button>
                </div>
            </PageContentBlock>
        );
    }

    return (
        <PageContentBlock title={'Bedrock Version'}>
        <div className={'bv-page'}>
            {toast && (
                <div className={`bv-toast bv-toast--${toast.type}`}>
                    <span>{toast.type === 'success' ? '✓' : '!'}</span>
                    {toast.message}
                </div>
            )}

            <div className={'bv-status'}>
                <div className={'bv-status__icon'}>🧱</div>
                <div className={'bv-status__body'}>
                    <div className={'bv-status__title'}>
                        {data.current_version
                            ? 'Servidor Bedrock em execução'
                            : 'Bedrock Dedicated Server'}
                    </div>
                    <div className={'bv-status__meta'}>
                        Versão instalada:{' '}
                        <strong>{data.current_version || 'não definida'}</strong>
                        {data.current_channel && data.current_version && (
                            <>
                                {' '}
                                · Canal: <strong>{data.current_channel}</strong>
                            </>
                        )}
                    </div>
                </div>
                <button
                    type={'button'}
                    className={'bv-btn bv-btn--ghost'}
                    onClick={handleSync}
                    disabled={syncing}
                >
                    {syncing ? 'Atualizando...' : 'Atualizar lista'}
                </button>
            </div>

            {data.outdated && data.latest_for_channel && (
                <div className={'bv-outdated'}>
                    ⚠️ Seu servidor está em uma versão antiga ({data.current_version}). A mais
                    recente do canal é <strong>{data.latest_for_channel}</strong>.
                </div>
            )}

            {view === 'home' ? (
                <>
                    <div className={'bv-section-title'}>Software</div>
                    <div className={'bv-software-grid'}>
                        {data.software.map((item) => {
                            const isActive =
                                (item.id === 'stable' || item.id === 'preview') &&
                                data.current_channel === item.id;
                            const comingSoon = item.status === 'coming_soon';

                            return (
                                <button
                                    key={item.id}
                                    type={'button'}
                                    className={`bv-software-card ${isActive ? 'is-active' : ''} ${
                                        comingSoon ? 'is-disabled' : ''
                                    }`}
                                    disabled={comingSoon}
                                    onClick={() => {
                                        if (item.id === 'stable' || item.id === 'preview') {
                                            setView(item.id);
                                        }
                                    }}
                                >
                                    <div className={'bv-software-card__icon'}>
                                        {item.id === 'pocketmine' ? '⏳' : '🧱'}
                                    </div>
                                    <div className={'bv-software-card__info'}>
                                        <div className={'bv-software-card__name'}>
                                            {item.name}
                                            {comingSoon && (
                                                <span className={'bv-pill'}>Em breve</span>
                                            )}
                                        </div>
                                        <div className={'bv-software-card__meta'}>
                                            {comingSoon
                                                ? 'Suporte planejado'
                                                : `${item.versions_count} versões · Latest ${
                                                      item.latest || '—'
                                                  }`}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </>
            ) : (
                <>
                    <div className={'bv-toolbar'}>
                        <button
                            type={'button'}
                            className={'bv-btn bv-btn--ghost'}
                            onClick={() => setView('home')}
                        >
                            ← Voltar
                        </button>
                        <div className={'bv-section-title'} style={{ margin: 0 }}>
                            {view === 'stable' ? 'Bedrock Stable' : 'Bedrock Preview'}
                        </div>
                    </div>

                    <div className={'bv-version-grid'}>
                        {versions.map((v) => {
                            const installed = data.current_version === v.version;
                            return (
                                <button
                                    key={`${v.channel}-${v.version}`}
                                    type={'button'}
                                    className={`bv-version-card ${installed ? 'is-active' : ''}`}
                                    onClick={() =>
                                        setModal({
                                            channel: view as Channel,
                                            version: v.version,
                                        })
                                    }
                                >
                                    <div className={'bv-version-card__left'}>
                                        <div className={'bv-version-card__icon'}>🧱</div>
                                        <div>
                                            <div className={'bv-version-card__version'}>
                                                {v.version}
                                            </div>
                                            <div className={'bv-version-card__type'}>
                                                {v.is_latest ? 'LATEST' : 'RELEASE'}
                                            </div>
                                        </div>
                                    </div>
                                    {v.is_latest && <span className={'bv-pill bv-pill--gold'}>Latest</span>}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {modal && (
                <div className={'bv-modal-backdrop'} onClick={() => !installing && setModal(null)}>
                    <div className={'bv-modal'} onClick={(e) => e.stopPropagation()}>
                        <h3 className={'bv-modal__title'}>
                            Instalar Bedrock {modal.channel === 'preview' ? 'Preview' : 'Stable'}{' '}
                            {modal.version}
                        </h3>

                        <label className={'bv-field-label'}>Versão</label>
                        <select
                            className={'bv-select'}
                            value={modal.version}
                            onChange={(e) =>
                                setModal({ ...modal, version: e.target.value })
                            }
                        >
                            {(modal.channel === 'stable'
                                ? data.catalog.stable
                                : data.catalog.preview
                            ).map((v) => (
                                <option key={v.version} value={v.version}>
                                    {v.version}
                                    {v.is_latest ? ' (latest)' : ''}
                                </option>
                            ))}
                        </select>

                        <div className={'bv-option'}>
                            <div>
                                <div className={'bv-option__title'}>APAGAR ARQUIVOS DO SERVIDOR</div>
                                <div className={'bv-option__desc'}>
                                    Isso apaga todos os arquivos antes de instalar a nova versão.
                                    Não pode ser desfeito.
                                </div>
                            </div>
                            <button
                                type={'button'}
                                className={`bv-toggle ${wipe ? 'is-on' : ''}`}
                                onClick={() => setWipe((v) => !v)}
                            >
                                <span />
                            </button>
                        </div>

                        <div className={'bv-option'}>
                            <div>
                                <div className={'bv-option__title'}>ACEITAR EULA</div>
                                <div className={'bv-option__desc'}>
                                    Ao ativar, você confirma que leu e aceita a{' '}
                                    <a
                                        href={'https://account.mojang.com/documents/minecraft_eula'}
                                        target={'_blank'}
                                        rel={'noreferrer'}
                                    >
                                        Minecraft EULA
                                    </a>
                                    .
                                </div>
                            </div>
                            <button
                                type={'button'}
                                className={`bv-toggle ${acceptEula ? 'is-on' : ''}`}
                                onClick={() => setAcceptEula((v) => !v)}
                            >
                                <span />
                            </button>
                        </div>

                        <div className={'bv-modal__actions'}>
                            <button
                                type={'button'}
                                className={'bv-btn bv-btn--ghost'}
                                disabled={installing}
                                onClick={() => setModal(null)}
                            >
                                Cancelar
                            </button>
                            <button
                                type={'button'}
                                className={'bv-btn bv-btn--danger'}
                                disabled={installing || !acceptEula}
                                onClick={handleInstall}
                            >
                                {installing ? 'Instalando...' : 'Instalar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </PageContentBlock>
    );
};

export default BedrockVersionSection;
