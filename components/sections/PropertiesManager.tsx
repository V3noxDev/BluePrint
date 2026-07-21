import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components/macro';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBolt,
    faCheck,
    faChevronRight,
    faCode,
    faExclamationTriangle,
    faGamepad,
    faGlobeAmericas,
    faMagic,
    faRedoAlt,
    faSave,
    faSearch,
    faServer,
    faShieldAlt,
    faSlidersH,
    faUndoAlt,
    faUsers,
} from '@fortawesome/free-solid-svg-icons';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import { httpErrorToHuman } from '@/api/http';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Button from '@/components/elements/Button';
import Input, { Textarea } from '@/components/elements/Input';
import Select from '@/components/elements/Select';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import FlashMessageRender from '@/components/FlashMessageRender';
import { ServerError } from '@/components/elements/ScreenBlock';
import { ServerContext } from '@/state/server';
import { usePermissions } from '@/plugins/usePermissions';
import useFlash from '@/plugins/useFlash';
import {
    definitionByKey,
    PropertyCategory,
    PropertyDefinition,
    propertyDefinitions,
    propertyPresets,
} from '../lib/schema';
import { parseProperties, setProperties } from '../lib/properties';

const FILE_PATH = '/server.properties';
const FLASH_KEY = 'serverproperties:editor';

const Hero = styled.div`
    ${tw`relative overflow-hidden rounded-xl shadow-xl mb-6 p-6 md:p-8`};
    background:
        radial-gradient(circle at 85% 20%, rgba(34, 197, 94, 0.22), transparent 32%),
        linear-gradient(135deg, #111827 0%, #172033 55%, #10251b 100%);
    border: 1px solid rgba(74, 222, 128, 0.18);
`;

const Panel = styled.div`
    ${tw`bg-neutral-700 rounded-xl shadow-lg border border-neutral-600 overflow-hidden`};
`;

const PropertyGrid = styled.div`
    ${tw`grid grid-cols-1 xl:grid-cols-2 gap-4`};
`;

const PropertyCard = styled.div`
    ${tw`relative bg-neutral-800 rounded-lg border border-neutral-600 p-4 transition-colors duration-150`};

    &:focus-within {
        ${tw`border-primary-400`};
    }
`;

const CategoryButton = styled.button<{ active?: boolean }>`
    ${tw`w-full flex items-center px-3 py-3 rounded-lg text-left text-sm transition-colors duration-150`};
    ${(props) =>
        props.active
            ? tw`bg-primary-500 text-white shadow-md`
            : tw`text-neutral-300 hover:text-white hover:bg-neutral-600`};
`;

const ModeButton = styled.button<{ active?: boolean }>`
    ${tw`px-4 py-2 text-sm font-medium transition-colors duration-150`};
    ${(props) => (props.active ? tw`bg-primary-500 text-white` : tw`text-neutral-300 hover:text-white`)};
`;

const Toggle = styled.button<{ enabled: boolean }>`
    ${tw`relative flex-none w-12 h-6 rounded-full transition-colors duration-150 focus:outline-none`};
    ${(props) => (props.enabled ? tw`bg-primary-500` : tw`bg-neutral-500`)};

    &::after {
        content: '';
        ${tw`absolute top-0 left-0 w-6 h-6 bg-white border-2 rounded-full shadow transition-transform duration-150`};
        border-color: ${(props) => (props.enabled ? '#0967d2' : '#718096')};
        ${(props) =>
            props.enabled &&
            css`
                transform: translateX(100%);
            `};
    }

    &:disabled {
        ${tw`opacity-50 cursor-not-allowed`};
    }
`;

const PresetCard = styled.button<{ accent: string }>`
    ${tw`relative text-left p-4 rounded-lg bg-neutral-800 border border-neutral-600 transition-all duration-150`};

    &::before {
        content: '';
        ${tw`absolute left-0 top-3 bottom-3 w-1 rounded-r`};
        background: ${(props) => props.accent};
    }

    &:hover:not(:disabled) {
        ${tw`border-neutral-400 transform -translate-y-px shadow-lg`};
    }

    &:disabled {
        ${tw`opacity-50 cursor-not-allowed`};
    }
`;

