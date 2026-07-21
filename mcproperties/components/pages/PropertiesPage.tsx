import React, { useEffect, useMemo, useState } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import Spinner from '@/components/elements/Spinner';
import Button from '@/components/elements/Button';
import Input from '@/components/elements/Input';
import Can from '@/components/elements/Can';
import { httpErrorToHuman } from '@/api/http';

import { CATEGORIES, CategoryKey, definitionFor, findDefinition, PropertyDefinition } from '../lib/catalog';
import { getServerProperties, saveServerProperties, sendPowerAction } from '../lib/api';
import { parseProperties, PropertiesDocument, serializeProperties } from '../lib/properties';
import PropertyField from '../elements/PropertyField';
import MotdEditor from '../elements/MotdEditor';

const FLASH_KEY = 'mcproperties';

const Pill = styled.button<{ $active: boolean }>`
    ${tw`px-3 py-1 rounded-full text-xs uppercase tracking-wide cursor-pointer transition-colors duration-150 border mr-2 mb-2 flex-none`};
    ${(props) =>
        props.$active
            ? tw`bg-primary-500 border-primary-600 text-primary-50`
            : tw`bg-neutral-700 border-neutral-600 text-neutral-300 hover:text-neutral-100 hover:border-neutral-500`};
`;

const SaveBarWrapper = styled.div`
    ${tw`fixed bottom-0 left-0 right-0 flex justify-center z-50`};
    pointer-events: none;
    padding-bottom: 1.25rem;
`;

const SaveBar = styled.div`
    ${tw`rounded shadow-lg bg-neutral-900 border border-neutral-600 p-3 flex flex-wrap items-center mx-4`};
    pointer-events: auto;
`;

const SectionTitle = styled.h3`
    ${tw`text-xs uppercase tracking-widest text-neutral-400 mt-8 mb-3 flex items-center`};
    &::after {
        content: '';
        ${tw`flex-1 ml-3 border-b border-neutral-700`};
    }
`;

type FilterKey = 'all' | CategoryKey;

const matchesSearch = (definition: PropertyDefinition, term: string): boolean => {
    if (term === '') return true;
    const haystack = `${definition.key} ${definition.label} ${definition.description}`.toLowerCase();
    return haystack.includes(term.toLowerCase());
};

