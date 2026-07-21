import React, { useCallback, useEffect, useMemo, useState } from 'react';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import { httpErrorToHuman } from '@/api/http';
import FlashMessageRender from '@/components/FlashMessageRender';
import Modal from '@/components/elements/Modal';
import Spinner from '@/components/elements/Spinner';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { usePermissions } from '@/plugins/usePermissions';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import {
    buildDefaultProperties,
    categories,
    CategoryId,
    presets,
    propertyDefinitionByKey,
    propertyDefinitions,
    PropertyDefinition,
    validateProperty,
} from './lib/catalog';
import {
    applyPropertyValues,
    getChangedPropertyKeys,
    isValidPropertyKey,
    parseProperties,
    propertiesToRecord,
    removeProperty,
    updateProperty,
} from './lib/properties';
import {
    ActionButton,
    BrandIcon,
    BrandRow,
    CategoryButton,
    CustomPropertyRow,
    EmptyState,
    Eyebrow,
    FieldCard,
    FieldDescription,
    FieldInput,
    FieldKey,
    FieldLabel,
    FieldMessage,
    FieldSelect,
    FieldsGrid,
    FieldTextarea,
    FieldTop,
    Hero,
    HeroActions,
    HeroGrid,
    HeroText,
    HeroTitle,
    LegacyBadge,
    LoadingCard,
    MainPanel,
    ModalFooter,
    ModalHeading,
    Notice,
    PageShell,
    PasswordWrap,
    PresetCard,
    PresetGrid,
    RawEditor,
    RawHeader,
    RawPanel,
    SearchInput,
    SearchWrap,
    SectionHeader,
    Sidebar,
    StatusPill,
    StatusRow,
    StickySaveBar,
    Toggle,
    Toolbar,
    ViewTab,
    ViewTabs,
    Workspace,
} from './styles';

const FILE_PATH = '/server.properties';
const BACKUP_PATH = '/server.properties.craftproperties.bak';
const FLASH_KEY = 'craftproperties';

type IconName =
    | 'adjust'
    | 'archive'
    | 'code'
    | 'eye'
    | 'file'
    | 'refresh'
    | 'save'
    | 'search'
    | 'sparkles'
    | 'warning'
    | 'x';

const Icon = ({ name }: { name: IconName }) => {
    const paths: Record<IconName, React.ReactNode> = {
        adjust: (
            <>
                <path d='M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6' />
                <circle cx='14' cy='7' r='2' />
                <circle cx='6' cy='17' r='2' />
            </>
        ),
        archive: (
            <>
                <path d='M4 7h16v13H4zM3 4h18v3H3zM9 11h6' />
            </>
        ),
        code: <path d='m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14' />,
        eye: (
            <>
                <path d='M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z' />
                <circle cx='12' cy='12' r='2.5' />
            </>
        ),
        file: (
            <>
                <path d='M6 3h8l4 4v14H6zM14 3v5h4M9 13h6M9 17h6' />
            </>
        ),
        refresh: <path d='M20 7v5h-5M4 17v-5h5M6.1 8a7 7 0 0 1 11.5-2.2L20 8M4 16l2.4 2.2A7 7 0 0 0 18 16' />,
        save: (
            <>
                <path d='M5 3h12l3 3v15H4V3zM8 3v6h8V3M8 21v-7h8v7' />
            </>
        ),
        search: (
            <>
                <circle cx='11' cy='11' r='7' />
                <path d='m16.5 16.5 4 4' />
            </>
        ),
        sparkles: <path d='m12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8L12 3ZM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15ZM19 3l.7 1.8L21.5 5l-1.8.7L19 7.5l-.7-1.8L16.5 5l1.8-.2L19 3Z' />,
        warning: <path d='M12 3 2.5 20h19L12 3Zm0 6v5m0 3v.1' />,
        x: <path d='m6 6 12 12M18 6 6 18' />,
    };

    return (
        <svg aria-hidden='true' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
            {paths[name]}
        </svg>
    );
};

interface PropertyFieldProps {
    definition: PropertyDefinition;
    value: string;
    present: boolean;
    error?: string;
    disabled: boolean;
    onChange: (value: string) => void;
}