const categories: Array<{
    id: 'all' | PropertyCategory;
    label: string;
    icon: typeof faSlidersH;
}> = [
    { id: 'all', label: 'Todas', icon: faSlidersH },
    { id: 'general', label: 'Geral', icon: faServer },
    { id: 'gameplay', label: 'Jogabilidade', icon: faGamepad },
    { id: 'world', label: 'Mundo', icon: faGlobeAmericas },
    { id: 'players', label: 'Jogadores', icon: faUsers },
    { id: 'performance', label: 'Desempenho', icon: faBolt },
    { id: 'advanced', label: 'Avançado', icon: faShieldAlt },
];

const validate = (definition: PropertyDefinition, value: string): string | null => {
    if (definition.control === 'number') {
        const number = Number(value);

        if (value.trim() === '' || !Number.isFinite(number) || !Number.isInteger(number)) {
            return 'Informe um número inteiro válido.';
        }

        if (definition.min !== undefined && number < definition.min) {
            return `O valor mínimo é ${definition.min}.`;
        }

        if (definition.max !== undefined && number > definition.max) {
            return `O valor máximo é ${definition.max}.`;
        }
    }

    if (definition.key === 'level-name' && value.trim() === '') {
        return 'O nome do mundo não pode ficar vazio.';
    }

    if (definition.key === 'rcon.password' && value && value.length < 8) {
        return 'Use pelo menos 8 caracteres para a senha RCON.';
    }

    return null;
};