const PropertiesPage = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const serverName = ServerContext.useStoreState((state) => state.server.data!.name);
    const { addFlash, clearFlashes, clearAndAddHttpError } = useFlash();

    const [loading, setLoading] = useState(true);
    const [missing, setMissing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [restarting, setRestarting] = useState(false);
    const [doc, setDoc] = useState<PropertiesDocument | null>(null);
    const [values, setValues] = useState<Record<string, string>>({});
    const [original, setOriginal] = useState<Record<string, string>>({});
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterKey>('all');

    const load = () => {
        setLoading(true);
        setMissing(false);
        clearFlashes(FLASH_KEY);
        getServerProperties(uuid)
            .then((content) => {
                const parsed = parseProperties(content);
                setDoc(parsed);
                setValues({ ...parsed.values });
                setOriginal({ ...parsed.values });
            })
            .catch((error) => {
                console.error(error);
                const status = error?.response?.status;
                if (status === 404 || status === 400) {
                    setMissing(true);
                } else {
                    clearAndAddHttpError({ key: FLASH_KEY, error });
                }
            })
            .then(() => setLoading(false));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uuid]);

    const isModified = (key: string): boolean => (values[key] ?? '') !== (original[key] ?? '');

    const dirtyKeys = useMemo(
        () => Object.keys(values).filter((key) => isModified(key)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [values, original]
    );

    const setValue = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));
    const resetValue = (key: string) => setValues((prev) => ({ ...prev, [key]: original[key] ?? '' }));
    const discardAll = () => setValues({ ...original });

    const save = (restartAfter: boolean) => {
        if (!doc) return;
        setSaving(true);
        if (restartAfter) setRestarting(true);
        clearFlashes(FLASH_KEY);

        const content = serializeProperties(doc, values);
        saveServerProperties(uuid, content)
            .then(() => {
                setDoc(parseProperties(content));
                setOriginal({ ...values });
                if (restartAfter) {
                    return sendPowerAction(uuid, 'restart').then(() => {
                        addFlash({
                            key: FLASH_KEY,
                            type: 'success',
                            message: 'Propriedades salvas! O servidor está sendo reiniciado para aplicar as mudanças.',
                        });
                    });
                }
                addFlash({
                    key: FLASH_KEY,
                    type: 'success',
                    message: 'Propriedades salvas! Reinicie o servidor para aplicar as mudanças.',
                });
                return undefined;
            })
            .catch((error) => {
                console.error(error);
                addFlash({
                    key: FLASH_KEY,
                    type: 'error',
                    title: 'Erro',
                    message: httpErrorToHuman(error),
                });
            })
            .then(() => {
                setSaving(false);
                setRestarting(false);
            });
    };

    // Propriedades presentes no arquivo (na ordem original), exceto o MOTD,
    // que tem um editor próprio em destaque.
    const fileDefinitions = useMemo(() => {
        if (!doc) return [] as PropertyDefinition[];
        return doc.order.filter((key) => key !== 'motd').map((key) => definitionFor(key));
    }, [doc]);

    const availableFilters = useMemo(() => {
        const present = new Set(fileDefinitions.map((definition) => definition.category));
        return CATEGORIES.filter((category) => present.has(category.key) || category.key === 'geral');
    }, [fileDefinitions]);

    const visibleDefinitions = fileDefinitions.filter(
        (definition) => (filter === 'all' || definition.category === filter) && matchesSearch(definition, search)
    );

    const motdDefinition = findDefinition('motd')!;
    const showMotd =
        doc !== null && (filter === 'all' || filter === 'geral') && matchesSearch(motdDefinition, search);

    const renderGrid = (definitions: PropertyDefinition[]) => (
        <div css={tw`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`}>
            {definitions.map((definition) => (
                <PropertyField
                    key={definition.key}
                    definition={definition}
                    value={values[definition.key] ?? ''}
                    modified={isModified(definition.key)}
                    onChange={(value) => setValue(definition.key, value)}
                    onReset={() => resetValue(definition.key)}
                />
            ))}
        </div>
    );

    return (
        <ServerContentBlock title={'Propriedades'}>
            <FlashMessageRender byKey={FLASH_KEY} css={tw`mb-4`} />

            {loading ? (
                <div css={tw`flex justify-center items-center py-16`}>
                    <Spinner size={'large'} />
                </div>
            ) : missing ? (
                <div css={tw`rounded shadow-md bg-neutral-700 p-8 flex flex-col items-center text-center`}>
                    <div css={tw`text-4xl mb-4`}>🧭</div>
                    <h2 css={tw`text-neutral-100 text-lg mb-2`}>server.properties não encontrado</h2>
                    <p css={tw`text-sm text-neutral-400 max-w-lg mb-6`}>
                        Este servidor ainda não possui um arquivo <code>server.properties</code> na raiz. Ele é criado
                        automaticamente na primeira inicialização de um servidor Minecraft Java. Inicie o servidor e
                        tente novamente.
                    </p>
                    <Button onClick={load}>Tentar novamente</Button>
                </div>
            ) : (
                doc && (
                    <>
                        <div css={tw`flex flex-col md:flex-row md:items-center mb-4`}>
                            <div css={tw`flex-1 md:mr-4 mb-3 md:mb-0`}>
                                <Input
                                    type={'text'}
                                    placeholder={'Buscar propriedade... (ex.: pvp, whitelist, view-distance)'}
                                    value={search}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.currentTarget.value)}
                                />
                            </div>
                            <p css={tw`text-xs text-neutral-400 flex-none`}>
                                {fileDefinitions.length + (doc.order.includes('motd') ? 1 : 0)} propriedades carregadas
                            </p>
                        </div>

                        <div css={tw`flex flex-wrap mb-2`}>
                            <Pill type={'button'} $active={filter === 'all'} onClick={() => setFilter('all')}>
                                Tudo
                            </Pill>
                            {availableFilters.map((category) => (
                                <Pill
                                    key={category.key}
                                    type={'button'}
                                    $active={filter === category.key}
                                    onClick={() => setFilter(category.key)}
                                >
                                    {category.label}
                                </Pill>
                            ))}
                        </div>

                        {showMotd && (
                            <div css={tw`mb-6`}>
                                <MotdEditor
                                    value={values['motd'] ?? ''}
                                    modified={isModified('motd')}
                                    serverName={serverName}
                                    onChange={(value) => setValue('motd', value)}
                                    onReset={() => resetValue('motd')}
                                />
                            </div>
                        )}

                        {visibleDefinitions.length === 0 && !showMotd ? (
                            <div css={tw`rounded shadow-md bg-neutral-700 p-8 text-center`}>
                                <p css={tw`text-sm text-neutral-400`}>
                                    Nenhuma propriedade encontrada para &quot;{search}&quot;.
                                </p>
                            </div>
                        ) : filter === 'all' ? (
                            CATEGORIES.map((category) => {
                                const definitions = visibleDefinitions.filter(
                                    (definition) => definition.category === category.key
                                );
                                if (definitions.length === 0) return null;
                                return (
                                    <div key={category.key}>
                                        <SectionTitle>{category.label}</SectionTitle>
                                        {renderGrid(definitions)}
                                    </div>
                                );
                            })
                        ) : (
                            <div css={tw`mt-4`}>{renderGrid(visibleDefinitions)}</div>
                        )}

                        {dirtyKeys.length > 0 && (
                            <SaveBarWrapper>
                                <SaveBar>
                                    <p css={tw`text-sm text-neutral-200 mr-4 my-1`}>
                                        <strong css={tw`text-primary-300`}>{dirtyKeys.length}</strong>{' '}
                                        {dirtyKeys.length === 1 ? 'alteração pendente' : 'alterações pendentes'}
                                    </p>
                                    <div css={tw`flex items-center my-1`}>
                                        <Button isSecondary onClick={discardAll} disabled={saving} css={tw`mr-2`}>
                                            Descartar
                                        </Button>
                                        <Can action={'file.update'}>
                                            <Button
                                                onClick={() => save(false)}
                                                disabled={saving}
                                                isLoading={saving && !restarting}
                                                css={tw`mr-2`}
                                            >
                                                Salvar
                                            </Button>
                                            <Button
                                                color={'green'}
                                                onClick={() => save(true)}
                                                disabled={saving}
                                                isLoading={restarting}
                                            >
                                                Salvar & Reiniciar
                                            </Button>
                                        </Can>
                                    </div>
                                </SaveBar>
                            </SaveBarWrapper>
                        )}

                        {/* Espaço extra para a barra de salvar não cobrir os últimos cards. */}
                        {dirtyKeys.length > 0 && <div css={tw`h-24`} />}
                    </>
                )
            )}
        </ServerContentBlock>
    );
};

export default PropertiesPage;
