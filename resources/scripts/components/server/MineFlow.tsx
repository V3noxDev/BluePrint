import React, { useCallback, useEffect, useState } from 'react';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faCubes, faMagic, faSlidersH } from '@fortawesome/free-solid-svg-icons';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import { ServerContext } from '@/state/server';
import useFlash from '@/plugins/useFlash';
import Marketplace from './mineflow/Marketplace';
import InstalledAddons from './mineflow/InstalledAddons';
import PropertiesEditor from './mineflow/PropertiesEditor';
import { Badge, Hero, HeroMark, TabButton, TabList } from './mineflow/styles';

type Tab = 'catalog' | 'installed' | 'properties';

export default () => {
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const { addFlash, clearFlashes } = useFlash();
    const [tab, setTab] = useState<Tab>('catalog');
    const [refreshToken, setRefreshToken] = useState(0);

    useEffect(() => {
        clearFlashes('mineflow');
    }, []);

    const success = useCallback((message: string): void => {
        clearFlashes('mineflow');
        addFlash({ key: 'mineflow', type: 'success', message });
    }, [addFlash, clearFlashes]);

    const error = useCallback((message: string): void => {
        clearFlashes('mineflow');
        addFlash({ key: 'mineflow', type: 'error', message });
    }, [addFlash, clearFlashes]);

    const installed = useCallback((message: string): void => {
        success(message);
        setRefreshToken((value) => value + 1);
        setTab('installed');
    }, [success]);

    return (
        <ServerContentBlock title={'MineFlow'}>
            <FlashMessageRender byKey={'mineflow'} css={tw`mb-5`} />

            <Hero>
                <div className={'relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between'}>
                    <div className={'flex items-center gap-4'}>
                        <HeroMark>
                            <FontAwesomeIcon icon={faMagic} className={'text-xl'} />
                        </HeroMark>
                        <div>
                            <div className={'flex flex-wrap items-center gap-2'}>
                                <h1 className={'text-2xl font-black tracking-tight text-white'}>MineFlow</h1>
                                <Badge $tone={'green'}>Blueprint</Badge>
                            </div>
                            <p className={'mt-1 text-sm text-neutral-300'}>
                                Addons e configurações do Minecraft, sem sair do painel.
                            </p>
                        </div>
                    </div>
                    <div className={'rounded-xl border border-neutral-700 bg-neutral-900/50 px-4 py-3 text-left sm:text-right'}>
                        <p className={'text-xs font-semibold uppercase tracking-wider text-neutral-500'}>Servidor</p>
                        <p className={'mt-0.5 max-w-[260px] truncate font-bold text-neutral-100'}>{server.name}</p>
                    </div>
                </div>
            </Hero>

            <TabList role={'tablist'} aria-label={'Seções do MineFlow'}>
                <TabButton
                    type={'button'}
                    role={'tab'}
                    aria-selected={tab === 'catalog'}
                    aria-label={'Catálogo'}
                    $active={tab === 'catalog'}
                    onClick={() => setTab('catalog')}
                >
                    <FontAwesomeIcon icon={faCubes} />
                    <span className={'hidden sm:inline'}>Catálogo</span>
                </TabButton>
                <TabButton
                    type={'button'}
                    role={'tab'}
                    aria-selected={tab === 'installed'}
                    aria-label={'Addons instalados'}
                    $active={tab === 'installed'}
                    onClick={() => setTab('installed')}
                >
                    <FontAwesomeIcon icon={faBox} />
                    <span className={'hidden sm:inline'}>Instalados</span>
                </TabButton>
                <TabButton
                    type={'button'}
                    role={'tab'}
                    aria-selected={tab === 'properties'}
                    aria-label={'Editar server.properties'}
                    $active={tab === 'properties'}
                    onClick={() => setTab('properties')}
                >
                    <FontAwesomeIcon icon={faSlidersH} />
                    <span className={'hidden sm:inline'}>server.properties</span>
                </TabButton>
            </TabList>

            {tab === 'catalog' && <Marketplace uuid={server.uuid} onInstalled={installed} onError={error} />}
            {tab === 'installed' && (
                <InstalledAddons
                    uuid={server.uuid}
                    refreshToken={refreshToken}
                    onSuccess={success}
                    onError={error}
                />
            )}
            {tab === 'properties' && <PropertiesEditor uuid={server.uuid} onSuccess={success} onError={error} />}
        </ServerContentBlock>
    );
};