const PropertyField = ({ definition, value, present, error, disabled, onChange }: PropertyFieldProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = `craftproperties-${definition.key.replace(/[^A-Za-z0-9]/g, '-')}`;

    const input = (() => {
        if (definition.type === 'boolean') {
            return (
                <Toggle
                    type='button'
                    role='switch'
                    aria-checked={value === 'true'}
                    aria-label={`${definition.label}: ${value === 'true' ? 'ativado' : 'desativado'}`}
                    active={value === 'true'}
                    disabled={disabled}
                    onClick={() => onChange(value === 'true' ? 'false' : 'true')}
                />
            );
        }

        if (definition.type === 'select') {
            return (
                <FieldSelect id={inputId} value={value} disabled={disabled} onChange={(event) => onChange(event.currentTarget.value)}>
                    {definition.options?.map((item) => (
                        <option key={item.value} value={item.value}>
                            {item.label}
                        </option>
                    ))}
                </FieldSelect>
            );
        }

        if (definition.type === 'textarea') {
            return (
                <FieldTextarea
                    id={inputId}
                    value={value}
                    disabled={disabled}
                    placeholder={definition.placeholder}
                    onChange={(event) => onChange(event.currentTarget.value)}
                />
            );
        }

        if (definition.type === 'password') {
            return (
                <PasswordWrap>
                    <FieldInput
                        id={inputId}
                        type={showPassword ? 'text' : 'password'}
                        value={value}
                        disabled={disabled}
                        placeholder={definition.placeholder}
                        autoComplete='new-password'
                        onChange={(event) => onChange(event.currentTarget.value)}
                    />
                    <button type='button' aria-label={showPassword ? 'Ocultar valor' : 'Mostrar valor'} onClick={() => setShowPassword(!showPassword)}>
                        <Icon name={showPassword ? 'x' : 'eye'} />
                    </button>
                </PasswordWrap>
            );
        }

        return (
            <FieldInput
                id={inputId}
                type={definition.type === 'number' ? 'number' : 'text'}
                value={value}
                min={definition.min}
                max={definition.max}
                step={definition.type === 'number' ? 1 : undefined}
                disabled={disabled}
                placeholder={definition.placeholder}
                onChange={(event) => onChange(event.currentTarget.value)}
            />
        );
    })();

    return (
        <FieldCard invalid={!!error}>
            <FieldTop>
                <div>
                    <FieldLabel htmlFor={definition.type === 'boolean' ? undefined : inputId}>
                        {definition.label}
                        {definition.legacy && <LegacyBadge>compatibilidade</LegacyBadge>}
                        {!present && <LegacyBadge>não presente</LegacyBadge>}
                    </FieldLabel>
                    <FieldKey>{definition.key}</FieldKey>
                </div>
                {definition.type === 'boolean' && input}
            </FieldTop>
            <FieldDescription>{definition.description}</FieldDescription>
            {definition.type !== 'boolean' && input}
            {error && <FieldMessage error>{error}</FieldMessage>}
            {!error && definition.warning && <FieldMessage>{definition.warning}</FieldMessage>}
        </FieldCard>
    );
};

interface UnknownPropertyProps {
    propertyKey: string;
    value: string;
    disabled: boolean;
    onChange: (value: string) => void;
    onRemove: () => void;
}

const UnknownProperty = ({ propertyKey, value, disabled, onChange, onRemove }: UnknownPropertyProps) => (
    <FieldCard>
        <FieldTop>
            <div>
                <FieldLabel>Propriedade personalizada</FieldLabel>
                <FieldKey>{propertyKey}</FieldKey>
            </div>
            <ActionButton type='button' danger disabled={disabled} onClick={onRemove} aria-label={`Remover ${propertyKey}`}>
                <Icon name='x' />
            </ActionButton>
        </FieldTop>
        <FieldDescription>Esta chave não está no catálogo, mas será preservada integralmente.</FieldDescription>
        <FieldInput value={value} disabled={disabled} onChange={(event) => onChange(event.currentTarget.value)} />
    </FieldCard>
);

