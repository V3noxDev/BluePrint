import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBoxOpen,
    faCheckCircle,
    faCode,
    faCogs,
    faExclamationTriangle,
    faGlobe,
    faNetworkWired,
    faPencilRuler,
    faPowerOff,
    faQuestionCircle,
    faSave,
    faSearch,
    faShieldAlt,
    faSlidersH,
    faSyncAlt,
    faUndo,
    faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import Spinner from '@/components/elements/Spinner';
import Can from '@/components/elements/Can';
import useFlash from '@/plugins/useFlash';
import http from '@/api/http';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import { CATALOG, CATALOG_MAP, CATEGORIES, CategoryId, PropertyDefinition } from './catalog';
import { extractValues, ParsedFile, parseProperties, serializeProperties } from './parser';
import PropertyCard from './PropertyCard';
import {
    ActionButton,
    CategoryTab,
    CategoryTabs,
    EmptyState,
    Footer,
    Grid,
    HeaderActions,
    HeaderCard,
    HeaderIcon,
    HeaderText,
    NoticeBanner,
    PageWrapper,
    RawEditor,
    SaveBar,
    SearchBox,
    Toolbar,
} from './styles';

const CATEGORY_ICONS: Record<CategoryId | 'all', IconDefinition> = {
    all: faSlidersH,
    general: faSlidersH,
    world: faGlobe,
    players: faUsers,
    network: faNetworkWired,
    resources: faBoxOpen,
    security: faShieldAlt,
    advanced: faCogs,
    other: faQuestionCircle,
};

interface ExtensionSettings {
    allowDangerous: boolean;
    allowRawEditor: boolean;
    hideUnknown: boolean;
    filePath: string;
}

const DEFAULT_SETTINGS: ExtensionSettings = {
    allowDangerous: false,
    allowRawEditor: true,
    hideUnknown: false,
    filePath: '/server.properties',
};

