import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBoxOpen,
    faCube,
    faPuzzlePiece,
    faSyncAlt,
    faTrash,
} from '@fortawesome/free-solid-svg-icons';
import Spinner from '@/components/elements/Spinner';
import Can from '@/components/elements/Can';
import { Button } from '@/components/elements/button';
import { Dialog } from '@/components/elements/dialog';
import { httpErrorToHuman } from '@/api/http';
import { Badge, EmptyState, Panel } from './styles';
import { getInstalledAddons, removeAddon } from './api';
import { AddonKind, InstalledAddon } from './types';

interface Props {
    uuid: string;
    refreshToken: number;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

const formatBytes = (value: number): string => {
    if (value < 1024) return `${value} B`;
    if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KiB`;
    return `${(value / 1024 ** 2).toFixed(1)} MiB`;
};

export default ({ uuid, refreshToken, onSuccess, onError }: Props) => {
    const [kind, setKind] = useState<AddonKind>('plugin');
    const [addons, setAddons] = useState<InstalledAddon[]>([]);
    const [directory, setDirectory] = useState('/plugins');
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState(false);
    const [selected, setSelected] = useState<InstalledAddon | null>(null);
    const requestSequence = useRef(0);
    const removingRef = useRef(false);

    const load = useCallback(() => {
        const sequence = ++requestSequence.current;
        setLoading(true);
        setAddons([]);
        setDirectory(kind === 'plugin' ? '/plugins' : '/mods');
        getInstalledAddons(uuid, kind)
            .then((response) => {
                if (sequence !== requestSequence.current) return;
                setAddons(response.addons);
                setDirectory(response.directory);
            })
            .catch((error) => {
                if (sequence === requestSequence.current) onError(httpErrorToHuman(error));
            })
            .then(() => {
                if (sequence === requestSequence.current) setLoading(false);
            });
    }, [uuid, kind, onError]);

    useEffect(load, [load, refreshToken]);

    const remove = (): void => {
        if (!selected || removingRef.current) return;

        removingRef.current = true;
        setRemoving(true);
        removeAddon(uuid, kind, selected.name)
            .then(() => {
                onSuccess(`${selected.name} foi removido de ${directory}.`);
                setSelected(null);
                load();
            })
            .catch((error) => onError(httpErrorToHuman(error)))
            .then(() => {
                removingRef.current = false;
                setRemoving(false);
            });
    };

    return (
        <>
            <Panel>
                <div className={'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'}>
                    <div>
                        <h2 className={'text-xl font-bold text-neutral-100'}>Addons instalados</h2>
                        <p className={'mt-1 text-sm text-neutral-400'}>
                            Arquivos JAR encontrados em <code className={'text-indigo-300'}>{directory}</code>.
                        </p>
                    </div>
                    <div className={'flex items-center gap-2'}>
                        <div className={'inline-flex rounded-lg border border-neutral-600 bg-neutral-800 p-1'}>
                            <button
                                type={'button'}
                                aria-pressed={kind === 'plugin'}
                                onClick={() => setKind('plugin')}
                                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                                    kind === 'plugin' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
                                }`}
                            >
                                Plugins
                            </button>
                            <button
                                type={'button'}
                                aria-pressed={kind === 'mod'}
                                onClick={() => setKind('mod')}
                                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                                    kind === 'mod' ? 'bg-violet-600 text-white' : 'text-neutral-400 hover:text-white'
                                }`}
                            >
                                Mods
                            </button>
                        </div>
                        <Button.Text
                            size={Button.Sizes.Small}
                            onClick={load}
                            disabled={loading}
                            aria-label={'Atualizar lista'}
                        >
                            <FontAwesomeIcon icon={faSyncAlt} spin={loading} />
                        </Button.Text>
                    </div>
                </div>

                {loading ? (
                    <div className={'py-20'}>
                        <Spinner size={'large'} centered />
                    </div>
                ) : addons.length === 0 ? (
                    <EmptyState>
                        <FontAwesomeIcon icon={faBoxOpen} className={'mb-4 text-4xl text-neutral-500'} />
                        <h3 className={'text-lg font-semibold text-neutral-200'}>Diretório vazio</h3>
                        <p className={'mt-1 text-sm text-neutral-400'}>
                            Instale um {kind === 'plugin' ? 'plugin' : 'mod'} pelo catálogo para começar.
                        </p>
                    </EmptyState>
                ) : (
                    <div className={'mt-5 overflow-hidden rounded-xl border border-neutral-700'}>
                        {addons.map((addon, index) => (
                            <div
                                key={addon.name}
                                className={`flex items-center gap-4 bg-neutral-800/60 p-4 ${
                                    index > 0 ? 'border-t border-neutral-700' : ''
                                }`}
                            >
                                <div className={'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-700 text-indigo-300'}>
                                    <FontAwesomeIcon icon={kind === 'plugin' ? faPuzzlePiece : faCube} />
                                </div>
                                <div className={'min-w-0 flex-1'}>
                                    <p className={'truncate font-semibold text-neutral-100'}>{addon.name}</p>
                                    <div className={'mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-400'}>
                                        <Badge $tone={'neutral'}>{formatBytes(addon.size)}</Badge>
                                        {addon.modified_at && (
                                            <span>alterado em {new Date(addon.modified_at).toLocaleString('pt-BR')}</span>
                                        )}
                                    </div>
                                </div>
                                <Can action={'file.delete'}>
                                    <Button.Danger
                                        variant={Button.Variants.Secondary}
                                        size={Button.Sizes.Small}
                                        onClick={() => setSelected(addon)}
                                    >
                                        <FontAwesomeIcon icon={faTrash} className={'mr-2'} />
                                        Remover
                                    </Button.Danger>
                                </Can>
                            </div>
                        ))}
                    </div>
                )}
            </Panel>

            <Dialog.Confirm
                open={selected !== null}
                title={'Remover addon?'}
                confirm={removing ? 'Removendo...' : 'Remover'}
                preventExternalClose={removing}
                onClose={() => !removing && setSelected(null)}
                onConfirmed={remove}
            >
                {selected
                    ? `${selected.name} será removido permanentemente de ${directory}. Faça um backup antes se precisar preservar o arquivo.`
                    : ''}
            </Dialog.Confirm>
        </>
    );
};