const PropertiesManager = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [canRead, canCreate, canUpdate] = usePermissions(['file.read-content', 'file.create', 'file.update']);
    const canWrite = canCreate && canUpdate;
    const { addFlash, clearFlashes, clearAndAddHttpError } = useFlash();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [savedContent, setSavedContent] = useState('');
    const [draftContent, setDraftContent] = useState('');
    const [mode, setMode] = useState<'visual' | 'raw'>('visual');
    const [category, setCategory] = useState<'all' | PropertyCategory>('all');
    const [query, setQuery] = useState('');
    const [appliedPreset, setAppliedPreset] = useState('');

    const isDirty = draftContent !== savedContent;
    const parsed = useMemo(() => parseProperties(draftContent), [draftContent]);
    const savedParsed = useMemo(() => parseProperties(savedContent), [savedContent]);

    const load = useCallback(async () => {
        if (!canRead) {
            setLoading(false);
            setLoadError('Sua conta não possui a permissão file.read-content.');
            return;
        }

        setLoading(true);
        setLoadError('');
        clearFlashes(FLASH_KEY);

        try {
            const content = await getFileContents(uuid, FILE_PATH);
            setSavedContent(content);
            setDraftContent(content);
            setAppliedPreset('');
        } catch (error) {
            setLoadError(httpErrorToHuman(error));
        } finally {
            setLoading(false);
        }
    }, [canRead, clearFlashes, uuid]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const warnBeforeLeave = (event: BeforeUnloadEvent) => {
            if (!isDirty) {
                return;
            }

            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', warnBeforeLeave);
        return () => window.removeEventListener('beforeunload', warnBeforeLeave);
    }, [isDirty]);

    const visibleDefinitions = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');

        return propertyDefinitions.filter((definition) => {
            const inCategory = category === 'all' || definition.category === category;
            const matchesQuery =
                !normalizedQuery ||
                definition.label.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
                definition.key.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
                definition.description.toLocaleLowerCase('pt-BR').includes(normalizedQuery);

            return inCategory && matchesQuery;
        });
    }, [category, query]);

    const validationErrors = useMemo(
        () =>
            propertyDefinitions.reduce<Record<string, string>>((errors, definition) => {
                const value = parsed.values[definition.key] ?? definition.defaultValue;
                const error = validate(definition, value);

                if (error) {
                    errors[definition.key] = error;
                }

                return errors;
            }, {}),
        [parsed.values]
    );
    const hasBlockingErrors = mode === 'visual' && Object.keys(validationErrors).length > 0;

    const managedCount = Object.keys(parsed.values).filter((key) => definitionByKey[key]).length;
    const unknownCount = Object.keys(parsed.values).filter((key) => !definitionByKey[key]).length;
    const changedCount = useMemo(() => {
        const allKeys = new Set([...Object.keys(parsed.values), ...Object.keys(savedParsed.values)]);
        return Array.from(allKeys).filter((key) => parsed.values[key] !== savedParsed.values[key]).length;
    }, [parsed.values, savedParsed.values]);

    const updateProperty = (key: string, value: string) => {
        setDraftContent((current) => setProperties(current, { [key]: value }));
        setAppliedPreset('');
    };

    const applyPreset = (presetId: string) => {
        const preset = propertyPresets.find((item) => item.id === presetId);

        if (!preset) {
            return;
        }

        setDraftContent((current) => setProperties(current, preset.values));
        setAppliedPreset(preset.id);
        setMode('visual');
    };

    const discard = () => {
        setDraftContent(savedContent);
        setAppliedPreset('');
        clearFlashes(FLASH_KEY);
    };

    const reload = () => {
        if (isDirty && !window.confirm('Descartar as alterações locais e recarregar o arquivo do servidor?')) {
            return;
        }

        load();
    };

    const save = async () => {
        if (!canWrite || !isDirty || hasBlockingErrors) {
            return;
        }

        setSaving(true);
        clearFlashes(FLASH_KEY);

        try {
            await saveFileContents(uuid, FILE_PATH, draftContent);
            setSavedContent(draftContent);
            setAppliedPreset('');
            addFlash({
                key: FLASH_KEY,
                type: 'success',
                title: 'Configurações salvas',
                message: 'O server.properties foi atualizado. Reinicie o servidor para aplicar todas as opções.',
            });
        } catch (error) {
            clearAndAddHttpError({ key: FLASH_KEY, error });
        } finally {
            setSaving(false);
        }
    };

    if (loadError) {
        return (
            <ServerError
                title={'Não foi possível abrir server.properties'}
                message={`${loadError} Inicie o servidor ao menos uma vez para que o arquivo seja criado.`}
                onRetry={load}
            />
        );
    }

    if (loading) {
        return (
            <ServerContentBlock title={'Minecraft Properties'}>
                <div css={tw`relative min-h-screen`}>
                    <SpinnerOverlay visible size={'large'}>
                        Carregando server.properties...
                    </SpinnerOverlay>
                </div>
            </ServerContentBlock>
        );
    }

    return (
        <ServerContentBlock title={'Minecraft Properties'}>
            <Hero>
                <div css={tw`relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6`}>
                    <div css={tw`flex items-start gap-4`}>
                        <div
                            css={tw`hidden sm:flex items-center justify-center w-14 h-14 rounded-xl bg-green-500 bg-opacity-20 text-green-300 text-2xl`}
                        >
                            <FontAwesomeIcon icon={faSlidersH} />
                        </div>
                        <div>
                            <div css={tw`flex flex-wrap items-center gap-2 mb-2`}>
                                <span css={tw`text-xs uppercase tracking-widest font-bold text-green-300`}>
                                    Minecraft Java
                                </span>
                                <span css={tw`px-2 py-1 rounded-full bg-green-500 bg-opacity-20 text-green-200 text-xs`}>
                                    /server.properties
                                </span>
                            </div>
                            <h1 css={tw`text-2xl md:text-3xl text-white font-bold`}>Central de configurações</h1>
                            <p css={tw`mt-2 text-neutral-300 max-w-2xl text-sm md:text-base`}>
                                Ajuste seu servidor com segurança. Comentários e propriedades personalizadas são preservados.
                            </p>
                        </div>
                    </div>
                    <div css={tw`grid grid-cols-3 gap-2 sm:gap-3 flex-none`}>
                        <div css={tw`bg-black bg-opacity-20 rounded-lg px-3 py-2 text-center`}>
                            <div css={tw`text-lg font-bold text-white`}>{managedCount}</div>
                            <div css={tw`text-xs text-neutral-400`}>gerenciadas</div>
                        </div>
                        <div css={tw`bg-black bg-opacity-20 rounded-lg px-3 py-2 text-center`}>
                            <div css={tw`text-lg font-bold text-white`}>{unknownCount}</div>
                            <div css={tw`text-xs text-neutral-400`}>preservadas</div>
                        </div>
                        <div css={tw`bg-black bg-opacity-20 rounded-lg px-3 py-2 text-center`}>
                            <div css={changedCount ? tw`text-lg font-bold text-yellow-300` : tw`text-lg font-bold text-white`}>
                                {changedCount}
                            </div>
                            <div css={tw`text-xs text-neutral-400`}>alteradas</div>
                        </div>
                    </div>
                </div>
            </Hero>

            <FlashMessageRender byKey={FLASH_KEY} css={tw`mb-6`} />

            {!canWrite && (
                <div css={tw`mb-6 p-4 rounded-lg border-l-4 border-yellow-400 bg-neutral-900 flex gap-3`}>
                    <FontAwesomeIcon icon={faExclamationTriangle} css={tw`text-yellow-300 mt-1`} />
                    <div>
                        <p css={tw`font-semibold text-neutral-100`}>Modo somente leitura</p>
                        <p css={tw`text-sm text-neutral-400 mt-1`}>
                            Para salvar, o usuário precisa das permissões file.create e file.update.
                        </p>
                    </div>
                </div>
            )}

            <Panel css={tw`mb-6`}>
                <div css={tw`px-5 py-4 border-b border-neutral-600 flex items-center gap-3`}>
                    <div css={tw`w-9 h-9 rounded-lg bg-purple-500 bg-opacity-20 text-purple-300 flex items-center justify-center`}>
                        <FontAwesomeIcon icon={faMagic} />
                    </div>
                    <div>
                        <h2 css={tw`font-semibold text-neutral-100`}>Configuração rápida</h2>
                        <p css={tw`text-xs text-neutral-400 mt-1`}>Aplique um perfil e revise as mudanças antes de salvar.</p>
                    </div>
                </div>
                <div css={tw`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 p-4`}>
                    {propertyPresets.map((preset) => (
                        <PresetCard
                            key={preset.id}
                            type={'button'}
                            accent={preset.accent}
                            disabled={!canWrite}
                            onClick={() => applyPreset(preset.id)}
                        >
                            <div css={tw`flex items-center justify-between gap-2 pl-2`}>
                                <span css={tw`font-semibold text-neutral-100 text-sm`}>{preset.name}</span>
                                {appliedPreset === preset.id ? (
                                    <FontAwesomeIcon icon={faCheck} css={tw`text-green-300`} />
                                ) : (
                                    <FontAwesomeIcon icon={faChevronRight} css={tw`text-neutral-500 text-xs`} />
                                )}
                            </div>
                            <p css={tw`text-xs text-neutral-400 mt-2 pl-2 leading-relaxed`}>{preset.description}</p>
                        </PresetCard>
                    ))}
                </div>
            </Panel>

            <div css={tw`grid grid-cols-1 lg:grid-cols-4 gap-6`}>
                <aside css={tw`lg:col-span-1`}>
                    <Panel css={tw`lg:sticky lg:top-6`}>
                        <div css={tw`p-4 border-b border-neutral-600`}>
                            <label css={tw`relative block`}>
                                <FontAwesomeIcon
                                    icon={faSearch}
                                    css={tw`absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400`}
                                />
                                <Input
                                    value={query}
                                    onChange={(event) => setQuery(event.currentTarget.value)}
                                    placeholder={'Buscar opção...'}
                                    css={tw`pl-10`}
                                />
                            </label>
                        </div>
                        <nav css={tw`p-2 space-y-1`}>
                            {categories.map((item) => (
                                <CategoryButton
                                    key={item.id}
                                    type={'button'}
                                    active={category === item.id}
                                    onClick={() => setCategory(item.id)}
                                >
                                    <FontAwesomeIcon icon={item.icon} css={tw`w-5 mr-3`} />
                                    <span css={tw`flex-1`}>{item.label}</span>
                                    <span
                                        css={
                                            category === item.id
                                                ? tw`text-xs text-primary-100`
                                                : tw`text-xs text-neutral-500`
                                        }
                                    >
                                        {item.id === 'all'
                                            ? propertyDefinitions.length
                                            : propertyDefinitions.filter((field) => field.category === item.id).length}
                                    </span>
                                </CategoryButton>
                            ))}
                        </nav>
                        <div css={tw`p-4 border-t border-neutral-600`}>
                            <div css={tw`flex items-start gap-2 text-xs text-neutral-400 leading-relaxed`}>
                                <FontAwesomeIcon icon={faShieldAlt} css={tw`text-green-300 mt-1`} />
                                <span>
                                    Portas e alocações continuam sob controle do Pterodactyl e não são alteradas aqui.
                                </span>
                            </div>
                        </div>
                    </Panel>
                </aside>

                <main css={tw`lg:col-span-3`}>
                    <Panel>
                        <div css={tw`flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-600`}>
                            <div css={tw`flex p-2`}>
                                <ModeButton type={'button'} active={mode === 'visual'} onClick={() => setMode('visual')}>
                                    <FontAwesomeIcon icon={faSlidersH} css={tw`mr-2`} />
                                    Editor visual
                                </ModeButton>
                                <ModeButton type={'button'} active={mode === 'raw'} onClick={() => setMode('raw')}>
                                    <FontAwesomeIcon icon={faCode} css={tw`mr-2`} />
                                    Modo avançado
                                </ModeButton>
                            </div>
                            <div css={tw`px-4 pb-3 sm:pb-0 text-xs text-neutral-400`}>
                                {isDirty ? (
                                    <span css={tw`text-yellow-300`}>
                                        <span css={tw`inline-block w-2 h-2 rounded-full bg-yellow-400 mr-2`} />
                                        Alterações não salvas
                                    </span>
                                ) : (
                                    <span css={tw`text-green-300`}>
                                        <span css={tw`inline-block w-2 h-2 rounded-full bg-green-400 mr-2`} />
                                        Sincronizado
                                    </span>
                                )}
                            </div>
                        </div>

                        {mode === 'visual' ? (
                            <div css={tw`p-4 md:p-5`}>
                                {visibleDefinitions.length ? (
                                    <PropertyGrid>
                                        {visibleDefinitions.map((definition) => {
                                            const value = parsed.values[definition.key] ?? definition.defaultValue;
                                            const error = validationErrors[definition.key];
                                            const changed =
                                                value !==
                                                (savedParsed.values[definition.key] ?? definition.defaultValue);

                                            return (
                                                <PropertyCard key={definition.key}>
                                                    {changed && (
                                                        <span
                                                            title={'Alterada'}
                                                            css={tw`absolute right-3 top-3 w-2 h-2 rounded-full bg-yellow-400`}
                                                        />
                                                    )}
                                                    <div css={tw`pr-5`}>
                                                        <div css={tw`flex flex-wrap items-center gap-2`}>
                                                            <label
                                                                htmlFor={`property-${definition.key}`}
                                                                css={tw`font-semibold text-neutral-100 text-sm`}
                                                            >
                                                                {definition.label}
                                                            </label>
                                                            {definition.restart && (
                                                                <span
                                                                    css={tw`px-2 py-px rounded bg-blue-500 bg-opacity-20 text-blue-200 text-xs`}
                                                                >
                                                                    reinício
                                                                </span>
                                                            )}
                                                        </div>
                                                        <code css={tw`block text-xs text-primary-300 mt-1`}>
                                                            {definition.key}
                                                        </code>
                                                        <p css={tw`text-xs text-neutral-400 mt-2 leading-relaxed min-h-8`}>
                                                            {definition.description}
                                                        </p>
                                                    </div>

                                                    <div css={tw`mt-4`}>
                                                        {definition.control === 'boolean' ? (
                                                            <div css={tw`flex items-center justify-between gap-4`}>
                                                                <span
                                                                    css={
                                                                        value === 'true'
                                                                            ? tw`text-sm font-medium text-green-300`
                                                                            : tw`text-sm font-medium text-neutral-400`
                                                                    }
                                                                >
                                                                    {value === 'true' ? 'Ativado' : 'Desativado'}
                                                                </span>
                                                                <Toggle
                                                                    id={`property-${definition.key}`}
                                                                    type={'button'}
                                                                    role={'switch'}
                                                                    aria-checked={value === 'true'}
                                                                    aria-label={definition.label}
                                                                    enabled={value === 'true'}
                                                                    disabled={!canWrite}
                                                                    onClick={() =>
                                                                        updateProperty(
                                                                            definition.key,
                                                                            value === 'true' ? 'false' : 'true'
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        ) : definition.control === 'select' ? (
                                                            <Select
                                                                id={`property-${definition.key}`}
                                                                value={value}
                                                                disabled={!canWrite}
                                                                onChange={(event) =>
                                                                    updateProperty(definition.key, event.currentTarget.value)
                                                                }
                                                            >
                                                                {!definition.options?.some((option) => option.value === value) && (
                                                                    <option value={value}>{value} (valor atual)</option>
                                                                )}
                                                                {definition.options?.map((option) => (
                                                                    <option key={option.value} value={option.value}>
                                                                        {option.label}
                                                                    </option>
                                                                ))}
                                                            </Select>
                                                        ) : (
                                                            <Input
                                                                id={`property-${definition.key}`}
                                                                type={
                                                                    definition.key === 'rcon.password'
                                                                        ? 'password'
                                                                        : definition.control
                                                                }
                                                                value={value}
                                                                min={definition.min}
                                                                max={definition.max}
                                                                step={definition.step || 1}
                                                                placeholder={definition.placeholder}
                                                                disabled={!canWrite}
                                                                hasError={!!error}
                                                                onChange={(event) =>
                                                                    updateProperty(definition.key, event.currentTarget.value)
                                                                }
                                                            />
                                                        )}
                                                        {error && <p css={tw`text-xs text-red-300 mt-2`}>{error}</p>}
                                                        {definition.warning && (
                                                            <p css={tw`text-xs text-yellow-300 mt-2 flex items-start gap-2`}>
                                                                <FontAwesomeIcon icon={faExclamationTriangle} css={tw`mt-1`} />
                                                                <span>{definition.warning}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </PropertyCard>
                                            );
                                        })}
                                    </PropertyGrid>
                                ) : (
                                    <div css={tw`py-16 text-center`}>
                                        <FontAwesomeIcon icon={faSearch} css={tw`text-3xl text-neutral-500`} />
                                        <h3 css={tw`mt-4 font-semibold text-neutral-200`}>Nenhuma opção encontrada</h3>
                                        <p css={tw`mt-2 text-sm text-neutral-400`}>Tente outro termo ou categoria.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div css={tw`p-4 md:p-5`}>
                                <div css={tw`mb-4 p-4 rounded-lg bg-neutral-900 border-l-4 border-primary-400`}>
                                    <div css={tw`flex items-start gap-3`}>
                                        <FontAwesomeIcon icon={faCode} css={tw`text-primary-300 mt-1`} />
                                        <div>
                                            <p css={tw`font-semibold text-neutral-100 text-sm`}>Edição avançada</p>
                                            <p css={tw`text-xs text-neutral-400 mt-1 leading-relaxed`}>
                                                Edite o arquivo completo. Linhas inválidas podem impedir a inicialização do
                                                Minecraft; mantenha o formato chave=valor.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <Textarea
                                    value={draftContent}
                                    disabled={!canWrite}
                                    onChange={(event) => {
                                        setDraftContent(event.currentTarget.value);
                                        setAppliedPreset('');
                                    }}
                                    spellCheck={false}
                                    css={tw`font-mono text-xs min-h-screen leading-relaxed`}
                                />
                                <div css={tw`mt-3 flex flex-wrap gap-3 text-xs text-neutral-400`}>
                                    <span>{parsed.lines.length} linhas</span>
                                    <span>•</span>
                                    <span>{Object.keys(parsed.values).length} propriedades</span>
                                    {parsed.duplicateKeys.length > 0 && (
                                        <>
                                            <span>•</span>
                                            <span css={tw`text-yellow-300`}>
                                                {parsed.duplicateKeys.length} chave(s) duplicada(s)
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <div
                            css={tw`p-4 bg-neutral-800 border-t border-neutral-600 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between`}
                        >
                            <div css={tw`flex flex-wrap gap-2`}>
                                <Button type={'button'} color={'grey'} isSecondary onClick={reload} disabled={saving}>
                                    <FontAwesomeIcon icon={faRedoAlt} css={tw`mr-2`} />
                                    Recarregar
                                </Button>
                                <Button
                                    type={'button'}
                                    color={'grey'}
                                    isSecondary
                                    onClick={discard}
                                    disabled={!isDirty || saving}
                                >
                                    <FontAwesomeIcon icon={faUndoAlt} css={tw`mr-2`} />
                                    Descartar
                                </Button>
                            </div>
                            <div css={tw`flex flex-col sm:flex-row sm:items-center gap-3`}>
                                {hasBlockingErrors && (
                                    <span css={tw`text-xs text-red-300`}>
                                        Corrija {Object.keys(validationErrors).length} campo(s)
                                    </span>
                                )}
                                <Button
                                    type={'button'}
                                    color={'green'}
                                    isLoading={saving}
                                    disabled={
                                        !canWrite ||
                                        !isDirty ||
                                        saving ||
                                        hasBlockingErrors
                                    }
                                    onClick={save}
                                >
                                    <FontAwesomeIcon icon={faSave} css={tw`mr-2`} />
                                    Salvar configurações
                                </Button>
                            </div>
                        </div>
                    </Panel>
                </main>
            </div>
        </ServerContentBlock>
    );
};

export default PropertiesManager;