const FLASH_KEY = 'mcproperties';

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { addFlash, clearFlashes, clearAndAddHttpError } = useFlash();

    const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
    const [parsed, setParsed] = useState<ParsedFile | null>(null);
    const [original, setOriginal] = useState<Record<string, string>>({});
    const [values, setValues] = useState<Record<string, string>>({});
    const [rawContent, setRawContent] = useState('');
    const [originalRaw, setOriginalRaw] = useState('');
    const [rawMode, setRawMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [restarting, setRestarting] = useState(false);
    const [savedRecently, setSavedRecently] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<CategoryId | 'all'>('all');

    const load = useCallback(
        (filePath: string) => {
            setLoading(true);
            setNotFound(false);
            return getFileContents(uuid, filePath)
                .then((content) => {
                    const file = parseProperties(content);
                    const extracted = extractValues(file);
                    setParsed(file);
                    setOriginal(extracted);
                    setValues(extracted);
                    setRawContent(content);
                    setOriginalRaw(content);
                })
                .catch((error) => {
                    console.error(error);
                    if (error.response?.status === 404) {
                        setNotFound(true);
                    } else {
                        clearAndAddHttpError({ key: FLASH_KEY, error });
                    }
                })
                .then(() => setLoading(false));
        },
        [uuid]
    );

    useEffect(() => {
        clearFlashes(FLASH_KEY);
        http.get('/api/client/extensions/mcproperties/settings')
            .then(({ data }) => {
                const fetched: ExtensionSettings = {
                    allowDangerous: data.data?.allow_dangerous ?? DEFAULT_SETTINGS.allowDangerous,
                    allowRawEditor: data.data?.allow_raw_editor ?? DEFAULT_SETTINGS.allowRawEditor,
                    hideUnknown: data.data?.hide_unknown ?? DEFAULT_SETTINGS.hideUnknown,
                    filePath: data.data?.file_path || DEFAULT_SETTINGS.filePath,
                };
                setSettings(fetched);
                return load(fetched.filePath);
            })
            .catch(() => load(DEFAULT_SETTINGS.filePath));
    }, [uuid]);

    const modifiedKeys = useMemo(
        () =>
            Object.keys(values).filter(
                (key) => (original[key] ?? '') !== (values[key] ?? '')
            ),
        [values, original]
    );

    const unknownDefinitions = useMemo<PropertyDefinition[]>(
        () =>
            Object.keys(original)
                .filter((key) => !CATALOG_MAP[key])
                .sort()
                .map((key) => ({
                    key,
                    label: key,
                    description: 'Propriedade não catalogada — presente no seu server.properties.',
                    category: 'other' as CategoryId,
                    type: 'string' as const,
                    defaultValue: '',
                })),
        [original]
    );

    const allDefinitions = useMemo(() => {
        const present = CATALOG.filter((def) => Object.prototype.hasOwnProperty.call(original, def.key));
        const missing = CATALOG.filter((def) => !Object.prototype.hasOwnProperty.call(original, def.key));
        return settings.hideUnknown ? [...present, ...missing] : [...present, ...missing, ...unknownDefinitions];
    }, [original, unknownDefinitions, settings.hideUnknown]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return allDefinitions.filter((def) => {
            if (category !== 'all' && def.category !== category) return false;
            if (!term) return true;
            return (
                def.key.toLowerCase().includes(term) ||
                def.label.toLowerCase().includes(term) ||
                def.description.toLowerCase().includes(term)
            );
        });
    }, [allDefinitions, category, search]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { all: allDefinitions.length };
        for (const def of allDefinitions) {
            counts[def.category] = (counts[def.category] || 0) + 1;
        }
        return counts;
    }, [allDefinitions]);

    const onChange = (key: string, value: string) => {
        setValues((prev) => ({ ...prev, [key]: value }));
        setSavedRecently(false);
    };

    const discard = () => {
        setValues(original);
        setRawContent(originalRaw);
        setSavedRecently(false);
    };

    const save = () => {
        if (!parsed && !rawMode) return;
        clearFlashes(FLASH_KEY);
        setSaving(true);

        const content = rawMode ? rawContent : serializeProperties(parsed!, values);

        saveFileContents(uuid, settings.filePath, content)
            .then(() => {
                const file = parseProperties(content);
                const extracted = extractValues(file);
                setParsed(file);
                setOriginal(extracted);
                setValues(extracted);
                setRawContent(content);
                setOriginalRaw(content);
                setSavedRecently(true);
                addFlash({
                    key: FLASH_KEY,
                    type: 'success',
                    message: 'server.properties salvo com sucesso! Reinicie o servidor para aplicar as alterações.',
                });
            })
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: FLASH_KEY, error });
            })
            .then(() => setSaving(false));
    };

    const restart = () => {
        setRestarting(true);
        http.post(`/api/client/servers/${uuid}/power`, { signal: 'restart' })
            .then(() => {
                setSavedRecently(false);
                addFlash({ key: FLASH_KEY, type: 'success', message: 'Reinicialização enviada para o servidor.' });
            })
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: FLASH_KEY, error });
            })
            .then(() => setRestarting(false));
    };

    const createFile = () => {
        setSaving(true);
        const content = CATALOG.map((def) => `${def.key}=${def.defaultValue}`).join('\n') + '\n';
        saveFileContents(uuid, settings.filePath, content)
            .then(() => load(settings.filePath))
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: FLASH_KEY, error });
            })
            .then(() => setSaving(false));
    };

    const hasChanges = rawMode ? rawContent !== originalRaw : modifiedKeys.length > 0;

    return (
        <ServerContentBlock title={'Server Properties'}>
            <PageWrapper>
                <div style={{ marginBottom: '1rem' }}>
                    <FlashMessageRender byKey={FLASH_KEY} />
                </div>

                <HeaderCard>
                    <HeaderIcon>
                        <FontAwesomeIcon icon={faPencilRuler} />
                    </HeaderIcon>
                    <HeaderText>
                        <h1>Server Properties</h1>
                        <p>
                            Edite o <code>{settings.filePath}</code> do seu servidor Minecraft Java com uma interface
                            visual — sem tocar em arquivos.
                        </p>
                    </HeaderText>
                    <HeaderActions>
                        {settings.allowRawEditor && (
                            <ActionButton $variant={'ghost'} onClick={() => setRawMode(!rawMode)} disabled={loading || notFound}>
                                <FontAwesomeIcon icon={rawMode ? faSlidersH : faCode} />
                                {rawMode ? 'Modo visual' : 'Editor raw'}
                            </ActionButton>
                        )}
                        <ActionButton $variant={'ghost'} onClick={() => load(settings.filePath)} disabled={loading || saving}>
                            <FontAwesomeIcon icon={faSyncAlt} spin={loading} />
                            Recarregar
                        </ActionButton>
                    </HeaderActions>
                </HeaderCard>

                {savedRecently && (
                    <NoticeBanner $color={'green'}>
                        <FontAwesomeIcon icon={faCheckCircle} />
                        <div className={'grow'}>
                            Alterações salvas! Reinicie o servidor para que as novas configurações entrem em vigor.
                        </div>
                        <Can action={'control.restart'}>
                            <ActionButton onClick={restart} disabled={restarting}>
                                <FontAwesomeIcon icon={faPowerOff} />
                                {restarting ? 'Reiniciando...' : 'Reiniciar agora'}
                            </ActionButton>
                        </Can>
                    </NoticeBanner>
                )}

                {loading ? (
                    <div style={{ padding: '4rem 0' }}>
                        <Spinner centered size={'large'} />
                    </div>
                ) : notFound ? (
                    <EmptyState>
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        <p>
                            O arquivo <code>{settings.filePath}</code> não foi encontrado neste servidor.
                            <br />
                            Ele é criado automaticamente na primeira inicialização de um servidor Minecraft Java.
                        </p>
                        <Can action={'file.create'}>
                            <ActionButton onClick={createFile} disabled={saving}>
                                <FontAwesomeIcon icon={faSave} />
                                Criar arquivo com valores padrão
                            </ActionButton>
                        </Can>
                    </EmptyState>
                ) : rawMode ? (
                    <>
                        <NoticeBanner $color={'amber'}>
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                            <div className={'grow'}>
                                Modo raw: você está editando o arquivo diretamente. Tenha cuidado com a sintaxe
                                (<code>chave=valor</code>, uma por linha).
                            </div>
                        </NoticeBanner>
                        <RawEditor
                            value={rawContent}
                            spellCheck={false}
                            onChange={(e) => {
                                setRawContent(e.target.value);
                                setSavedRecently(false);
                            }}
                        />
                    </>
                ) : (
                    <>
                        <Toolbar>
                            <SearchBox>
                                <FontAwesomeIcon icon={faSearch} />
                                <input
                                    type={'text'}
                                    placeholder={'Buscar propriedade... (ex: pvp, view-distance, motd)'}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </SearchBox>
                        </Toolbar>

                        <CategoryTabs>
                            <CategoryTab $active={category === 'all'} onClick={() => setCategory('all')}>
                                <FontAwesomeIcon icon={CATEGORY_ICONS.all} />
                                Todas
                                <span className={'count'}>{categoryCounts.all || 0}</span>
                            </CategoryTab>
                            {CATEGORIES.filter((c) => (categoryCounts[c.id] || 0) > 0).map((c) => (
                                <CategoryTab key={c.id} $active={category === c.id} onClick={() => setCategory(c.id)}>
                                    <FontAwesomeIcon icon={CATEGORY_ICONS[c.id]} />
                                    {c.label}
                                    <span className={'count'}>{categoryCounts[c.id] || 0}</span>
                                </CategoryTab>
                            ))}
                        </CategoryTabs>

                        {filtered.length === 0 ? (
                            <EmptyState>
                                <FontAwesomeIcon icon={faSearch} />
                                <p>Nenhuma propriedade encontrada para a sua busca.</p>
                            </EmptyState>
                        ) : (
                            <Grid>
                                {filtered.map((def) => (
                                    <PropertyCard
                                        key={def.key}
                                        definition={def}
                                        value={values[def.key] ?? def.defaultValue}
                                        modified={(original[def.key] ?? '') !== (values[def.key] ?? '')}
                                        locked={!!def.dangerous && !settings.allowDangerous}
                                        onChange={onChange}
                                    />
                                ))}
                            </Grid>
                        )}
                    </>
                )}

                {!loading && !notFound && (
                    <Can action={'file.update'}>
                        <SaveBar>
                            <div className={'info'}>
                                <FontAwesomeIcon icon={hasChanges ? faExclamationTriangle : faCheckCircle} />
                                {hasChanges
                                    ? rawMode
                                        ? 'Você tem alterações não salvas no editor raw.'
                                        : `${modifiedKeys.length} ${
                                              modifiedKeys.length === 1 ? 'propriedade alterada' : 'propriedades alteradas'
                                          } sem salvar.`
                                    : 'Tudo salvo. Nenhuma alteração pendente.'}
                            </div>
                            <div className={'actions'}>
                                <ActionButton $variant={'ghost'} onClick={discard} disabled={!hasChanges || saving}>
                                    <FontAwesomeIcon icon={faUndo} />
                                    Descartar
                                </ActionButton>
                                <ActionButton onClick={save} disabled={!hasChanges || saving}>
                                    <FontAwesomeIcon icon={faSave} spin={saving} />
                                    {saving ? 'Salvando...' : 'Salvar alterações'}
                                </ActionButton>
                            </div>
                        </SaveBar>
                    </Can>
                )}

                <Footer>
                    MC Properties v{'{version}'} — feito com Blueprint Framework
                </Footer>
            </PageWrapper>
        </ServerContentBlock>
    );
};
