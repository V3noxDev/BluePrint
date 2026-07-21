import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ServerContext } from '@/state/server';
import http from '@/api/http';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';

type Channel = 'stable' | 'preview';
type View = 'home' | 'bedrock';

interface Build {
    id: string;
    label: string;
    full_version: string;
    download_url: string;
    available: boolean;
    is_latest: boolean;
}

interface VersionGroup {
    id: string;
    version: string;
    type: string;
    channel: Channel;
    builds: Build[];
    builds_count: number;
    is_latest_group: boolean;
}

interface SoftwareCard {
    id: string;
    name: string;
    icon: string | null;
    status: 'available' | 'coming_soon';
    minecraft_versions: number;
    builds: number;
    latest: string | null;
}

interface IndexData {
    is_bedrock: boolean;
    current_version: string | null;
    current_group: string | null;
    current_build: string | null;
    current_channel: Channel;
    latest_for_channel: string | null;
    outdated: boolean;
    software: SoftwareCard[];
    release: VersionGroup[];
    preview: VersionGroup[];
    chest_icon: string;
}

const BedrockVersionSection = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<IndexData | null>(null);
    const [view, setView] = useState<View>('home');
    const [showPreview, setShowPreview] = useState(false);
    const [modal, setModal] = useState<VersionGroup | null>(null);
    const [selectedBuild, setSelectedBuild] = useState<string>('');
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
                    'Falha ao carregar versões. A API pode estar indisponível.'
            );
        } finally {
            setLoading(false);
        }
    }, [uuid]);

    useEffect(() => {
        load();
    }, [load]);

    const openInstall = (group: VersionGroup) => {
        const preferred =
            group.builds.find((b) => b.is_latest)?.full_version ||
            group.builds[0]?.full_version ||
            '';
        setSelectedBuild(preferred);
        setWipe(false);
        setAcceptEula(false);
        setModal(group);
    };

    const handleInstall = async () => {
        if (!modal || !selectedBuild || !acceptEula) return;
        setInstalling(true);
        try {
            const { data: res } = await http.post(
                `/api/client/extensions/bedrockversions/servers/${uuid}/versions/install`,
                {
                    channel: modal.channel,
                    version: selectedBuild,
                    wipe,
                    accept_eula: acceptEula,
                    restart: true,
                }
            );
            if (res.success) {
                showToast('success', res.message || 'Versão instalada com sucesso!');
                setModal(null);
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

    const versionCards = useMemo(() => {
        if (!data) return [];
        return showPreview ? data.preview : data.release;
    }, [data, showPreview]);

    const chest = data?.chest_icon || '/extensions/bedrockversions/chest-face.svg';

    if (loading) {
        return (
            <PageContentBlock title={'Versions'}>
                <div className={'bv-loading'}>
                    <Spinner size={'large'} />
                    <span>Buscando versões na API...</span>
                </div>
            </PageContentBlock>
        );
    }

    if (error || !data) {
        return (
            <PageContentBlock title={'Versions'}>
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
        <PageContentBlock title={'Versions'}>
            <div className={'bv-page'}>
                {toast && (
                    <div className={`bv-toast bv-toast--${toast.type}`}>
                        <span>{toast.type === 'success' ? '✓' : '!'}</span>
                        {toast.message}
                    </div>
                )}

                <div className={'bv-status'}>
                    <img className={'bv-status__chest'} src={chest} alt={'Bedrock'} />
                    <div className={'bv-status__body'}>
                        <div className={'bv-status__title'}>
                            {data.current_version
                                ? 'Currently running Bedrock'
                                : 'Bedrock Dedicated Server'}
                        </div>
                        <div className={'bv-status__meta'}>
                            Installed Minecraft Version:{' '}
                            <strong>{data.current_group || data.current_version || '—'}</strong>
                            {data.current_build && (
                                <>
                                    {' '}
                                    · Installed Build: <strong>#{data.current_build}</strong>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {data.outdated && data.latest_for_channel && (
                    <div className={'bv-outdated'}>
                        ⚠️ Your server is currently running an outdated version of Bedrock
                        {data.current_version ? ` ${data.current_version}` : ''}. The latest build is{' '}
                        <strong>{data.latest_for_channel}</strong>.
                    </div>
                )}

                {view === 'home' ? (
                    <>
                        <div className={'bv-section-title'}>Recommended</div>
                        <div className={'bv-software-grid'}>
                            {data.software.map((item) => {
                                const comingSoon = item.status === 'coming_soon';
                                const isActive =
                                    item.id === 'bedrock' && !!data.current_version;

                                return (
                                    <button
                                        key={item.id}
                                        type={'button'}
                                        className={`bv-software-card ${isActive ? 'is-active' : ''} ${
                                            comingSoon ? 'is-disabled' : ''
                                        }`}
                                        disabled={comingSoon}
                                        onClick={() => {
                                            if (item.id === 'bedrock') setView('bedrock');
                                        }}
                                    >
                                        <div className={'bv-software-card__icon-wrap'}>
                                            {item.id === 'bedrock' ? (
                                                <img src={chest} alt={'Bedrock'} />
                                            ) : (
                                                <span className={'bv-software-card__emoji'}>⏳</span>
                                            )}
                                        </div>
                                        <div className={'bv-software-card__info'}>
                                            <div className={'bv-software-card__name'}>
                                                {item.name}
                                                {comingSoon && (
                                                    <span className={'bv-pill'}>Coming Soon</span>
                                                )}
                                            </div>
                                            <div className={'bv-software-card__meta'}>
                                                {comingSoon ? (
                                                    'Support planned'
                                                ) : (
                                                    <>
                                                        <div>
                                                            {item.minecraft_versions} Minecraft
                                                            versions
                                                        </div>
                                                        <div>{item.builds} Builds</div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <>
                        <div className={'bv-actions-row'}>
                            <button
                                type={'button'}
                                className={'bv-action-btn'}
                                onClick={() => setView('home')}
                            >
                                ← Go Back
                            </button>
                            <button
                                type={'button'}
                                className={`bv-action-btn ${showPreview ? 'is-on' : ''}`}
                                onClick={() => setShowPreview((v) => !v)}
                            >
                                {showPreview ? 'Hide Preview Versions' : 'Show Preview Versions'}
                            </button>
                        </div>

                        <div className={'bv-section-title'}>
                            {showPreview ? 'Bedrock Preview' : 'Bedrock'}
                        </div>

                        <div className={'bv-version-grid'}>
                            {versionCards.map((group) => {
                                const installed = data.current_group === group.version;
                                return (
                                    <button
                                        key={`${group.channel}-${group.version}`}
                                        type={'button'}
                                        className={`bv-version-card ${installed ? 'is-active' : ''}`}
                                        onClick={() => openInstall(group)}
                                    >
                                        <div className={'bv-version-card__left'}>
                                            <img
                                                className={'bv-version-card__chest'}
                                                src={chest}
                                                alt={'chest'}
                                            />
                                            <div>
                                                <div className={'bv-version-card__version'}>
                                                    {group.version}
                                                    {group.is_latest_group && (
                                                        <span className={'bv-pill bv-pill--gold'}>
                                                            Latest
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={'bv-version-card__type'}>
                                                    {group.is_latest_group ? 'LATEST' : group.type}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={'bv-version-card__builds'}>
                                            {group.builds_count}{' '}
                                            {group.builds_count === 1 ? 'Build' : 'Builds'}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {versionCards.length === 0 && (
                            <div className={'bv-empty'}>
                                Nenhuma versão disponível neste canal ainda.
                            </div>
                        )}
                    </>
                )}

                {modal && (
                    <div
                        className={'bv-modal-backdrop'}
                        onClick={() => !installing && setModal(null)}
                    >
                        <div className={'bv-modal'} onClick={(e) => e.stopPropagation()}>
                            <div className={'bv-modal__header'}>
                                <h3>
                                    Install Bedrock {modal.version}
                                </h3>
                                <button
                                    type={'button'}
                                    className={'bv-modal__close'}
                                    onClick={() => setModal(null)}
                                    disabled={installing}
                                >
                                    ×
                                </button>
                            </div>

                            <select
                                className={'bv-select'}
                                value={selectedBuild}
                                onChange={(e) => setSelectedBuild(e.target.value)}
                            >
                                {modal.builds.map((b) => (
                                    <option key={b.full_version} value={b.full_version}>
                                        {b.label}
                                        {b.is_latest ? ' (latest)' : ''}
                                        {!b.available ? ' — unavailable' : ''}
                                    </option>
                                ))}
                            </select>

                            <div className={'bv-option'}>
                                <div>
                                    <div className={'bv-option__title'}>WIPE SERVER FILES</div>
                                    <div className={'bv-option__desc'}>
                                        This will delete all files on your server before installing
                                        the new version. This cannot be undone.
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
                                    <div className={'bv-option__title'}>ACCEPT EULA</div>
                                    <div className={'bv-option__desc'}>
                                        By enabling this option you confirm that you have read and
                                        accept the Minecraft EULA.{' '}
                                        <a
                                            href={'https://www.minecraft.net/eula'}
                                            target={'_blank'}
                                            rel={'noreferrer'}
                                        >
                                            https://minecraft.net/eula
                                        </a>
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
                                    Cancel
                                </button>
                                <button
                                    type={'button'}
                                    className={'bv-btn bv-btn--danger'}
                                    disabled={installing || !acceptEula || !selectedBuild}
                                    onClick={handleInstall}
                                >
                                    {installing ? 'Installing...' : 'Install'}
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