const ServerProperties = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const serverStatus = ServerContext.useStoreState((state) => state.status.value);
    const [canRead, canWrite] = usePermissions(['file.read', 'file.update']);
    const { addFlash, clearFlashes } = useFlash();

    const [rawContent, setRawContent] = useState('');
    const [savedContent, setSavedContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [missing, setMissing] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<CategoryId>('essential');
    const [viewMode, setViewMode] = useState<'form' | 'raw'>('form');
    const [presetModal, setPresetModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'reload' | 'restore' | null>(null);
    const [newPropertyKey, setNewPropertyKey] = useState('');
    const [newPropertyValue, setNewPropertyValue] = useState('');
    const [newPropertyError, setNewPropertyError] = useState('');

    const loadFile = useCallback(async () => {
        if (!canRead) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setLoadError('');
        clearFlashes(FLASH_KEY);

        try {
            const content = await getFileContents(uuid, FILE_PATH);
            setRawContent(content);
            setSavedContent(content);
            setMissing(false);
        } catch (error) {
            const status = (error as { response?: { status?: number } }).response?.status;
            if (status === 404) {
                setRawContent('');
                setSavedContent('');
                setMissing(true);
            } else {
                setLoadError(httpErrorToHuman(error));
            }
        } finally {
            setLoading(false);
        }
    }, [canRead, clearFlashes, uuid]);

    useEffect(() => {
        loadFile();
    }, [loadFile]);

    const document = useMemo(() => parseProperties(rawContent), [rawContent]);
    const values = useMemo(() => propertiesToRecord(document), [document]);
    const dirty = rawContent !== savedContent;
    const changedKeys = useMemo(() => getChangedPropertyKeys(savedContent, rawContent), [rawContent, savedContent]);
    const unknownKeys = useMemo(() => Object.keys(values).filter((key) => !propertyDefinitionByKey[key]).sort(), [values]);

    const errors = useMemo(
        () =>
            propertyDefinitions.reduce<Record<string, string>>((result, definition) => {
                if (values[definition.key] !== undefined) {
                    const error = validateProperty(definition, values[definition.key]);
                    if (error) result[definition.key] = error;
                }
                return result;
            }, {}),
        [values]
    );

    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
    const visibleDefinitions = useMemo(
        () =>
            propertyDefinitions.filter((definition) => {
                if (!normalizedSearch) return definition.category === activeCategory;
                return [definition.key, definition.label, definition.description].some((text) =>
                    text.toLocaleLowerCase('pt-BR').includes(normalizedSearch)
                );
            }),
        [activeCategory, normalizedSearch]
    );

    const visibleUnknownKeys = useMemo(() => {
        if (!normalizedSearch) return activeCategory === 'advanced' ? unknownKeys : [];
        return unknownKeys.filter((key) => `${key} ${values[key]}`.toLocaleLowerCase('pt-BR').includes(normalizedSearch));
    }, [activeCategory, normalizedSearch, unknownKeys, values]);

    const selectedCategory = categories.find((category) => category.id === activeCategory)!;
    const isServerActive = serverStatus === 'running' || serverStatus === 'starting';

    const notify = (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => {
        clearFlashes(FLASH_KEY);
        addFlash({ key: FLASH_KEY, type, title, message });
    };

    const changeProperty = (key: string, value: string) => {
        setRawContent((current) => updateProperty(current, key, value));
    };

    const save = async () => {
        if (!canWrite || !dirty || saving) return;

        if (Object.keys(errors).length > 0) {
            notify('error', 'Existem valores inválidos', 'Corrija os campos destacados antes de salvar.');
            return;
        }

        setSaving(true);
        clearFlashes(FLASH_KEY);

        try {
            if (!missing && savedContent.length > 0) {
                await saveFileContents(uuid, BACKUP_PATH, savedContent);
            }

            await saveFileContents(uuid, FILE_PATH, rawContent);
            setSavedContent(rawContent);
            setMissing(false);
            notify('success', 'Configuração salva', `O ${FILE_PATH} foi atualizado e uma cópia da versão anterior foi preservada.`);
        } catch (error) {
            notify('error', 'Não foi possível salvar', httpErrorToHuman(error));
        } finally {
            setSaving(false);
        }
    };

    const restoreBackup = async () => {
        setConfirmAction(null);
        setLoading(true);

        try {
            const content = await getFileContents(uuid, BACKUP_PATH);
            setRawContent(content);
            notify('info', 'Backup carregado', 'Revise a configuração restaurada e clique em Salvar para aplicá-la.');
        } catch (error) {
            notify('error', 'Backup indisponível', httpErrorToHuman(error));
        } finally {
            setLoading(false);
        }
    };

    const applyPreset = (presetId: string) => {
        const preset = presets.find((item) => item.id === presetId);
        if (!preset) return;

        setRawContent((current) => applyPropertyValues(current, preset.values));
        setPresetModal(false);
        notify('info', `Preset “${preset.name}” aplicado`, 'As alterações ainda não foram salvas. Revise os valores antes de continuar.');
    };

    const createDefault = () => {
        setRawContent(buildDefaultProperties());
        setMissing(true);
        notify('info', 'Configuração padrão preparada', 'Clique em Salvar para criar o arquivo no servidor.');
    };

    const addCustomProperty = () => {
        const key = newPropertyKey.trim();
        if (!isValidPropertyKey(key)) {
            setNewPropertyError('Use apenas letras, números, ponto, hífen e sublinhado.');
            return;
        }
        if (values[key] !== undefined) {
            setNewPropertyError('Essa propriedade já existe no arquivo.');
            return;
        }

        setRawContent((current) => updateProperty(current, key, newPropertyValue));
        setNewPropertyKey('');
        setNewPropertyValue('');
        setNewPropertyError('');
    };

    const requestReload = () => {
        if (dirty) {
            setConfirmAction('reload');
        } else {
            loadFile();
        }
    };

    const confirmReload = () => {
        setConfirmAction(null);
        loadFile();
    };

    const renderContent = () => {
        if (loading) {
            return (
                <LoadingCard>
                    <div>
                        <Spinner centered />
                        <p>Lendo {FILE_PATH} com segurança…</p>
                    </div>
                </LoadingCard>
            );
        }

        if (!canRead) {
            return (
                <EmptyState>
                    <h3>Permissão de leitura necessária</h3>
                    <p>Solicite a permissão <code>file.read</code> para visualizar as propriedades deste servidor.</p>
                </EmptyState>
            );
        }

        if (loadError) {
            return (
                <EmptyState>
                    <h3>Não foi possível abrir o arquivo</h3>
                    <p>{loadError}</p>
                    <ActionButton type='button' onClick={loadFile} style={{ marginTop: '1rem' }}>
                        <Icon name='refresh' />
                        Tentar novamente
                    </ActionButton>
                </EmptyState>
            );
        }

        if (missing && rawContent.length === 0) {
            return (
                <EmptyState>
                    <h3>server.properties ainda não existe</h3>
                    <p>Inicie o Minecraft uma vez para gerar o arquivo ou prepare agora uma configuração compatível com as versões atuais.</p>
                    <ActionButton type='button' primary disabled={!canWrite} onClick={createDefault} style={{ marginTop: '1rem' }}>
                        <Icon name='file' />
                        Criar configuração padrão
                    </ActionButton>
                </EmptyState>
            );
        }

        if (viewMode === 'raw') {
            return (
                <RawPanel>
                    <RawHeader>
                        <code>{FILE_PATH}</code>
                        <span>{rawContent.split(/\r\n|\n|\r/).length} linhas</span>
                    </RawHeader>
                    <RawEditor
                        value={rawContent}
                        readOnly={!canWrite}
                        spellCheck={false}
                        aria-label='Conteúdo bruto do server.properties'
                        onChange={(event) => setRawContent(event.currentTarget.value)}
                    />
                </RawPanel>
            );
        }

        return (
            <Workspace>
                <Sidebar aria-label='Categorias de propriedades'>
                    {categories.map((category) => (
                        <CategoryButton
                            key={category.id}
                            type='button'
                            active={activeCategory === category.id && !normalizedSearch}
                            accent={category.accent}
                            onClick={() => {
                                setSearch('');
                                setActiveCategory(category.id);
                            }}
                        >
                            <span className='dot' />
                            <span>
                                <strong>{category.label}</strong>
                                <small>{category.description}</small>
                            </span>
                        </CategoryButton>
                    ))}
                </Sidebar>
                <MainPanel>
                    <SectionHeader>
                        <div>
                            <h2>{normalizedSearch ? 'Resultados da busca' : selectedCategory.label}</h2>
                            <p>{normalizedSearch ? `Correspondências para “${search.trim()}”` : selectedCategory.description}</p>
                        </div>
                        <span>{visibleDefinitions.length + visibleUnknownKeys.length} opções</span>
                    </SectionHeader>

                    {visibleDefinitions.length + visibleUnknownKeys.length === 0 ? (
                        <EmptyState>
                            <h3>Nenhuma propriedade encontrada</h3>
                            <p>Tente buscar pelo nome técnico, como <code>view-distance</code>, ou por uma descrição.</p>
                        </EmptyState>
                    ) : (
                        <FieldsGrid>
                            {visibleDefinitions.map((definition) => (
                                <PropertyField
                                    key={definition.key}
                                    definition={definition}
                                    value={values[definition.key] ?? definition.defaultValue}
                                    present={values[definition.key] !== undefined}
                                    error={errors[definition.key]}
                                    disabled={!canWrite}
                                    onChange={(value) => changeProperty(definition.key, value)}
                                />
                            ))}
                            {visibleUnknownKeys.map((key) => (
                                <UnknownProperty
                                    key={key}
                                    propertyKey={key}
                                    value={values[key]}
                                    disabled={!canWrite}
                                    onChange={(value) => changeProperty(key, value)}
                                    onRemove={() => setRawContent((current) => removeProperty(current, key))}
                                />
                            ))}
                        </FieldsGrid>
                    )}

                    {!normalizedSearch && activeCategory === 'advanced' && (
                        <CustomPropertyRow>
                            <label>
                                Nova chave
                                <FieldInput
                                    value={newPropertyKey}
                                    disabled={!canWrite}
                                    placeholder='minha-propriedade'
                                    onChange={(event) => {
                                        setNewPropertyKey(event.currentTarget.value);
                                        setNewPropertyError('');
                                    }}
                                />
                            </label>
                            <label>
                                Valor
                                <FieldInput
                                    value={newPropertyValue}
                                    disabled={!canWrite}
                                    placeholder='valor'
                                    onChange={(event) => setNewPropertyValue(event.currentTarget.value)}
                                />
                            </label>
                            <ActionButton type='button' disabled={!canWrite} onClick={addCustomProperty}>
                                Adicionar
                            </ActionButton>
                            {newPropertyError && <FieldMessage error>{newPropertyError}</FieldMessage>}
                        </CustomPropertyRow>
                    )}
                </MainPanel>
            </Workspace>
        );
    };

    return (
        <ServerContentBlock title='CraftProperties'>
            <PageShell>
                <FlashMessageRender byKey={FLASH_KEY} />
                <Hero>
                    <HeroGrid>
                        <BrandRow>
                            <BrandIcon>
                                <Icon name='adjust' />
                            </BrandIcon>
                            <div>
                                <Eyebrow>Minecraft Java · server.properties</Eyebrow>
                                <HeroTitle>Configuração sem complicação.</HeroTitle>
                                <HeroText>
                                    Edite propriedades com validação, presets e backup automático sem perder comentários ou opções personalizadas.
                                </HeroText>
                                <StatusRow>
                                    <StatusPill tone={loadError ? 'amber' : 'green'}>{loadError ? 'Arquivo indisponível' : 'Arquivo sincronizado'}</StatusPill>
                                    <StatusPill tone={isServerActive ? 'amber' : 'blue'}>
                                        {isServerActive ? 'Servidor em execução' : 'Servidor parado'}
                                    </StatusPill>
                                    <StatusPill>{Object.keys(values).length} propriedades</StatusPill>
                                </StatusRow>
                            </div>
                        </BrandRow>
                        <HeroActions>
                            <ActionButton type='button' disabled={!canRead || loading} onClick={() => setConfirmAction('restore')}>
                                <Icon name='archive' />
                                Restaurar backup
                            </ActionButton>
                            <ActionButton type='button' disabled={!canWrite || loading} onClick={() => setPresetModal(true)}>
                                <Icon name='sparkles' />
                                Presets
                            </ActionButton>
                            <ActionButton type='button' disabled={!canRead || loading} onClick={requestReload}>
                                <Icon name='refresh' />
                                Recarregar
                            </ActionButton>
                        </HeroActions>
                    </HeroGrid>
                </Hero>

                {isServerActive && dirty && (
                    <Notice tone='amber'>
                        <Icon name='warning' />
                        <span>O Minecraft lê a maioria destas opções apenas ao iniciar. Salve agora e reinicie o servidor para aplicar tudo.</span>
                    </Notice>
                )}

                {!canWrite && canRead && (
                    <Notice tone='red'>
                        <Icon name='warning' />
                        <span>Modo somente leitura. A permissão <code>file.update</code> é necessária para alterar ou restaurar o arquivo.</span>
                    </Notice>
                )}

                <Toolbar>
                    <SearchWrap>
                        <Icon name='search' />
                        <SearchInput
                            value={search}
                            disabled={viewMode === 'raw'}
                            placeholder='Buscar propriedade, descrição ou chave…'
                            onChange={(event) => setSearch(event.currentTarget.value)}
                        />
                    </SearchWrap>
                    <ViewTabs>
                        <ViewTab type='button' active={viewMode === 'form'} onClick={() => setViewMode('form')}>
                            Editor visual
                        </ViewTab>
                        <ViewTab type='button' active={viewMode === 'raw'} onClick={() => setViewMode('raw')}>
                            Arquivo bruto
                        </ViewTab>
                    </ViewTabs>
                </Toolbar>

                {renderContent()}

                {dirty && !loading && (
                    <StickySaveBar>
                        <div>
                            <strong>{changedKeys.length || 1} alteração(ões) pendente(s)</strong>
                            <small>{Object.keys(errors).length > 0 ? 'Corrija os valores inválidos' : 'Backup automático antes de sobrescrever'}</small>
                        </div>
                        <ActionButton
                            type='button'
                            primary
                            disabled={!canWrite || saving || Object.keys(errors).length > 0}
                            onClick={save}
                        >
                            {saving ? <Spinner size='small' /> : <Icon name='save' />}
                            {saving ? 'Salvando…' : 'Salvar'}
                        </ActionButton>
                    </StickySaveBar>
                )}

                <Modal visible={presetModal} onDismissed={() => setPresetModal(false)}>
                    <ModalHeading>
                        <h2>Escolha um ponto de partida</h2>
                        <p>Cada preset altera somente as propriedades indicadas. Suas opções personalizadas permanecem intactas.</p>
                    </ModalHeading>
                    <PresetGrid>
                        {presets.map((preset) => (
                            <PresetCard key={preset.id} type='button' tone={preset.tone} onClick={() => applyPreset(preset.id)}>
                                <span className='swatch' />
                                <strong>{preset.name}</strong>
                                <span>{preset.description}</span>
                            </PresetCard>
                        ))}
                    </PresetGrid>
                    <ModalFooter>
                        <ActionButton type='button' onClick={() => setPresetModal(false)}>
                            Cancelar
                        </ActionButton>
                    </ModalFooter>
                </Modal>

                <Modal visible={confirmAction !== null} onDismissed={() => setConfirmAction(null)}>
                    <ModalHeading>
                        <h2>{confirmAction === 'restore' ? 'Carregar o último backup?' : 'Descartar alterações locais?'}</h2>
                        <p>
                            {confirmAction === 'restore'
                                ? `O conteúdo de ${BACKUP_PATH} será carregado no editor. Você ainda precisará clicar em Salvar.`
                                : 'O arquivo será lido novamente e todas as alterações ainda não salvas serão perdidas.'}
                        </p>
                    </ModalHeading>
                    <ModalFooter>
                        <ActionButton type='button' onClick={() => setConfirmAction(null)}>
                            Cancelar
                        </ActionButton>
                        <ActionButton
                            type='button'
                            danger={confirmAction === 'reload'}
                            primary={confirmAction === 'restore'}
                            onClick={confirmAction === 'restore' ? restoreBackup : confirmReload}
                        >
                            {confirmAction === 'restore' ? 'Carregar backup' : 'Descartar e recarregar'}
                        </ActionButton>
                    </ModalFooter>
                </Modal>
            </PageShell>
        </ServerContentBlock>
    );
};

export default ServerProperties;
