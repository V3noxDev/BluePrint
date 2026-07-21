import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageContentBlock from '@/components/elements/PageContentBlock';
import http, { httpErrorToHuman } from '@/api/http';
import { ServerContext } from '@/state/server';
import AddonsPanel from './AddonsPanel';
import PropertiesPanel from './PropertiesPanel';
import {
    Badge,
    Button,
    Content,
    Dot,
    EmptyState,
    Eyebrow,
    Heading,
    Hero,
    HeroBadges,
    HeroContent,
    HeroDescription,
    HeroTitle,
    LoadingState,
    Notice,
    Panel,
    PanelHeader,
    Shell,
    Spinner,
    TabButton,
    Tabs,
} from '../styles';
import { AddonType, CatalogMetadata, MineHubConfiguration } from '../types';

type ActiveTab = 'addons' | 'properties';

const MineHubSection = () => {
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const permissions = ServerContext.useStoreState((state) => state.server.permissions);
    const serverIdentifier = String(server.identifier ?? server.uuid);
    const [configuration, setConfiguration] = useState<MineHubConfiguration | null>(null);
    const [metadata, setMetadata] = useState<CatalogMetadata | null>(null);
    const [configurationError, setConfigurationError] = useState('');
    const [metadataError, setMetadataError] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ActiveTab>('addons');
    const [addonType, setAddonType] = useState<AddonType>('plugin');

    const hasPermission = useCallback(
        (permission: string): boolean => permissions.includes('*') || permissions.includes(permission),
        [permissions]
    );

    const loadExtensionData = useCallback(async () => {
        setLoading(true);
        setConfigurationError('');
        setMetadataError('');

        const [configurationResult, metadataResult] = await Promise.all([
            http
                .get<MineHubConfiguration>('/api/client/extensions/minehub/catalog/config')
                .then((response) => ({ response, error: null }))
                .catch((error) => ({ response: null, error })),
            http
                .get<CatalogMetadata>('/api/client/extensions/minehub/catalog/metadata')
                .then((response) => ({ response, error: null }))
                .catch((error) => ({ response: null, error })),
        ]);

        if (configurationResult.response) {
            setConfiguration(configurationResult.response.data);
        } else {
            setConfigurationError(httpErrorToHuman(configurationResult.error));
        }

        if (metadataResult.response) {
            setMetadata(metadataResult.response.data);
        } else {
            setMetadataError(httpErrorToHuman(metadataResult.error));
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        void loadExtensionData();
    }, [loadExtensionData]);

    const enabledTypes = useMemo<AddonType[]>(() => {
        if (!configuration) return [];

        const types: AddonType[] = [];
        if (configuration.plugins_enabled) types.push('plugin');
        if (configuration.mods_enabled) types.push('mod');

        return types;
    }, [configuration]);

    useEffect(() => {
        if (!configuration) return;

        const preferred = enabledTypes.includes(configuration.default_section)
            ? configuration.default_section
            : enabledTypes[0];

        if (preferred) {
            setAddonType(preferred);
        }

        if (enabledTypes.length === 0 && configuration.properties_enabled) {
            setActiveTab('properties');
        } else if (!configuration.properties_enabled) {
            setActiveTab('addons');
        }
    }, [configuration, enabledTypes]);

    if (loading && !configuration) {
        return (
            <PageContentBlock title='MineHub'>
                <LoadingState style={{ minHeight: 420 }}>
                    <Spinner aria-label='Carregando MineHub' />
                </LoadingState>
            </PageContentBlock>
        );
    }

    return (
        <PageContentBlock title='MineHub'>
            <Shell>
                <Hero>
                    <HeroContent>
                        <Eyebrow>
                            <Dot />
                            Minecraft control center
                        </Eyebrow>
                        <HeroTitle>MineHub</HeroTitle>
                        <HeroDescription>
                            Plugins, mods e configurações do Minecraft em um só lugar. Todas as ações respeitam as
                            permissões definidas para sua conta.
                        </HeroDescription>
                        <HeroBadges>
                            <Badge>Servidor: {server.name}</Badge>
                            <Badge>Catálogo: {configuration?.provider ?? 'Modrinth'}</Badge>
                            <Badge>Instalação direta</Badge>
                        </HeroBadges>
                    </HeroContent>
                </Hero>

                {configurationError ? (
                    <Panel>
                        <PanelHeader>
                            <Heading>
                                <h2>Não foi possível carregar o MineHub</h2>
                                <p>A configuração da extensão não respondeu corretamente.</p>
                            </Heading>
                            <Button type='button' onClick={() => void loadExtensionData()}>
                                Tentar novamente
                            </Button>
                        </PanelHeader>
                        <Content>
                            <Notice $tone='danger'>{configurationError}</Notice>
                        </Content>
                    </Panel>
                ) : configuration ? (
                    <>
                        {enabledTypes.length > 0 || configuration.properties_enabled ? (
                            <Tabs aria-label='Seções do MineHub'>
                                {enabledTypes.length > 0 ? (
                                    <TabButton
                                        type='button'
                                        $active={activeTab === 'addons'}
                                        onClick={() => setActiveTab('addons')}
                                    >
                                        Addons
                                    </TabButton>
                                ) : null}
                                {configuration.properties_enabled ? (
                                    <TabButton
                                        type='button'
                                        $active={activeTab === 'properties'}
                                        onClick={() => setActiveTab('properties')}
                                    >
                                        server.properties
                                    </TabButton>
                                ) : null}
                            </Tabs>
                        ) : null}

                        {activeTab === 'addons' && enabledTypes.length > 0 ? (
                            metadata ? (
                                <AddonsPanel
                                    serverIdentifier={serverIdentifier}
                                    addonType={addonType}
                                    onAddonTypeChange={setAddonType}
                                    enabledTypes={enabledTypes}
                                    metadata={metadata}
                                    canRead={hasPermission('file.read')}
                                    canCreate={hasPermission('file.create')}
                                    canUpdate={hasPermission('file.update')}
                                    canDelete={hasPermission('file.delete')}
                                />
                            ) : (
                                <Panel>
                                    <Content>
                                        <Notice $tone='danger'>
                                            {metadataError || 'O catálogo não retornou versões disponíveis.'}
                                        </Notice>
                                        <Button type='button' onClick={() => void loadExtensionData()}>
                                            Recarregar catálogo
                                        </Button>
                                    </Content>
                                </Panel>
                            )
                        ) : null}

                        {activeTab === 'properties' && configuration.properties_enabled ? (
                            <PropertiesPanel
                                serverIdentifier={serverIdentifier}
                                canRead={hasPermission('file.read-content')}
                                canUpdate={hasPermission('file.update')}
                            />
                        ) : null}

                        {enabledTypes.length === 0 && !configuration.properties_enabled ? (
                            <EmptyState>
                                <div>
                                    <strong>MineHub está desativado neste painel</strong>
                                    <p>Um administrador precisa ativar ao menos um recurso da extensão.</p>
                                </div>
                            </EmptyState>
                        ) : null}
                    </>
                ) : null}
            </Shell>
        </PageContentBlock>
    );
};

export default MineHubSection;
