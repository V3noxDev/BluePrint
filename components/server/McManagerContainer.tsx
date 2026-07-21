import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import PageContentBlock from '@/components/elements/PageContentBlock';
import http from '@/api/http';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs, faPuzzlePiece, faSlidersH } from '@fortawesome/free-solid-svg-icons';
import PropertiesEditor from './properties/PropertiesEditor';
import AddonInstaller from './addons/AddonInstaller';

type Tab = 'properties' | 'addons';

interface ExtensionConfig {
    enabled: boolean;
    default_tab: Tab;
    allow_addon_install: boolean;
    allow_addon_remove: boolean;
    allow_properties_edit: boolean;
}

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const name = ServerContext.useStoreState((state) => state.server.data!.name);

    const [tab, setTab] = useState<Tab>('properties');
    const [config, setConfig] = useState<ExtensionConfig>({
        enabled: true,
        default_tab: 'properties',
        allow_addon_install: true,
        allow_addon_remove: true,
        allow_properties_edit: true,
    });
    const [toast, setToast] = useState<{ type: 'ok' | 'err'; message: string } | null>(null);

    useEffect(() => {
        http
            .get(`/api/client/extensions/mcmanager/${uuid}/config`)
            .then(({ data }) => {
                const next = data.config || {};
                setConfig({
                    enabled: next.enabled !== false,
                    default_tab: next.default_tab === 'addons' ? 'addons' : 'properties',
                    allow_addon_install: next.allow_addon_install !== false,
                    allow_addon_remove: next.allow_addon_remove !== false,
                    allow_properties_edit: next.allow_properties_edit !== false,
                });
                if (next.default_tab === 'addons' || next.default_tab === 'properties') {
                    setTab(next.default_tab);
                }
            })
            .catch(() => {
                // Keep defaults if config endpoint fails.
            });
    }, [uuid]);

    const onToast = (type: 'ok' | 'err', message: string) => {
        setToast({ type, message });
        window.setTimeout(() => setToast(null), 4500);
    };

    return (
        <PageContentBlock title={`MC Manager | ${name}`}>
            <div className="mcm-shell">
                <div className="mcm-hero">
                    <p className="mcm-kicker">Minecraft Java</p>
                    <h1 className="mcm-title">
                        <FontAwesomeIcon icon={faCogs} style={{ marginRight: 10 }} />
                        MC Manager
                    </h1>
                    <p className="mcm-subtitle">
                        Edite o <strong>server.properties</strong> com seleções visuais e instale/remova plugins
                        diretamente no painel — sem FTP.
                    </p>
                </div>

                {toast && <div className={`mcm-toast ${toast.type}`}>{toast.message}</div>}

                {!config.enabled && (
                    <div className="mcm-toast err">MC Manager está desabilitado pelo administrador.</div>
                )}

                <div className="mcm-tabs">
                    <button
                        type="button"
                        className={`mcm-tab ${tab === 'properties' ? 'is-active' : ''}`}
                        onClick={() => setTab('properties')}
                    >
                        <FontAwesomeIcon icon={faSlidersH} style={{ marginRight: 6 }} />
                        server.properties
                    </button>
                    <button
                        type="button"
                        className={`mcm-tab ${tab === 'addons' ? 'is-active' : ''}`}
                        onClick={() => setTab('addons')}
                    >
                        <FontAwesomeIcon icon={faPuzzlePiece} style={{ marginRight: 6 }} />
                        Addons
                    </button>
                </div>

                {tab === 'properties' && (
                    <PropertiesEditor
                        uuid={uuid}
                        canEdit={config.enabled && config.allow_properties_edit}
                        onToast={onToast}
                    />
                )}

                {tab === 'addons' && (
                    <AddonInstaller
                        uuid={uuid}
                        canInstall={config.enabled && config.allow_addon_install}
                        canRemove={config.enabled && config.allow_addon_remove}
                        onToast={onToast}
                    />
                )}
            </div>
        </PageContentBlock>
    );
};
